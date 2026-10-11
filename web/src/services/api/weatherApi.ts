/**
 * Weather & Geocoding API service.
 * Interacts with Open-Meteo APIs using coarse coordinate rounding for privacy.
 */

import { httpClient } from './client'
import { env } from '../../config/env'
import { roundToTenth } from '../../utils/formatters'
import type {
  DailyWeatherSummary,
  GeocodingCoordinates,
  HourlyWeatherForecast,
} from '../../types/weather'
import { ApiError } from '../../utils/errors'

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    apparent_temperature_2m: number[]
    precipitation_probability: number[]
    precipitation: number[]
    weather_code: number[]
    cloud_cover: number[]
    visibility: number[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    uv_index: number[]
    cape: number[]
    is_day: number[]
  }
}

interface OpenMeteoDailyResponse {
  daily: {
    sunrise: string[]
    sunset: string[]
  }
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    latitude: number
    longitude: number
    name: string
    country?: string
    admin1?: string
  }>
}

/**
 * Geocode a city name into coarse {lat, lon} coordinates.
 */
export async function geocodeCity(city: string): Promise<GeocodingCoordinates & { label: string }> {
  const trimmed = city.trim()
  if (!trimmed) {
    throw new ApiError('City name cannot be empty', 400)
  }

  const url = new URL(`${env.geocodingApiBaseUrl}/search`)
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')

  const response = await httpClient<OpenMeteoGeocodingResponse>(url)
  const first = response.results?.[0]

  if (!first) {
    throw new ApiError(`No location results found for "${trimmed}"`, 404)
  }

  return {
    lat: roundToTenth(first.latitude),
    lon: roundToTenth(first.longitude),
    label: first.name + (first.country ? `, ${first.country}` : ''),
  }
}

/**
 * Fetch hourly weather parameters from Open-Meteo for rounded coordinates.
 */
export async function fetchHourlyWeather(
  lat: number,
  lon: number,
  hourOffset: number = 0
): Promise<HourlyWeatherForecast> {
  const roundedLat = roundToTenth(lat)
  const roundedLon = roundToTenth(lon)

  const url = new URL(`${env.weatherApiBaseUrl}/forecast`)
  url.searchParams.set('latitude', roundedLat.toString())
  url.searchParams.set('longitude', roundedLon.toString())
  url.searchParams.set(
    'hourly',
    'temperature_2m,apparent_temperature_2m,precipitation_probability,precipitation,weather_code,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index,cape,is_day'
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '2')

  const data = await httpClient<OpenMeteoHourlyResponse>(url)
  const hourly = data.hourly

  if (!hourly || !hourly.time || hourly.time.length === 0) {
    throw new ApiError('Empty hourly weather forecast returned from provider', 500)
  }

  const index = Math.max(0, Math.min(hourly.time.length - 1, hourOffset))

  return {
    temperature_2m: hourly.temperature_2m[index] ?? 20,
    apparent_temperature_2m: hourly.apparent_temperature_2m[index] ?? 20,
    precipitation_probability: hourly.precipitation_probability[index] ?? 0,
    precipitation: hourly.precipitation[index] ?? 0,
    weather_code: hourly.weather_code[index] ?? 0,
    cloud_cover: hourly.cloud_cover[index] ?? 0,
    visibility: hourly.visibility[index] ?? 10000,
    wind_speed_10m: hourly.wind_speed_10m[index] ?? 0,
    wind_gusts_10m: hourly.wind_gusts_10m[index] ?? 0,
    uv_index: hourly.uv_index[index] ?? 0,
    cape: hourly.cape[index] ?? 0,
    is_day: hourly.is_day[index] ?? 1,
  }
}

/**
 * Fetch daily summary (sunrise and sunset timestamps).
 */
export async function fetchDailyWeather(
  lat: number,
  lon: number
): Promise<DailyWeatherSummary> {
  const roundedLat = roundToTenth(lat)
  const roundedLon = roundToTenth(lon)

  const url = new URL(`${env.weatherApiBaseUrl}/forecast`)
  url.searchParams.set('latitude', roundedLat.toString())
  url.searchParams.set('longitude', roundedLon.toString())
  url.searchParams.set('daily', 'sunrise,sunset')
  url.searchParams.set('timezone', 'auto')

  const data = await httpClient<OpenMeteoDailyResponse>(url)

  if (!data.daily || !data.daily.sunrise?.[0] || !data.daily.sunset?.[0]) {
    throw new ApiError('Incomplete daily weather summary returned', 500)
  }

  return {
    sunrise: data.daily.sunrise[0],
    sunset: data.daily.sunset[0],
  }
}
