export type TwinAssetKind = 'building' | 'energy' | 'communication' | 'environment'
export type TwinAssetStatus = 'normal' | 'warning'

export interface TwinAsset {
  id: string
  name: string
  code: string
  kind: TwinAssetKind
  status: TwinAssetStatus
  east: number
  north: number
  width: number
  depth: number
  height: number
  metric: string
  metricLabel: string
  secondary: string
}

export const TWIN_ORIGIN = { lng: 114.0615, lat: 22.5323 }

export const TWIN_ASSETS: TwinAsset[] = [
  {
    id: 'command-center', name: '综合指挥中心', code: 'BLD-A01', kind: 'building', status: 'normal',
    east: -82, north: 42, width: 52, depth: 34, height: 34,
    metric: '22.6 ℃', metricLabel: '室内温度', secondary: '能耗 118 kW',
  },
  {
    id: 'warehouse', name: '智能仓储中心', code: 'BLD-B02', kind: 'building', status: 'normal',
    east: 24, north: 55, width: 72, depth: 42, height: 21,
    metric: '96.8%', metricLabel: '设备在线', secondary: '库容 72%',
  },
  {
    id: 'energy-center', name: '综合能源站', code: 'ENE-C03', kind: 'energy', status: 'warning',
    east: 96, north: -22, width: 42, depth: 34, height: 17,
    metric: '1.82 MW', metricLabel: '当前负荷', secondary: '储能 64%',
  },
  {
    id: 'data-center', name: '边缘数据中心', code: 'BLD-D04', kind: 'building', status: 'normal',
    east: -30, north: -70, width: 54, depth: 34, height: 25,
    metric: '38.2%', metricLabel: '计算负载', secondary: 'PUE 1.24',
  },
  {
    id: 'communication-tower', name: '低空通信基站', code: 'COM-E05', kind: 'communication', status: 'normal',
    east: 76, north: 86, width: 8, depth: 8, height: 48,
    metric: '-67 dBm', metricLabel: '信号强度', secondary: '连接 128',
  },
  {
    id: 'environment-station', name: '环境监测站', code: 'ENV-F06', kind: 'environment', status: 'normal',
    east: -122, north: -46, width: 8, depth: 8, height: 12,
    metric: '18 μg/m³', metricLabel: 'PM2.5', secondary: '噪声 42 dB',
  },
]

export function offsetToCoordinates(east: number, north: number) {
  const longitudeScale = 111_320 * Math.cos(TWIN_ORIGIN.lat * Math.PI / 180)
  return {
    lng: TWIN_ORIGIN.lng + east / longitudeScale,
    lat: TWIN_ORIGIN.lat + north / 110_540,
  }
}

export const CAMPUS_BOUNDARY = [
  offsetToCoordinates(-170, -125),
  offsetToCoordinates(160, -125),
  offsetToCoordinates(160, 125),
  offsetToCoordinates(-170, 125),
]

export const INSPECTION_ROUTE_OFFSETS = [
  [-145, -92, 24], [-115, 78, 36], [-24, 106, 42], [104, 84, 40],
  [135, -35, 32], [40, -102, 38], [-76, -96, 30], [-145, -92, 24],
]

export const INSPECTION_ROUTE = INSPECTION_ROUTE_OFFSETS.map(([east, north, height]) => ({
  ...offsetToCoordinates(east, north),
  height,
}))

export const CAMERA_PRESETS = {
  overview: { east: 360, north: -410, height: 370, heading: -38, pitch: -32 },
  top: { east: 0, north: 0, height: 670, heading: 0, pitch: -90 },
  energy: { east: 205, north: -185, height: 115, heading: -42, pitch: -25 },
} as const

export type CameraPreset = keyof typeof CAMERA_PRESETS
