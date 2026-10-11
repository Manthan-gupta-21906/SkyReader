/**
 * Machine Learning Inference Service.
 * Manages model calibration temperature, rejection thresholds, and top-3 probability predictions.
 */

import { CLOUD_CLASSES } from '../../domain/clouds/cloudData'
import type { CloudInfo } from '../../types/cloud'
import type { ModelPackOption } from '../../types/settings'

export interface PredictionOutput {
  cloud: CloudInfo
  confidence: number
}

export interface InferenceResult {
  primary: CloudInfo
  topPredictions: PredictionOutput[]
  latencyMs: number
  isUnsure: boolean
}

export const AVAILABLE_MODELS: ModelPackOption[] = [
  {
    id: 'mobilenet_v3',
    name: 'MobileNetV3-Small (WASM)',
    version: '1.2.0',
    sizeMb: 3.2,
    latencyMs: 45,
    desc: 'Recommended · High speed & low memory footprint',
    isActive: true,
  },
  {
    id: 'efficientnet_lite',
    name: 'EfficientNet-Lite0 (ONNX)',
    version: '0.9.4',
    sizeMb: 4.8,
    latencyMs: 72,
    desc: 'High detail · Better distinction for overlapping altocumulus',
    isActive: false,
  },
  {
    id: 'heuristic_rules',
    name: 'CloudNet-Heuristic (Offline)',
    version: '2.0.0',
    sizeMb: 0.2,
    latencyMs: 5,
    desc: 'Ultra-fast fallback when WASM is throttled',
    isActive: false,
  },
]

/**
 * Simulates in-browser neural network inference with temperature softmax scaling.
 */
export async function runInference(
  _image: File | Blob,
  options: {
    temperature?: number
    rejectionThreshold?: number
    activeModelId?: string
  } = {}
): Promise<InferenceResult> {
  const temperature = options.temperature ?? 1.0
  const threshold = options.rejectionThreshold ?? 0.45

  // Simulated latency
  const startTime = performance.now()
  await new Promise((resolve) => setTimeout(resolve, 600))
  const latencyMs = Math.round(performance.now() - startTime)

  // Random primary cloud selection for demo
  const primary = CLOUD_CLASSES[Math.floor(Math.random() * CLOUD_CLASSES.length)]

  // Softmax-like probability with temperature
  const baseConf = 0.65 + Math.random() * 0.25
  const scaledConf = Math.min(0.98, Math.max(0.3, baseConf / temperature))

  const otherClouds = CLOUD_CLASSES.filter((c) => c.code !== primary.code)
  const shuffledOthers = [...otherClouds].sort(() => Math.random() - 0.5)

  const remaining = Math.max(0.02, 1 - scaledConf)
  const conf2 = remaining * (0.6 + Math.random() * 0.3)
  const conf3 = Math.max(0.01, remaining - conf2)

  const topPredictions: PredictionOutput[] = [
    { cloud: primary, confidence: Number(scaledConf.toFixed(2)) },
    { cloud: shuffledOthers[0], confidence: Number(conf2.toFixed(2)) },
    { cloud: shuffledOthers[1], confidence: Number(conf3.toFixed(2)) },
  ]

  const isUnsure = scaledConf < threshold

  return {
    primary,
    topPredictions,
    latencyMs,
    isUnsure,
  }
}

/**
 * Generates top 3 simulated predictions for a known primary cloud (e.g. in Atlas or sample tests).
 */
export function generateTopPredictions(primary: CloudInfo): PredictionOutput[] {
  const primaryConf = 0.72 + Math.random() * 0.2
  const remaining = 1 - primaryConf
  const others = CLOUD_CLASSES.filter((c) => c.code !== primary.code).sort(() => Math.random() - 0.5)

  const conf2 = remaining * 0.7
  const conf3 = remaining - conf2

  return [
    { cloud: primary, confidence: Number(primaryConf.toFixed(2)) },
    { cloud: others[0], confidence: Number(conf2.toFixed(2)) },
    { cloud: others[1], confidence: Number(Math.max(0.02, conf3).toFixed(2)) },
  ]
}
