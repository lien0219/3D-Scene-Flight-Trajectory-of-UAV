package model

type DroneState struct {
	DroneID       string  `json:"droneId"`
	Lng           float64 `json:"lng"`
	Lat           float64 `json:"lat"`
	Alt           float64 `json:"alt"`
	Heading       float64 `json:"heading"`
	Pitch         float64 `json:"pitch"`
	Roll          float64 `json:"roll"`
	Speed         float64 `json:"speed"`
	Battery       float64 `json:"battery"`
	Timestamp     int64   `json:"timestamp"`
	Status        string  `json:"status"`
	WaypointIndex int     `json:"waypointIndex"`
}

type Waypoint struct {
	Lng float64
	Lat float64
	Alt float64
}
