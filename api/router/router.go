package router

import (
	"net/http"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/handler"

	"github.com/rs/cors"
)

func Setup(hub *handler.Hub, allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /ws", hub.HandleWS)
	mux.HandleFunc("GET /api/state", hub.HandleState)
	mux.HandleFunc("GET /api/config", hub.HandleConfig)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	c := cors.New(cors.Options{
		AllowOriginFunc: func(origin string) bool {
			return handler.IsOriginAllowed(origin, allowedOrigins)
		},
		AllowedMethods: []string{http.MethodGet, http.MethodOptions},
		AllowedHeaders: []string{"Content-Type"},
	})

	return c.Handler(mux)
}
