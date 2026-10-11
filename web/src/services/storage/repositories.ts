/**
 * Data repository layer providing type-safe CRUD operations over IndexedDB tables.
 */

import { db } from './db'
import type {
  CloudClassRecord,
  ModelPackRecord,
  PredictionRecord,
  ObservationRecord,
  WeatherSnapshotRecord,
  AdviceRecord,
  OutcomeCheckRecord,
} from '../../types/database'
import { StorageError } from '../../utils/errors'

export class CloudClassRepository {
  async list(): Promise<CloudClassRecord[]> {
    try {
      return await db.cloud_class.orderBy('code').toArray()
    } catch (err) {
      throw new StorageError(`Failed to list cloud classes: ${err}`)
    }
  }

  async getById(id: number): Promise<CloudClassRecord | undefined> {
    try {
      return await db.cloud_class.get(id)
    } catch (err) {
      throw new StorageError(`Failed to get cloud class #${id}: ${err}`)
    }
  }

  async getByCode(code: string): Promise<CloudClassRecord | undefined> {
    try {
      return await db.cloud_class.where('code').equals(code).first()
    } catch (err) {
      throw new StorageError(`Failed to find cloud class with code ${code}: ${err}`)
    }
  }
}

export class ModelPackRepository {
  async list(): Promise<ModelPackRecord[]> {
    try {
      return await db.model_pack.orderBy('version').reverse().toArray()
    } catch (err) {
      throw new StorageError(`Failed to list model packs: ${err}`)
    }
  }

  async getActive(): Promise<ModelPackRecord | undefined> {
    try {
      return await db.model_pack.where('is_active').equals(1).first()
    } catch (err) {
      throw new StorageError(`Failed to get active model pack: ${err}`)
    }
  }

  async setActive(id: number): Promise<void> {
    try {
      const all = await db.model_pack.toArray()
      await Promise.all(
        all.map((item) => (item.id ? db.model_pack.update(item.id, { is_active: 0 }) : Promise.resolve()))
      )
      if (id > 0) {
        await db.model_pack.update(id, { is_active: 1 })
      }
    } catch (err) {
      throw new StorageError(`Failed to set active model pack #${id}: ${err}`)
    }
  }
}

export class ObservationRepository {
  async list(): Promise<ObservationRecord[]> {
    try {
      return await db.observation.orderBy('observed_at').reverse().toArray()
    } catch (err) {
      throw new StorageError(`Failed to list observations: ${err}`)
    }
  }

  async getById(id: number): Promise<ObservationRecord | undefined> {
    try {
      return await db.observation.get(id)
    } catch (err) {
      throw new StorageError(`Failed to get observation #${id}: ${err}`)
    }
  }

  async save(obs: ObservationRecord): Promise<number> {
    try {
      const id = await db.observation.add(obs)
      return id as number
    } catch (err) {
      throw new StorageError(`Failed to save observation: ${err}`)
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await db.observation.delete(id)
      await db.prediction.where('observation_id').equals(id).delete()
      await db.weather_snapshot.where('observation_id').equals(id).delete()
      await db.advice.where('observation_id').equals(id).delete()
      await db.outcome_check.where('observation_id').equals(id).delete()
    } catch (err) {
      throw new StorageError(`Failed to delete observation #${id}: ${err}`)
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await Promise.all([
        db.observation.clear(),
        db.prediction.clear(),
        db.weather_snapshot.clear(),
        db.advice.clear(),
        db.outcome_check.clear(),
      ])
    } catch (err) {
      throw new StorageError(`Failed to clear observations: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.observation.count()
    } catch {
      return 0
    }
  }
}

export class SettingRepository {
  async get(key: string): Promise<string | undefined> {
    try {
      const record = await db.setting.get(key)
      return record?.value
    } catch {
      return undefined
    }
  }

  async save(key: string, value: string): Promise<void> {
    try {
      await db.setting.put({ key, value })
    } catch (err) {
      throw new StorageError(`Failed to save setting ${key}: ${err}`)
    }
  }

  async getAll(): Promise<Record<string, string>> {
    try {
      const records = await db.setting.toArray()
      return records.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      }, {} as Record<string, string>)
    } catch {
      return {}
    }
  }

  async clearAll(): Promise<void> {
    try {
      await db.setting.clear()
    } catch (err) {
      throw new StorageError(`Failed to clear settings: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.setting.count()
    } catch {
      return 0
    }
  }
}

export class WeatherSnapshotRepository {
  async getByObservation(obsId: number): Promise<WeatherSnapshotRecord | undefined> {
    try {
      return await db.weather_snapshot.where('observation_id').equals(obsId).first()
    } catch {
      return undefined
    }
  }

  async save(record: WeatherSnapshotRecord): Promise<number> {
    try {
      return (await db.weather_snapshot.add(record)) as number
    } catch (err) {
      throw new StorageError(`Failed to save weather snapshot: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.weather_snapshot.count()
    } catch {
      return 0
    }
  }
}

export class PredictionRepository {
  async listByObservation(obsId: number): Promise<PredictionRecord[]> {
    try {
      return await db.prediction.where('observation_id').equals(obsId).toArray()
    } catch {
      return []
    }
  }

  async save(record: PredictionRecord): Promise<number> {
    try {
      return (await db.prediction.add(record)) as number
    } catch (err) {
      throw new StorageError(`Failed to save prediction: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.prediction.count()
    } catch {
      return 0
    }
  }
}

export class AdviceRepository {
  async getByObservation(obsId: number): Promise<AdviceRecord | undefined> {
    try {
      return await db.advice.where('observation_id').equals(obsId).first()
    } catch {
      return undefined
    }
  }

  async save(record: AdviceRecord): Promise<number> {
    try {
      return (await db.advice.add(record)) as number
    } catch (err) {
      throw new StorageError(`Failed to save advice record: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.advice.count()
    } catch {
      return 0
    }
  }
}

export class OutcomeCheckRepository {
  async getByObservation(obsId: number): Promise<OutcomeCheckRecord | undefined> {
    try {
      return await db.outcome_check.where('observation_id').equals(obsId).first()
    } catch {
      return undefined
    }
  }

  async save(record: OutcomeCheckRecord): Promise<number> {
    try {
      return (await db.outcome_check.add(record)) as number
    } catch (err) {
      throw new StorageError(`Failed to save outcome record: ${err}`)
    }
  }

  async count(): Promise<number> {
    try {
      return await db.outcome_check.count()
    } catch {
      return 0
    }
  }
}

// Singletons
export const cloudClassRepo = new CloudClassRepository()
export const modelPackRepo = new ModelPackRepository()
export const observationRepo = new ObservationRepository()
export const settingRepo = new SettingRepository()
export const weatherSnapshotRepo = new WeatherSnapshotRepository()
export const predictionRepo = new PredictionRepository()
export const adviceRepo = new AdviceRepository()
export const outcomeCheckRepo = new OutcomeCheckRepository()
