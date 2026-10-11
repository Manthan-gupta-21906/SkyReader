/**
 * Pure formatting and mathematical utility functions.
 */

import type { UnitSystem } from '../types/settings'

/**
 * Rounds a number to ~0.1 degree/value precision.
 */
export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Formats an ISO date-time into a clean relative string ("Just now", "2h ago", "Yesterday").
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffHours = Math.round((now.getTime() - date.getTime()) / 3600000)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Formats a temperature value according to user unit preference.
 */
export function formatTemperature(celsius: number, units: UnitSystem = 'metric'): string {
  if (units === 'imperial') {
    const fahrenheit = Math.round((celsius * 9) / 5 + 32)
    return `${fahrenheit}°F`
  }
  return `${Math.round(celsius)}°C`
}

/**
 * Formats wind speed according to user unit preference.
 */
export function formatWindSpeed(kmh: number, units: UnitSystem = 'metric'): string {
  if (units === 'imperial') {
    const mph = Math.round(kmh * 0.621371)
    return `${mph} mph`
  }
  return `${Math.round(kmh)} km/h`
}

/**
 * Calculates cache age in minutes.
 */
export function calculateCacheAgeMinutes(fetchedAt: string | null): number | null {
  if (!fetchedAt) return null
  const fetchedTime = new Date(fetchedAt).getTime()
  if (Number.isNaN(fetchedTime)) return null
  const ageMs = Date.now() - fetchedTime
  return Math.max(0, Math.round(ageMs / 60000))
}
