import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { Viewer, Entity, PolylineGraphics, ImageryLayer } from 'resium'
import {
  Cartesian3,
  Color,
  HeadingPitchRoll,
  Math as CesiumMath,
  Transforms,
  ConstantProperty,
  NearFarScalar,
  Cartesian2,
  Viewer as CesiumViewer,
  JulianDate,
  EllipsoidTerrainProvider,
  UrlTemplateImageryProvider,
  SceneMode,
  CallbackProperty,
  Credit,
  CreditDisplay,
  buildModuleUrl,
} from 'cesium'
import type { DroneState, DroneFleet, Mission } from '../types/drone'
import { DroneInterpolator, lerpAngleRad } from '../lib/DroneInterpolator'

import droneModelUrl from '../assets/uav.gltf?url'

const cesiumLogoUrl = buildModuleUrl('Assets/Images/cesium_credit.png')
CreditDisplay.cesiumCredit = new Credit(
  `<a href="https://cesium.com/" target="_blank" rel="noopener noreferrer"><img src="${cesiumLogoUrl}" alt="Cesium" title="Cesium" /></a>`,
  true,
)

const gaodeSatellite = new UrlTemplateImageryProvider({
  url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
  maximumLevel: 18,
  credit: '地图影像 © 高德地图',
})
const flatTerrain = new EllipsoidTerrainProvider()

// ======= 地标 =======
const LANDMARKS: { name: string; lng: number; lat: number; type: 'district' | 'road' | 'poi' }[] = [
  { name: '南山区', lng: 113.930, lat: 22.533, type: 'district' },
  { name: '福田区', lng: 114.055, lat: 22.527, type: 'district' },
  { name: '罗湖区', lng: 114.131, lat: 22.548, type: 'district' },
  { name: '宝安区', lng: 113.883, lat: 22.555, type: 'district' },
  { name: '深圳湾公园', lng: 113.942, lat: 22.515, type: 'poi' },
  { name: '深圳湾大桥', lng: 113.965, lat: 22.498, type: 'poi' },
  { name: '华侨城', lng: 114.004, lat: 22.535, type: 'poi' },
  { name: '市民中心', lng: 114.054, lat: 22.543, type: 'poi' },
  { name: '莲花山公园', lng: 114.058, lat: 22.556, type: 'poi' },
  { name: '会展中心', lng: 114.061, lat: 22.529, type: 'poi' },
  { name: '深圳北站', lng: 114.029, lat: 22.609, type: 'poi' },
  { name: '罗湖口岸', lng: 114.113, lat: 22.543, type: 'poi' },
  { name: '蛇口港', lng: 113.899, lat: 22.477, type: 'poi' },
  { name: '世界之窗', lng: 113.974, lat: 22.535, type: 'poi' },
  { name: '深圳大学', lng: 113.935, lat: 22.530, type: 'poi' },
  { name: '深南大道', lng: 114.020, lat: 22.532, type: 'road' },
  { name: '滨海大道', lng: 113.970, lat: 22.510, type: 'road' },
  { name: '北环大道', lng: 114.050, lat: 22.568, type: 'road' },
  { name: '沿河路', lng: 114.100, lat: 22.540, type: 'road' },
]

const LANDMARK_STYLES = {
  district: {
    font: new ConstantProperty('bold 18px "Microsoft YaHei", sans-serif'),
    fillColor: new ConstantProperty(Color.fromCssColorString('#FFD700')),
    outlineColor: new ConstantProperty(Color.fromCssColorString('#333')),
    outlineWidth: new ConstantProperty(4),
    style: new ConstantProperty(2),
    scaleByDistance: new ConstantProperty(new NearFarScalar(1000, 1.0, 50000, 0.3)),
    disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
  },
  road: {
    font: new ConstantProperty('bold 13px "Microsoft YaHei", sans-serif'),
    fillColor: new ConstantProperty(Color.fromCssColorString('#FFFFFF')),
    outlineColor: new ConstantProperty(Color.fromCssColorString('#555')),
    outlineWidth: new ConstantProperty(3),
    style: new ConstantProperty(2),
    scaleByDistance: new ConstantProperty(new NearFarScalar(500, 1.0, 30000, 0.2)),
    disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
  },
  poi: {
    font: new ConstantProperty('14px "Microsoft YaHei", sans-serif'),
    fillColor: new ConstantProperty(Color.fromCssColorString('#87CEEB')),
    outlineColor: new ConstantProperty(Color.fromCssColorString('#222')),
    outlineWidth: new ConstantProperty(3),
    style: new ConstantProperty(2),
    scaleByDistance: new ConstantProperty(new NearFarScalar(500, 1.0, 25000, 0.2)),
    disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
  },
}

