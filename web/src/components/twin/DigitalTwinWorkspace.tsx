import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Eye,
  EyeOff,
  Focus,
  Gauge,
  Layers3,
  Map,
  RadioTower,
  Route,
  ScanLine,
  Tags,
  Warehouse,
  Zap,
} from 'lucide-react'
import DigitalTwinScene from './DigitalTwinScene'
import type { TwinLayers } from './ThreeTwinLayer'
import { TWIN_ASSETS, type CameraPreset, type TwinAssetKind } from './twinData'

const assetKinds: { kind: TwinAssetKind; label: string; icon: typeof Building2 }[] = [
  { kind: 'building', label: '建筑空间', icon: Building2 },
  { kind: 'energy', label: '能源设施', icon: Zap },
  { kind: 'communication', label: '通信设施', icon: RadioTower },
  { kind: 'environment', label: '环境感知', icon: Gauge },
]

const layerOptions: { id: keyof TwinLayers; label: string; icon: typeof Layers3 }[] = [
  { id: 'models', label: '建筑模型', icon: Warehouse },
  { id: 'devices', label: '感知设备', icon: ScanLine },
  { id: 'routes', label: '巡检航线', icon: Route },
  { id: 'labels', label: '资产标注', icon: Tags },
]

const cameraOptions: { id: CameraPreset; label: string }[] = [
  { id: 'overview', label: '园区鸟瞰' },
  { id: 'top', label: '正射视图' },
  { id: 'energy', label: '能源站' },
]

export default function DigitalTwinWorkspace() {
  const [selectedId, setSelectedId] = useState('energy-center')
  const [running, setRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [layers, setLayers] = useState<TwinLayers>({ models: true, devices: true, routes: true, labels: true })
  const [expandedKinds, setExpandedKinds] = useState<Set<TwinAssetKind>>(() => new Set(assetKinds.map(({ kind }) => kind)))
  const [cameraCommand, setCameraCommand] = useState<{ preset: CameraPreset; revision: number }>({ preset: 'overview', revision: 0 })
  const [focusRevision, setFocusRevision] = useState(0)
  const [assetPanelOpen, setAssetPanelOpen] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const selectedAsset = TWIN_ASSETS.find((asset) => asset.id === selectedId) ?? TWIN_ASSETS[0]
  const simulatedTime = useMemo(() => {
    const time = new Date('2026-08-13T09:30:00+08:00')
    time.setSeconds(time.getSeconds() + elapsed)
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(time)
  }, [elapsed])

  const toggleKind = (kind: TwinAssetKind) => {
    setExpandedKinds((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const selectAsset = (id: string) => {
    setSelectedId(id)
    setFocusRevision((value) => value + 1)
    setAssetPanelOpen(false)
  }

  return (
    <section className="project-workspace twin-workspace" aria-label="低空园区数字孪生项目">
      <DigitalTwinScene
        selectedId={selectedId}
        onSelectAsset={selectAsset}
        layers={layers}
        running={running}
        cameraCommand={cameraCommand}
        focusRevision={focusRevision}
      />

      <button
        type="button"
        className="twin-mobile-assets"
        aria-label="打开资产目录"
        title="资产目录"
        onClick={() => setAssetPanelOpen((value) => !value)}
      >
        <Layers3 size={19} />
      </button>

      <aside className="twin-assets" data-open={assetPanelOpen} aria-label="园区资产目录">
        <header className="twin-panel__header">
          <div><span>ASSET INDEX</span><h2>园区资产</h2></div>
          <span className="twin-panel__count">{TWIN_ASSETS.length.toString().padStart(2, '0')}</span>
        </header>

        <div className="twin-assets__tree">
          {assetKinds.map(({ kind, label, icon: Icon }) => {
            const items = TWIN_ASSETS.filter((asset) => asset.kind === kind)
            const expanded = expandedKinds.has(kind)
            return (
              <div className="twin-asset-group" key={kind}>
                <button type="button" className="twin-asset-group__title" onClick={() => toggleKind(kind)}>
                  {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <Icon size={16} />
                  <span>{label}</span>
                  <small>{items.length}</small>
                </button>
                {expanded && items.map((asset) => (
                  <button
                    type="button"
                    key={asset.id}
                    className="twin-asset-item"
                    data-active={asset.id === selectedId}
                    onClick={() => selectAsset(asset.id)}
                  >
                    <i data-status={asset.status} />
                    <span><strong>{asset.name}</strong><small>{asset.code}</small></span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="twin-asset-detail">
          <span className="twin-asset-detail__code">{selectedAsset.code}</span>
          <strong>{selectedAsset.name}</strong>
          <div className="twin-asset-detail__metric">
            <span>{selectedAsset.metricLabel}</span><b>{selectedAsset.metric}</b>
          </div>
          <div className="twin-asset-detail__meta">
            <span><i data-status={selectedAsset.status} />{selectedAsset.status === 'warning' ? '负荷预警' : '运行正常'}</span>
            <span>{selectedAsset.secondary}</span>
          </div>
          <button type="button" className="twin-focus-button" onClick={() => setFocusRevision((value) => value + 1)}>
            <Focus size={15} />定位资产
          </button>
        </div>
      </aside>

      <aside className="twin-tools" aria-label="场景工具">
        <div className="twin-tool-group">
          <span className="twin-tool-group__label">图层</span>
          {layerOptions.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className="twin-layer-toggle"
              data-active={layers[id]}
              aria-pressed={layers[id]}
              title={label}
              onClick={() => setLayers((current) => ({ ...current, [id]: !current[id] }))}
            >
              <Icon size={17} />
              <span>{label}</span>
              {layers[id] ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          ))}
        </div>

        <div className="twin-tool-group twin-camera-presets">
          <span className="twin-tool-group__label">视角</span>
          {cameraOptions.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              data-active={cameraCommand.preset === id}
              onClick={() => setCameraCommand({ preset: id, revision: cameraCommand.revision + 1 })}
            >
              <Map size={15} /><span>{label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="twin-kpis" aria-label="园区实时指标">
        <div><Activity size={17} /><span>在线设备<strong>128</strong></span></div>
        <div><Zap size={17} /><span>实时负荷<strong>2.46 MW</strong></span></div>
        <div><Route size={17} /><span>今日巡检<strong>24 km</strong></span></div>
        <div><Gauge size={17} /><span>运行效率<strong>96.8%</strong></span></div>
      </div>

      <footer className="twin-timeline">
        <button
          type="button"
          className="twin-play"
          aria-label={running ? '暂停仿真' : '继续仿真'}
          title={running ? '暂停仿真' : '继续仿真'}
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <CirclePause size={21} /> : <CirclePlay size={21} />}
        </button>
        <div className="twin-time"><small>SIMULATION TIME</small><strong>{simulatedTime}</strong></div>
        <div className="twin-progress"><i style={{ width: `${18 + (elapsed % 72)}%` }} /><span /></div>
        <div className="twin-timeline__event"><i data-status="warning" /><span><small>09:28</small>能源站负荷接近阈值</span></div>
        <span className="twin-speed">1×</span>
      </footer>
    </section>
  )
}
