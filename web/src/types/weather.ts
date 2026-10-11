/**
 * Weather domain & API data types.
 */

export interface WeatherInput {
  precip_prob_3h: number
  wind_gust_kmh: number
  cape: number
  weather_code: number
  uv_index: number
  apparent_temp_c: number
  hours_to_sunset: number
  temperature_c: number
}

export interface HourlyWeatherForecast {
  temperature_2m: number
  apparent_temperature_2m: number
  precipitation_probability: number
  precipitation: number
  weather_code: number
  cloud_cover: number
  visibility: number
  wind_speed_10m: number
  wind_gusts_10m: number
  uv_index: number
  cape: number
  is_day: number
}

export interface DailyWeatherSummary {
  sunrise: string
  sunset: string
}

export interface GeocodingCoordinates {
  lat: number
  lon: number
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  name: string
  country?: string
  admin1?: string
}
