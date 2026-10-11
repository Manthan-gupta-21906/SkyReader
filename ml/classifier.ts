/** Classifier module that wraps the ONNX Worker.
 *  Provides a clean API: load model, predict with top-3, calibration, reject.
 */

import { preprocess } from './preprocess'

export interface CloudClassification {
  top3: { label: string; probability: number }[]
  isUnsure: boolean
  verdict?: 'Go' | 'Go with care' | 'Wait' | 'Stay in'
}

/** Load the ONNX model session and config.
 *  In production this would use onnxruntime-web.
 *  For the scaffold, just mark ready.
 */
export async function loadModel(
  manifest: any,
  worker: Worker
): Promise<void> {
  // Send init to the worker with manifest config
  worker.postMessage({
    type: 'init',
    config: {
      input_size: manifest.input_size,
      mean: manifest.preprocess.mean,
      std: manifest.preprocess.std,
      labels: manifest.labels,
    },
    temperature: manifest.calibration?.temperature ?? 1.3,
    rejectThreshold: manifest.calibration?.rejectThreshold ?? 0.45,
  })
}

/** Predict cloud type from an ImageData object.
 *  Resizes, crops, normalises, runs inference, returns top-3 with calibrated probabilities.
 */
export async function predictFromImage(
  image: ImageData,
  worker: Worker
): Promise<CloudClassification> {
  // Step 1: Preprocess
  const config = {
    input_size: 224,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  }
  const input = preprocess(image, config)

  // Step 2: Send to worker for inference
  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'result') {
        self.removeEventListener('message', handler)
        resolve({
          top3: event.data.top3,
          isUnsure: event.data.isUnsure,
        })
      }
      if (event.data.type === 'error') {
        self.removeEventListener('message', handler)
        resolve({ top3: [], isUnsure: true })
      }
    }
    self.addEventListener('message', handler)
    worker.postMessage({ type: 'predict', input })
  })
}

/** Apply temperature scaling and reject threshold to decide verdict.
 *  This is the deterministic rule engine from the TRD.
 */
