package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/config"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/simulator"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients        map[*websocket.Conn]struct{}
	mu             sync.RWMutex
	simulators     []*simulator.FlightSimulator
	mission        config.Mission
	tickInterval   time.Duration
	allowedOrigins map[string]struct{}
	allowAnyOrigin bool
	upgrader       websocket.Upgrader
}

func NewHub(mission config.Mission, tickInterval time.Duration, allowedOrigins []string) *Hub {
	sims := make([]*simulator.FlightSimulator, len(mission.Drones))
	for i, cfg := range mission.Drones {
		sims[i] = simulator.NewFlightSimulator(cfg, tickInterval)
	}

	hub := &Hub{
		clients:        make(map[*websocket.Conn]struct{}),
		simulators:     sims,
		mission:        mission,
		tickInterval:   tickInterval,
		allowedOrigins: make(map[string]struct{}, len(allowedOrigins)),
	}
	for _, origin := range allowedOrigins {
		if origin == "*" {
			hub.allowAnyOrigin = true
		}
		hub.allowedOrigins[strings.TrimRight(origin, "/")] = struct{}{}
	}
	hub.upgrader.CheckOrigin = hub.checkOrigin
	return hub
}

func (h *Hub) StartBroadcast(ctx context.Context) {
	ticker := time.NewTicker(h.tickInterval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				states := make([]model.DroneState, len(h.simulators))
				for i, sim := range h.simulators {
					states[i] = sim.Tick()
				}
				data, err := json.Marshal(states)
				if err != nil {
					log.Println("marshal error:", err)
					continue
				}
				h.broadcast(data)
			}
		}
	}()
	log.Printf("broadcast started: interval=%s drones=%d", h.tickInterval, len(h.simulators))
}

func (h *Hub) broadcast(msg []byte) {
	h.mu.RLock()
	connections := make([]*websocket.Conn, 0, len(h.clients))
	for conn := range h.clients {
		connections = append(connections, conn)
	}
	h.mu.RUnlock()

	for _, conn := range connections {
		err := conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("write error:", err)
			_ = conn.Close()
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()
		}
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}
	h.mu.Lock()
	h.clients[conn] = struct{}{}
	clientCount := len(h.clients)
	h.mu.Unlock()
	log.Printf("websocket client connected: total=%d", clientCount)

	defer func() {
		h.mu.Lock()
		delete(h.clients, conn)
		h.mu.Unlock()
		_ = conn.Close()
		log.Println("websocket client disconnected")
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (h *Hub) HandleState(w http.ResponseWriter, r *http.Request) {
	states := make([]model.DroneState, len(h.simulators))
	for i, sim := range h.simulators {
		states[i] = sim.GetState()
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(states); err != nil {
		log.Println("encode state response:", err)
	}
}

func (h *Hub) HandleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(h.mission); err != nil {
		log.Println("encode mission response:", err)
	}
}

func (h *Hub) checkOrigin(r *http.Request) bool {
	origin := strings.TrimRight(r.Header.Get("Origin"), "/")
	if origin == "" || h.allowAnyOrigin {
		return true
	}
	_, allowed := h.allowedOrigins[origin]
	return allowed
}
