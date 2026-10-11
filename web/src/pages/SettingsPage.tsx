/**
 * Settings Page – User activity profile, AI calibration parameters, and IndexedDB storage management.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAppState } from '../state/useAppState'
import {
  observationRepo,
  settingRepo,
  weatherSnapshotRepo,
  predictionRepo,
  adviceRepo,
  outcomeCheckRepo,
} from '../services/storage/repositories'
import { AVAILABLE_MODELS } from '../services/ml/inferenceService'
import { CLOUD_CLASSES } from '../domain/clouds/cloudData'
import { Modal } from '../components/common/Modal'
import { db } from '../services/storage/db'
import type {
  ActivityOption,
  LocationMode,
  UnitSystem,
  ThemeMode,
} from '../types/settings'

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: 'walking', name: 'Walking / Strolling', icon: '🚶', desc: 'Balanced tolerance for light rain and moderate breezes.', rainSensitivity: 'medium', windThresholdKmh: 45 },
  { id: 'running', name: 'Running / Jogging', icon: '🏃', desc: 'Sensitive to heavy rain, slippery paths, and high heat/UV.', rainSensitivity: 'high', windThresholdKmh: 40 },
  { id: 'hiking', name: 'Hiking / Trekking', icon: '🥾', desc: 'Critical storm warning & daylight requirements. Exposed ridges.', rainSensitivity: 'high', windThresholdKmh: 35 },
  { id: 'cycling', name: 'Cycling / Road', icon: '🚴', desc: 'High crosswind penalty and wet road caution.', rainSensitivity: 'high', windThresholdKmh: 35 },
  { id: 'photography', name: 'Sky Photography', icon: '📸', desc: 'Focus on cloud textures, golden hour, and light diffusion.', rainSensitivity: 'low', windThresholdKmh: 50 },
  { id: 'stargazing', name: 'Stargazing / Night', icon: '🔭', desc: 'Overhead cloud clearance, sunset timing, and night visibility.', rainSensitivity: 'high', windThresholdKmh: 30 },
]

export function SettingsPage() {
  const { state, updateSettings, notify } = useAppState()
  const { settings } = state

  // Database object counts
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
  const [savedFeedback, setSavedFeedback] = useState(false)

  // Asynchronous refresh of IndexedDB table counts
  const refreshDbCounts = useCallback(async () => {
    try {
      const [obs, snaps, preds, adv, outc, sets] = await Promise.all([
        observationRepo.count(),
        weatherSnapshotRepo.count(),
        predictionRepo.count(),
        adviceRepo.count(),
        outcomeCheckRepo.count(),
        settingRepo.count(),
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
      // Storage may still be initializing
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadCounts = async () => {
      try {
        const [obs, snaps, preds, adv, outc, sets] = await Promise.all([
          observationRepo.count(),
          weatherSnapshotRepo.count(),
          predictionRepo.count(),
          adviceRepo.count(),
          outcomeCheckRepo.count(),
          settingRepo.count(),
        ])
        if (active) {
          setDbCounts({
            observations: obs,
            snapshots: snaps,
            predictions: preds,
            advice: adv,
            outcomes: outc,
            settings: sets,
          })
        }
      } catch {
        // Storage may still be initializing
      }
    }
    void loadCounts()
    return () => {
      active = false
    }
  }, [])

  const handleSaveSettings = () => {
    setSavedFeedback(true)
    notify({
      type: 'success',
      title: 'Settings Saved',
      message: 'All outdoor preferences and AI calibration values have been synchronized.',
    })
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  const toggleSkyFeature = (id: string) => {
    const updated = settings.skyObjects.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    )
    updateSettings({ skyObjects: updated })
  }

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
        const foundClass = CLOUD_CLASSES.find((c) => c.code === s.genusCode) || CLOUD_CLASSES[0]

        const obsId = await observationRepo.save({
          observed_at: obsTime,
          lat_rounded: 40.71,
          lon_rounded: -74.01,
          location_mode: 'rounded',
          place_label: 'Local Observation',
          user_label_class_id: foundClass.label_index,
          is_unsure: 0,
          note: s.note,
          created_at: obsTime,
        })

        await weatherSnapshotRepo.save({
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

        await predictionRepo.save({
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

        await outcomeCheckRepo.save({
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
      notify({
        type: 'success',
        message: 'Successfully generated 5 sample observation records!',
      })
    } catch {
      notify({
        type: 'error',
        message: 'Failed to seed sample observations.',
      })
    }
  }

  const handleInspectRawJson = async () => {
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
    } catch {
      notify({
        type: 'error',
        message: 'Failed to extract database records.',
      })
    }
  }

  const handleDeleteAllData = async () => {
    setShowDeleteConfirm(false)
    try {
      await observationRepo.deleteAll()
      await settingRepo.clearAll()
      await refreshDbCounts()
      notify({
        type: 'info',
        message: 'All local IndexedDB tables cleared successfully.',
      })
    } catch {
      notify({
        type: 'error',
        message: 'Failed to clear local database tables.',
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 text-xs font-medium text-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)]">
          <span>⚙️ System Preferences & Engine Tuning</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          <span className="glow-text">Settings & Configuration</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm max-w-xl">
          Configure outdoor activity profiles, sky detection features, AI model inference backbones, and local IndexedDB tables.
        </p>
      </div>

      {/* SECTION 1: Outdoor Activity Profiles */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🎯 Outdoor Activity Focus</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Adapts weather penalty weights and wind speed thresholds to your planned outing.
            </p>
          </div>
          <span className="badge badge-high text-[10px]">Active Tuning</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTIVITY_OPTIONS.map((act) => {
            const isSelected = settings.activity === act.id
            return (
              <button
                key={act.id}
                onClick={() => updateSettings({ activity: act.id })}
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

      {/* SECTION 2: Sky Detection Feature Toggles */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🔭 Viewfinder Objects & Feature Toggles</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Enable or disable specific assistive visual overlays in the sky camera viewfinder.
            </p>
          </div>
          <span className="badge badge-mid text-[10px]">Viewfinder Overlays</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {settings.skyObjects.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleSkyFeature(item.id)}
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
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

      {/* SECTION 3: AI Model Inference Calibration */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>🧠 AI Model Inference Backbones</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Select active in-browser inference runtime and calibrate probability temperature.
            </p>
          </div>
          <span className="badge badge-high text-[10px]">WASM / ONNX</span>
        </div>

        <div className="space-y-3">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = settings.activeModel === model.id
            return (
              <div
                key={model.id}
                onClick={() => updateSettings({ activeModel: model.id })}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[rgba(34,211,238,0.1)] border-[var(--color-aurora-cyan)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
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

        {/* Calibration Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-space-200)]">Softmax Temperature (T)</span>
              <span className="font-mono text-[var(--color-aurora-cyan)]">{settings.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-aurora-cyan)] cursor-pointer"
            />
            <p className="text-[10px] text-[var(--color-space-300)] mt-1">Lower = sharp confidence, Higher = softer probability distribution</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-space-200)]">Uncertainty Rejection Threshold</span>
              <span className="font-mono text-[var(--color-aurora-cyan)]">{settings.rejectionThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={settings.rejectionThreshold}
              onChange={(e) => updateSettings({ rejectionThreshold: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-aurora-cyan)] cursor-pointer"
            />
            <p className="text-[10px] text-[var(--color-space-300)] mt-1">Below this confidence, images are flagged as inconclusive</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Scoring Heuristics & Rules */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
          <span>⚖️ Advice Heuristics & Scoring Rules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'conservative' as const, label: 'Conservative', desc: '-50 max rain penalty. Cautious for sensitive outings.' },
            { id: 'balanced' as const, label: 'Balanced (Standard)', desc: '-40 max rain penalty. Follows TRD standard specifications.' },
            { id: 'relaxed' as const, label: 'Relaxed', desc: '-25 max rain penalty. Accepts light showers.' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => updateSettings({ rainPenaltyScale: mode.id })}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                settings.rainPenaltyScale === mode.id
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
              Cumulonimbus (Cb) or thunderstorm weather codes automatically cap verdict at &ldquo;Wait&rdquo;.
            </p>
          </div>
          <button
            onClick={() => updateSettings({ enforceStormCap: !settings.enforceStormCap })}
            className={`btn btn-sm ${settings.enforceStormCap ? 'btn-primary' : 'btn-secondary'}`}
          >
            {settings.enforceStormCap ? 'Enforced' : 'Off'}
          </button>
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
              { value: 'rounded' as LocationMode, label: 'Coarse GPS (~0.1°)', desc: '10km privacy' },
              { value: 'manual' as LocationMode, label: 'Manual City', desc: 'No GPS queried' },
              { value: 'off' as LocationMode, label: 'Off', desc: 'Cloud model only' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => updateSettings({ locationMode: value })}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                  settings.locationMode === value
                    ? 'bg-[rgba(34,211,238,0.12)] border-[var(--color-aurora-cyan)] text-[var(--color-star-white)]'
                    : 'bg-[rgba(255,255,255,0.02)] border-transparent text-[var(--color-space-200)]'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-[10px] text-[var(--color-space-300)]">{desc}</span>
              </button>
            ))}
            {settings.locationMode === 'manual' && (
              <input
                type="text"
                value={settings.manualCity}
                onChange={(e) => updateSettings({ manualCity: e.target.value })}
                placeholder="Enter city (e.g. Seattle)..."
                className="input text-xs py-1.5 mt-1 w-full"
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
              { value: 'metric' as UnitSystem, label: 'Metric (°C · km/h)' },
              { value: 'imperial' as UnitSystem, label: 'Imperial (°F · mph)' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ units: value })}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                  settings.units === value
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
              { value: 'dark' as ThemeMode, label: 'Dark', icon: '🌙' },
              { value: 'light' as ThemeMode, label: 'Light', icon: '☀️' },
              { value: 'auto' as ThemeMode, label: 'Auto', icon: '🔄' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value })}
                className={`flex-1 p-2.5 rounded-xl text-center text-xs transition-all border cursor-pointer ${
                  settings.theme === value
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

      {/* SECTION 6: Local Database Storage Manager */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--color-star-white)] flex items-center gap-2">
              <span>💾 Local IndexedDB Storage Tables</span>
            </h2>
            <p className="text-xs text-[var(--color-space-200)] mt-0.5">
              Inspect on-device Dexie table counts or seed demo records.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSeedDemoData} className="btn btn-secondary btn-sm">
              + Seed Demo Records
            </button>
            <button onClick={handleInspectRawJson} className="btn btn-secondary btn-sm">
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

        {/* Delete All Data */}
        <div className="pt-2">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger btn-sm w-full justify-center"
            >
              Clear All Stored Records & History
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] space-y-3">
              <p className="text-xs text-[var(--color-supernova-red)] font-semibold">
                Are you sure you want to delete all stored observation and setting records? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDeleteAllData} className="btn btn-danger btn-sm flex-1">
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
      <Modal
        isOpen={showJsonInspector}
        onClose={() => setShowJsonInspector(false)}
        title="IndexedDB Raw Records Inspector"
      >
        <div className="space-y-4">
          <pre className="p-3 rounded-lg bg-[var(--color-space-900)] text-[11px] font-mono text-[var(--color-space-100)] border border-[rgba(255,255,255,0.1)] overflow-auto max-h-96">
            {rawJsonData}
          </pre>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(rawJsonData)
                notify({ type: 'success', message: 'JSON copied to clipboard!' })
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
      </Modal>

      {/* Primary Save Action */}
      <div className="pt-2">
        <button
          onClick={handleSaveSettings}
          className="btn btn-primary btn-lg w-full justify-center py-3.5 shadow-lg"
        >
          {savedFeedback ? '✓ Settings Synchronized!' : 'Save All Preferences'}
        </button>
      </div>
    </div>
  )
}