export function advise(
  cloudTop3: { label: string; probability }[],
  weatherSnapshot: {
    precip_probability?: number
    wind_gusts?: number
    cape?: number
    weather_code?: number
    cloud_cover?: number
    uv_index?: number
    is_day?: boolean
    apparent_temp?: number
  },
  now: Date
): {
  score: number
  verdict: 'Go' | 'Go with care' | 'Wait' | 'Stay in'
  hard_rule_hit: boolean
  reasons: { factor: string; penalty: number; text: string }[]
  suggestion: string
} {
  let score = 75
  const reasons: { factor: string; penalty: number; text: string }[] = []
  let hardRuleHit = false

  // Get top class probability
  const topProb = cloudTop3[0]?.probability ?? 0
  const topLabel = cloudTop3[0]?.label ?? ''

  // Cloud penalties from TRD
  const cloudPenalties: Record<string, number> = {
    Cb: 30,     // Cumulonimbus
    Ns: 25,     // Nimbostratus
    As: 15,     // Altostratus
    St: 10,     // Stratus
    Cs: 10,     // Cirrostratus
    Cu: 5,      // Altocumulus
    Ci: 5,      // Cirrus
    others: 0,
  }

  const cloudPenalty = topLabel in cloudPenalties ? cloudPenalties[topLabel] : 0
  if (cloudPenalty > 0) {
    score -= cloudPenalty
    reasons.push({
      factor: `cloud_type_${topLabel}`,
      penalty: cloudPenalty,
      text: `Cloud type is ${topLabel}`,
    })
  }

  // Precipitation probability penalty
  if (weatherSnapshot?.precip_probability !== undefined) {
    const p = Math.round(0.4 * weatherSnapshot.precip_probability)
    const capped = Math.min(p, 40)
    score -= capped
    reasons.push({
      factor: 'precip_probability',
      penalty: capped,
      text: `Precipitation probability ${weatherSnapshot.precip_probability}%`,
    })
  }

  // Wind gusts penalty
  if (weatherSnapshot?.wind_gusts !== undefined) {
    let windPenalty = 0
    if (weatherSnapshot.wind_gusts >= 60) windPenalty = 30
    else if (weatherSnapshot.wind_gusts >= 45) windPenalty = 20
    else if (weatherSnapshot.wind_gusts >= 30) windPenalty = 10
    if (windPenalty > 0) {
      score -= windPenalty
      reasons.push({
        factor: 'wind_gusts',
        penalty: windPenalty,
        text: `Wind gusts ${weatherSnapshot.wind_gusts} km/h`,
      })
    }
  }

  // CAPE penalty
  if (weatherSnapshot?.cape !== undefined) {
    let capePenalty = 0
    if (weatherSnapshot.cape >= 2000) capePenalty = 45
    else if (weatherSnapshot.cape >= 1000) capePenalty = 35
    else if (weatherSnapshot.cape >= 500) capePenalty = 25
    if (capePenalty > 0) {
      score -= capePenalty
      reasons.push({
        factor: 'cape',
        penalty: capePenalty,
        text: `CAPE ${weatherSnapshot.cape} J/kg`,
      })
    }
  }

  // Thunder weather codes: -45
  if (weatherSnapshot?.weather_code !== undefined &&
      [95, 96, 99].includes(weatherSnapshot.weather_code)) {
    score -= 45
    reasons.push({
      factor: 'thunder',
      penalty: 45,
      text: 'Thunder weather code detected',
    })
    hardRuleHit = true
  }

  // UV index penalty
  if (weatherSnapshot?.uv_index !== undefined) {
    if (weatherSnapshot.uv_index >= 8) {
      score -= 15
      reasons.push({
        factor: 'uv_index',
        penalty: 15,
        text: 'High UV index',
      })
    } else if (weatherSnapshot.uv_index >= 6) {
      score -= 10
      reasons.push({
        factor: 'uv_index',
        penalty: 10,
        text: 'Moderate UV index',
      })
    }
  }

  // Apparent temperature penalties
  if (weatherSnapshot?.apparent_temp !== undefined) {
    const at = weatherSnapshot.apparent_temp
    if (at < 0 || at > 40) {
      score -= 25
      reasons.push({ factor: 'apparent_temp', penalty: 25, text: 'Extreme apparent temperature' })
    } else if (at < 5 || at > 35) {
      score -= 15
      reasons.push({ factor: 'apparent_temp', penalty: 15, text: 'Uncomfortable apparent temperature' })
    } else if (at < 10 || at > 32) {
      score -= 10
      reasons.push({ factor: 'apparent_temp', penalty: 10, text: 'Mild apparent temperature' })
    }
  }

  // Daylight left under 1 hour
  const hoursLeft = (new Date( now.getTime() + 3600000 ).getHours() - now.getHours()) / 24
  if (hoursLeft < 1) {
    score -= 10
    reasons.push({ factor: 'daylight', penalty: 10, text: 'Less than 1 hour of daylight left' })
  }

  // Hard rule: storm signal caps at Wait
  if (hardRuleHit) {
    score = Math.min(score, 49) // Wait band
  }

  // Verdict bands
  let verdict: 'Go' | 'Go with care' | 'Wait' | 'Stay in'
  if (score >= 75) verdict = 'Go'
  else if (score >= 50) verdict = 'Go with care'
  else if (score >= 25) verdict = 'Wait'
  else verdict = 'Stay in'

  return {
    score: Math.max(score, 0),
    verdict,
    hard_rule_hit,
    reasons,
    suggestion: generateSuggestion(verdict, topLabel, weatherSnapshot),
  }
}

/** Generate a human suggestion based on the verdict and conditions. */
function generateSuggestion(
  verdict: 'Go' | 'Go with care' | 'Wait' | 'Stay in',
  cloudLabel: string,
  weather: any
): string {
  switch (verdict) {
    case 'Go':
      return `Good conditions! ${cloudLabel} clouds typically mean ${getTypicalWeather(cloudLabel)}.`
    case 'Go with care':
      return `Proceed with caution. ${cloudLabel} clouds may bring ${getTypicalWeather(cloudLabel) === '' ? 'variable conditions' : getTypicalWeather(cloudLabel)}}.`
    case 'Wait':
      return `Wait for better conditions. ${cloudLabel} clouds often bring ${getTypicalWeather(cloudLabel) === '' ? 'rain or changes' : getTypicalWeather(cloudLabel)}}.`
    case 'Stay in':
      return `Stay indoors. ${cloudLabel} clouds typically bring ${getTypicalWeather(cloudLabel) === '' ? 'severe weather' : getTypicalWeather(cloudLabel)}}.`
    default:
      return `Check the current conditions before heading out.`
  }
}

/** Return typical weather description for a cloud type. */
function getTypicalWeather(cloud: string): string {
  const map: Record<string, string> = {
    Ci: 'fair weather, high cirrus',
    Cc: 'pleasant, scattered clouds',
    Cs: 'subtle veils, possible halo',
    Ac: 'mackerel sky, possible rain soon',
    As: 'overcast, steady rain possible',
    Ns: 'continuous rain',
    Sc: 'patchy drizzle, overcast',
    St: 'overcast, light rain possible',
    Cu: 'fair, may develop into storms',
    Cb: 'thunderstorms, heavy rain',
    Clr: 'clear, sunny',
  }
  return map[cloud] || ''
}