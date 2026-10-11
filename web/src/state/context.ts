/**
 * App State Context and default preferences definitions.
 */

import { createContext } from 'react'
import type { AppState, AppAction, ToastNotification, ActiveAnalysisResult } from './types'
import type { AppSettings } from '../types/settings'
import { STORAGE_KEYS } from '../config/constants'

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  locationMode: 'rounded',
  units: 'metric',
  manualCity: '',
  activity: 'walking',
  activeModel: 'mobilenet_v3',
  temperature: 1.0,
  rejectionThreshold: 0.45,
  rainPenaltyScale: 'balanced',
  enforceStormCap: true,
  outcomeWindowHours: 3,
  skyObjects: [
    { id: 'clouds_10', name: '10 WMO Cloud Genera', icon: '☁️', desc: 'Full WMO cloud classification atlas', enabled: true },
    { id: 'sun_glare', name: 'Sun Glare Filter', icon: '☀️', desc: 'Warn when direct glare obscures clouds', enabled: true },
    { id: 'horizon_guide', name: 'Horizon Leveling Guide', icon: '📐', desc: '0° leveler overlay in camera viewfinder', enabled: true },
    { id: 'moon_celestial', name: 'Celestial & Moon Phase', icon: '🌙', desc: 'Stargazing & optical clarity index', enabled: false },
    { id: 'optical_halos', name: 'Optical Halos & Ice Crystals', icon: '🌈', desc: 'Cirrostratus 22° solar halo detector', enabled: true },
  ],
}

export function loadInitialSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch {
    // Ignore storage parse error
  }
  return DEFAULT_SETTINGS
}

export interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  updateSettings: (newSettings: Partial<AppSettings>) => void
  setAnalysis: (analysis: ActiveAnalysisResult | null) => void
  notify: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void
  dismissNotification: (id: string) => void
}

export const AppStateContext = createContext<AppContextValue | null>(null)
