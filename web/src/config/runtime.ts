const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

export function webSocketUrl(): string {
  const configuredUrl = import.meta.env.VITE_WS_URL?.trim()
  if (configuredUrl) return configuredUrl

  if (apiBaseUrl) {
    const url = new URL(apiBaseUrl, window.location.href)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`
    return url.toString()
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}
