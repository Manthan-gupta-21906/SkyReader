/**
 * App-wide constants, presets, and configuration defaults.
 */

export const STORAGE_KEYS = {
  SETTINGS: 'skyreader_settings',
  THEME: 'skyreader_theme',
  CACHE_WEATHER: 'skyreader_weather_cache',
  ONBOARDING_SEEN: 'skyreader_onboarding_completed',
} as const

export const DEFAULT_COORDINATES = {
  LATITUDE: 40.71,
  LONGITUDE: -74.01,
  CITY_NAME: 'New York',
} as const

export const CACHE_SETTINGS = {
  WEATHER_TTL_MINUTES: 60,
  GEOCODING_TTL_MINUTES: 1440, // 24 hours
} as const

export const VERDICT_COLORS = {
  go: '#10b981',
  go_with_care: '#f59e0b',
  wait: '#f97316',
  stay_in: '#ef4444',
} as const

export const VERDICT_BADGES = {
  go: 'badge-go',
  go_with_care: 'badge-care',
  wait: 'badge-wait',
  stay_in: 'badge-stay',
} as const

export const VERDICT_ICONS = {
  go: '✅',
  go_with_care: '⚠️',
  wait: '⏳',
  stay_in: '🚫',
} as const

export const THUNDERSTORM_WEATHER_CODES = [95, 96, 99] as const
