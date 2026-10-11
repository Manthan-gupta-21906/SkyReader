/** Minimal IndexedDB SkyReader data repositories.
 *  Each class wraps a Dexie table with typed CRUD methods.
 */

import { db, type CloudClass, type ModelPack, type Prediction, type Observation, type WeatherSnapshot, type Advice, type OutcomeCheck, type Setting } from './indexed-db'

// CloudClass -----------------------------------------------------------
export class CloudClassRepo {
  async list(): Promise<CloudClass[]> {
    return db.cloud_class.orderBy('code').toArray()
  }
  async get(id: number): Promise<CloudClass | undefined> {
    return db.cloud_class.get(id)
  }
  async getByCode(code: string): Promise<CloudClass | undefined> {
    return db.cloud_class.where('code').equals(code).first()
  }
}

// ModelPack -----------------------------------------------------------
export class ModelPackRepo {
  async list(): Promise<ModelPack[]> {
    return db.model_pack.orderBy('version').reverse().toArray()
  }
  async get(id: number): Promise<ModelPack | undefined> {
    return db.model_pack.get(id)
  }
  async getActive(): Promise<ModelPack | undefined> {
    return db.model_pack.where('is_active').equals(1).first()
  }
  async save(pack: ModelPack) {
    return db.model_pack.add(pack)
  }
  async setActive(id: number): Promise<void> {
    const all = await db.model_pack.toArray()
    await Promise.all(all.map((v: any) => db.model_pack.update(v.id, { is_active: 0 })))
    if (id > 0) await db.model_pack.update(id, { is_active: 1 })
  }
}

// Prediction -----------------------------------------------------------
export class PredictionRepo {
  async listByObservation(obsId: number): Promise<Prediction[]> {
    return db.prediction.where('observation_id').equals(obsId).toArray()
  }
  async get(id: number): Promise<Prediction | undefined> {
    return db.prediction.get(id)
  }
  async save(pred: Omit<Prediction, 'id'> & { id?: number }) {
    const idVal = pred.id ?? Date.now() % 1e9
    return db.prediction.add({ ...pred, id: idVal })
  }
  async deleteByObservation(obsId: number): Promise<void> {
    await db.prediction.where('observation_id').equals(obsId).delete()
  }
}

// Observation -----------------------------------------------------------
export class ObservationRepo {
  async list(): Promise<Observation[]> {
    return db.observation.orderBy('observed_at').reverse().toArray()
  }
  async get(id: number): Promise<Observation | undefined> {
    return db.observation.get(id)
  }
  async save(obs: Observation) {
    return db.observation.add(obs) as any
  }
  async delete(id: number): Promise<void> {
    await db.observation.delete(id)
  }
  async deleteAll(): Promise<void> {
    await db.observation.clear()
    await db.prediction.clear()
    await db.weather_snapshot.clear()
    await db.advice.clear()
    await db.outcome_check.clear()
  }
  async correctLabel(id: number, newClassId: number): Promise<Observation | undefined> {
    return db.observation.update(id, { user_label_class_id: newClassId })
  }
}

// WeatherSnapshot -----------------------------------------------------------
export class WeatherSnapshotRepo {
  async getByObservation(obsId: number): Promise<WeatherSnapshot | undefined> {
    return db.weather_snapshot.where('observation_id').equals(obsId).first()
  }
  async save(snapshot: Omit<WeatherSnapshot, 'id'>) {
    return db.weather_snapshot.add({ ...snapshot, id: Date.now() % 1e9 })
  }
  async deleteByObservation(obsId: number): Promise<void> {
    await db.weather_snapshot.where('observation_id').equals(obsId).delete()
  }
}

// Advice -----------------------------------------------------------
export class AdviceRepo {
  async getByObservation(obsId: number): Promise<Advice | undefined> {
    return db.advice.where('observation_id').equals(obsId).first()
  }
  async save(advice: Omit<Advice, 'id'>) {
    return db.advice.add({ ...advice, id: Date.now() % 1e9 })
  }
  async deleteByObservation(obsId: number): Promise<void> {
    await db.advice.where('observation_id').equals(obsId).delete()
  }
}

// OutcomeCheck -----------------------------------------------------------
export class OutcomeCheckRepo {
  async getByObservation(obsId: number): Promise<OutcomeCheck | undefined> {
    return db.outcome_check.where('observation_id').equals(obsId).first()
  }
  async save(check: Omit<OutcomeCheck, 'id'>) {
    return db.outcome_check.add({ ...check, id: Date.now() % 1e9 })
  }
  async deleteByObservation(obsId: number): Promise<void> {
    await db.outcome_check.where('observation_id').equals(obsId).delete()
  }
}

// Setting -----------------------------------------------------------
export class SettingRepo {
  async get(key: string): Promise<Setting | undefined> {
    return db.setting.where('key').equals(key).first()
  }
  async save(setting: { key: string; value: string }) {
    return db.setting.add({ key: setting.key, value: setting.value })
  }
  async getAll(): Promise<Setting[]> {
    return db.setting.orderBy('key').toArray()
  }
  async delete(key: string): Promise<void> {
    await db.setting.where('key').equals(key).delete()
  }
  async clearAll(): Promise<void> {
    await db.setting.clear()
  }
}

// Singleton exports -----------------------------------------------------------
export const cloudClass = new CloudClassRepo()
export const modelPack = new ModelPackRepo()
export const prediction = new PredictionRepo()
export const observation = new ObservationRepo()
export const weatherSnapshot = new WeatherSnapshotRepo()
export const advice = new AdviceRepo()
export const outcomeCheck = new OutcomeCheckRepo()
export const setting = new SettingRepo()