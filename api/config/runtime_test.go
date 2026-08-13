package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"
)

func TestLoadRuntimeDefaults(t *testing.T) {
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("TICK_INTERVAL", "")
	t.Setenv("ALLOWED_ORIGINS", "")
	t.Setenv("MISSION_FILE", "")

	runtimeConfig, err := LoadRuntime()
	if err != nil {
		t.Fatalf("LoadRuntime() error = %v", err)
	}
	if runtimeConfig.HTTPAddr != ":8080" {
		t.Errorf("HTTPAddr = %q, want :8080", runtimeConfig.HTTPAddr)
	}
	if runtimeConfig.TickInterval != 200*time.Millisecond {
		t.Errorf("TickInterval = %s, want 200ms", runtimeConfig.TickInterval)
	}
	if len(runtimeConfig.AllowedOrigins) != 2 {
		t.Errorf("AllowedOrigins = %v, want two development origins", runtimeConfig.AllowedOrigins)
	}
}

func TestLoadRuntimeRejectsInvalidTickInterval(t *testing.T) {
	t.Setenv("TICK_INTERVAL", "zero")
	if _, err := LoadRuntime(); err == nil {
		t.Fatal("LoadRuntime() error = nil, want invalid duration error")
	}
}

func TestLoadMissionFromFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "mission.json")
	data := `{"name":"test","drones":[{"id":"uav-test","name":"Test","color":"#ffffff","speed":10,"route":[{"lng":113,"lat":22,"alt":100},{"lng":114,"lat":23,"alt":120}]}]}`
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}

	mission, err := LoadMission(path)
	if err != nil {
		t.Fatalf("LoadMission() error = %v", err)
	}
	if mission.Drones[0].ID != "uav-test" || len(mission.Drones[0].Route) != 2 {
		t.Fatalf("LoadMission() = %#v", mission)
	}
}

func TestValidateMissionRejectsInvalidDefinitions(t *testing.T) {
	tests := []struct {
		name    string
		mission Mission
		want    string
	}{
		{name: "missing name", mission: Mission{}, want: "mission name"},
		{name: "no drones", mission: Mission{Name: "test"}, want: "at least one drone"},
		{
			name: "short route",
			mission: Mission{Name: "test", Drones: []DroneConfig{{
				ID: "uav-1", Speed: 1, Route: []model.Waypoint{{Lng: 1, Lat: 1}},
			}}},
			want: "at least two waypoints",
		},
		{
			name: "invalid latitude",
			mission: Mission{Name: "test", Drones: []DroneConfig{{
				ID: "uav-1", Speed: 1, Route: []model.Waypoint{{Lng: 1, Lat: 91}, {Lng: 2, Lat: 2}},
			}}},
			want: "lat is out of range",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := ValidateMission(test.mission)
			if err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("ValidateMission() error = %v, want containing %q", err, test.want)
			}
		})
	}
}
