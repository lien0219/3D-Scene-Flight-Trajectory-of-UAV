package config

import "github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/api/model"

const InitBattery = 100.0

type Mission struct {
	Name   string        `json:"name"`
	Drones []DroneConfig `json:"drones"`
}

type DroneConfig struct {
	ID    string           `json:"id"`
	Name  string           `json:"name"`
	Color string           `json:"color"`
	Speed float64          `json:"speed"`
	Route []model.Waypoint `json:"route"`
}

// 深圳核心航线（UAV-001）
var route1 = []model.Waypoint{
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
var route2 = []model.Waypoint{
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
var route3 = []model.Waypoint{
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

var defaultMission = Mission{
	Name: "深圳无人机巡航演示",
	Drones: []DroneConfig{
		{ID: "uav-001", Name: "核心航线", Color: "#00ffff", Speed: 15.0, Route: route1},
		{ID: "uav-002", Name: "沿海航线", Color: "#ff6b35", Speed: 12.0, Route: route2},
		{ID: "uav-003", Name: "北部航线", Color: "#a855f7", Speed: 18.0, Route: route3},
	},
}

func DefaultMission() Mission {
	return cloneMission(defaultMission)
}
