package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/config"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"
)

func TestWebSocketOriginAndBroadcast(t *testing.T) {
	const allowedOrigin = "http://localhost:5173"
	hub := NewHub(config.DefaultMission(), 10*time.Millisecond, []string{allowedOrigin})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	hub.StartBroadcast(ctx)

	server := httptest.NewServer(http.HandlerFunc(hub.HandleWS))
	defer server.Close()
	url := "ws" + strings.TrimPrefix(server.URL, "http")

	t.Run("allowed origin receives telemetry", func(t *testing.T) {
		header := http.Header{"Origin": []string{allowedOrigin}}
		conn, response, err := websocket.DefaultDialer.Dial(url, header)
		if err != nil {
			t.Fatalf("Dial() error = %v, response = %#v", err, response)
		}
		defer conn.Close()
		if err := conn.SetReadDeadline(time.Now().Add(time.Second)); err != nil {
			t.Fatal(err)
		}

		var states []model.DroneState
		if err := conn.ReadJSON(&states); err != nil {
			t.Fatalf("ReadJSON() error = %v", err)
		}
		if len(states) != 3 || states[0].DroneID != "uav-001" {
			t.Fatalf("telemetry = %#v", states)
		}
	})

	t.Run("alternate loopback port receives telemetry", func(t *testing.T) {
		header := http.Header{"Origin": []string{"http://127.0.0.1:5175"}}
		conn, response, err := websocket.DefaultDialer.Dial(url, header)
		if err != nil {
			t.Fatalf("Dial() error = %v, response = %#v", err, response)
		}
		defer conn.Close()
		if err := conn.SetReadDeadline(time.Now().Add(time.Second)); err != nil {
			t.Fatal(err)
		}

		var states []model.DroneState
		if err := conn.ReadJSON(&states); err != nil {
			t.Fatalf("ReadJSON() error = %v", err)
		}
		if len(states) != 3 {
			t.Fatalf("telemetry count = %d, want 3", len(states))
		}
	})

	t.Run("rejected origin fails handshake", func(t *testing.T) {
		header := http.Header{"Origin": []string{"https://untrusted.example"}}
		conn, response, err := websocket.DefaultDialer.Dial(url, header)
		if conn != nil {
			_ = conn.Close()
		}
		if err == nil || response == nil || response.StatusCode != http.StatusForbidden {
			t.Fatalf("Dial() error/response = %v/%#v, want 403", err, response)
		}
	})
}

func TestIsOriginAllowed(t *testing.T) {
	allowedOrigins := []string{"http://localhost:5173", "https://console.example.com"}
	tests := []struct {
		origin string
		want   bool
	}{
		{origin: "http://localhost:5173", want: true},
		{origin: "http://127.0.0.1:5175", want: true},
		{origin: "http://[::1]:5199", want: true},
		{origin: "https://127.0.0.1:5175", want: false},
		{origin: "https://console.example.com", want: true},
		{origin: "https://console.example.com:444", want: false},
		{origin: "https://untrusted.example", want: false},
	}

	for _, test := range tests {
		t.Run(test.origin, func(t *testing.T) {
			if got := IsOriginAllowed(test.origin, allowedOrigins); got != test.want {
				t.Fatalf("IsOriginAllowed(%q) = %v, want %v", test.origin, got, test.want)
			}
		})
	}
}

func TestHandleConfigProducesJSON(t *testing.T) {
	mission := config.DefaultMission()
	hub := NewHub(mission, 200*time.Millisecond, []string{"*"})
	response := httptest.NewRecorder()
	hub.HandleConfig(response, httptest.NewRequest(http.MethodGet, "/api/config", nil))

	var got config.Mission
	if err := json.NewDecoder(response.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.Name != mission.Name || len(got.Drones) != len(mission.Drones) {
		t.Fatalf("mission response = %#v", got)
	}
}
