import { describe, expect, it } from 'vitest'
import { DroneInterpolator, lerpAngleDeg, lerpAngleRad } from './DroneInterpolator'
import type { DroneState } from '../types/drone'

const state: DroneState = {
  droneId: 'uav-001', lng: 113, lat: 22, alt: 100,
  heading: 350, pitch: 0, roll: 0, speed: 10, battery: 100, timestamp: 1,
}

describe('angle interpolation', () => {
  it('uses the shortest path across the wrap boundary', () => {
    expect(lerpAngleDeg(350, 10, 0.5)).toBe(360)
    expect(lerpAngleRad(Math.PI * 1.9, Math.PI * 0.1, 0.5)).toBeCloseTo(Math.PI * 2)
  })
})

describe('DroneInterpolator', () => {
  it('initializes immediately and converges toward new telemetry', () => {
    const interpolator = new DroneInterpolator()
    interpolator.setTarget(state.droneId, state)
    expect(interpolator.get(state.droneId)?.lng).toBe(113)

    interpolator.setTarget(state.droneId, { ...state, lng: 114, heading: 10 })
    interpolator.tick(0.1)

    const current = interpolator.get(state.droneId)
    expect(current?.lng).toBeGreaterThan(113)
    expect(current?.lng).toBeLessThan(114)
    expect(current?.heading).toBeGreaterThan(350)
  })
})
