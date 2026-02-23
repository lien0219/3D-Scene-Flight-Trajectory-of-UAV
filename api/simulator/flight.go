package simulator

import (
	"math"
	"sync"
	"time"

	"drone-api/config"
	"drone-api/model"
)

type FlightSimulator struct {
	mu           sync.RWMutex
	droneID      string
	route        []model.Waypoint
	currentIdx   int
	progress     float64
	battery      float64
	speed        float64
	state        model.DroneState
	tickInterval time.Duration
}

func NewFlightSimulator(cfg config.DroneConfig) *FlightSimulator {
	fs := &FlightSimulator{
		droneID:      cfg.ID,
		route:        cfg.Route,
		currentIdx:   0,
		progress:     0,
		battery:      config.InitBattery,
		speed:        cfg.Speed,
		tickInterval: time.Duration(config.TickInterval) * time.Millisecond,
	}
	wp := fs.route[0]
	fs.state = model.DroneState{
		DroneID: cfg.ID,
		Lng:     wp.Lng,
		Lat:     wp.Lat,
		Alt:     wp.Alt,
		Speed:   0,
		Battery: fs.battery,
	}
	return fs
}

func (fs *FlightSimulator) Tick() model.DroneState {
	fs.mu.Lock()
	defer fs.mu.Unlock()

	if fs.currentIdx >= len(fs.route)-1 {
		fs.currentIdx = 0
		fs.progress = 0
	}

	from := fs.route[fs.currentIdx]
	to := fs.route[fs.currentIdx+1]

	segDist := haversine(from.Lat, from.Lng, to.Lat, to.Lng)

	dt := fs.tickInterval.Seconds()
	stepRatio := (fs.speed * dt) / segDist
	fs.progress += stepRatio

	if fs.progress >= 1.0 {
		fs.progress = 0
		fs.currentIdx++
		if fs.currentIdx >= len(fs.route)-1 {
			fs.currentIdx = 0
		}
		from = fs.route[fs.currentIdx]
		to = fs.route[fs.currentIdx+1]
	}

	lng := lerp(from.Lng, to.Lng, fs.progress)
	lat := lerp(from.Lat, to.Lat, fs.progress)
	alt := lerp(from.Alt, to.Alt, fs.progress)

	heading := bearing(from.Lat, from.Lng, to.Lat, to.Lng)

	altDiff := to.Alt - from.Alt
	pitch := math.Atan2(altDiff, segDist) * 180 / math.Pi
	roll := math.Sin(float64(time.Now().UnixMilli())/1000.0) * 2.0

	fs.battery -= 0.001
	if fs.battery < 0 {
		fs.battery = 100.0
	}

	speed := fs.speed
	if fs.progress < 0.1 {
		speed = fs.speed * (0.5 + fs.progress*5)
	} else if fs.progress > 0.9 {
		speed = fs.speed * (0.5 + (1-fs.progress)*5)
	}

	fs.state = model.DroneState{
		DroneID:   fs.droneID,
		Lng:       lng,
		Lat:       lat,
		Alt:       alt,
		Heading:   heading,
		Pitch:     pitch,
		Roll:      roll,
		Speed:     math.Round(speed*100) / 100,
		Battery:   math.Round(fs.battery*10) / 10,
		Timestamp: time.Now().Unix(),
	}
	return fs.state
}

func (fs *FlightSimulator) GetState() model.DroneState {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	return fs.state
}

// --- 地理计算工具 ---
func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371000
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func bearing(lat1, lng1, lat2, lng2 float64) float64 {
	dLng := (lng2 - lng1) * math.Pi / 180
	lat1R := lat1 * math.Pi / 180
	lat2R := lat2 * math.Pi / 180
	x := math.Sin(dLng) * math.Cos(lat2R)
	y := math.Cos(lat1R)*math.Sin(lat2R) - math.Sin(lat1R)*math.Cos(lat2R)*math.Cos(dLng)
	brng := math.Atan2(x, y) * 180 / math.Pi
	return math.Mod(brng+360, 360)
}

func lerp(a, b, t float64) float64 {
	return a + (b-a)*t
}
