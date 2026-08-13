package simulator

import (
	"math"
	"testing"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/config"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"
)

func TestGeographicCalculations(t *testing.T) {
	distance := haversine(0, 0, 0, 1)
	if math.Abs(distance-111194.9) > 100 {
		t.Errorf("haversine() = %.1f, want approximately 111194.9", distance)
	}
	if heading := bearing(0, 0, 0, 1); math.Abs(heading-90) > 0.001 {
		t.Errorf("bearing() = %.3f, want 90", heading)
	}
}

func TestTickProducesCompleteState(t *testing.T) {
	sim := NewFlightSimulator(config.DroneConfig{
		ID:    "uav-test",
		Speed: 10,
		Route: []model.Waypoint{
			{Lng: 113, Lat: 22, Alt: 100},
			{Lng: 113.01, Lat: 22, Alt: 110},
		},
	}, 200*time.Millisecond)

	state := sim.Tick()
	if state.DroneID != "uav-test" || state.Status != "flying" {
		t.Errorf("Tick() identity/status = %q/%q", state.DroneID, state.Status)
	}
	if state.Timestamp == 0 || state.Speed <= 0 || state.Battery <= 0 {
		t.Errorf("Tick() returned incomplete telemetry: %#v", state)
	}
	if state.Lng <= 113 || state.Lng >= 113.01 {
		t.Errorf("Tick() longitude = %f, want inside first segment", state.Lng)
	}
}

func TestTickCarriesDistanceAcrossRouteBoundary(t *testing.T) {
	sim := NewFlightSimulator(config.DroneConfig{
		ID:    "uav-loop",
		Speed: 15,
		Route: []model.Waypoint{
			{Lng: 0, Lat: 0, Alt: 100},
			{Lng: 0.0001, Lat: 0, Alt: 100},
		},
	}, time.Second)

	state := sim.Tick()
	if state.WaypointIndex != 1 {
		t.Fatalf("WaypointIndex = %d, want return segment index 1", state.WaypointIndex)
	}
	if state.Lng <= 0 || state.Lng >= 0.0001 {
		t.Fatalf("longitude = %f, want a position on the return segment", state.Lng)
	}
}
