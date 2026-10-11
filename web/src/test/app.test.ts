/**
 * Comprehensive Unit Test Suite for SkyReader.
 * Tests:
 * - Domain: Advice Engine scoring, hard storm cap rule, penalties
 * - Domain: Cloud Genera lookups and WMO data integrity
 * - Utils: Temperature, wind speed, relative time formatters
 * - Errors: AppError hierarchy and message extractors
 */

import { describe, it, expect } from 'vitest'
import {
  computeAdvice,
  computeWeatherPenalties,
  computeSampleAdvice,
} from '../domain/advice/adviceEngine'
import {
  CLOUD_CLASSES,
  getCloudByCode,
  getCloudByIndex,
} from '../domain/clouds/cloudData'
import {
  roundToTenth,
  formatTemperature,
  formatWindSpeed,
  formatRelativeTime,
  calculateCacheAgeMinutes,
} from '../utils/formatters'
import {
  AppError,
  NetworkError,
  TimeoutError,
  ApiError,
  CameraError,
  getErrorMessage,
} from '../utils/errors'
import type { WeatherInput } from '../types/weather'
import type { CloudInfo } from '../types/cloud'

describe('Domain: Cloud Genera Data', () => {
  it('contains 11 total entries (10 WMO Genera + Clear Sky)', () => {
    expect(CLOUD_CLASSES.length).toBe(11)
  })

  it('can look up cloud by code case-insensitively', () => {
    const cb = getCloudByCode('cb')
    expect(cb).toBeDefined()
    expect(cb?.name).toBe('Cumulonimbus')
    expect(cb?.is_storm_signal).toBe(true)

    const clr = getCloudByCode('CLR')
    expect(clr).toBeDefined()
    expect(clr?.name).toBe('Clear Sky')
  })

  it('can look up cloud by label_index', () => {
    const ci = getCloudByIndex(0)
    expect(ci).toBeDefined()
    expect(ci?.code).toBe('Ci')
  })

  it('returns undefined for non-existent codes', () => {
    expect(getCloudByCode('XYZ')).toBeUndefined()
  })
})

describe('Domain: Advice Engine', () => {
  const fairWeather: WeatherInput = {
    precip_prob_3h: 10,
    wind_gust_kmh: 15,
    cape: 100,
    weather_code: 0,
    uv_index: 3,
    apparent_temp_c: 22,
    hours_to_sunset: 5,
    temperature_c: 22,
  }

  const clearSky: CloudInfo = getCloudByCode('Clr')!
  const cumulonimbus: CloudInfo = getCloudByCode('Cb')!

  it('calculates a 100 score and "Go" verdict for clear sky in fair weather', () => {
    const result = computeAdvice(clearSky, fairWeather)
    expect(result.score).toBe(100)
    expect(result.verdict).toBe('go')
    expect(result.verdictLabel).toBe('Go')
    expect(result.hard_rule_hit).toBeNull()
  })

  it('applies hard storm cap to Cumulonimbus regardless of score', () => {
    const result = computeAdvice(cumulonimbus, fairWeather, { enforceStormCap: true })
    // Even if base score is above 50, verdict must be capped at "wait"
    expect(result.hard_rule_hit).toBe('storm_cap')
    expect(result.verdict).toBe('wait')
    expect(result.verdictLabel).toBe('Wait')
  })

  it('deducts rain penalty when precipitation probability exceeds 20%', () => {
    const rainyWeather: WeatherInput = {
      ...fairWeather,
      precip_prob_3h: 80,
    }
    const penalties = computeWeatherPenalties(rainyWeather)
    const rainPen = penalties.find((p) => p.factor === 'Rain chance')
    expect(rainPen).toBeDefined()
    expect(rainPen?.penalty).toBeGreaterThan(0)
  })

  it('adjusts rain penalty scale based on user preference (conservative vs relaxed)', () => {
    const rainyWeather: WeatherInput = {
      ...fairWeather,
      precip_prob_3h: 90,
    }

    const conservativePen = computeWeatherPenalties(rainyWeather, { rainPenaltyScale: 'conservative' })
    const relaxedPen = computeWeatherPenalties(rainyWeather, { rainPenaltyScale: 'relaxed' })

    const consRain = conservativePen.find((p) => p.factor === 'Rain chance')
    const relRain = relaxedPen.find((p) => p.factor === 'Rain chance')

    expect(consRain!.penalty).toBeGreaterThan(relRain!.penalty)
  })

  it('generates sample advice for demo without errors', () => {
    for (const cloud of CLOUD_CLASSES) {
      const advice = computeSampleAdvice(cloud)
      expect(advice.score).toBeGreaterThanOrEqual(0)
      expect(advice.score).toBeLessThanOrEqual(100)
      expect(['go', 'go_with_care', 'wait', 'stay_in']).toContain(advice.verdict)
    }
  })
})

describe('Utils: Formatters & Math', () => {
  it('rounds values to tenths correctly', () => {
    expect(roundToTenth(40.7128)).toBe(40.7)
    expect(roundToTenth(40.76)).toBe(40.8)
    expect(roundToTenth(10)).toBe(10)
  })

  it('formats temperature in Celsius and Fahrenheit', () => {
    expect(formatTemperature(25, 'metric')).toBe('25°C')
    expect(formatTemperature(25, 'imperial')).toBe('77°F')
    expect(formatTemperature(0, 'imperial')).toBe('32°F')
  })

  it('formats wind speed in km/h and mph', () => {
    expect(formatWindSpeed(50, 'metric')).toBe('50 km/h')
    expect(formatWindSpeed(50, 'imperial')).toBe('31 mph')
  })

  it('formats relative time accurately', () => {
    const now = new Date()
    expect(formatRelativeTime(now.toISOString())).toBe('Just now')

    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString()
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
  })

  it('calculates cache age in minutes', () => {
    expect(calculateCacheAgeMinutes(null)).toBeNull()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()
    expect(calculateCacheAgeMinutes(fiveMinutesAgo)).toBe(5)
  })
})

describe('Utils: Error Handling Hierarchy', () => {
  it('preserves error codes and status across custom error classes', () => {
    const netErr = new NetworkError('Failed connection')
    expect(netErr instanceof AppError).toBe(true)
    expect(netErr.code).toBe('NETWORK_ERROR')

    const timeErr = new TimeoutError()
    expect(timeErr.code).toBe('TIMEOUT_ERROR')

    const apiErr = new ApiError('Not Found', 404)
    expect(apiErr.status).toBe(404)

    const camErr = new CameraError('Denied', 'permission_denied')
    expect(camErr.reason).toBe('permission_denied')
  })

  it('extracts readable error message from various error types', () => {
    expect(getErrorMessage(new AppError('Custom error'))).toBe('Custom error')
    expect(getErrorMessage(new Error('Standard error'))).toBe('Standard error')
    expect(getErrorMessage('Raw string error')).toBe('Raw string error')
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.')
  })
})
