import { describe, expect, it } from 'vitest'
import { projectFromLocation, projectUrl } from './projectRoute'

describe('project routing', () => {
  it('uses flight as the default and rejects unsupported project ids', () => {
    expect(projectFromLocation({ search: '' } as Location)).toBe('flight')
    expect(projectFromLocation({ search: '?project=unknown' } as Location)).toBe('flight')
  })

  it('builds stable deep links without removing unrelated query values', () => {
    const location = { pathname: '/console', search: '?theme=dark', hash: '#scene' } as Location
    expect(projectUrl('digital-twin', location)).toBe('/console?theme=dark&project=digital-twin#scene')
    expect(projectUrl('flight', { ...location, search: '?theme=dark&project=digital-twin' } as Location))
      .toBe('/console?theme=dark#scene')
  })
})