const landmarkEntities = LANDMARKS.map((lm) => ({
  position: Cartesian3.fromDegrees(lm.lng, lm.lat, 5),
  label: {
    text: new ConstantProperty(lm.type === 'road' ? `── ${lm.name} ──` : lm.name),
    ...LANDMARK_STYLES[lm.type],
  },
}))

// 航点样式
const WP_POINT = {
  pixelSize: new ConstantProperty(6),
  color: new ConstantProperty(Color.YELLOW),
  outlineColor: new ConstantProperty(Color.BLACK),
  outlineWidth: new ConstantProperty(1),
  scaleByDistance: new ConstantProperty(new NearFarScalar(500, 1.5, 20000, 0.5)),
}
const WP_LABEL_BASE = {
  font: new ConstantProperty('bold 12px "Microsoft YaHei", sans-serif'),
  fillColor: new ConstantProperty(Color.WHITE),
  outlineColor: new ConstantProperty(Color.BLACK),
  outlineWidth: new ConstantProperty(3),
  style: new ConstantProperty(2),
  pixelOffset: new ConstantProperty(new Cartesian2(10, -10)),
  scaleByDistance: new ConstantProperty(new NearFarScalar(300, 1.0, 15000, 0.3)),
  disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
}

// ======= 无人机模型配置 =======
const DRONE_MODEL_URI = new ConstantProperty(droneModelUrl)
const DRONE_SCALE = new ConstantProperty(1.5)
const DRONE_MIN_PX = new ConstantProperty(88)
const DRONE_MAX_SCALE = new ConstantProperty(80)

const DRONE_DEFAULT_COLOR = Color.LIME

const DRONE_LABEL_BASE = {
  font: new ConstantProperty('bold 14px "Microsoft YaHei", monospace'),
  outlineColor: new ConstantProperty(Color.BLACK),
  outlineWidth: new ConstantProperty(3),
  style: new ConstantProperty(2),
  pixelOffset: new ConstantProperty(new Cartesian2(16, -24)),
  disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
}

type FollowMode = 'chase' | 'top' | 'free'
type WeatherMode = 'clear' | 'foggy' | 'overcast'
type SceneModeType = '3d' | '2d'

interface Props {
  fleet: DroneFleet
  droneIds: string[]
  selectedId: string
  onSelectDrone: (id: string) => void
  mission: Mission | null
}

// 天气
const WEATHER_OVERLAY: Record<WeatherMode, React.CSSProperties> = {
  clear: { display: 'none' },
  foggy: {
    position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(200,200,200,0.5) 0%, rgba(180,180,180,0.7) 60%, rgba(160,160,160,0.85) 100%)',
  },
  overcast: {
    position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(100,100,110,0.45) 0%, rgba(80,80,90,0.25) 40%, transparent 70%)',
  },
}

