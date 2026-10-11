/**
 * IndexedDB storage facade.
 * Re-exports from src/services/storage/db and src/types/database for backward compatibility.
 */

export * from '../services/storage/db'
export type {
  CloudClassRecord as CloudClass,
  ModelPackRecord as ModelPack,
  PredictionRecord as Prediction,
  ObservationRecord as Observation,
  WeatherSnapshotRecord as WeatherSnapshot,
  AdviceRecord as Advice,
  OutcomeCheckRecord as OutcomeCheck,
  SettingRecord as Setting,
} from '../types/database'