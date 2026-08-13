import { describe, expect, it } from 'vitest'
import { analyzeScenePixels } from './scenePixels'

describe('analyzeScenePixels', () => {
  it('rejects uniformly blank frames', () => {
    expect(analyzeScenePixels(solidFrame(20, 20, [0, 0, 0]), 20, 20).visible).toBe(false)
    expect(analyzeScenePixels(solidFrame(20, 20, [4, 10, 16]), 20, 20).visible).toBe(false)
  })

  it('accepts dark scenes with sparse rendered geometry', () => {
    const frame = solidFrame(20, 20, [2, 5, 7])
    for (let index = 8; index < 12; index++) {
      setPixel(frame, 20, index, 9, [35, 220, 190])
      setPixel(frame, 20, index, 10, [35, 220, 190])
    }

    const result = analyzeScenePixels(frame, 20, 20)
    expect(result.visible).toBe(true)
    expect(result.nonDarkRatio).toBeLessThan(0.1)
  })

  it('accepts detailed imagery and rejects invalid buffers', () => {
    const frame = solidFrame(20, 20, [30, 40, 50])
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x += 2) setPixel(frame, 20, x, y, [90, 110, 70])
    }

    expect(analyzeScenePixels(frame, 20, 20).visible).toBe(true)
    expect(analyzeScenePixels(new Uint8Array(), 20, 20).visible).toBe(false)
  })
})

function solidFrame(width: number, height: number, color: [number, number, number]): Uint8Array {
  const data = new Uint8Array(width * height * 4)
  for (let index = 0; index < width * height; index++) {
    const offset = index * 4
    data[offset] = color[0]
    data[offset + 1] = color[1]
    data[offset + 2] = color[2]
    data[offset + 3] = 255
  }
  return data
}

function setPixel(
  data: Uint8Array,
  width: number,
  x: number,
  y: number,
  color: [number, number, number],
): void {
  const offset = (y * width + x) * 4
  data[offset] = color[0]
  data[offset + 1] = color[1]
  data[offset + 2] = color[2]
}
