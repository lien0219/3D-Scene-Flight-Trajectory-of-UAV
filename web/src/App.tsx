import { useEffect, useState } from 'react'
import FlightWorkspace from './components/FlightWorkspace'
import PlatformShell from './components/PlatformShell'
import DigitalTwinWorkspace from './components/twin/DigitalTwinWorkspace'
import { projectFromLocation, projectUrl, type ProjectId } from './lib/projectRoute'

export default function App() {
  const [project, setProject] = useState<ProjectId>(() => projectFromLocation(window.location))

  useEffect(() => {
    const handlePopState = () => setProject(projectFromLocation(window.location))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const selectProject = (nextProject: ProjectId) => {
    if (nextProject === project) return
    window.history.pushState({}, '', projectUrl(nextProject, window.location))
    setProject(nextProject)
  }

  return (
    <PlatformShell activeProject={project} onSelectProject={selectProject}>
      {project === 'flight' ? <FlightWorkspace /> : <DigitalTwinWorkspace />}
    </PlatformShell>
  )
}
