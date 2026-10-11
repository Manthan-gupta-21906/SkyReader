/**
 * Atlas Page – Interactive WMO Cloud Genera catalog with altitude guides.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLOUD_CLASSES, ALTITUDE_BANDS } from '../domain/clouds/cloudData'
import { computeSampleAdvice } from '../domain/advice/adviceEngine'
import { generateTopPredictions } from '../services/ml/inferenceService'
import { StatusBadge } from '../components/common/StatusBadge'
import { useAppState } from '../state/useAppState'
import type { CloudInfo } from '../types/cloud'

export function AtlasPage() {
  const navigate = useNavigate()
  const { setAnalysis } = useAppState()
  const [selectedCloud, setSelectedCloud] = useState<CloudInfo | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filteredClouds =
    filter === 'all' ? CLOUD_CLASSES : CLOUD_CLASSES.filter((c) => c.altitude_band === filter)

  const handleTryCloud = (cloud: CloudInfo) => {
    const advice = computeSampleAdvice(cloud)
    const topPredictions = generateTopPredictions(cloud)

    setAnalysis({
      cloud,
      advice,
      topPredictions,
      isDemo: true,
    })

    navigate('/result', {
      state: { cloud, advice, topPredictions, isDemo: true },
    })
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="glow-text">Cloud Atlas</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm">
          Learn to identify the 10 cloud genera and clear sky. Tap any genus to inspect characteristics.
        </p>
      </div>

      {/* Altitude Diagram */}
      <div className="glass-card p-5 mb-6">
        <h2 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-3">
          Atmospheric Altitude Strata
        </h2>
        <div className="altitude-bar relative h-32 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {/* Strata background labels */}
          <span className="altitude-label text-[var(--color-nebula-indigo)] absolute left-3 top-2 text-[10px] uppercase font-mono">
            High (6–12 km)
          </span>
          <span className="altitude-label text-[var(--color-aurora-cyan)] absolute left-3 top-[42%] text-[10px] uppercase font-mono">
            Mid (2–6 km)
          </span>
          <span className="altitude-label text-[var(--color-aurora-green)] absolute left-3 bottom-2 text-[10px] uppercase font-mono">
            Low (0–2 km)
          </span>

          {/* Cloud markers on diagram */}
          {CLOUD_CLASSES.filter((c) => c.altitude_band !== 'none').map((c) => {
            const pos = ALTITUDE_BANDS[c.altitude_band]?.position || 50
            return (
              <button
                key={c.code}
                onClick={() => setSelectedCloud(c)}
                className="absolute flex items-center gap-1 cursor-pointer hover:scale-125 transition-transform group"
                style={{
                  top: `${pos}%`,
                  left: `${8 + c.label_index * 8.2}%`,
                  transform: 'translateY(-50%)',
                }}
                title={c.name}
              >
                <span className="text-xl group-hover:scale-110 transition-transform filter drop-shadow">
                  {c.icon}
                </span>
                <span className="text-[10px] font-mono font-bold text-[var(--color-star-white)] opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(5,8,16,0.8)] px-1 rounded">
                  {c.code}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Altitude Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'high', 'mid', 'low', 'vertical', 'none'].map((band) => (
          <button
            key={band}
            onClick={() => setFilter(band)}
            className={`btn btn-sm whitespace-nowrap cursor-pointer ${
              filter === band ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {band === 'all'
              ? 'All Genera'
              : band === 'none'
              ? 'Clear Sky'
              : band.charAt(0).toUpperCase() + band.slice(1)}
          </button>
        ))}
      </div>

      {/* Cloud Genera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClouds.map((cloud) => {
          const sampleAdvice = computeSampleAdvice(cloud)
          const isSelected = selectedCloud?.code === cloud.code

          return (
            <div
              key={cloud.code}
              className={`glass-card p-5 cursor-pointer transition-all border ${
                isSelected
                  ? 'border-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.06)]'
                  : 'hover:border-[rgba(255,255,255,0.2)]'
              }`}
              onClick={() => setSelectedCloud(isSelected ? null : cloud)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedCloud(isSelected ? null : cloud)}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0 filter drop-shadow">{cloud.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors">
                      {cloud.name}
                    </h3>
                    <span className="text-xs text-[var(--color-space-200)] font-mono">
                      ({cloud.code})
                    </span>
                  </div>

                  <StatusBadge type="altitude" altitude={cloud.altitude_band} />

                  <p className="text-sm text-[var(--color-space-100)] mt-2 leading-relaxed">
                    {cloud.how_to_spot}
                  </p>

                  {/* Expanded Card Details */}
                  {isSelected && (
                    <div className="mt-4 space-y-4 pt-3 border-t border-[rgba(255,255,255,0.08)] animate-in fade-in">
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-1">
                          Typical Meteorology
                        </h4>
                        <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
                          {cloud.usual_meaning}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-1">
                          Recommended Action
                        </h4>
                        <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
                          {cloud.what_to_do}
                        </p>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge type="verdict" verdict={sampleAdvice.verdict} label={sampleAdvice.verdictLabel} />
                          <span className="text-xs font-mono text-[var(--color-space-200)]">
                            Score: {sampleAdvice.score}/100
                          </span>
                        </div>

                        {cloud.is_storm_signal && (
                          <span className="badge badge-stay text-[10px]">⚡ Storm Signal</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTryCloud(cloud)
                        }}
                        className="btn btn-ghost btn-sm w-full justify-center mt-2"
                      >
                        Simulate outdoor verdict →
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