function DroneEntity({
  droneId,
  interpolator,
  isSelected,
  onSelect,
  color,
}: {
  droneId: string
  interpolator: DroneInterpolator
  isSelected: boolean
  onSelect: () => void
  color: Color
}) {
  const positionProp = useMemo(
    () => new CallbackProperty(() => {
      const c = interpolator.get(droneId)
      if (!c) return Cartesian3.fromDegrees(0, 0, 0)
      return Cartesian3.fromDegrees(c.lng, c.lat, c.alt)
    }, false),
    [droneId, interpolator]
  )

  const orientationProp = useMemo(
    () => new CallbackProperty(() => {
      const c = interpolator.get(droneId)
      if (!c) return Transforms.headingPitchRollQuaternion(
        Cartesian3.fromDegrees(0, 0, 0),
        new HeadingPitchRoll(0, 0, 0)
      )
      const pos = Cartesian3.fromDegrees(c.lng, c.lat, c.alt)
      return Transforms.headingPitchRollQuaternion(
        pos,
        new HeadingPitchRoll(
          CesiumMath.toRadians(c.heading),
          CesiumMath.toRadians(c.pitch),
          CesiumMath.toRadians(c.roll)
        )
      )
    }, false),
    [droneId, interpolator]
  )

  const droneColor = color

  const model = useMemo(() => ({
    uri: DRONE_MODEL_URI,
    scale: DRONE_SCALE,
    minimumPixelSize: DRONE_MIN_PX,
    maximumScale: DRONE_MAX_SCALE,
    silhouetteColor: new ConstantProperty(isSelected ? Color.WHITE : droneColor),
    silhouetteSize: new ConstantProperty(isSelected ? 3 : 1.5),
    color: new ConstantProperty(Color.WHITE),
  }), [droneId, isSelected, droneColor])

  const label = useMemo(() => ({
    text: new ConstantProperty(droneId.toUpperCase()),
    fillColor: new ConstantProperty(isSelected ? Color.WHITE : droneColor),
    ...DRONE_LABEL_BASE,
  }), [droneId, isSelected, droneColor])

  return (
    <Entity
      position={positionProp as any}
      orientation={orientationProp as any}
      model={model}
      label={label}
      onClick={onSelect}
    />
  )
}

