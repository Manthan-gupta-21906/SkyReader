/**
 * Weather client facade.
 * Re-exports from src/services/api/weatherApi and src/utils/formatters for backward compatibility.
 */

import { calculateCacheAgeMinutes } from '../utils/formatters'

export * from '../services/api/weatherApi'
export * from '../types/weather'

export function computeCacheAge(fetchedAt: string | null, maxAgeMinutes: number = 60): number | null {
  const age = calculateCacheAgeMinutes(fetchedAt)
  if (age === null || age > maxAgeMinutes) return null
  return age
}