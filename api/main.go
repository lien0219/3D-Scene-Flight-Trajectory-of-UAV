package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/config"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/handler"
	"github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/router"
)

func main() {
	runtimeConfig, err := config.LoadRuntime()
	if err != nil {
		log.Fatal("load runtime config: ", err)
	}
	mission, err := config.LoadMission(runtimeConfig.MissionFile)
	if err != nil {
		log.Fatal("load mission: ", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	hub := handler.NewHub(mission, runtimeConfig.TickInterval, runtimeConfig.AllowedOrigins)
	hub.StartBroadcast(ctx)

	server := &http.Server{
		Addr:              runtimeConfig.HTTPAddr,
		Handler:           router.Setup(hub, runtimeConfig.AllowedOrigins),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("server shutdown: %v", err)
		}
	}()

	log.Printf("API listening on %s (mission=%q)", runtimeConfig.HTTPAddr, mission.Name)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("server error: ", err)
	}
}