export default function CesiumScene({ fleet, droneIds, selectedId, onSelectDrone, mission }: Props) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const [followMode, setFollowMode] = useState<FollowMode>('chase')
  const [weather, setWeather] = useState<WeatherMode>('clear')
  const [sceneMode, setSceneMode] = useState<SceneModeType>('3d')

  // 插值器
  const interpolator = useRef(new DroneInterpolator()).current

  const cameraSmooth = useRef({ lng: 114.05, lat: 22.53, alt: 270, heading: 0 })
  const followModeRef = useRef<FollowMode>('chase')
  const sceneModeRef = useRef<SceneModeType>('3d')
  const selectedIdRef = useRef(selectedId)

  const routeData = useMemo(() => (mission?.drones ?? []).map((drone) => {
    const color = Color.fromCssColorString(drone.color) ?? DRONE_DEFAULT_COLOR
    return {
      ...drone,
      color,
      positions: Cartesian3.fromDegreesArrayHeights(
        [...drone.route, drone.route[0]].flatMap(({ lng, lat, alt }) => [lng, lat, alt]),
      ),
      waypointPositions: drone.route.map(({ lng, lat, alt }) => Cartesian3.fromDegrees(lng, lat, alt)),
      material: color.withAlpha(0.7),
      waypointLabels: drone.route.map((_, index) => ({
        text: new ConstantProperty(`${drone.id.toUpperCase()} WP${index + 1}`),
        ...WP_LABEL_BASE,
      })),
    }
  }), [mission])

  const droneColors = useMemo(() => new Map(
    routeData.map((route) => [route.id, route.color]),
  ), [routeData])

  followModeRef.current = followMode
  sceneModeRef.current = sceneMode
  selectedIdRef.current = selectedId

  useEffect(() => {
    for (const id of droneIds) {
      const s = fleet[id]
      if (s) interpolator.setTarget(id, s)
    }
  }, [fleet, droneIds, interpolator])

  // ===== 动画主循环 =====
  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      // 所有无人机平滑插值
      interpolator.tick(dt)

      // 相机跟随选中无人机
      const viewer = viewerRef.current
      const selId = selectedIdRef.current
      const cur = selId ? interpolator.get(selId) : undefined

      if (viewer && cur && followModeRef.current !== 'free') {
        const fm = followModeRef.current
        const sm = sceneModeRef.current
        const headingRad = CesiumMath.toRadians(cur.heading)
        const camT = 1 - Math.exp(-5 * dt)

        let tLng: number, tLat: number, tAlt: number
        if (fm === 'chase') {
          const offsetDist = sm === '2d' ? 0 : 0.003
          const offsetAlt = sm === '2d' ? 600 : 120
          tLng = cur.lng - Math.sin(headingRad) * offsetDist
          tLat = cur.lat - Math.cos(headingRad) * offsetDist
          tAlt = cur.alt + offsetAlt
        } else {
          tLng = cur.lng
          tLat = cur.lat
          tAlt = cur.alt + 800
        }

        const cam = cameraSmooth.current
        cam.lng += (tLng - cam.lng) * camT
        cam.lat += (tLat - cam.lat) * camT
        cam.alt += (tAlt - cam.alt) * camT
        cam.heading = lerpAngleRad(cam.heading, headingRad, camT)

        const pitchDeg = sm === '2d' ? -90 : (fm === 'chase' ? -25 : -80)
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(cam.lng, cam.lat, cam.alt),
          orientation: { heading: cam.heading, pitch: CesiumMath.toRadians(pitchDeg), roll: 0 },
        })
      }

      if (viewer) viewer.scene.requestRender()
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [interpolator])

  // ===== 2D/3D =====
  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    const target = sceneMode === '3d' ? SceneMode.SCENE3D : SceneMode.SCENE2D
    if (v.scene.mode !== target) {
      v.scene.mode = target
      v.scene.requestRender()
    }
  }, [sceneMode])

  // ===== 天气 =====
  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    const scene = v.scene
    const bl = v.imageryLayers.length > 0 ? v.imageryLayers.get(0) : null

    if (weather === 'clear') {
      scene.fog.enabled = false
      scene.skyAtmosphere.hueShift = 0; scene.skyAtmosphere.saturationShift = 0; scene.skyAtmosphere.brightnessShift = 0
      scene.globe.atmosphereLightIntensity = 10
      if (bl) { bl.brightness = 1; bl.contrast = 1; bl.saturation = 1 }
    } else if (weather === 'foggy') {
      scene.fog.enabled = true; scene.fog.density = 0.0008; scene.fog.minimumBrightness = 0.6
      scene.skyAtmosphere.hueShift = -0.02; scene.skyAtmosphere.saturationShift = -0.8; scene.skyAtmosphere.brightnessShift = -0.3
      scene.globe.atmosphereLightIntensity = 3
      if (bl) { bl.brightness = 1.3; bl.contrast = 0.7; bl.saturation = 0.3 }
    } else {
      scene.fog.enabled = true; scene.fog.density = 0.0003; scene.fog.minimumBrightness = 0.2
      scene.skyAtmosphere.hueShift = -0.04; scene.skyAtmosphere.saturationShift = -0.6; scene.skyAtmosphere.brightnessShift = -0.25
      scene.globe.atmosphereLightIntensity = 4
      if (bl) { bl.brightness = 0.85; bl.contrast = 0.9; bl.saturation = 0.5 }
    }
    scene.requestRender()
  }, [weather])

  // ===== 初始化 =====
  const handleViewerReady = useCallback((viewer: CesiumViewer) => {
    viewerRef.current = viewer
    const scene = viewer.scene
    const globe = scene.globe

    viewer.imageryLayers.removeAll()
    globe.enableLighting = true
    scene.skyAtmosphere.show = true
    globe.showGroundAtmosphere = true
    scene.highDynamicRange = true
    globe.atmosphereLightIntensity = 10

    scene.requestRenderMode = true
    scene.maximumRenderTimeChange = 0.0
    globe.tileCacheSize = 1000
    globe.maximumScreenSpaceError = 1.5
    globe.preloadSiblings = true
    globe.depthTestAgainstTerrain = false

    if (scene.postProcessStages) scene.postProcessStages.fxaa.enabled = true

    viewer.clock.currentTime = JulianDate.fromIso8601('2026-03-15T02:00:00Z')
    viewer.clock.shouldAnimate = false

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(114.0, 22.54, 8000),
      orientation: { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-45), roll: 0 },
      duration: 2,
    })
  }, [])

  const btnStyle = useCallback((active: boolean, activeColor: string) => ({
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: (active ? 'bold' : 'normal') as 'bold' | 'normal',
    fontFamily: 'monospace',
    background: active ? `rgba(${activeColor},0.3)` : 'rgba(0,0,0,0.7)',
    color: active ? `rgb(${activeColor})` : '#aaa',
    border: active ? `2px solid rgb(${activeColor})` : '1px solid #555',
    borderRadius: 6,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.2s',
  }), [])

  return (
    <>
      <div style={WEATHER_OVERLAY[weather]} />

      {/* 右侧控制面板 */}
      <div className="scene-controls">
        <div className="scene-controls__mode" style={{ display: 'flex', gap: 6 }}>
          {(['3d', '2d'] as SceneModeType[]).map((m) => (
            <button key={m} onClick={() => setSceneMode(m)} style={{
              flex: 1, padding: '8px 0', fontSize: 15, fontFamily: 'monospace',
              fontWeight: sceneMode === m ? 'bold' : 'normal',
              background: sceneMode === m ? 'rgba(0,200,255,0.35)' : 'rgba(0,0,0,0.7)',
              color: sceneMode === m ? '#0cf' : '#777',
              border: sceneMode === m ? '2px solid #0cf' : '1px solid #555',
              borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {m === '3d' ? '🌐 3D' : '🗺️ 2D'}
            </button>
          ))}
        </div>

        <div className="scene-controls__separator" style={{ height: 1, background: '#555', margin: '2px 0' }} />

        {/* 无人机选择 */}
        <div className="scene-controls__label" style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', textAlign: 'center' }}>无人机选择</div>
        {droneIds.map((id) => {
          const c = droneColors.get(id) ?? DRONE_DEFAULT_COLOR
          const isActive = id === selectedId
          return (
            <button
              key={id}
              className="scene-controls__drone"
              onClick={() => onSelectDrone(id)}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: isActive ? 'bold' : 'normal',
                fontFamily: 'monospace',
                background: isActive ? `rgba(${c.red * 255},${c.green * 255},${c.blue * 255},0.25)` : 'rgba(0,0,0,0.7)',
                color: isActive ? `rgb(${c.red * 255},${c.green * 255},${c.blue * 255})` : '#888',
                border: isActive ? `2px solid rgb(${c.red * 255},${c.green * 255},${c.blue * 255})` : '1px solid #555',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `rgb(${c.red * 255},${c.green * 255},${c.blue * 255})`,
                boxShadow: isActive ? `0 0 6px rgb(${c.red * 255},${c.green * 255},${c.blue * 255})` : 'none',
              }} />
              {id.toUpperCase()}
            </button>
          )
        })}

        <div className="scene-controls__separator" style={{ height: 1, background: '#555', margin: '2px 0' }} />

        {/* 视角 */}
        {([
          ['chase', '🎯 追尾视角'],
          ['top', '🛰️ 俯瞰视角'],
          ['free', '🖱️ 自由视角'],
        ] as [FollowMode, string][]).map(([m, l]) => (
          <button className="scene-controls__action" key={m} onClick={() => setFollowMode(m)} style={btnStyle(followMode === m, '0,255,255')}>
            {l}
          </button>
        ))}

        <div className="scene-controls__separator" style={{ height: 1, background: '#555', margin: '2px 0' }} />

        {/* 天气 */}
        {([
          ['clear', '☀️ 晴天'],
          ['foggy', '🌫️ 大雾'],
          ['overcast', '☁️ 阴天'],
        ] as [WeatherMode, string][]).map(([m, l]) => (
          <button className="scene-controls__action" key={m} onClick={() => setWeather(m)} style={btnStyle(weather === m, '255,200,0')}>
            {l}
          </button>
        ))}
      </div>

      <Viewer
        full
        timeline={false}
        animation={false}
        homeButton={false}
        geocoder={false}
        baseLayerPicker={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        terrainProvider={flatTerrain}
        ref={(e) => {
          if (e?.cesiumElement && !viewerRef.current) handleViewerReady(e.cesiumElement)
        }}
      >
        <ImageryLayer imageryProvider={gaodeSatellite} />

        {/* 地标 */}
        {landmarkEntities.map((lm, i) => (
          <Entity key={`lm-${i}`} position={lm.position} label={lm.label} />
        ))}

        {/* 所有航线 */}
        {routeData.map((rd) => (
          <Entity key={`route-${rd.id}`}>
            <PolylineGraphics positions={rd.positions} width={3} material={rd.material} clampToGround={false} />
          </Entity>
        ))}

        {/* 所有航线航点 */}
        {routeData.map((rd) =>
          rd.route.map((_, wi) => (
            <Entity
              key={`wp-${rd.id}-${wi}`}
              position={rd.waypointPositions[wi]}
              point={WP_POINT}
              label={rd.waypointLabels[wi]}
            />
          ))
        )}

        {droneIds.map((id) => (
          <DroneEntity
            key={id}
            droneId={id}
            interpolator={interpolator}
            isSelected={id === selectedId}
            onSelect={() => onSelectDrone(id)}
            color={droneColors.get(id) ?? DRONE_DEFAULT_COLOR}
          />
        ))}
      </Viewer>
    </>
  )
}
