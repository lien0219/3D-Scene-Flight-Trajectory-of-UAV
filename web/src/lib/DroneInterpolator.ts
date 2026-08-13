import type { DroneState } from '../types/drone'

export interface InterpolatedState {
  lng: number
  lat: number
  alt: number
  heading: number
  pitch: number
  roll: number
}

export function lerpAngleDeg(a: number, b: number, t: number): number {
  let diff = b - a
  while (diff > 180) diff -= 360
  while (diff < -180) diff += 360
  return a + diff * t
}

export function lerpAngleRad(a: number, b: number, t: number): number {
  let diff = b - a
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return a + diff * t
}

export class DroneInterpolator {
  private readonly targets = new Map<string, InterpolatedState>()
  private readonly currents = new Map<string, InterpolatedState>()

  setTarget(id: string, state: DroneState): void {
    const target = toInterpolatedState(state)
    this.targets.set(id, target)
    if (!this.currents.has(id)) this.currents.set(id, { ...target })
  }

  tick(deltaSeconds: number): void {
    const t = 1 - Math.exp(-8 * deltaSeconds)

    for (const [id, target] of this.targets) {
      const current = this.currents.get(id)
      if (!current) continue
      current.lng += (target.lng - current.lng) * t
      current.lat += (target.lat - current.lat) * t
      current.alt += (target.alt - current.alt) * t
      current.heading = lerpAngleDeg(current.heading, target.heading, t)
      current.pitch += (target.pitch - current.pitch) * t
      current.roll += (target.roll - current.roll) * t
    }
  }

  get(id: string): InterpolatedState | undefined {
    return this.currents.get(id)
  }
}

function toInterpolatedState(state: DroneState): InterpolatedState {
  return {
    lng: state.lng,
    lat: state.lat,
    alt: state.alt,
    heading: state.heading,
    pitch: state.pitch,
    roll: state.roll,
  }
}
