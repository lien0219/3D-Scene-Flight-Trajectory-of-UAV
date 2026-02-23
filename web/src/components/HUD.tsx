import type { DroneState } from '../types/drone'

interface Props {
  droneState: DroneState | null
  connected: boolean
  droneIds: string[]
  selectedId: string
  onSelectDrone: (id: string) => void
}

export default function HUD({ droneState, connected, droneIds, selectedId, onSelectDrone }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 999,
        background: 'rgba(0,0,0,0.80)',
        color: '#0f0',
        padding: '16px 20px',
        borderRadius: 8,
        fontFamily: '"Consolas", "Courier New", monospace',
        fontSize: 14,
        minWidth: 280,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,255,0,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 12,
          borderBottom: '1px solid rgba(0,255,0,0.2)',
          paddingBottom: 8,
          color: '#0ff',
        }}
      >
        无人机巡航系统 — 深圳
      </div>

      <div style={{ marginBottom: 8 }}>
        连接状态：{connected ? '🟢 已连接' : '🔴 断开'}
        <span style={{ marginLeft: 12, color: '#888', fontSize: 12 }}>
          在线: {droneIds.length} 架
        </span>
      </div>

      {/* 无人机快捷切换 */}
      {droneIds.length > 1 && (
        <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {droneIds.map((id) => (
            <button
              key={id}
              onClick={() => onSelectDrone(id)}
              style={{
                padding: '3px 10px',
                fontSize: 12,
                fontFamily: 'monospace',
                background: id === selectedId ? 'rgba(0,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: id === selectedId ? '#0ff' : '#888',
                border: id === selectedId ? '1px solid #0ff' : '1px solid #444',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {droneState ? (
        <div style={{ lineHeight: '1.8' }}>
          <div>📌 ID : {droneState.droneId}</div>
          <div>📍 经度: {droneState.lng.toFixed(6)}°</div>
          <div>📍 纬度: {droneState.lat.toFixed(6)}°</div>
          <div>📏 高度: {droneState.alt.toFixed(1)} m</div>
          <div>🧭 航向: {droneState.heading.toFixed(1)}°</div>
          <div>📐 俯仰: {droneState.pitch.toFixed(2)}°</div>
          <div>↩️ 横滚: {droneState.roll.toFixed(2)}°</div>
          <div>💨 速度: {droneState.speed} m/s</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            🔋 电池: {droneState.battery}%
            <span
              style={{
                display: 'inline-block',
                width: 70,
                height: 12,
                background: '#333',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid #555',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: `${droneState.battery}%`,
                  height: '100%',
                  background:
                    droneState.battery > 50
                      ? '#0f0'
                      : droneState.battery > 20
                      ? '#ff0'
                      : '#f00',
                  transition: 'width 0.3s',
                }}
              />
            </span>
          </div>
        </div>
      ) : (
        <div style={{ color: '#888' }}>等待数据...</div>
      )}
    </div>
  )
}
