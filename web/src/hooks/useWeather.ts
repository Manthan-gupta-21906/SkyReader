/**
 * Custom hook for querying live weather data based on user location mode.
 */

import { useState, useCallback } from 'react'
import { fetchHourlyWeather, geocodeCity } from '../services/api/weatherApi'
import { DEFAULT_COORDINATES } from '../config/constants'
import type { HourlyWeatherForecast } from '../types/weather'
import { useAppState } from '../state/useAppState'
import { getErrorMessage } from '../utils/errors'

export interface UseWeatherReturn {
  weather: HourlyWeatherForecast | null
  isLoading: boolean
  error: string | null
  locationLabel: string
  fetchCurrentWeather: () => Promise<HourlyWeatherForecast | null>
}

export function useWeather(): UseWeatherReturn {
  const { state, dispatch, notify } = useAppState()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationLabel, setLocationLabel] = useState<string>('Default Location')

  const fetchCurrentWeather = useCallback(async (): Promise<HourlyWeatherForecast | null> => {
    setIsLoading(true)
    setError(null)

    try {
      let lat: number = DEFAULT_COORDINATES.LATITUDE
      let lon: number = DEFAULT_COORDINATES.LONGITUDE
      let label: string = DEFAULT_COORDINATES.CITY_NAME

      const { locationMode, manualCity } = state.settings

      if (locationMode === 'manual' && manualCity.trim()) {
        try {
          const geo = await geocodeCity(manualCity)
          lat = geo.lat
          lon = geo.lon
          label = geo.label
        } catch {
          notify({
            type: 'warning',
            message: `Could not find "${manualCity}", using standard coordinates.`,
          })
        }
      } else if (locationMode === 'rounded' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
          label = 'Local Area'
        } catch {
          // Fall back gracefully to default coordinates
        }
      }

      setLocationLabel(label)

      const forecast = await fetchHourlyWeather(lat, lon)
      dispatch({ type: 'SET_WEATHER_CACHE', payload: forecast })
      return forecast
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      notify({
        type: 'error',
        message: `Failed to load weather: ${msg}`,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [state.settings, dispatch, notify])

  return {
    weather: state.weatherCache,
    isLoading,
    error,
    locationLabel,
    fetchCurrentWeather,
  }
}
