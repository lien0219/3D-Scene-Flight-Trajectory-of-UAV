package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"drone-api/config"
	"drone-api/model"
	"drone-api/simulator"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	clients    map[*websocket.Conn]bool
	mu         sync.RWMutex
	simulators []*simulator.FlightSimulator
}

func NewHub() *Hub {
	sims := make([]*simulator.FlightSimulator, len(config.DroneFleet))
	for i, cfg := range config.DroneFleet {
		sims[i] = simulator.NewFlightSimulator(cfg)
	}
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		simulators: sims,
	}
}

func (h *Hub) StartBroadcast() {
	ticker := time.NewTicker(time.Duration(config.TickInterval) * time.Millisecond)
	go func() {
		for range ticker.C {
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
	}()
	log.Printf("广播开始, 间隔=%dms, 无人机数量=%d\n", config.TickInterval, len(h.simulators))
}

func (h *Hub) broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn := range h.clients {
		err := conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("write error:", err)
			conn.Close()
			delete(h.clients, conn)
		}
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()
	log.Printf("🔗 Client connected, total=%d\n", len(h.clients))

	defer func() {
		h.mu.Lock()
		delete(h.clients, conn)
		h.mu.Unlock()
		conn.Close()
		log.Println("❌ Client disconnected")
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
	json.NewEncoder(w).Encode(states)
}
