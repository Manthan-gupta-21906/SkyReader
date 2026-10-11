/**
 * Advice Engine – computes a score-based outdoor verdict from cloud signals & weather conditions.
 * Follows TRD scoring rules:
 * - Starting score: 100
 * - Verdict thresholds:
 *     75–100: Go
 *     50–74:  Go with Care
 *     25–49:  Wait
 *     0–24:   Stay In
 * - Hard rule: Storm signals or thunderstorm codes cap verdict at "Wait" maximum.
 */

import type { CloudInfo } from '../../types/cloud'
import type { WeatherInput } from '../../types/weather'
import type { AdviceResult, Penalty, Verdict } from '../../types/advice'
import { THUNDERSTORM_WEATHER_CODES } from '../../config/constants'

export interface AdviceOptions {
  rainPenaltyScale?: 'conservative' | 'balanced' | 'relaxed'
  enforceStormCap?: boolean
}

/**
 * Computes penalties based on atmospheric weather metrics.
 */
export function computeWeatherPenalties(
  w: WeatherInput,
  options: AdviceOptions = {}
): Penalty[] {
  const penalties: Penalty[] = []
  const rainScale = options.rainPenaltyScale || 'balanced'

  // 1. Precipitation probability
  if (w.precip_prob_3h > 20) {
    const maxPenalty = rainScale === 'conservative' ? 50 : rainScale === 'relaxed' ? 25 : 40
    const factor = rainScale === 'conservative' ? 0.65 : rainScale === 'relaxed' ? 0.35 : 0.5
    const pen = Math.min(maxPenalty, Math.round((w.precip_prob_3h - 20) * factor))
    if (pen > 0) {
      penalties.push({
        factor: 'Rain chance',
        penalty: pen,
        text: `${Math.round(w.precip_prob_3h)}% chance of rain in the next 3 hours`,
      })
    }
  }

  // 2. Wind gusts
  if (w.wind_gust_kmh > 30) {
    const pen = Math.min(30, Math.round((w.wind_gust_kmh - 30) * 0.5))
    penalties.push({
      factor: 'Wind gusts',
      penalty: pen,
      text: `Gusts up to ${Math.round(w.wind_gust_kmh)} km/h`,
    })
  }

  // 3. CAPE convective energy & thunderstorms
  const isThunder = (THUNDERSTORM_WEATHER_CODES as readonly number[]).includes(w.weather_code)
  if (isThunder) {
    penalties.push({
      factor: 'Thunderstorm',
      penalty: 45,
      text: 'Active thunderstorm conditions detected',
    })
  } else if (w.cape > 500) {
    const pen = Math.min(25, Math.round((w.cape - 500) / 40))
    penalties.push({
      factor: 'Storm energy',
      penalty: pen,
      text: `High convective energy (CAPE ${Math.round(w.cape)} J/kg)`,
    })
  }

  // 4. UV index
  if (w.uv_index > 6) {
    const pen = Math.min(15, Math.round((w.uv_index - 6) * 3))
    penalties.push({
      factor: 'UV exposure',
      penalty: pen,
      text: `UV index ${w.uv_index.toFixed(1)} — sun protection needed`,
    })
  }

  // 5. Temperature extremes
  if (w.apparent_temp_c > 38) {
    const pen = Math.min(25, Math.round((w.apparent_temp_c - 38) * 3))
    penalties.push({
      factor: 'Heat',
      penalty: pen,
      text: `Feels like ${Math.round(w.apparent_temp_c)}°C — risk of heat stress`,
    })
  } else if (w.apparent_temp_c < 0) {
    const pen = Math.min(25, Math.round(Math.abs(w.apparent_temp_c) * 2))
    penalties.push({
      factor: 'Cold',
      penalty: pen,
      text: `Feels like ${Math.round(w.apparent_temp_c)}°C — dress warmly`,
    })
  }

  // 6. Daylight remaining
  if (w.hours_to_sunset < 1 && w.hours_to_sunset >= 0) {
    penalties.push({
      factor: 'Daylight',
      penalty: 10,
      text: 'Less than 1 hour of daylight remaining',
    })
  }

  return penalties
}

/**
 * Computes cloud genus signal penalty.
 */
export function computeCloudPenalty(cloud: CloudInfo): Penalty | null {
  if (cloud.signal_weight <= 0) return null
  return {
    factor: `Cloud: ${cloud.name}`,
    penalty: cloud.signal_weight,
    text: cloud.usual_meaning,
  }
}

