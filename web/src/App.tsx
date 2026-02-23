import { useState, useEffect } from 'react'
import CesiumScene from './components/CesiumViewer'
import HUD from './components/HUD'
import { useDroneWS } from './hooks/useDroneWS'

export default function App() {
  const { fleet, droneIds, connected } = useDroneWS()
  const [selectedId, setSelectedId] = useState<string>('')

  // 自动选中第一架无人机
  useEffect(() => {
    if (!selectedId && droneIds.length > 0) {
      setSelectedId(droneIds[0])
    }
  }, [droneIds, selectedId])

  const selectedDrone = selectedId ? fleet[selectedId] ?? null : null

  return (
    <>
      <CesiumScene
        fleet={fleet}
        droneIds={droneIds}
        selectedId={selectedId}
        onSelectDrone={setSelectedId}
      />
      <HUD
        droneState={selectedDrone}
        connected={connected}
        droneIds={droneIds}
        selectedId={selectedId}
        onSelectDrone={setSelectedId}
      />
    </>
  )
}
