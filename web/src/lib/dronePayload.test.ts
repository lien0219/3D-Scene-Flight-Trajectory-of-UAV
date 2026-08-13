import { describe, expect, it } from 'vitest'
import { parseDronePayload } from './dronePayload'

const telemetry = {
  droneId: 'uav-001', lng: 113, lat: 22, alt: 100,
  heading: 90, pitch: 1, roll: 2, speed: 10, battery: 99, timestamp: 1,
}

describe('parseDronePayload', () => {
  it('accepts fleet and legacy single-drone payloads', () => {
    expect(parseDronePayload(JSON.stringify(telemetry)).ids).toEqual(['uav-001'])
    expect(parseDronePayload(JSON.stringify([telemetry])).fleet['uav-001']).toEqual(telemetry)
  })

  it('rejects malformed telemetry', () => {
    expect(() => parseDronePayload('{"droneId":"uav-001"}')).toThrow('invalid telemetry')
    expect(() => parseDronePayload(JSON.stringify([telemetry, telemetry]))).toThrow('duplicate ID')
  })
})
