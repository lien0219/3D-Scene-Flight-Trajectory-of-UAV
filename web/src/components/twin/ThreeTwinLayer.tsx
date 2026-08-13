import { useEffect, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  Cartesian3,
  Matrix4 as CesiumMatrix4,
  Transforms,
  Viewer as CesiumViewer,
} from 'cesium'
import { INSPECTION_ROUTE_OFFSETS, TWIN_ASSETS, TWIN_ORIGIN } from './twinData'

export interface TwinLayers {
  models: boolean
  devices: boolean
  routes: boolean
  labels: boolean
}

interface Props {
  viewer: CesiumViewer | null
  selectedId: string
  layers: TwinLayers
  running: boolean
}

interface LayerScene {
  root: Group
  models: Group
  devices: Group
  routes: Group
  labels: Group
  selection: Mesh
  drone: Group
  animated: Group[]
  assetGroups: Map<string, Group>
}

const threeVector = (value: Cartesian3) => new Vector3(value.x, value.z, -value.y)

function createTextSprite(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 72
  const context = canvas.getContext('2d')!
  context.fillStyle = 'rgba(7, 17, 22, .86)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#63e6be'
  context.lineWidth = 2
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
  context.fillStyle = '#e7f8f2'
  context.font = '500 27px "Microsoft YaHei", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthTest: false }))
  sprite.scale.set(29, 6.5, 1)
  return sprite
}

function addWindows(group: Group, width: number, depth: number, height: number) {
  const windowMaterial = new MeshBasicMaterial({ color: 0x72e6d2, transparent: true, opacity: 0.72 })
  const rows = Math.max(2, Math.floor(height / 7))
  const columns = Math.max(3, Math.floor(width / 10))
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const windowMesh = new Mesh(new PlaneGeometry(4.8, 2.2), windowMaterial)
      windowMesh.position.set(-width / 2 + 6 + column * ((width - 12) / Math.max(1, columns - 1)), 4.5 + row * 6.3, depth / 2 + 0.06)
      group.add(windowMesh)
    }
  }
}

function createBuilding(asset: typeof TWIN_ASSETS[number]) {
  const group = new Group()
  const isWarning = asset.status === 'warning'
  const body = new Mesh(
    new BoxGeometry(asset.width, asset.height, asset.depth),
    new MeshStandardMaterial({
      color: isWarning ? 0x4b4a3f : 0x273d42,
      roughness: 0.72,
      metalness: 0.18,
      emissive: new Color(isWarning ? 0x1f1600 : 0x051415),
    }),
  )
  body.position.y = asset.height / 2
  group.add(body)

  const roof = new Mesh(
    new BoxGeometry(asset.width + 1.4, 1.3, asset.depth + 1.4),
    new MeshStandardMaterial({ color: isWarning ? 0xf6b94a : 0x69d4bd, metalness: 0.3, roughness: 0.45 }),
  )
  roof.position.y = asset.height + 0.65
  group.add(roof)
  addWindows(group, asset.width, asset.depth, asset.height)

  if (asset.kind === 'energy') {
    for (let row = -1; row <= 1; row += 2) {
      for (let column = -1; column <= 1; column += 2) {
        const panel = new Mesh(
          new BoxGeometry(12, 0.7, 8),
          new MeshStandardMaterial({ color: 0x1b728a, metalness: 0.7, roughness: 0.25 }),
        )
        panel.position.set(column * 7, asset.height + 2.2, row * 5)
        panel.rotation.x = -0.16
        group.add(panel)
      }
    }
  }
  return group
}

