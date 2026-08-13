export interface ScenePixelAnalysis {
  visible: boolean
  nonDarkRatio: number
  edgeRatio: number
  colorRange: number
}

export function analyzeScenePixels(
  data: Uint8Array,
  width: number,
  height: number,
): ScenePixelAnalysis {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) {
    return { visible: false, nonDarkRatio: 0, edgeRatio: 0, colorRange: 0 }
  }

  let nonDarkPixels = 0
  let edgePixels = 0
  let minRed = 255
  let minGreen = 255
  let minBlue = 255
  let maxRed = 0
  let maxGreen = 0
  let maxBlue = 0
  const pixels = width * height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4
      const red = data[offset]
      const green = data[offset + 1]
      const blue = data[offset + 2]
      const alpha = data[offset + 3]

      if (alpha > 0 && red + green + blue > 18) nonDarkPixels++
      minRed = Math.min(minRed, red)
      minGreen = Math.min(minGreen, green)
      minBlue = Math.min(minBlue, blue)
      maxRed = Math.max(maxRed, red)
      maxGreen = Math.max(maxGreen, green)
      maxBlue = Math.max(maxBlue, blue)

      if (x > 0 && colorDifference(data, offset, offset - 4) > 18) {
        edgePixels++
      } else if (y > 0 && colorDifference(data, offset, offset - width * 4) > 18) {
        edgePixels++
      }
    }
  }

  const nonDarkRatio = nonDarkPixels / pixels
  const edgeRatio = edgePixels / pixels
  const colorRange = Math.max(maxRed - minRed, maxGreen - minGreen, maxBlue - minBlue)

  return {
    visible: nonDarkRatio > 0.005 && edgeRatio > 0.001 && colorRange > 8,
    nonDarkRatio,
    edgeRatio,
    colorRange,
  }
}

function colorDifference(data: Uint8Array, first: number, second: number): number {
  return Math.abs(data[first] - data[second])
    + Math.abs(data[first + 1] - data[second + 1])
    + Math.abs(data[first + 2] - data[second + 2])
}
