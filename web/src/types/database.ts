/**
 * Local IndexedDB Dexie table schemas and database records.
 */

import type { AltitudeBand, SignalType } from './cloud'
import type { Verdict, AdviceHardRule } from './advice'
import type { LocationMode } from './settings'

export interface CloudClassRecord {
  id?: number
  code: string
  name: string
  altitude_band: AltitudeBand
  how_to_spot?: string
  usual_meaning?: string
  signal_type: SignalType
  signal_weight: number
  is_storm_signal: number // 0 or 1
  label_index: number
}

export interface ModelPackRecord {
  id?: number
  name: string
  version: string
  model_file: string
  sha256: string
  license: string
  input_size: number
  temperature: number
  reject_threshold: number
  installed_at: string
  is_active: number // 0 or 1
}

export interface PredictionRecord {
  id?: number
  observation_id: number
  model_pack_id: number
  cloud_class_id: number
  rank: number
  probability: number
  latency_ms?: number
}

export interface ObservationRecord {
  id?: number
  observed_at: string // ISO 8601 UTC
  photo_thumb?: ArrayBuffer
  lat_rounded: number
  lon_rounded: number
  location_mode: LocationMode
  place_label?: string
  user_label_class_id?: number
  is_unsure: number // 0 or 1
  note?: string
  created_at: string
}

export interface WeatherSnapshotRecord {
  id?: number
  observation_id: number
  source: string
  fetched_at: string
  is_cached: number // 0 or 1
  temperature_c: number
  apparent_temp_c: number
  precip_prob_3h: number
  precip_mm_6h: number
  wind_gust_kmh: number
  wind_speed_kmh: number
  uv_index: number
  cape: number
  weather_code: number
  cloud_cover_pct: number
  visibility_m: number
  hours_to_sunset: number
  hourly_json: string
}

export interface AdviceRecord {
  id?: number
  observation_id: number
  score: number
  verdict: Verdict
  hard_rule_hit?: AdviceHardRule | string
  reasons_json: string
  suggestion?: string
  text_source: 'template' | 'llm'
  engine_version: string
}

export interface OutcomeCheckRecord {
  id?: number
  observation_id: number
  checked_at: string
  window_hours: number
  rain_occurred?: number // 0 or 1
  precip_mm?: number
  max_gust_kmh?: number
  thunder_occurred?: number
  result: 'held_up' | 'missed' | 'inconclusive'
  user_felt?: 'better' | 'as_expected' | 'worse'
}

export interface SettingRecord {
  key: string
  value: string
}
