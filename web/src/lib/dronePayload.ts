import type { DroneFleet, DroneState } from '../types/drone'

const telemetryFields = [
  'lng',
  'lat',
  'alt',
  'heading',
  'pitch',
  'roll',
  'speed',
  'battery',
  'timestamp',
] as const

export function parseDronePayload(payload: string): { fleet: DroneFleet; ids: string[] } {
  const raw: unknown = JSON.parse(payload)
  const values = Array.isArray(raw) ? raw : [raw]
  const fleet: DroneFleet = {}
  const ids: string[] = []

  for (const value of values) {
    if (!isDroneState(value)) throw new Error('WebSocket payload contains invalid telemetry')
    if (fleet[value.droneId]) throw new Error(`WebSocket payload contains duplicate ID: ${value.droneId}`)
    fleet[value.droneId] = value
    ids.push(value.droneId)
  }

  return { fleet, ids }
}

function isDroneState(value: unknown): value is DroneState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.droneId !== 'string' || candidate.droneId.length === 0) return false
  return telemetryFields.every((field) => typeof candidate[field] === 'number' && Number.isFinite(candidate[field]))
}
