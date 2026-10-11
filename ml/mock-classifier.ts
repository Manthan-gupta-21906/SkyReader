/** Mock classifier used when model.onnx is missing or VITE_MOCK_MODEL=true.
 *  - Sample skies return their own class with plausible probabilities (filename keyed).
 *  - Uploaded photos use a deterministic colour-statistics heuristic.
 *  - All outputs are labelled "Demo model - results are not real." in the UI.
 */

export interface MockPrediction {
  top3: { label: string; probability: number }[]
  isUnsure: boolean
  demo: boolean
  source: 'sample' | 'upload' | 'heuristic'
}

/** Predict from a sample sky image filename.
 *  Maps known sample filenames to their expected cloud class.
 */
export function predictFromSample(filename: string): MockPrediction {
  const sampleMap: Record<string, string> = {
    'Ci.svg': 'Ci',
    'Cc.svg': 'Cc',
    'Cs.svg': 'Cs',
    'Ac.svg': 'Ac',
    'As.svg': 'As',
    'Ns.svg': 'Ns',
    'Sc.svg': 'Sc',
    'St.svg': 'St',
    'Cu.svg': 'Cu',
    'Cb.svg': 'Cb',
    'Clr.svg': 'Clr',
  }

  const classCode = sampleMap[filename] || 'Ci'
  const baseProbs = [0.55, 0.25, 0.12, 0.08] // top-4 plausible probabilities

  // Shuffle but keep the class code at the top
  const labels = ['Ci', 'Cc', 'Cs', 'Ac', 'As', 'Ns', 'Sc', 'St', 'Cu', 'Cb', 'Clr']
  const shuffled = [...labels]
  // Move the predicted class to index 0
  shuffled.unshift(shuffled.splice(labels.indexOf(classCode), 1)[0])

  const top3 = shuffled.slice(0, 3).map((label, i) => ({
    label,
    probability: baseProbs[i] || 0.1,
  }))

  // Normalise
  const sum = top3.reduce((a, b) => a + b.probability, 0)
  top3.forEach((item) => (item.probability = item.probability / sum))

  const isUnsure = top3[0].probability < 0.5

  return {
    top3,
    isUnsure,
    demo: true,
    source: 'sample',
  }
}

/** Predict from an uploaded photo file using deterministic colour statistics.
 *  Uses mean brightness, blue ratio, and saturation to infer cloud type.
 */
export function predictFromUpload(file: File): MockPrediction {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        // Extract pixel data
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let rTotal = 0,
          gTotal = 0,
          bTotal = 0
        let count = 0

        for (let i = 0; i < pixels.length; i += 4) {
          if (i + 3 < pixels.length) {
            rTotal += pixels[i]
            gTotal += pixels[i + 1]
            bTotal += pixels[i + 2]
            count++
          }
        }

        if (count === 0) {
          resolve({ top3: [], isUnsure: true, demo: true, source: 'upload' })
          return
        }

        const rAvg = rTotal / count
        const gAvg = gTotal / count
        const bAvg = bTotal / count
        const total = rAvg + gAvg + bAvg || 1

        const rRatio = rAvg / total
        const gRatio = gAvg / total
        const bRatio = bAvg / total

        // Heuristic rules for cloud classification
        let classCode: string
        if (bRatio > 0.4 && rRatio < 0.3) {
          // Blue-dominant: likely cirrus or clear sky
          classCode = Math.random() > 0.5 ? 'Ci' : 'Clr'
        } else if (rRatio > 0.4 && gRatio > 0.3) {
          // Red/green-dominant: likely cumulus or altocumulus
          classCode = Math.random() > 0.5 ? 'Cc' : 'Ac'
        } else if (gRatio > 0.4) {
          // Green-dominant: likely stratocumulus or clear
          classCode = Math.random() > 0.5 ? 'Sc' : 'Clr'
        } else {
          classCode = 'Cb' // default to cumulonimbus/rain
        }

        const labels = ['Ci', 'Cc', 'Cs', 'Ac', 'As', 'Ns', 'Sc', 'St', 'Cu', 'Cb', 'Clr']
        const top3 = labels.slice(0, 3).map((label) => ({
          label,
          probability: 0.3,
        }))

        // Adjust probability for the detected class
        top3[0] = { label: classCode, probability: 0.5 }
        top3[1] = { label: labels[1], probability: 0.25 }
        top3[2] = { label: labels[2], probability: 0.15 }

        const isUnsure = top3[0].probability < 0.55

        resolve({
          top3,
          isUnsure,
          demo: true,
          source: 'upload',
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

/** Predict from an ImageData object using deterministic heuristics.
 *  Used as a fallback when no model is available.
 */
export function predictFromImageData(imageData: ImageData): MockPrediction {
  const pixels = imageData.data
  let rTotal = 0,
    gTotal = 0,
    bTotal = 0
  let validPixels = 0

  for (let i = 0; i < pixels.length; i += 4) {
    if (i + 3 < pixels.length) {
      rTotal += pixels[i]
      gTotal += pixels[i + 1]
      bTotal += pixels[i + 2]
      validPixels++
    }
  }

  if (validPixels === 0) {
    return { top3: [], isUnsure: true, demo: true, source: 'heuristic' }
  }

  const rAvg = rTotal / validPixels
  const gAvg = gTotal / validPixels
  const bAvg = bTotal / validPixels
  const total = rAvg + gAvg + bAvg || 1

  const rRatio = rAvg / total
  const gRatio = gAvg / total
  const bRatio = bAvg / total

  // Heuristic classification based on colour ratios
  let classCode: string
  if (bRatio > 0.45 && rRatio < 0.35) {
    classCode = 'Ci' // cirrus / high thin clouds
  } else if (rRatio > 0.4 && gRatio > 0.35) {
    classCode = 'Cc' // cumulus / puffy clouds
  } else if (gRatio > 0.45) {
    classCode = 'Sc' // stratocumulus / layered
  } else if (bRatio > 0.35 && rRatio > 0.3) {
    classCode = 'As' // altostratus / gray
  } else if (rRatio > 0.5) {
    classCode = 'Cb' // cumulonimbus / thunderstorm
  } else {
    classCode = 'Clr' // clear sky
  }

  const labels = ['Ci', 'Cc', 'Cs', 'Ac', 'As', 'Ns', 'Sc', 'St', 'Cu', 'Cb', 'Clr']
  const top3 = labels.slice(0, 3).map((label) => ({
    label,
    probability: 0.33,
  }))

  // Boost the detected class
  top3[0] = { label: classCode, probability: 0.5 }
  top3[1] = { label: labels[1], probability: 0.25 }
  top3[2] = { label: labels[2], probability: 0.15 }

  const isUnsure = top3[0].probability < 0.55

  return {
    top3,
    isUnsure,
    demo: true,
    source: 'heuristic',
  }
}