/**
 * Synthesizes actionable outdoors advice based on verdict and key penalties.
 */
export function generateSuggestion(
  verdict: Verdict,
  penalties: Penalty[],
  weather: WeatherInput
): string {
  const parts: string[] = []

  if (verdict === 'stay_in') {
    parts.push('Best to stay indoors for now.')
  } else if (verdict === 'wait') {
    parts.push('Consider waiting for conditions to improve.')
  }

  const hasRain = penalties.some((p) => p.factor === 'Rain chance')
  const hasWind = penalties.some((p) => p.factor === 'Wind gusts')
  const hasUV = penalties.some((p) => p.factor === 'UV exposure')
  const hasHeat = penalties.some((p) => p.factor === 'Heat')
  const hasCold = penalties.some((p) => p.factor === 'Cold')

  if (hasRain) parts.push('Carry an umbrella or rain jacket.')
  if (hasWind) parts.push('Secure loose items; avoid exposed ridges.')
  if (hasUV) parts.push('Apply SPF 30+ sunscreen; wear a hat.')
  if (hasHeat) parts.push('Stay hydrated; take shade breaks.')
  if (hasCold) parts.push('Layer up and protect extremities.')

  if (weather.hours_to_sunset > 0 && weather.hours_to_sunset < 3) {
    parts.push(`Be back by sunset (~${Math.ceil(weather.hours_to_sunset)} h from now).`)
  }

  if (parts.length === 0) {
    parts.push('Great conditions — enjoy your time outside!')
  }

  return parts.join(' ')
}

/**
 * Main advice calculation function.
 */
export function computeAdvice(
  cloud: CloudInfo,
  weather: WeatherInput,
  options: AdviceOptions = {}
): AdviceResult {
  const enforceStormCap = options.enforceStormCap ?? true
  let score = 100
  const allPenalties: Penalty[] = []

  // Collect weather penalties
  const weatherPenalties = computeWeatherPenalties(weather, options)
  allPenalties.push(...weatherPenalties)

  // Collect cloud penalty
  const cloudPenalty = computeCloudPenalty(cloud)
  if (cloudPenalty) {
    allPenalties.push(cloudPenalty)
  }

  // Deduct penalties
  for (const p of allPenalties) {
    score -= p.penalty
  }
  score = Math.max(0, Math.min(100, score))

  // Determine standard score verdict
  let verdict: Verdict
  if (score >= 75) verdict = 'go'
  else if (score >= 50) verdict = 'go_with_care'
  else if (score >= 25) verdict = 'wait'
  else verdict = 'stay_in'

  // Hard rule enforcement
  let hardRuleHit: 'storm_cap' | null = null
  const isThunderCode = (THUNDERSTORM_WEATHER_CODES as readonly number[]).includes(weather.weather_code)

  if (enforceStormCap && (cloud.is_storm_signal || isThunderCode)) {
    hardRuleHit = 'storm_cap'
    if (verdict === 'go' || verdict === 'go_with_care') {
      verdict = 'wait'
    }
  }

  allPenalties.sort((a, b) => b.penalty - a.penalty)

  const verdictLabels: Record<Verdict, string> = {
    go: 'Go',
    go_with_care: 'Go with Care',
    wait: 'Wait',
    stay_in: 'Stay In',
  }

  return {
    score,
    verdict,
    verdictLabel: verdictLabels[verdict],
    penalties: allPenalties,
    suggestion: generateSuggestion(verdict, allPenalties, weather),
    hard_rule_hit: hardRuleHit,
    cloudExplanation: cloud.usual_meaning,
  }
}

/**
 * Computes sample demo advice for testing and walkthroughs.
 */
export function computeSampleAdvice(
  cloud: CloudInfo,
  options: AdviceOptions = {}
): AdviceResult {
  const sampleWeather: WeatherInput = {
    precip_prob_3h:
      cloud.signal_type === 'rain_now'
        ? 70
        : cloud.signal_type === 'rain_building'
        ? 45
        : cloud.signal_type === 'storm'
        ? 85
        : 15,
    wind_gust_kmh: cloud.is_storm_signal ? 55 : 18,
    cape: cloud.is_storm_signal ? 1200 : 150,
    weather_code: cloud.is_storm_signal ? 95 : 0,
    uv_index: cloud.code === 'Clr' ? 7.5 : 3,
    apparent_temp_c: 24,
    hours_to_sunset: 4,
    temperature_c: 26,
  }

  return computeAdvice(cloud, sampleWeather, options)
}
