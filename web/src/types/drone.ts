export interface DroneState {
  droneId: string
  lng: number
  lat: number
  alt: number
  heading: number
  pitch: number
  roll: number
  speed: number
  battery: number
  timestamp: number
  status?: string
  waypointIndex?: number
}

export type DroneFleet = Record<string, DroneState>
