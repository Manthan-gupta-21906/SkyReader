import { useState, useEffect } from 'react'
import { db } from '../data/indexed-db'
import {
  setting as settingRepo,
  observation as obsRepo,
  weatherSnapshot as weatherRepo,
  advice as adviceRepo,
  outcomeCheck as outcomeRepo,
  prediction as predRepo,
} from '../data/repositories'
import { CLOUD_CLASSES } from '../domain/cloud-data'

type Theme = 'dark' | 'light' | 'auto'
type LocationMode = 'rounded' | 'manual' | 'off'
type Units = 'metric' | 'imperial'
type ActivityType = 'walking' | 'running' | 'hiking' | 'cycling' | 'photography' | 'stargazing'

interface ActivityObject {
  id: ActivityType
  name: string
  icon: string
  desc: string
  rainSensitivity: 'high' | 'medium' | 'low'
  windThresholdKmh: number
}

const ACTIVITY_OBJECTS: ActivityObject[] = [
  { id: 'walking', name: 'Walking / Strolling', icon: '🚶', desc: 'Balanced tolerance for light rain and moderate breezes.', rainSensitivity: 'medium', windThresholdKmh: 45 },
  { id: 'running', name: 'Running / Jogging', icon: '🏃', desc: 'Sensitive to heavy rain, slippery paths, and high heat/UV.', rainSensitivity: 'high', windThresholdKmh: 40 },
  { id: 'hiking', name: 'Hiking / Trekking', icon: '🥾', desc: 'Critical storm warning & daylight requirements. Exposed ridges.', rainSensitivity: 'high', windThresholdKmh: 35 },
  { id: 'cycling', name: 'Cycling / Road', icon: '🚴', desc: 'High crosswind penalty and wet road caution.', rainSensitivity: 'high', windThresholdKmh: 35 },
  { id: 'photography', name: 'Sky Photography', icon: '📸', desc: 'Focus on cloud textures, golden hour, and light diffusion.', rainSensitivity: 'low', windThresholdKmh: 50 },
  { id: 'stargazing', name: 'Stargazing / Night', icon: '🔭', desc: 'Overhead cloud clearance, sunset timing, and night visibility.', rainSensitivity: 'high', windThresholdKmh: 30 },
]

interface SkyDetectionObject {
  id: string
  name: string
  icon: string
  desc: string
  enabled: boolean
}

interface ModelPackObject {
  id: string
  name: string
  version: string
  sizeMb: number
  latencyMs: number
  desc: string
  isActive: boolean
}

const MODEL_OBJECTS: ModelPackObject[] = [
  { id: 'mobilenet_v3', name: 'MobileNetV3-Small (WASM)', version: '1.2.0', sizeMb: 3.2, latencyMs: 45, desc: 'Recommended · High speed & low memory footprint', isActive: true },
  { id: 'efficientnet_lite', name: 'EfficientNet-Lite0 (ONNX)', version: '0.9.4', sizeMb: 4.8, latencyMs: 72, desc: 'High detail · Better distinction for overlapping altocumulus', isActive: false },
  { id: 'heuristic_rules', name: 'CloudNet-Heuristic (Offline)', version: '2.0.0', sizeMb: 0.2, latencyMs: 5, desc: 'Ultra-fast fallback when WASM is throttled', isActive: false },
]

