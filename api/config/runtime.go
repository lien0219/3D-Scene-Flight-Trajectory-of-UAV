package config

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"
)

const (
	defaultHTTPAddr     = ":8080"
	defaultTickInterval = 200 * time.Millisecond
)

type Runtime struct {
	HTTPAddr       string
	TickInterval   time.Duration
	AllowedOrigins []string
	MissionFile    string
}

func LoadRuntime() (Runtime, error) {
	tickInterval, err := time.ParseDuration(envOrDefault("TICK_INTERVAL", defaultTickInterval.String()))
	if err != nil || tickInterval <= 0 {
		return Runtime{}, fmt.Errorf("TICK_INTERVAL must be a positive duration: %q", os.Getenv("TICK_INTERVAL"))
	}

	origins := splitCSV(envOrDefault(
		"ALLOWED_ORIGINS",
		"http://localhost:5173,http://127.0.0.1:5173",
	))
	if len(origins) == 0 {
		return Runtime{}, errors.New("ALLOWED_ORIGINS must contain at least one origin")
	}

	return Runtime{
		HTTPAddr:       envOrDefault("HTTP_ADDR", defaultHTTPAddr),
		TickInterval:   tickInterval,
		AllowedOrigins: origins,
		MissionFile:    strings.TrimSpace(os.Getenv("MISSION_FILE")),
	}, nil
}

func LoadMission(path string) (Mission, error) {
	if strings.TrimSpace(path) == "" {
		mission := DefaultMission()
		return mission, ValidateMission(mission)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return Mission{}, fmt.Errorf("read mission file: %w", err)
	}

	var mission Mission
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&mission); err != nil {
		return Mission{}, fmt.Errorf("decode mission file: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return Mission{}, errors.New("decode mission file: multiple JSON values are not allowed")
	}
	if err := ValidateMission(mission); err != nil {
		return Mission{}, err
	}
	return cloneMission(mission), nil
}

func ValidateMission(mission Mission) error {
	if strings.TrimSpace(mission.Name) == "" {
		return errors.New("mission name is required")
	}
	if len(mission.Drones) == 0 {
		return errors.New("mission must define at least one drone")
	}

	seen := make(map[string]struct{}, len(mission.Drones))
	for i, drone := range mission.Drones {
		if strings.TrimSpace(drone.ID) == "" {
			return fmt.Errorf("drones[%d].id is required", i)
		}
		if _, exists := seen[drone.ID]; exists {
			return fmt.Errorf("duplicate drone id %q", drone.ID)
		}
		seen[drone.ID] = struct{}{}
		if drone.Speed <= 0 {
			return fmt.Errorf("drone %q speed must be positive", drone.ID)
		}
		if len(drone.Route) < 2 {
			return fmt.Errorf("drone %q route must contain at least two waypoints", drone.ID)
		}
		hasMovement := false
		for waypointIndex, waypoint := range drone.Route {
			if waypoint.Lng < -180 || waypoint.Lng > 180 {
				return fmt.Errorf("drone %q route[%d].lng is out of range", drone.ID, waypointIndex)
			}
			if waypoint.Lat < -90 || waypoint.Lat > 90 {
				return fmt.Errorf("drone %q route[%d].lat is out of range", drone.ID, waypointIndex)
			}
			if waypoint.Alt < 0 {
				return fmt.Errorf("drone %q route[%d].alt must not be negative", drone.ID, waypointIndex)
			}
			if waypointIndex > 0 {
				previous := drone.Route[waypointIndex-1]
				hasMovement = hasMovement || previous.Lng != waypoint.Lng || previous.Lat != waypoint.Lat
			}
		}
		if !hasMovement {
			return fmt.Errorf("drone %q route must contain at least one non-zero segment", drone.ID)
		}
	}
	return nil
}

func cloneMission(mission Mission) Mission {
	cloned := Mission{Name: mission.Name, Drones: make([]DroneConfig, len(mission.Drones))}
	for i, drone := range mission.Drones {
		cloned.Drones[i] = drone
		cloned.Drones[i].Route = append([]model.Waypoint(nil), drone.Route...)
	}
	return cloned
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, strings.TrimRight(trimmed, "/"))
		}
	}
	return result
}
