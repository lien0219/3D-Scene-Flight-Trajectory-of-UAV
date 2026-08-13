import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Entity, ImageryLayer, PolylineGraphics, Viewer } from 'resium'
import {
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  EllipsoidTerrainProvider,
  HeadingPitchRange,
  Math as CesiumMath,
  Matrix4,
  NearFarScalar,
  Transforms,
  UrlTemplateImageryProvider,
  Viewer as CesiumViewer,
} from 'cesium'
import ThreeTwinLayer, { type TwinLayers } from './ThreeTwinLayer'
import {
  CAMERA_PRESETS,
  CAMPUS_BOUNDARY,
  INSPECTION_ROUTE,
  offsetToCoordinates,
  TWIN_ASSETS,
  TWIN_ORIGIN,
  type CameraPreset,
} from './twinData'

interface Props {
  selectedId: string
  onSelectAsset: (id: string) => void
  layers: TwinLayers
  running: boolean
  cameraCommand: { preset: CameraPreset; revision: number }
  focusRevision: number
}

const imagery = new UrlTemplateImageryProvider({
  url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
  maximumLevel: 18,
  credit: '地图影像 © 高德地图',
})
const terrain = new EllipsoidTerrainProvider()
const origin = Cartesian3.fromDegrees(TWIN_ORIGIN.lng, TWIN_ORIGIN.lat, 0)
const enu = Transforms.eastNorthUpToFixedFrame(origin)
const boundaryPositions = Cartesian3.fromDegreesArray(CAMPUS_BOUNDARY.flatMap((point) => [point.lng, point.lat]))
const routePositions = Cartesian3.fromDegreesArrayHeights(
  INSPECTION_ROUTE.flatMap((point) => [point.lng, point.lat, point.height]),
)

const labelBase = {
  font: new ConstantProperty('500 13px "Microsoft YaHei", sans-serif'),
  fillColor: new ConstantProperty(Color.fromCssColorString('#e8fff8')),
  outlineColor: new ConstantProperty(Color.fromCssColorString('#071416')),
  outlineWidth: new ConstantProperty(4),
  style: new ConstantProperty(2),
  pixelOffset: new ConstantProperty(new Cartesian2(0, -25)),
  scaleByDistance: new ConstantProperty(new NearFarScalar(100, 1, 2500, 0.2)),
  disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
}

export default function DigitalTwinScene({
  selectedId,
  onSelectAsset,
  layers,
  running,
  cameraCommand,
  focusRevision,
}: Props) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const [viewer, setViewer] = useState<CesiumViewer | null>(null)

  const assetEntities = useMemo(() => TWIN_ASSETS.map((asset) => {
    const coordinates = offsetToCoordinates(asset.east, asset.north)
    const selected = asset.id === selectedId
    const color = asset.status === 'warning' ? Color.fromCssColorString('#ffbe55') : Color.fromCssColorString('#55e0bd')
    return {
      asset,
      position: Cartesian3.fromDegrees(coordinates.lng, coordinates.lat, asset.height + 5),
      point: {
        pixelSize: new ConstantProperty(selected ? 12 : 8),
        color: new ConstantProperty(color),
        outlineColor: new ConstantProperty(selected ? Color.WHITE : Color.fromCssColorString('#071416')),
        outlineWidth: new ConstantProperty(selected ? 3 : 2),
        disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
      },
      label: { text: new ConstantProperty(asset.code), ...labelBase },
    }
  }), [selectedId])

  const focusAsset = useCallback((assetId: string) => {
    const activeViewer = viewerRef.current
    const asset = TWIN_ASSETS.find((item) => item.id === assetId)
    if (!activeViewer || !asset) return
    const coordinates = offsetToCoordinates(asset.east, asset.north)
    const target = Cartesian3.fromDegrees(coordinates.lng, coordinates.lat, asset.height / 2)
    activeViewer.camera.flyToBoundingSphere(new BoundingSphere(target, Math.max(asset.width, asset.height)), {
      offset: new HeadingPitchRange(CesiumMath.toRadians(-35), CesiumMath.toRadians(-27), 150),
      duration: 0.9,
    })
  }, [])

  useEffect(() => {
    if (focusRevision > 0) focusAsset(selectedId)
  }, [focusAsset, focusRevision, selectedId])

  useEffect(() => {
    const activeViewer = viewerRef.current
    if (!activeViewer) return
    const preset = CAMERA_PRESETS[cameraCommand.preset]
    const destination = Matrix4.multiplyByPoint(
      enu,
      new Cartesian3(preset.east, preset.north, preset.height),
      new Cartesian3(),
    )
    activeViewer.camera.flyTo({
      destination,
      orientation: {
        heading: CesiumMath.toRadians(preset.heading),
        pitch: CesiumMath.toRadians(preset.pitch),
        roll: 0,
      },
      duration: cameraCommand.revision === 0 ? 0 : 1.1,
    })
  }, [cameraCommand])

  const handleReady = useCallback((instance: CesiumViewer) => {
    viewerRef.current = instance
    setViewer(instance)
    const scene = instance.scene
    instance.imageryLayers.removeAll()
    scene.globe.enableLighting = true
    scene.globe.showGroundAtmosphere = true
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true
    scene.highDynamicRange = true
    scene.requestRenderMode = false
    scene.globe.depthTestAgainstTerrain = false
    scene.postProcessStages.fxaa.enabled = true

    const preset = CAMERA_PRESETS.overview
    const destination = Matrix4.multiplyByPoint(enu, new Cartesian3(preset.east, preset.north, preset.height), new Cartesian3())
    instance.camera.setView({
      destination,
      orientation: {
        heading: CesiumMath.toRadians(preset.heading),
        pitch: CesiumMath.toRadians(preset.pitch),
        roll: 0,
      },
    })
  }, [])

  return (
    <div className="twin-scene" data-testid="digital-twin-scene">
      <Viewer
        full
        timeline={false}
        animation={false}
        homeButton={false}
        geocoder={false}
        baseLayerPicker={false}
        baseLayer={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false}
        fullscreenButton={false}
        terrainProvider={terrain}
        ref={(element) => {
          if (element?.cesiumElement && !viewerRef.current) handleReady(element.cesiumElement)
        }}
      >
        <ImageryLayer imageryProvider={imagery} brightness={0.7} contrast={1.15} saturation={0.62} />
        <Entity
          polygon={{
            hierarchy: boundaryPositions,
            material: Color.fromCssColorString('#0d8b75').withAlpha(0.18),
            outline: true,
            outlineColor: Color.fromCssColorString('#63e6be').withAlpha(0.9),
          }}
        />
        {layers.routes && (
          <Entity>
            <PolylineGraphics
              positions={routePositions}
              width={3}
              material={Color.fromCssColorString('#7fffd4').withAlpha(0.82)}
            />
          </Entity>
        )}
        {layers.devices && assetEntities.map(({ asset, position, point, label }) => (
          <Entity
            key={asset.id}
            name={asset.name}
            position={position}
            point={point}
            label={layers.labels ? label : undefined}
            onClick={() => {
              onSelectAsset(asset.id)
              focusAsset(asset.id)
            }}
          />
        ))}
      </Viewer>
      <ThreeTwinLayer viewer={viewer} selectedId={selectedId} layers={layers} running={running} />
      <div className="twin-scene__engine-badge" aria-label="渲染引擎">
        <span>CESIUM</span><i /> <span>THREE.JS</span>
      </div>
    </div>
  )
}
