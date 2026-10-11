/**
 * Environment configuration module.
 * Provides type-safe access to environment variables with fallback defaults.
 */

export interface EnvConfig {
  appName: string
  appDescription: string
  weatherApiBaseUrl: string
  geocodingApiBaseUrl: string
  apiTimeoutMs: number
  apiMaxRetries: number
  enableMockFallback: boolean
  isDev: boolean
  isProd: boolean
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key]
  if (value === undefined || value === '') return defaultValue
  const parsed = Number(value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key]
  if (value === undefined || value === '') return defaultValue
  return value === 'true' || value === '1'
}

export const env: EnvConfig = {
  appName: (import.meta.env.VITE_APP_NAME as string) || 'SkyReader',
  appDescription:
    (import.meta.env.VITE_APP_DESCRIPTION as string) ||
    'In-browser cloud classification and intelligent outdoor guidance',
  weatherApiBaseUrl:
    (import.meta.env.VITE_API_WEATHER_BASE_URL as string) ||
    'https://api.open-meteo.com/v1',
  geocodingApiBaseUrl:
    (import.meta.env.VITE_API_GEOCODING_BASE_URL as string) ||
    'https://geocoding-api.open-meteo.com/v1',
  apiTimeoutMs: getEnvNumber('VITE_API_TIMEOUT_MS', 8000),
  apiMaxRetries: getEnvNumber('VITE_API_MAX_RETRIES', 2),
  enableMockFallback: getEnvBoolean('VITE_ENABLE_MOCK_FALLBACK', true),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
