/** Advice engine – computes a score-based verdict from cloud signal + weather data.
 *  Follows the TRD scoring rules exactly:
 *  - Start at 100, subtract penalties, clamp to 0–100.
 *  - Verdict bands: 75–100 Go, 50–74 Go with care, 25–49 Wait, 0–24 Stay in.
 *  - Hard rule: storm signal caps verdict at "Wait" max.
 */

import { type CloudInfo } from '../domain/cloud-data'

export type Verdict = 'go' | 'go_with_care' | 'wait' | 'stay_in'

export interface WeatherInput {
  precip_prob_3h: number        // max precipitation probability next 3h (0–100)
  wind_gust_kmh: number         // wind gusts km/h
  cape: number                  // convective energy J/kg
  weather_code: number          // WMO weather code
  uv_index: number              // UV index
  apparent_temp_c: number       // "feels like" temperature
  hours_to_sunset: number       // hours of daylight remaining
  temperature_c: number         // actual temperature
}

export interface Penalty {
  factor: string
  penalty: number
  text: string
}

export interface AdviceResult {
  score: number
  verdict: Verdict
  verdictLabel: string
  penalties: Penalty[]
  suggestion: string
  hard_rule_hit: string | null
  cloudExplanation: string
}

/** WMO weather codes that indicate thunderstorm */
const THUNDER_CODES = [95, 96, 99]

/** Compute penalties from weather data */
function computeWeatherPenalties(w: WeatherInput): Penalty[] {
  const penalties: Penalty[] = []

  // Precipitation probability (up to -40)
  if (w.precip_prob_3h > 20) {
    const pen = Math.min(40, Math.round((w.precip_prob_3h - 20) * 0.5))
    penalties.push({
      factor: 'Rain chance',
      penalty: pen,
      text: `${Math.round(w.precip_prob_3h)}% chance of rain in the next 3 hours`,
    })
  }

  // Wind gusts (-10 to -30)
  if (w.wind_gust_kmh > 30) {
    const pen = Math.min(30, Math.round((w.wind_gust_kmh - 30) * 0.5))
    penalties.push({
      factor: 'Wind gusts',
      penalty: pen,
      text: `Gusts up to ${Math.round(w.wind_gust_kmh)} km/h`,
    })
  }

  // CAPE / Thunder (-25 to -45)
  if (THUNDER_CODES.includes(w.weather_code)) {
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

  // UV index (-5 to -15)
  if (w.uv_index > 6) {
    const pen = Math.min(15, Math.round((w.uv_index - 6) * 3))
    penalties.push({
      factor: 'UV exposure',
      penalty: pen,
      text: `UV index ${w.uv_index.toFixed(1)} — sun protection needed`,
    })
  }

  // Temperature extremes (-10 to -25)
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

  // Daylight remaining (-10)
  if (w.hours_to_sunset < 1 && w.hours_to_sunset >= 0) {
    penalties.push({
      factor: 'Daylight',
      penalty: 10,
      text: `Less than 1 hour of daylight remaining`,
    })
  }

  return penalties
}

/** Compute cloud signal penalty */
function computeCloudPenalty(cloud: CloudInfo): Penalty | null {
  if (cloud.signal_weight <= 0) return null
  return {
    factor: `Cloud: ${cloud.name}`,
    penalty: cloud.signal_weight,
    text: cloud.usual_meaning,
  }
}

/** Generate a suggestion based on the verdict and top reasons */
function generateSuggestion(verdict: Verdict, penalties: Penalty[], weather: WeatherInput): string {
  const parts: string[] = []

  if (verdict === 'stay_in') {
    parts.push('Best to stay indoors for now.')
  } else if (verdict === 'wait') {
    parts.push('Consider waiting for conditions to improve.')
  }

  const hasRain = penalties.some(p => p.factor === 'Rain chance')
  const hasWind = penalties.some(p => p.factor === 'Wind gusts')
  const hasUV = penalties.some(p => p.factor === 'UV exposure')
  const hasHeat = penalties.some(p => p.factor === 'Heat')
  const hasCold = penalties.some(p => p.factor === 'Cold')

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

/** Main advice computation */
export function computeAdvice(cloud: CloudInfo, weather: WeatherInput): AdviceResult {
  let score = 100
  const allPenalties: Penalty[] = []

  // Weather penalties
  const weatherPen = computeWeatherPenalties(weather)
  allPenalties.push(...weatherPen)

  // Cloud penalty
  const cloudPen = computeCloudPenalty(cloud)
  if (cloudPen) allPenalties.push(cloudPen)

  // Apply penalties
  for (const p of allPenalties) {
    score -= p.penalty
  }
  score = Math.max(0, Math.min(100, score))

  // Determine verdict from score
  let verdict: Verdict
  if (score >= 75) verdict = 'go'
  else if (score >= 50) verdict = 'go_with_care'
  else if (score >= 25) verdict = 'wait'
  else verdict = 'stay_in'

  // Hard rules: storm signals cap verdict at "wait"
  let hard_rule_hit: string | null = null
  if (cloud.is_storm_signal || THUNDER_CODES.includes(weather.weather_code)) {
    hard_rule_hit = 'storm_cap'
    if (verdict === 'go' || verdict === 'go_with_care') {
      verdict = 'wait'
    }
  }

  // Sort penalties by severity
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
    hard_rule_hit,
    cloudExplanation: cloud.usual_meaning,
  }
}

/** Generate sample advice for demo mode */
export function computeSampleAdvice(cloud: CloudInfo): AdviceResult {
  // Simulate mild weather conditions for demo
  const sampleWeather: WeatherInput = {
    precip_prob_3h: cloud.signal_type === 'rain_now' ? 70 :
                    cloud.signal_type === 'rain_building' ? 45 :
                    cloud.signal_type === 'storm' ? 85 : 15,
    wind_gust_kmh: cloud.is_storm_signal ? 55 : 18,
    cape: cloud.is_storm_signal ? 1200 : 150,
    weather_code: cloud.is_storm_signal ? 95 : 0,
    uv_index: cloud.code === 'Clr' ? 7.5 : 3,
    apparent_temp_c: 24,
    hours_to_sunset: 4,
    temperature_c: 26,
  }
  return computeAdvice(cloud, sampleWeather)
}
