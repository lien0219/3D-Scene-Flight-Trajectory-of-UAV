import { useEffect, useState } from 'react'
import CesiumScene from './CesiumViewer'
import HUD from './HUD'
import { useDroneWS } from '../hooks/useDroneWS'
import { useMission } from '../hooks/useMission'

export default function FlightWorkspace() {
  const { fleet, droneIds, connected } = useDroneWS()
  const { mission, error: missionError } = useMission()
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (!selectedId && droneIds.length > 0) setSelectedId(droneIds[0])
  }, [droneIds, selectedId])

  const selectedDrone = selectedId ? fleet[selectedId] ?? null : null

  return (
    <section className="project-workspace flight-workspace" aria-label="无人机飞行轨迹项目">
      <CesiumScene
        fleet={fleet}
        droneIds={droneIds}
        selectedId={selectedId}
        onSelectDrone={setSelectedId}
        mission={mission}
      />
      <HUD
        droneState={selectedDrone}
        connected={connected}
        droneIds={droneIds}
        selectedId={selectedId}
        onSelectDrone={setSelectedId}
        missionName={mission?.name}
        missionError={missionError}
      />
    </section>
  )
}
