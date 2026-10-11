/**
 * Repository layer facade.
 * Re-exports from src/services/storage/repositories for backward compatibility.
 */

export * from '../services/storage/repositories'

// Export legacy named singletons
export {
  cloudClassRepo as cloudClass,
  modelPackRepo as modelPack,
  predictionRepo as prediction,
  observationRepo as observation,
  weatherSnapshotRepo as weatherSnapshot,
  adviceRepo as advice,
  outcomeCheckRepo as outcomeCheck,
  settingRepo as setting,
} from '../services/storage/repositories'