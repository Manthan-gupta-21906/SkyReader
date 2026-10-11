import { useState } from 'react'

type Theme = 'dark' | 'light' | 'auto'
type LocationMode = 'rounded' | 'manual' | 'off'
type Units = 'metric' | 'imperial'

export default function Settings() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [locationMode, setLocationMode] = useState<LocationMode>('rounded')
  const [units, setUnits] = useState<Units>('metric')
  const [manualCity, setManualCity] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDeleteAll = () => {
    setShowDeleteConfirm(false)
    // In real app: observation.deleteAll() + setting.clearAll()
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="glow-text">Settings</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm">
          Customize SkyReader to your preferences.
        </p>
      </div>

      <div className="space-y-5">
        {/* Location */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-4">
            📍 Location
          </h2>
          <div className="space-y-3">
            {[
              { value: 'rounded' as LocationMode, label: 'Precise (Rounded)', desc: 'GPS rounded to ~0.1° for weather. Best accuracy.' },
              { value: 'manual' as LocationMode, label: 'Manual City', desc: 'Type a city name. No GPS access needed.' },
              { value: 'off' as LocationMode, label: 'Off', desc: 'No location. Cloud classification only, no weather.' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setLocationMode(value)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  locationMode === value
                    ? 'bg-[rgba(34,211,238,0.1)] border border-[var(--color-aurora-cyan)]'
                    : 'bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.1)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    locationMode === value ? 'border-[var(--color-aurora-cyan)]' : 'border-[var(--color-space-300)]'
                  }`}>
                    {locationMode === value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-aurora-cyan)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-star-white)]">{label}</p>
                    <p className="text-xs text-[var(--color-space-200)]">{desc}</p>
                  </div>
                </div>
              </button>
            ))}

            {locationMode === 'manual' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Enter city name..."
                  className="input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Units */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-4">
            📐 Units
          </h2>
          <div className="flex gap-3">
            {[
              { value: 'metric' as Units, label: '°C · km/h', desc: 'Metric' },
              { value: 'imperial' as Units, label: '°F · mph', desc: 'Imperial' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setUnits(value)}
                className={`flex-1 p-3 rounded-xl text-center transition-all ${
                  units === value
                    ? 'bg-[rgba(34,211,238,0.1)] border border-[var(--color-aurora-cyan)]'
                    : 'bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.1)]'
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-star-white)]">{desc}</p>
                <p className="text-xs text-[var(--color-space-200)]">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-4">
            🎨 Theme
          </h2>
          <div className="flex gap-3">
            {[
              { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
              { value: 'light' as Theme, label: 'Light', icon: '☀️' },
              { value: 'auto' as Theme, label: 'Auto', icon: '🔄' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 p-3 rounded-xl text-center transition-all ${
                  theme === value
                    ? 'bg-[rgba(34,211,238,0.1)] border border-[var(--color-aurora-cyan)]'
                    : 'bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.1)]'
                }`}
              >
                <span className="text-xl block mb-1">{icon}</span>
                <p className="text-sm font-medium text-[var(--color-star-white)]">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-4">
            🔒 Privacy & Data
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)' }}>
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-star-white)]">Photos stay on your device</p>
                <p className="text-xs text-[var(--color-space-200)]">Photos are processed in-browser and never uploaded. Only a rounded location is sent to fetch weather.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)' }}>
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-star-white)]">No analytics or trackers</p>
                <p className="text-xs text-[var(--color-space-200)]">No third-party scripts. The only external call is the Open-Meteo weather API.</p>
              </div>
            </div>

            <div className="divider" />

            <div className="flex gap-3">
              <button className="btn btn-secondary btn-sm flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
              <button className="btn btn-secondary btn-sm flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export JSON
              </button>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-danger btn-sm w-full"
              >
                Delete All Data
              </button>
            ) : (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-sm text-[var(--color-supernova-red)] font-medium mb-2">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAll} className="btn btn-danger btn-sm flex-1">
                    Yes, delete everything
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary btn-sm flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Model & About */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-4">
            🧠 Model Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-space-200)]">Model</span>
              <span className="text-[var(--color-star-white)] font-medium">MobileNetV3 (ONNX)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-space-200)]">Classes</span>
              <span className="text-[var(--color-star-white)] font-medium">10 genera + clear sky</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-space-200)]">Inference</span>
              <span className="text-[var(--color-star-white)] font-medium">In-browser (WASM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-space-200)]">Weather API</span>
              <span className="text-[var(--color-star-white)] font-medium">Open-Meteo (free)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-space-200)]">Version</span>
              <span className="text-[var(--color-star-white)] font-medium">0.1.0</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button onClick={handleSave} className="btn btn-primary w-full">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </section>
  )
}