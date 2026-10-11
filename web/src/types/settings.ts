/**
 * User preference, activity profile, and AI calibration types.
 */

export type ThemeMode = 'dark' | 'light' | 'auto'
export type LocationMode = 'rounded' | 'manual' | 'off'
export type UnitSystem = 'metric' | 'imperial'
export type ActivityType =
  | 'walking'
  | 'running'
  | 'hiking'
  | 'cycling'
  | 'photography'
  | 'stargazing'

export interface ActivityOption {
  id: ActivityType
  name: string
  icon: string
  desc: string
  rainSensitivity: 'high' | 'medium' | 'low'
  windThresholdKmh: number
}

export interface SkyFeatureToggle {
  id: string
  name: string
  icon: string
  desc: string
  enabled: boolean
}

export interface ModelPackOption {
  id: string
  name: string
  version: string
  sizeMb: number
  latencyMs: number
  desc: string
  isActive: boolean
}

export interface AppSettings {
  theme: ThemeMode
  locationMode: LocationMode
  units: UnitSystem
  manualCity: string
  activity: ActivityType
  activeModel: string
  temperature: number
  rejectionThreshold: number
  rainPenaltyScale: 'conservative' | 'balanced' | 'relaxed'
  enforceStormCap: boolean
  outcomeWindowHours: number
  skyObjects: SkyFeatureToggle[]
}
