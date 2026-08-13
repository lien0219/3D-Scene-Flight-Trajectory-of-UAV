import { useEffect, useState } from 'react'
import { apiUrl } from '../config/runtime'
import type { Mission } from '../types/drone'

export function useMission() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMission() {
      try {
        const response = await fetch(apiUrl('/api/config'), { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setMission(await response.json() as Mission)
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : '未知错误')
      }
    }

    void loadMission()
    return () => controller.abort()
  }, [])

  return { mission, error }
}
