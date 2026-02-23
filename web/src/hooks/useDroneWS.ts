import { useEffect, useRef, useState, useCallback } from 'react'
import type { DroneState, DroneFleet } from '../types/drone'

const WS_URL = `ws://${window.location.hostname}:8080/ws`

export function useDroneWS() {
  const [fleet, setFleet] = useState<DroneFleet>({})
  const [connected, setConnected] = useState(false)
  const [droneIds, setDroneIds] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<number>()
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    function connect() {
      if (!isMounted.current) return
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current) {
          ws.close()
          return
        }
        console.log('✅ WebSocket connected')
        setConnected(true)
      }

      ws.onmessage = (evt) => {
        try {
          const raw = JSON.parse(evt.data)

          // 兼容单无人机和多无人机格式
          const arr: DroneState[] = Array.isArray(raw) ? raw : [raw]

          const newFleet: DroneFleet = {}
          const ids: string[] = []
          for (const s of arr) {
            newFleet[s.droneId] = s
            ids.push(s.droneId)
          }
          setFleet(newFleet)

          setDroneIds((prev) => {
            if (prev.length !== ids.length || prev.some((id, i) => id !== ids[i])) {
              return ids
            }
            return prev
          })
        } catch (e) {
          console.error('Parse error:', e)
        }
      }

      ws.onclose = () => {
        if (!isMounted.current) return
        setConnected(false)
        reconnectTimer.current = window.setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      isMounted.current = false
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  return { fleet, droneIds, connected }
}
