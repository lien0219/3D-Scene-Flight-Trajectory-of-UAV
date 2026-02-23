package main

import (
	"log"
	"net/http"

	"drone-api/config"
	"drone-api/handler"
	"drone-api/router"
)

func main() {
	log.Println("API服务器启动")

	hub := handler.NewHub()
	hub.StartBroadcast()

	r := router.Setup(hub)

	log.Printf("服务器监听 %s\n", config.ServerPort)
	if err := http.ListenAndServe(config.ServerPort, r); err != nil {
		log.Fatal("服务器错误:", err)
	}
}
