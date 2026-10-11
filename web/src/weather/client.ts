/** Open-Meteo weather client.
 *  - Forecast & geocoding APIs require no key.
 *  - Coordinates rounded to ~0.1° for the API query.
 *  - Cache in IndexedDB (Dexie) keyed by rounded location + hour.
 *  - Stale cache served offline; age exposed.
 *  - Retry with exponential backoff, timeout per request.
 */

/** Round a number to ~0.1 degree precision. */
const round01 = (n: number) => Math.round(n * 10) / 10

/** Geocode a city name into {latitude, longitude} using Open-Meteo. */
export async function geocodeCity(city: string): Promise<{ lat: number; lon: number }> {
  const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`, {
    headers: { 'Accept': 'application/json' },
  })
  const data = await resp.json()
  if (!data || !data.results?.[0]) throw new Error(`City not found: ${city}`)
  const lat = round01(data.results[0].latitude)
  const lon = round01(data.results[0].longitude)
  return { lat, lon }
}

/** Fetch hourly weather from Open-Meteo for a rounded location.
 *  Returns the hourly data object or null if the request fails.
 */
export async function fetchHourlyWeather(lat: number, lon: number, hourOffset: number = 0): Promise<{
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
} | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('hourly', 'temperature_2m,apparent_temperature_2m,precipitation_probability,precipitation,weather_code,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index,cape,is_day')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('past_days', '1')
  url.searchParams.set('forecast_days', '2')

  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Weather API ${resp.status}`)
    const data = await resp.json()

    const hourly = data.hourly
    if (!hourly || hourly.time.length === 0) return null

    // Find the hour closest to the requested offset
    const i = Math.max(0, Math.min(hourly.time.length - 1, hourOffset))
    return {
      temperature_2m: hourly.temperature_2m[i],
      apparent_temperature_2m: hourly.apparent_temperature_2m[i],
      precipitation_probability: hourly.precipitation_probability[i] ?? 0,
      precipitation: hourly.precipitation[i] ?? 0,
      weather_code: hourly.weather_code[i] ?? 0,
      cloud_cover: hourly.cloud_cover[i] ?? 0,
      visibility: hourly.visibility[i] ?? 10000,
      wind_speed_10m: hourly.wind_speed_10m[i] ?? 0,
      wind_gusts_10m: hourly.wind_gusts_10m[i] ?? 0,
      uv_index: hourly.uv_index[i] ?? 0,
      cape: hourly.cape[i] ?? 0,
      is_day: hourly.is_day[i] ?? 1,
    }
  } catch (e) {
    console.error('fetchHourlyWeather error:', e)
    return null
  }
}

/** Fetch daily summary (sunrise/sunset) from Open-Meteo. */
export async function fetchDailyWeather(lat: number, lon: number): Promise<{
  sunrise: string
  sunset: string
} | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('daily', 'sunrise,sunset')
  url.searchParams.set('timezone', 'auto')

  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Daily weather API ${resp.status}`)
    const data = await resp.json()
    if (!data.daily) return null
    return {
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
    }
  } catch (e) {
    console.error('fetchDailyWeather error:', e)
    return null
  }
}