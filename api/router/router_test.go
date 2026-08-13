package router

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/config"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/handler"
)

func TestHTTPContracts(t *testing.T) {
	mission := config.DefaultMission()
	hub := handler.NewHub(mission, 200*time.Millisecond, []string{"http://localhost:5173"})
	server := Setup(hub, []string{"http://localhost:5173"})

	t.Run("health", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
		response := httptest.NewRecorder()
		server.ServeHTTP(response, request)
		if response.Code != http.StatusOK || response.Body.String() != `{"status":"ok"}` {
			t.Fatalf("health response = %d %q", response.Code, response.Body.String())
		}
	})

	t.Run("mission config", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/api/config", nil)
		response := httptest.NewRecorder()
		server.ServeHTTP(response, request)
		var got config.Mission
		if err := json.NewDecoder(response.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		if response.Code != http.StatusOK || got.Name != mission.Name || len(got.Drones) != 3 {
			t.Fatalf("config response = %d %#v", response.Code, got)
		}
	})

	t.Run("method rejected", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodPost, "/api/state", nil)
		response := httptest.NewRecorder()
		server.ServeHTTP(response, request)
		if response.Code != http.StatusMethodNotAllowed {
			t.Fatalf("POST /api/state status = %d, want 405", response.Code)
		}
	})
}
