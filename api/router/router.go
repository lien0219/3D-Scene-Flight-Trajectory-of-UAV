package router

import (
	"net/http"

	"drone-api/handler"

	"github.com/rs/cors"
)

func Setup(hub *handler.Hub) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", hub.HandleWS)
	mux.HandleFunc("/api/state", hub.HandleState)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	return c.Handler(mux)
}
