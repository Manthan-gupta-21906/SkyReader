import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLOUD_CLASSES, ALTITUDE_BANDS, type CloudInfo } from '../domain/cloud-data'
import { computeSampleAdvice } from '../advice/engine'

export default function Atlas() {
  const navigate = useNavigate()
  const [selectedCloud, setSelectedCloud] = useState<CloudInfo | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all'
    ? CLOUD_CLASSES
    : CLOUD_CLASSES.filter(c => c.altitude_band === filter)

  const handleTryCloud = (cloud: CloudInfo) => {
    const advice = computeSampleAdvice(cloud)
    navigate('/result', { state: { cloud, advice, isDemo: true } })
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="glow-text">Cloud Atlas</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm">
          Learn to identify the 10 cloud genera and clear sky. Tap a cloud to learn more.
        </p>
      </div>

      {/* Altitude Diagram */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-3">
          Altitude Guide
        </h2>
        <div className="altitude-bar relative">
          {/* Altitude labels */}
          <span className="altitude-label text-[var(--color-nebula-indigo)]" style={{ top: '8px' }}>High (6–12 km)</span>
          <span className="altitude-label text-[var(--color-aurora-cyan)]" style={{ top: '40%' }}>Mid (2–6 km)</span>
          <span className="altitude-label text-[var(--color-aurora-green)]" style={{ top: '72%' }}>Low (0–2 km)</span>

          {/* Cloud dots on diagram */}
          {CLOUD_CLASSES.filter(c => c.altitude_band !== 'none').map((c) => {
            const pos = ALTITUDE_BANDS[c.altitude_band]?.position || 50
            return (
              <button
                key={c.code}
                onClick={() => setSelectedCloud(c)}
                className="absolute flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform group"
                style={{
                  top: `${pos}%`,
                  left: `${10 + (c.label_index * 7.5)}%`,
                  transform: 'translateY(-50%)',
                }}
                title={c.name}
              >
                <span className="text-lg group-hover:scale-125 transition-transform">{c.icon}</span>
                <span className="text-[10px] font-semibold text-[var(--color-star-white)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.code}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'high', 'mid', 'low', 'vertical', 'none'].map((band) => (
          <button
            key={band}
            onClick={() => setFilter(band)}
            className={`btn btn-sm whitespace-nowrap ${
              filter === band ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {band === 'all' ? 'All' : band === 'none' ? 'Clear' : band.charAt(0).toUpperCase() + band.slice(1)}
          </button>
        ))}
      </div>

      {/* Cloud Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cloud) => {
          const sampleAdvice = computeSampleAdvice(cloud)
          return (
            <div
              key={cloud.code}
              className="glass-card p-5 cursor-pointer group hover:scale-[1.01] transition-all"
              onClick={() => setSelectedCloud(selectedCloud?.code === cloud.code ? null : cloud)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedCloud(selectedCloud?.code === cloud.code ? null : cloud)}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0">{cloud.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors">
                      {cloud.name}
                    </h3>
                    <span className="text-xs text-[var(--color-space-200)]">({cloud.code})</span>
                  </div>
                  <span className={`badge badge-${cloud.altitude_band === 'vertical' ? 'vertical' : cloud.altitude_band}`}>
                    {ALTITUDE_BANDS[cloud.altitude_band]?.label || cloud.altitude_band}
                  </span>
                  <p className="text-sm text-[var(--color-space-100)] mt-2 leading-relaxed">
                    {cloud.how_to_spot}
                  </p>

                  {/* Expanded Details */}
                  {selectedCloud?.code === cloud.code && (
                    <div className="mt-4 space-y-4 animate-in fade-in">
                      <div className="divider" />

                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-1">
                          Typical Weather
                        </h4>
                        <p className="text-sm text-[var(--color-star-dim)]">{cloud.usual_meaning}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-1">
                          What to Do
                        </h4>
                        <p className="text-sm text-[var(--color-star-dim)]">{cloud.what_to_do}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-xs text-[var(--color-space-200)]">Signal: </span>
                          <span className="text-xs font-semibold text-[var(--color-star-white)]">
                            {cloud.signal_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {cloud.is_storm_signal && (
                          <span className="badge badge-stay">⚡ Storm Signal</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`badge badge-${sampleAdvice.verdict === 'go' ? 'go' : sampleAdvice.verdict === 'go_with_care' ? 'care' : sampleAdvice.verdict === 'wait' ? 'wait' : 'stay'}`}>
                          Sample: {sampleAdvice.verdictLabel}
                        </span>
                        <span className="text-xs text-[var(--color-space-200)]">Score: {sampleAdvice.score}</span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleTryCloud(cloud) }}
                        className="btn btn-ghost btn-sm w-full"
                      >
                        Try this cloud →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}