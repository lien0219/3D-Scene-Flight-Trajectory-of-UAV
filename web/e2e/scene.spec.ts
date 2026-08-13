import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

test('renders live telemetry and a nonblank 3D scene without panel overlap', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')

  const hud = page.locator('.hud-panel')
  const controls = page.locator('.scene-controls')
  await expect(hud).toContainText('深圳无人机巡航演示')
  await expect(hud).toContainText('已连接')
  await expect(hud).toContainText('uav-001')
  await expect(controls).toBeVisible()

  const canvas = page.locator('.cesium-widget canvas')
  await expect(canvas).toBeVisible()
  const cesiumLogo = page.locator('.cesium-credit-logoContainer')
  await expect(cesiumLogo).toBeVisible()
  await expect(cesiumLogo.locator('img')).toHaveAttribute('src', /cesium_credit\.png$/)
  await expect(page.locator('.cesium-credit-textContainer')).toBeHidden()
  await expect(page.locator('.cesium-credit-expand-link')).toBeHidden()
  const [canvasBox, hudBox, controlsBox] = await Promise.all([
    canvas.boundingBox(),
    hud.boundingBox(),
    controls.boundingBox(),
  ])
  expect(canvasBox).not.toBeNull()
  expect(hudBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(rectanglesOverlap(hudBox!, controlsBox!)).toBe(false)
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  const sceneClip = {
    x: Math.floor(viewport!.width * 0.38),
    y: Math.floor(viewport!.height * 0.48),
    width: Math.floor(viewport!.width * 0.24),
    height: Math.floor(viewport!.height * 0.16),
  }
  await expect.poll(async () => sceneRegionIsVisible(
    await page.screenshot({ clip: sceneClip }),
  ), { timeout: 20_000 }).toBe(true)
  expect(pageErrors).toEqual([])

  await page.screenshot({ path: `test-results/${test.info().project.name}-scene.png`, fullPage: true })
})

function rectanglesOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function sceneRegionIsVisible(buffer: Buffer): boolean {
  const image = PNG.sync.read(buffer)
  let visibleSamples = 0
  let samples = 0
  const stepX = Math.max(1, Math.floor(image.width / 20))
  const stepY = Math.max(1, Math.floor(image.height / 20))

  for (let y = 0; y < image.height; y += stepY) {
    for (let x = 0; x < image.width; x += stepX) {
      const offset = (image.width * y + x) * 4
      const red = image.data[offset]
      const green = image.data[offset + 1]
      const blue = image.data[offset + 2]
      if (red + green + blue > 30) visibleSamples++
      samples++
    }
  }

  return visibleSamples / samples > 0.5
}
