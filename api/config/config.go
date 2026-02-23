package config

import "drone-api/model"

const (
	ServerPort   = ":8080"
	TickInterval = 200 // 毫秒
	InitBattery  = 100.0
)

// 多无人机配置
type DroneConfig struct {
	ID    string
	Speed float64
	Alt   float64
	Route []model.Waypoint
}

// 深圳核心航线（UAV-001）
var Route1 = []model.Waypoint{
	{Lng: 113.9301, Lat: 22.5334, Alt: 150},
	{Lng: 113.9425, Lat: 22.5155, Alt: 160},
	{Lng: 113.9710, Lat: 22.5092, Alt: 140},
	{Lng: 114.0040, Lat: 22.5173, Alt: 155},
	{Lng: 114.0340, Lat: 22.5260, Alt: 150},
	{Lng: 114.0579, Lat: 22.5431, Alt: 170},
	{Lng: 114.0850, Lat: 22.5510, Alt: 145},
	{Lng: 114.1130, Lat: 22.5480, Alt: 160},
	{Lng: 114.1315, Lat: 22.5481, Alt: 150},
	{Lng: 114.1130, Lat: 22.5480, Alt: 155},
	{Lng: 114.0579, Lat: 22.5431, Alt: 160},
	{Lng: 113.9710, Lat: 22.5092, Alt: 150},
	{Lng: 113.9301, Lat: 22.5334, Alt: 150},
}

// 南山-蛇口沿海航线（UAV-002）
var Route2 = []model.Waypoint{
	{Lng: 113.9350, Lat: 22.5300, Alt: 120},
	{Lng: 113.9200, Lat: 22.5100, Alt: 130},
	{Lng: 113.9050, Lat: 22.4900, Alt: 140},
	{Lng: 113.8900, Lat: 22.4800, Alt: 135},
	{Lng: 113.9100, Lat: 22.4700, Alt: 125},
	{Lng: 113.9350, Lat: 22.4850, Alt: 130},
	{Lng: 113.9550, Lat: 22.5000, Alt: 120},
	{Lng: 113.9700, Lat: 22.5100, Alt: 135},
	{Lng: 113.9550, Lat: 22.5200, Alt: 125},
	{Lng: 113.9350, Lat: 22.5300, Alt: 120},
}

// 龙华-福田北线（UAV-003）
var Route3 = []model.Waypoint{
	{Lng: 114.0290, Lat: 22.6090, Alt: 180},
	{Lng: 114.0400, Lat: 22.5900, Alt: 175},
	{Lng: 114.0550, Lat: 22.5750, Alt: 170},
	{Lng: 114.0700, Lat: 22.5600, Alt: 165},
	{Lng: 114.0850, Lat: 22.5700, Alt: 175},
	{Lng: 114.1000, Lat: 22.5850, Alt: 180},
	{Lng: 114.0800, Lat: 22.6000, Alt: 185},
	{Lng: 114.0600, Lat: 22.6100, Alt: 180},
	{Lng: 114.0400, Lat: 22.6150, Alt: 175},
	{Lng: 114.0290, Lat: 22.6090, Alt: 180},
}

// 所有无人机
var DroneFleet = []DroneConfig{
	{ID: "uav-001", Speed: 15.0, Alt: 150, Route: Route1},
	{ID: "uav-002", Speed: 12.0, Alt: 120, Route: Route2},
	{ID: "uav-003", Speed: 18.0, Alt: 180, Route: Route3},
}
