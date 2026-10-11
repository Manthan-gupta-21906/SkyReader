/** Pure preprocessing following the model manifest:
 *  - Resize short side to input_size
 *  - Centre-crop to input_size
 *  - Mean/std normalise (CHW float32)
 *  - No browser globals; safe to run on the main thread or a worker
 */

export interface PreprocessConfig {
  input_size: number
  mean: number[]
  std: number[]
}

/** Resize the short side of a uint8[H,W,3] image to target, then centre-crop.
 *  Returns a CHW float32 Tensor of shape [3, input_size, input_size].
 */
export function preprocess(
  imageData: ImageData,
  config: PreprocessConfig
): Float32Array {
  const { input_size, mean, std } = config
  const H = imageData.height
  const W = imageData.width
  const C = 3

  /** Step 1: Resize short side to input_size preserving aspect ratio */
  const scale = input_size / Math.min(H, W)
  const newH = Math.round(H * scale)
  const newW = Math.round(W * scale)

  /** Create a temporary canvas for resize */
  const resizeCanvas = document.createElement('canvas')
  resizeCanvas.width = newW
  resizeCanvas.height = newH
  const resizeCtx = resizeCanvas.getContext('2d')!
  resizeCtx.drawImage(imageData, 0, 0, newW, newH)

  /** Step 2: Centre-crop to input_size */
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = input_size
  cropCanvas.height = input_size
  const cropCtx = cropCanvas.getContext('2d')!
  const cropX = Math.round((newW - input_size) / 2)
  const cropY = Math.round((newH - input_size) / 2)
  cropCtx.drawImage(resizeCanvas, cropX, cropY, input_size, input_size, 0, 0, input_size, input_size)

  /** Step 3: Extract pixel data and normalise to CHW float32 */
  const imageDataOut = cropCtx.getImageData(0, 0, input_size, input_size)
  const pixels = imageDataOut.data // RGBA interleaved, length = 4 * input_size * input_size
  const chw = new Float32Array(input_size * input_size * 3)

  for (let y = 0; y < input_size; y++) {
    for (let x = 0; x < input_size; x++) {
      const i = (y * input_size + x) * 4
      // R channel at index 0, G at 1, B at 2, ignore A
      chw[y * input_size + x] = (pixels[i] / 255.0 - mean[0]) / std[0] // R
      chw[(input_size * input_size) + y * input_size + x] = (pixels[i + 1] / 255.0 - mean[1]) / std[1] // G
      chw[(input_size * input_size) * 2 + y * input_size + x] = (pixels[i + 2] / 255.0 - mean[2]) / std[2] // B
    }
  }

  return chw
}