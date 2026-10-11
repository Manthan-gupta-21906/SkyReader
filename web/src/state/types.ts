/**
 * State management types, actions, and reducer definitions.
 */

import type { AppSettings } from '../types/settings'
import type { CloudInfo } from '../types/cloud'
import type { AdviceResult } from '../types/advice'
import type { HourlyWeatherForecast } from '../types/weather'
import type { PredictionOutput } from '../services/ml/inferenceService'

export interface ToastNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  timestamp: number
}

export interface ActiveAnalysisResult {
  cloud: CloudInfo
  advice: AdviceResult
  topPredictions?: PredictionOutput[]
  photoUrl?: string | null
  isDemo?: boolean
  orientation?: string
}

export interface AppState {
  settings: AppSettings
  activeAnalysis: ActiveAnalysisResult | null
  weatherCache: HourlyWeatherForecast | null
  notifications: ToastNotification[]
  isAnalyzing: boolean
}

export type AppAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_ACTIVE_ANALYSIS'; payload: ActiveAnalysisResult | null }
  | { type: 'SET_WEATHER_CACHE'; payload: HourlyWeatherForecast | null }
  | { type: 'SET_IS_ANALYZING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<ToastNotification, 'id' | 'timestamp'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'RESET_SETTINGS' }
