export type ProjectId = 'flight' | 'digital-twin'

const supportedProjects = new Set<ProjectId>(['flight', 'digital-twin'])

export function projectFromLocation(location: Pick<Location, 'search'>): ProjectId {
  const value = new URLSearchParams(location.search).get('project') as ProjectId | null
  return value && supportedProjects.has(value) ? value : 'flight'
}

export function projectUrl(project: ProjectId, location: Pick<Location, 'pathname' | 'search' | 'hash'>): string {
  const params = new URLSearchParams(location.search)
  if (project === 'flight') params.delete('project')
  else params.set('project', project)
  const query = params.toString()
  return `${location.pathname}${query ? `?${query}` : ''}${location.hash}`
}