export default function Settings() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [locationMode, setLocationMode] = useState<LocationMode>('rounded')
  const [units, setUnits] = useState<Units>('metric')
  const [manualCity, setManualCity] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('walking')
  const [activeModel, setActiveModel] = useState<string>('mobilenet_v3')
  const [temperature, setTemperature] = useState<number>(1.0)
  const [rejectionThreshold, setRejectionThreshold] = useState<number>(0.45)
  const [rainPenaltyScale, setRainPenaltyScale] = useState<'conservative' | 'balanced' | 'relaxed'>('balanced')
  const [enforceStormCap, setEnforceStormCap] = useState<boolean>(true)
  const [outcomeWindowHours, setOutcomeWindowHours] = useState<number>(3)

  // Sky Detection Objects toggles
  const [skyObjects, setSkyObjects] = useState<SkyDetectionObject[]>([
    { id: 'clouds_10', name: '10 WMO Cloud Genera', icon: '☁️', desc: 'Full WMO cloud classification atlas', enabled: true },
    { id: 'sun_glare', name: 'Sun Glare Filter', icon: '☀️', desc: 'Warn when direct glare obscures clouds', enabled: true },
    { id: 'horizon_guide', name: 'Horizon Leveling Guide', icon: '📐', desc: '0° leveler overlay in camera viewfinder', enabled: true },
    { id: 'moon_celestial', name: 'Celestial & Moon Phase', icon: '🌙', desc: 'Stargazing & optical clarity index', enabled: false },
    { id: 'optical_halos', name: 'Optical Halos & Ice Crystals', icon: '🌈', desc: 'Cirrostratus 22° solar halo detector', enabled: true },
  ])

  // Database Object Counts
  const [dbCounts, setDbCounts] = useState({
    observations: 0,
    snapshots: 0,
    predictions: 0,
    advice: 0,
    outcomes: 0,
    settings: 0,
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showJsonInspector, setShowJsonInspector] = useState(false)
  const [rawJsonData, setRawJsonData] = useState<string>('')
  const [saved, setSaved] = useState(false)
  const [seedNotice, setSeedNotice] = useState<string | null>(null)

  // Refresh DB counts
  const refreshDbCounts = async () => {
    try {
      const [obs, snaps, preds, adv, outc, sets] = await Promise.all([
        db.observation.count(),
        db.weather_snapshot.count(),
        db.prediction.count(),
        db.advice.count(),
        db.outcome_check.count(),
        db.setting.count(),
      ])
      setDbCounts({
        observations: obs,
        snapshots: snaps,
        predictions: preds,
        advice: adv,
        outcomes: outc,
        settings: sets,
      })
    } catch {
      // IndexedDB might not be initialized yet
    }
  }

  // Load saved settings
  useEffect(() => {
    refreshDbCounts()

    async function loadSettings() {
      try {
        const themeSet = await settingRepo.get('theme')
        if (themeSet) setTheme(themeSet.value as Theme)

        const locSet = await settingRepo.get('location_mode')
        if (locSet) setLocationMode(locSet.value as LocationMode)

        const unitSet = await settingRepo.get('units')
        if (unitSet) setUnits(unitSet.value as Units)

        const citySet = await settingRepo.get('manual_city')
        if (citySet) setManualCity(citySet.value)

        const actSet = await settingRepo.get('activity')
        if (actSet) setSelectedActivity(actSet.value as ActivityType)

        const modelSet = await settingRepo.get('active_model')
        if (modelSet) setActiveModel(modelSet.value)
      } catch {
        // Fallback to defaults
      }
    }
    loadSettings()
  }, [])

  const toggleSkyObject = (id: string) => {
    setSkyObjects(prev =>
      prev.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    )
  }

  const handleSave = async () => {
    try {
      await settingRepo.save({ key: 'theme', value: theme })
      await settingRepo.save({ key: 'location_mode', value: locationMode })
      await settingRepo.save({ key: 'units', value: units })
      await settingRepo.save({ key: 'manual_city', value: manualCity })
      await settingRepo.save({ key: 'activity', value: selectedActivity })
      await settingRepo.save({ key: 'active_model', value: activeModel })
      await settingRepo.save({ key: 'temperature', value: temperature.toString() })
      await settingRepo.save({ key: 'rejection_threshold', value: rejectionThreshold.toString() })
      await settingRepo.save({ key: 'rain_scale', value: rainPenaltyScale })
      await settingRepo.save({ key: 'enforce_storm_cap', value: enforceStormCap ? 'true' : 'false' })
      await settingRepo.save({ key: 'outcome_window', value: outcomeWindowHours.toString() })
      await settingRepo.save({ key: 'sky_objects', value: JSON.stringify(skyObjects) })

      await refreshDbCounts()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  // Seed demo data objects in IndexedDB
  const handleSeedDemoData = async () => {
    try {
      const now = new Date()
      const sampleSeeds = [
        { genusCode: 'Cb', verdict: 'wait' as const, score: 35, rain: 75, gust: 42, note: 'Towering anvil cloud to the southwest' },
        { genusCode: 'Cu', verdict: 'go' as const, score: 92, rain: 5, gust: 14, note: 'Fluffy fair-weather cumulus over park' },
        { genusCode: 'As', verdict: 'go_with_care' as const, score: 62, rain: 45, gust: 24, note: 'Thick gray veil covering sun' },
        { genusCode: 'Ns', verdict: 'stay_in' as const, score: 18, rain: 90, gust: 38, note: 'Heavy dark rain clouds, continuous drizzle' },
        { genusCode: 'Ci', verdict: 'go' as const, score: 88, rain: 10, gust: 12, note: 'Feathery wisps high in the sky' },
      ]

      for (let i = 0; i < sampleSeeds.length; i++) {
        const s = sampleSeeds[i]
        const obsTime = new Date(now.getTime() - (i + 1) * 3600 * 1000 * 6).toISOString()
        const foundClass = CLOUD_CLASSES.find(c => c.code === s.genusCode) || CLOUD_CLASSES[0]

        const obsId = (await obsRepo.save({
          id: Date.now() + i,
          observed_at: obsTime,
          lat_rounded: 40.71,
          lon_rounded: -74.01,
          location_mode: 'rounded',
          place_label: 'Local Observation',
          user_label_class_id: foundClass.label_index,
          is_unsure: 0,
          note: s.note,
          created_at: obsTime,
        })) as unknown as number

        await weatherRepo.save({
          observation_id: obsId,
          source: 'open-meteo',
          fetched_at: obsTime,
          is_cached: 1,
          temperature_c: 21,
          apparent_temp_c: 22,
          precip_prob_3h: s.rain,
          precip_mm_6h: s.rain > 50 ? 6.2 : 0,
          wind_gust_kmh: s.gust,
          wind_speed_kmh: Math.round(s.gust * 0.6),
          uv_index: 5,
          cape: s.genusCode === 'Cb' ? 1400 : 150,
          weather_code: s.genusCode === 'Cb' ? 95 : s.rain > 50 ? 61 : 1,
          cloud_cover_pct: s.genusCode === 'Clr' ? 5 : 85,
          visibility_m: 10000,
          hours_to_sunset: 4,
          hourly_json: JSON.stringify([{ hour: 1, rain: s.rain }]),
        })

        await predRepo.save({
          id: Date.now() + i * 10,
          observation_id: obsId,
          model_pack_id: 1,
          cloud_class_id: foundClass.label_index,
          rank: 1,
          probability: 0.84,
          latency_ms: 42,
        })

        await adviceRepo.save({
          observation_id: obsId,
          score: s.score,
          verdict: s.verdict,
          hard_rule_hit: s.genusCode === 'Cb' ? 'storm_cap' : undefined,
          reasons_json: JSON.stringify([{ factor: 'precipitation', penalty: -25, text: 'Rain risk' }]),
          suggestion: s.score >= 75 ? 'Great conditions to go out' : 'Keep an umbrella handy',
          text_source: 'template',
          engine_version: '1.0.0',
        })

        await outcomeRepo.save({
          observation_id: obsId,
          checked_at: new Date(now.getTime() - i * 3600 * 1000 * 3).toISOString(),
          window_hours: 3,
          rain_occurred: s.rain > 40 ? 1 : 0,
          precip_mm: s.rain > 40 ? 4.5 : 0,
          max_gust_kmh: s.gust,
          result: 'held_up',
          user_felt: 'as_expected',
        })
      }

      await refreshDbCounts()
      setSeedNotice('Successfully generated 5 observation data objects!')
      setTimeout(() => setSeedNotice(null), 3000)
    } catch (err) {
      console.error('Failed to seed demo data:', err)
    }
  }

  // Inspect database objects in raw JSON
  const handleInspectObjects = async () => {
    try {
      const [allObs, allSnaps, allAdv, allSets] = await Promise.all([
        db.observation.limit(5).toArray(),
        db.weather_snapshot.limit(5).toArray(),
        db.advice.limit(5).toArray(),
        db.setting.toArray(),
      ])

      const dump = {
        summary: dbCounts,
        active_settings: allSets,
        sample_observations: allObs,
        sample_weather: allSnaps,
        sample_advice: allAdv,
      }
      setRawJsonData(JSON.stringify(dump, null, 2))
      setShowJsonInspector(true)
    } catch (err) {
      console.error('Failed to inspect objects:', err)
    }
  }

  // Delete all data objects
  const handleDeleteAll = async () => {
    setShowDeleteConfirm(false)
    try {
      await obsRepo.deleteAll()
      await settingRepo.clearAll()
      await refreshDbCounts()
      setSeedNotice('All local storage objects cleared.')
      setTimeout(() => setSeedNotice(null), 3000)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 text-xs font-medium text-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)]">
          <span>⚙️ Preferences & Engine Objects</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          <span className="glow-text">Settings & Configuration</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm max-w-xl">
          Configure outdoor activity objects, sky detection features, AI model packs, and inspect local IndexedDB objects.
        </p>
      </div>

      {seedNotice && (
        <div className="p-4 rounded-xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)] text-sm text-[var(--color-aurora-green)] flex items-center gap-2">
          <span>✓</span>
          <span>{seedNotice}</span>
        </div>
      )}

      {/* SECTION 1: Outdoor Activity Objects */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🎯 Outdoor Activity Objects</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Select your primary outdoor focus to adapt advice penalties and wind thresholds.
            </p>
          </div>
          <span className="badge badge-high text-[10px]">Active Tuning</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTIVITY_OBJECTS.map((act) => {
            const isSelected = selectedActivity === act.id
            return (
              <button
                key={act.id}
                onClick={() => setSelectedActivity(act.id)}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[rgba(34,211,238,0.12)] border-[var(--color-aurora-cyan)] shadow-md'
                    : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-2xl p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)]">{act.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-star-white)]">{act.name}</h3>
                    <span className="text-[10px] text-[var(--color-space-300)] font-mono">
                      Max gust: {act.windThresholdKmh} km/h
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-space-200)] line-clamp-2 leading-relaxed">
                  {act.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Sky Objects & Feature Detection */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🔭 Sky Objects & Detection Toggles</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Enable or disable specific sky objects and visual aids in the scanner viewfinder.
            </p>
          </div>
          <span className="badge badge-mid text-[10px]">Viewfinder Objects</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skyObjects.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleSkyObject(item.id)}
              className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-3 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-star-white)]">{item.name}</h3>
                  <p className="text-xs text-[var(--color-space-200)]">{item.desc}</p>
                </div>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  item.enabled ? 'bg-[var(--color-aurora-cyan)]' : 'bg-[var(--color-space-500)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[var(--color-space-900)] absolute top-0.5 transition-transform ${
                    item.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: AI Model Pack Objects */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🧠 AI Model Pack Objects</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Select active inference backbone and calibrate confidence temperature.
            </p>
          </div>
          <span className="badge badge-high text-[10px]">WASM / ONNX</span>
        </div>

        <div className="space-y-3">
          {MODEL_OBJECTS.map((model) => {
            const isSelected = activeModel === model.id
            return (
              <div
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[rgba(34,211,238,0.1)] border-[var(--color-aurora-cyan)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[var(--color-aurora-cyan)]' : 'border-[var(--color-space-300)]'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-aurora-cyan)]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--color-star-white)]">{model.name}</h3>
                      <span className="text-[10px] text-[var(--color-space-300)] font-mono">v{model.version}</span>
                    </div>
                    <p className="text-xs text-[var(--color-space-200)] mt-0.5">{model.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-[var(--color-star-white)]">{model.sizeMb} MB</span>
                  <p className="text-[10px] text-[var(--color-aurora-green)] font-mono">~{model.latencyMs}ms</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Model Calibration Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-space-200)]">Calibration Temperature (T)</span>
              <span className="font-mono text-[var(--color-aurora-cyan)]">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-aurora-cyan)] cursor-pointer"
            />
            <p className="text-[10px] text-[var(--color-space-300)] mt-1">Lower = more confident, Higher = softened probabilities</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-space-200)]">Uncertainty Reject Threshold</span>
              <span className="font-mono text-[var(--color-aurora-cyan)]">{rejectionThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={rejectionThreshold}
              onChange={(e) => setRejectionThreshold(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-aurora-cyan)] cursor-pointer"
            />
            <p className="text-[10px] text-[var(--color-space-300)] mt-1">Below this threshold, image is flagged as "Unsure / Not a clear sky"</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Scoring Rubric Tuning */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
          <span>⚖️ Advice Heuristics & Scoring Rules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'conservative' as const, label: 'Conservative', desc: '-50 max rain penalty. Extra cautious for outdoor plans.' },
            { id: 'balanced' as const, label: 'Balanced (Standard)', desc: '-40 max rain penalty. Follows TRD standard rules.' },
            { id: 'relaxed' as const, label: 'Relaxed', desc: '-25 max rain penalty. Light rain accepted.' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setRainPenaltyScale(mode.id)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                rainPenaltyScale === mode.id
                  ? 'bg-[rgba(34,211,238,0.1)] border-[var(--color-aurora-cyan)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)]'
              }`}
            >
              <h3 className="text-sm font-semibold text-[var(--color-star-white)]">{mode.label}</h3>
              <p className="text-xs text-[var(--color-space-200)] mt-1 leading-relaxed">{mode.desc}</p>
            </button>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-star-white)]">Enforce Hard Storm Cap</h3>
            <p className="text-xs text-[var(--color-space-200)]">
              Cumulonimbus (Cb) or thunderstorm weather code caps verdict at "Wait" regardless of weather score.
            </p>
          </div>
          <button
            onClick={() => setEnforceStormCap(!enforceStormCap)}
            className={`btn btn-sm ${enforceStormCap ? 'btn-primary' : 'btn-secondary'}`}
          >
            {enforceStormCap ? 'Enforced' : 'Off'}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-star-white)]">Outcome Check Window</h3>
            <p className="text-xs text-[var(--color-space-200)]">
              Evaluate advice accuracy against actual observed weather outcome after this interval.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[3, 6].map((hours) => (
              <button
                key={hours}
                onClick={() => setOutcomeWindowHours(hours)}
                className={`btn btn-sm ${outcomeWindowHours === hours ? 'btn-primary' : 'btn-secondary'}`}
              >
                {hours} Hours
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: Core Preferences (Location, Units, Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Location Mode */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide">
            📍 Location
          </h2>
          <div className="space-y-2">
            {[
              { value: 'rounded' as LocationMode, label: 'Precise (~0.1°)', desc: 'Coarse GPS' },
              { value: 'manual' as LocationMode, label: 'Manual City', desc: 'No GPS' },
              { value: 'off' as LocationMode, label: 'Off', desc: 'Cloud only' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setLocationMode(value)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                  locationMode === value
                    ? 'bg-[rgba(34,211,238,0.12)] border-[var(--color-aurora-cyan)] text-[var(--color-star-white)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-transparent text-[var(--color-space-200)]'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-[10px] text-[var(--color-space-300)]">{desc}</span>
              </button>
            ))}
            {locationMode === 'manual' && (
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Enter city..."
                className="input text-xs py-1.5 mt-1"
              />
            )}
          </div>
        </div>

        {/* Units */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide">
            📐 Units
          </h2>
          <div className="space-y-2">
            {[
              { value: 'metric' as Units, label: 'Metric (°C · km/h)' },
              { value: 'imperial' as Units, label: 'Imperial (°F · mph)' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setUnits(value)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-all border ${
                  units === value
                    ? 'bg-[rgba(34,211,238,0.12)] border-[var(--color-aurora-cyan)] text-[var(--color-star-white)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-transparent text-[var(--color-space-200)]'
                }`}
              >
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide">
            🎨 Theme
          </h2>
          <div className="flex gap-2">
            {[
              { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
              { value: 'light' as Theme, label: 'Light', icon: '☀️' },
              { value: 'auto' as Theme, label: 'Auto', icon: '🔄' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 p-2.5 rounded-xl text-center text-xs transition-all border ${
                  theme === value
                    ? 'bg-[rgba(34,211,238,0.12)] border-[var(--color-aurora-cyan)] text-[var(--color-star-white)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-transparent text-[var(--color-space-200)]'
                }`}
              >
                <span className="text-base block mb-0.5">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Local Database Storage Objects Manager */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>💾 Local IndexedDB Storage Objects</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Direct object store inspector for Dexie tables in your browser.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSeedDemoData} className="btn btn-secondary btn-sm">
              + Seed Demo Objects
            </button>
            <button onClick={handleInspectObjects} className="btn btn-secondary btn-sm">
              Inspect Raw JSON
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Observations', count: dbCounts.observations, icon: '📋' },
            { label: 'Weather Snaps', count: dbCounts.snapshots, icon: '⛅' },
            { label: 'Predictions', count: dbCounts.predictions, icon: '🎯' },
            { label: 'Advices', count: dbCounts.advice, icon: '⚖️' },
            { label: 'Outcomes', count: dbCounts.outcomes, icon: '🔍' },
            { label: 'Settings', count: dbCounts.settings, icon: '⚙️' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-center">
              <span className="text-xl block mb-1">{item.icon}</span>
              <p className="text-lg font-bold font-mono text-[var(--color-aurora-cyan)]">{item.count}</p>
              <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Delete All Data Trigger */}
        <div className="pt-2">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger btn-sm w-full justify-center"
            >
              Clear All Stored Objects & Logs
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] space-y-3">
              <p className="text-xs text-[var(--color-supernova-red)] font-semibold">
                Are you sure you want to delete all stored observation and setting objects? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAll} className="btn btn-danger btn-sm flex-1">
                  Yes, delete all
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary btn-sm flex-1">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw JSON Inspector Modal */}
      {showJsonInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,16,0.85)] backdrop-blur-md">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-3">
              <h3 className="text-sm font-bold text-[var(--color-star-white)]">
                IndexedDB Object Store Raw JSON
              </h3>
              <button onClick={() => setShowJsonInspector(false)} className="text-[var(--color-space-200)] hover:text-white">
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-3 rounded-lg bg-[var(--color-space-900)] text-[11px] font-mono text-[var(--color-space-100)] border border-[rgba(255,255,255,0.1)]">
              {rawJsonData}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rawJsonData)
                  alert('JSON copied to clipboard!')
                }}
                className="btn btn-secondary btn-sm"
              >
                Copy JSON
              </button>
              <button onClick={() => setShowJsonInspector(false)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Save Action */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="btn btn-primary btn-lg w-full justify-center py-3.5 shadow-lg"
        >
          {saved ? '✓ All Settings & Objects Saved!' : 'Save All Settings & Objects'}
        </button>
      </div>
    </div>
  )
}