function createTower(asset: typeof TWIN_ASSETS[number]) {
  const group = new Group()
  const mast = new Mesh(
    new CylinderGeometry(1.1, 2.5, asset.height, 8),
    new MeshStandardMaterial({ color: 0x93a7aa, metalness: 0.8, roughness: 0.28 }),
  )
  mast.position.y = asset.height / 2
  group.add(mast)

  for (const height of [20, 31, 42]) {
    const ring = new Mesh(
      new TorusGeometry(6, 0.42, 8, 32),
      new MeshBasicMaterial({ color: 0x5ee8c6 }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = height
    group.add(ring)
  }
  const beacon = new Mesh(new ConeGeometry(2.2, 5, 8), new MeshBasicMaterial({ color: 0xff5d5d }))
  beacon.position.y = asset.height + 2.5
  group.add(beacon)
  group.userData.rotate = true
  return group
}

function createSensor(asset: typeof TWIN_ASSETS[number]) {
  const group = new Group()
  const stem = new Mesh(
    new CylinderGeometry(0.6, 0.9, asset.height, 8),
    new MeshStandardMaterial({ color: 0xb1c7c9, metalness: 0.65, roughness: 0.32 }),
  )
  stem.position.y = asset.height / 2
  group.add(stem)
  const head = new Mesh(
    new CylinderGeometry(2.5, 2.5, 2.6, 12),
    new MeshBasicMaterial({ color: 0x59e1bd }),
  )
  head.position.y = asset.height
  group.add(head)
  group.userData.rotate = true
  return group
}

function createGroundNetwork() {
  const geometry = new BufferGeometry().setFromPoints([
    new Vector3(-145, 0.3, 92), new Vector3(-115, 0.3, -78), new Vector3(-24, 0.3, -106),
    new Vector3(104, 0.3, -84), new Vector3(135, 0.3, 35), new Vector3(40, 0.3, 102),
    new Vector3(-76, 0.3, 96), new Vector3(-145, 0.3, 92),
  ])
  return new Line(geometry, new LineBasicMaterial({ color: 0x75f0cd, transparent: true, opacity: 0.9 }))
}

function createDrone() {
  const drone = new Group()
  const bodyMaterial = new MeshStandardMaterial({ color: 0xf2f8f5, metalness: 0.42, roughness: 0.36 })
  const darkMaterial = new MeshStandardMaterial({ color: 0x172426, metalness: 0.7, roughness: 0.28 })
  const body = new Mesh(new BoxGeometry(5.4, 1.6, 3.4), bodyMaterial)
  drone.add(body)
  for (const rotation of [Math.PI / 4, -Math.PI / 4]) {
    const arm = new Mesh(new BoxGeometry(11, 0.55, 0.7), darkMaterial)
    arm.rotation.y = rotation
    drone.add(arm)
  }
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) {
    const rotor = new Mesh(
      new TorusGeometry(2.1, 0.18, 6, 28),
      new MeshBasicMaterial({ color: 0x72f1d0, transparent: true, opacity: 0.9 }),
    )
    rotor.rotation.x = Math.PI / 2
    rotor.position.set(x, 0.8, z)
    drone.add(rotor)
  }
  drone.scale.setScalar(1.35)
  return drone
}

function buildLayerScene() : LayerScene {
  const root = new Group()
  const models = new Group()
  const devices = new Group()
  const routes = new Group()
  const labels = new Group()
  const animated: Group[] = []
  const assetGroups = new Map<string, Group>()
  root.add(models, devices, routes, labels)

  const sitePlate = new Mesh(
    new PlaneGeometry(330, 250),
    new MeshBasicMaterial({ color: 0x0a2928, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false }),
  )
  sitePlate.rotation.x = -Math.PI / 2
  sitePlate.position.y = 0.15
  models.add(sitePlate)
  routes.add(createGroundNetwork())

  for (const asset of TWIN_ASSETS) {
    const assetGroup = asset.kind === 'communication'
      ? createTower(asset)
      : asset.kind === 'environment'
        ? createSensor(asset)
        : createBuilding(asset)
    assetGroup.position.set(asset.east, 0, -asset.north)
    assetGroup.userData.assetId = asset.id
    assetGroups.set(asset.id, assetGroup)
    if (assetGroup.userData.rotate) animated.push(assetGroup)
    if (asset.kind === 'communication' || asset.kind === 'environment') devices.add(assetGroup)
    else models.add(assetGroup)

    const label = createTextSprite(asset.name)
    label.position.set(asset.east, asset.height + 13, -asset.north)
    labels.add(label)
  }

  const selection = new Mesh(
    new TorusGeometry(18, 0.9, 10, 64),
    new MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95, depthTest: false }),
  )
  selection.rotation.x = Math.PI / 2
  selection.position.y = 1.2
  root.add(selection)

  const drone = createDrone()
  routes.add(drone)

  return { root, models, devices, routes, labels, selection, drone, animated, assetGroups }
}

