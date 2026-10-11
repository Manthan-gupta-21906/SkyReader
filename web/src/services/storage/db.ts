/**
 * Dexie IndexedDB database configuration and schema versioning.
 */

import Dexie, { type Table } from 'dexie'
import type {
  CloudClassRecord,
  ModelPackRecord,
  PredictionRecord,
  ObservationRecord,
  WeatherSnapshotRecord,
  AdviceRecord,
  OutcomeCheckRecord,
  SettingRecord,
} from '../../types/database'

export class SkyReaderDatabase extends Dexie {
  cloud_class!: Table<CloudClassRecord, number>
  model_pack!: Table<ModelPackRecord, number>
  prediction!: Table<PredictionRecord, number>
  observation!: Table<ObservationRecord, number>
  weather_snapshot!: Table<WeatherSnapshotRecord, number>
  advice!: Table<AdviceRecord, number>
  outcome_check!: Table<OutcomeCheckRecord, number>
  setting!: Table<SettingRecord, string>

  constructor() {
    super('SkyReaderDB')

    this.version(1).stores({
      cloud_class: '++id, code, name, altitude_band, signal_type, is_storm_signal, label_index',
      model_pack: '++id, name, version, model_file, sha256, license, input_size, temperature, reject_threshold, installed_at, is_active',
      observation: '++id, observed_at, lat_rounded, lon_rounded, location_mode, place_label, user_label_class_id, is_unsure, note, created_at',
      prediction: '++id, observation_id, model_pack_id, cloud_class_id, rank, probability, latency_ms',
    })

    this.version(2).stores({
      outcome_check: '++id, observation_id, checked_at, window_hours, rain_occurred, precip_mm, max_gust_kmh, thunder_occurred, result, user_felt',
      setting: 'key, value',
    })

    this.version(3).stores({
      weather_snapshot: '++id, observation_id, source, fetched_at, is_cached, temperature_c, apparent_temp_c, precip_prob_3h, precip_mm_6h, wind_gust_kmh, wind_speed_kmh, uv_index, cape, weather_code, cloud_cover_pct, visibility_m, hours_to_sunset, hourly_json',
      advice: '++id, observation_id, score, verdict, hard_rule_hit, reasons_json, suggestion, text_source, engine_version',
    })
  }
}

export const db = new SkyReaderDatabase()
