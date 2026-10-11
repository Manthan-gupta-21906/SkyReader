/** IndexedDB database using Dexie for SkyReader observation storage.
 *  Schema maps directly to the SQL definition in the Backend/Data Schema document.
 *  Stores: cloud_class, model_pack, observation, prediction, weather_snapshot,
 *  advice, outcome_check, setting.
 */

import Dexie, { type Table } from 'dexie'

export interface CloudClass {
  id: number
  code: string      // 'Cb', 'Ns', 'As', etc
  name: string      // 'Cumulonimbus', etc
  altitude_band: 'high' | 'mid' | 'low' | 'vertical' | 'none'
  how_to_spot?: string
  usual_meaning?: string
  signal_type: 'neutral' | 'change_coming' | 'rain_building' | 'rain_now' | 'storm' | 'low_visibility'
  signal_weight: number     // penalty used by advice engine, default 0
  is_storm_signal: number   // 0 or 1, default 0
  label_index: number       // model output index, UNIQUE
}

export interface ModelPack {
  id: number
  name: string
  version: string
  model_file: string
  sha256: string
  license: string
  input_size: number
  temperature: number     // calibration default 1.0
  reject_threshold: number // default 0.45
  installed_at: string
  is_active: number       // 0 or 1
}

export interface Prediction {
  id: number
  observation_id: number
  model_pack_id: number
  cloud_class_id: number
  rank: number
  probability: number    // 0 to 1
  latency_ms?: number
}

export interface Observation {
  id: number
  observed_at: string     // ISO 8601 UTC
  photo_thumb?: ArrayBuffer // small JPEG, optional
  lat_rounded: number
  lon_rounded: number
  location_mode: 'rounded' | 'manual' | 'none'
  place_label?: string
  user_label_class_id?: number // refs cloud_class.id
  is_unsure: number       // 0 or 1, default 0
  note?: string
  created_at: string    // ISO 8601 UTC
}

export interface WeatherSnapshot {
  id: number
  observation_id: number
  source: string        // 'open-meteo'
  fetched_at: string
  is_cached: number     // 0 or 1
  temperature_c: number
  apparent_temp_c: number
  precip_prob_3h: number   // max over next 3 h, percent
  precip_mm_6h: number
  wind_gust_kmh: number
  wind_speed_kmh: number
  uv_index: number
  cape: number
  weather_code: number
  cloud_cover_pct: number
  visibility_m: number
  hours_to_sunset: number
  hourly_json: string   // next 6 h for the strip, JSON
}

export interface Advice {
  id: number
  observation_id: number
  score: number          // 0 to 100
  verdict: 'go' | 'go_with_care' | 'wait' | 'stay_in'
  hard_rule_hit?: string // e.g. 'storm_cap'
  reasons_json: string   // JSON string [{factor, penalty, text}]
  suggestion?: string
  text_source: 'template' | 'llm'
  engine_version: string
}

export interface OutcomeCheck {
  id: number
  observation_id: number
  checked_at: string
  window_hours: number
  rain_occurred?: number   // 0/1
  precip_mm?: number
  max_gust_kmh?: number
  thunder_occurred?: number
  result: 'held_up' | 'missed' | 'inconclusive'
  user_felt?: 'better' | 'as_expected' | 'worse'
}

export interface Setting {
  key: string
  value: string
}

export class SkyReaderDB extends Dexie {
  cloud_class!: Table<CloudClass, number>
  model_pack!: Table<ModelPack, number>
  prediction!: Table<Prediction, number>
  observation!: Table<Observation, number>
  weather_snapshot!: Table<WeatherSnapshot, number>
  advice!: Table<Advice, number>
  outcome_check!: Table<OutcomeCheck, number>
  setting!: Table<Setting, string>

  constructor() {
    super('SkyReaderDB')
    // Version 2 adds outcome_check and setting; version 3 adds weather_snapshot improvements
    this.version(1).stores({
      cloud_class: '++id, code, name, altitude_band, signal_type, is_storm_signal, label_index',
      model_pack: '++id, name, version, model_file, sha256, license, input_size, temperature, reject_threshold, installed_at, is_active',
      observation: '++id, observed_at, lat_rounded, lon_rounded, location_mode, place_label, user_label_class_id, is_unsure, note, created_at',
      prediction: '++id, observation_id, model_pack_id, cloud_class_id, rank, probability, latency_ms',
    })
    this.version(2).stores({
      outcome_check: '++id, observation_id, checked_at, window_hours, rain_occurred, precip_mm, max_gust_kmh, thunder_occurred, result, user_felt',
      setting: '++id, key, value',
    })
    this.version(3).stores({
      weather_snapshot: '++id, observation_id, source, fetched_at, is_cached, temperature_c, apparent_temp_c, precip_prob_3h, precip_mm_6h, wind_gust_kmh, wind_speed_kmh, uv_index, cape, weather_code, cloud_cover_pct, visibility_m, hours_to_sunset, hourly_json',
    })
  }
}

export const db = new SkyReaderDB()