export default function ThreeTwinLayer({ viewer, selectedId, layers, running }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneState = useRef<LayerScene | null>(null)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    if (!viewer || !containerRef.current) return
    const container = containerRef.current
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(50, 1, 0.5, 200_000)
    scene.add(new AmbientLight(0xc8fff1, 1.8))
    const sun = new DirectionalLight(0xfff3d5, 3.8)
    sun.position.set(-200, 400, 260)
    scene.add(sun)
    const layerScene = buildLayerScene()
    sceneState.current = layerScene
    scene.add(layerScene.root)

    const origin = Cartesian3.fromDegrees(TWIN_ORIGIN.lng, TWIN_ORIGIN.lat, 0)
    const enuToWorld = Transforms.eastNorthUpToFixedFrame(origin)
    const worldToEnu = CesiumMatrix4.inverseTransformation(enuToWorld, new CesiumMatrix4())
    const resize = () => {
      const { clientWidth, clientHeight } = container
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / Math.max(clientHeight, 1)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const startedAt = performance.now()
    let frame = 0
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      const positionEnu = CesiumMatrix4.multiplyByPoint(worldToEnu, viewer.camera.positionWC, new Cartesian3())
      const directionEnu = CesiumMatrix4.multiplyByPointAsVector(worldToEnu, viewer.camera.directionWC, new Cartesian3())
      const upEnu = CesiumMatrix4.multiplyByPointAsVector(worldToEnu, viewer.camera.upWC, new Cartesian3())
      const position = threeVector(positionEnu)
      const direction = threeVector(directionEnu)
      camera.position.copy(position)
      camera.up.copy(threeVector(upEnu)).normalize()
      camera.lookAt(position.clone().add(direction))

      const frustum = viewer.camera.frustum as { fovy?: number }
      if (frustum.fovy) camera.fov = frustum.fovy * 180 / Math.PI
      camera.updateProjectionMatrix()

      if (runningRef.current) {
        // The first RAF timestamp can precede performance.now() from this frame.
        const time = Math.max(0, (now - startedAt) / 1000)
        layerScene.animated.forEach((group, index) => {
          group.rotation.y = time * (index % 2 ? -0.3 : 0.3)
        })
        layerScene.selection.scale.setScalar(1 + Math.sin(time * 2.4) * 0.06)

        const progress = (time * 0.055) % 1
        const routeIndex = progress * (INSPECTION_ROUTE_OFFSETS.length - 1)
        const startIndex = Math.floor(routeIndex)
        const endIndex = (startIndex + 1) % INSPECTION_ROUTE_OFFSETS.length
        const amount = routeIndex - startIndex
        const from = INSPECTION_ROUTE_OFFSETS[startIndex]
        const to = INSPECTION_ROUTE_OFFSETS[endIndex]
        layerScene.drone.position.set(
          from[0] + (to[0] - from[0]) * amount,
          from[2] + (to[2] - from[2]) * amount,
          -(from[1] + (to[1] - from[1]) * amount),
        )
        layerScene.drone.rotation.y = Math.atan2(to[0] - from[0], -(to[1] - from[1]))
      }
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Line) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => {
            material.dispose()
          })
        } else if (object instanceof Sprite) {
          object.material.map?.dispose()
          object.material.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
      sceneState.current = null
    }
  }, [viewer])

  useEffect(() => {
    const current = sceneState.current
    if (!current) return
    current.models.visible = layers.models
    current.devices.visible = layers.devices
    current.routes.visible = layers.routes
    current.labels.visible = layers.labels
    const asset = TWIN_ASSETS.find((item) => item.id === selectedId)
    current.selection.visible = Boolean(asset)
    if (asset) current.selection.position.set(asset.east, 1.2, -asset.north)
  }, [layers, selectedId])

  return <div ref={containerRef} className="three-twin-layer" data-testid="three-twin-layer" aria-hidden="true" />
}
