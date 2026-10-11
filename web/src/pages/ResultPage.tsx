/**
 * Result Page – Displays AI cloud prediction, weather penalties breakdown, and outdoor verdict.
 */

import { useLocation, useNavigate, Link } from 'react-router-dom'
import { computeSampleAdvice } from '../domain/advice/adviceEngine'
import { generateTopPredictions } from '../services/ml/inferenceService'
import { ScoreRing } from '../components/common/ScoreRing'
import { ConfidenceBar } from '../components/common/ConfidenceBar'
import { StatusBadge } from '../components/common/StatusBadge'
import { CameraIcon, AtlasIcon } from '../components/icons/Icons'
import { useAppState } from '../state/useAppState'
import { VERDICT_ICONS } from '../config/constants'
import type { CloudInfo } from '../types/cloud'
import type { AdviceResult } from '../types/advice'
import type { PredictionOutput } from '../services/ml/inferenceService'

interface LocationState {
  cloud?: CloudInfo
  advice?: AdviceResult
  photoUrl?: string
  isDemo?: boolean
  topPredictions?: PredictionOutput[]
}

export function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state: appState } = useAppState()

  const state = (location.state as LocationState) || appState.activeAnalysis

  if (!state?.cloud) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="glass-card p-8">
          <span className="text-5xl mb-4 block">🔭</span>
          <h2 className="text-xl font-semibold text-[var(--color-star-white)] mb-2">No Sky Data</h2>
          <p className="text-[var(--color-space-100)] mb-6">Take a sky photo or try a sample to see results.</p>
          <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
            <CameraIcon size={18} />
            <span>Go to Sky Capture</span>
          </Link>
        </div>
      </section>
    )
  }

  const cloud = state.cloud
  const advice =
    state.advice ||
    computeSampleAdvice(cloud, {
      rainPenaltyScale: appState.settings.rainPenaltyScale,
      enforceStormCap: appState.settings.enforceStormCap,
    })
  const photoUrl = state.photoUrl
  const isDemo = state.isDemo
  const topPredictions = state.topPredictions || generateTopPredictions(cloud)

  const verdictCardClasses: Record<string, string> = {
    go: 'verdict-go',
    go_with_care: 'verdict-go-care',
    wait: 'verdict-wait',
    stay_in: 'verdict-stay',
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Storm Warning Banner */}
      {advice.hard_rule_hit === 'storm_cap' && (
        <div
          className="glass-card p-4 flex items-center gap-3 border border-[rgba(239,68,68,0.4)]"
          style={{ background: 'rgba(239,68,68,0.15)' }}
        >
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-supernova-red)]">
              Critical Storm Risk Warning
            </p>
            <p className="text-xs text-[var(--color-space-100)]">
              Convective storm cells detected. Stay indoors and seek shelter away from exposed high ground.
            </p>
          </div>
        </div>
      )}

      {/* Verdict Card */}
      <div className={`verdict-card ${verdictCardClasses[advice.verdict] || 'verdict-go'}`}>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-5 mb-3">
            <ScoreRing score={advice.score} verdict={advice.verdict} size={96} />
            <div className="text-left">
              <p className="text-xs font-semibold opacity-80 uppercase tracking-widest flex items-center gap-1.5">
                <span>{VERDICT_ICONS[advice.verdict]}</span>
                <span>Verdict</span>
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {advice.verdictLabel}
              </h1>
            </div>
          </div>
          <p className="text-sm md:text-base opacity-95 max-w-lg mx-auto leading-relaxed">
            {advice.suggestion}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Cloud Identification & Confidence */}
        <div className="glass-card overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt="Captured sky" className="w-full h-52 object-cover" />
          ) : (
            <div
              className="w-full h-52 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(129,140,248,0.12))',
              }}
            >
              <span className="text-7xl filter drop-shadow">{cloud.icon}</span>
            </div>
          )}

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge type="altitude" altitude={cloud.altitude_band} />
                <span className="text-xs text-[var(--color-space-200)] font-mono font-medium">
                  {cloud.code}
                </span>
                {isDemo && <StatusBadge type="tag" label="Demo" />}
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-star-white)]">
                {cloud.name}
              </h2>
            </div>

            {/* Top Predictions Bar */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-semibold text-[var(--color-space-200)] uppercase tracking-wider">
                Model Confidence
              </h3>
              {topPredictions.map((pred, i) => (
                <ConfidenceBar
                  key={i}
                  label={pred.cloud.name}
                  value={pred.confidence}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reasoning & Penalties */}
        <div className="space-y-5">
          {/* What it usually means */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wider mb-2">
              Atmospheric Meaning
            </h3>
            <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
              {cloud.usual_meaning}
            </p>
          </div>

          {/* Why this verdict */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wider mb-3">
              Why this verdict
            </h3>
            {advice.penalties.length === 0 ? (
              <p className="text-sm text-[var(--color-aurora-green)]">
                ✓ No weather concerns detected — conditions look optimal!
              </p>
            ) : (
              <div className="space-y-3">
                {advice.penalties.slice(0, 4).map((pen, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                      style={{
                        background:
                          pen.penalty >= 30
                            ? 'rgba(239,68,68,0.15)'
                            : pen.penalty >= 15
                            ? 'rgba(249,115,22,0.15)'
                            : 'rgba(245,158,11,0.15)',
                        color:
                          pen.penalty >= 30
                            ? 'var(--color-supernova-red)'
                            : pen.penalty >= 15
                            ? 'var(--color-verdict-wait)'
                            : 'var(--color-verdict-go-care)',
                      }}
                    >
                      -{pen.penalty}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-star-white)]">
                        {pen.factor}
                      </p>
                      <p className="text-xs text-[var(--color-space-200)] leading-relaxed">
                        {pen.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable guidance */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wider mb-2">
              What to do
            </h3>
            <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
              {cloud.what_to_do}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary flex-1 min-w-[140px] justify-center py-3"
        >
          <CameraIcon size={16} />
          <span>Scan Another Sky</span>
        </button>
        <Link
          to="/atlas"
          className="btn btn-secondary flex-1 min-w-[140px] justify-center py-3"
        >
          <AtlasIcon size={16} />
          <span>Explore Cloud Atlas</span>
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--color-space-200)] pt-2 pb-6">
        ⚠️ Advisory verdict only. Always monitor regional meteorological radar for safety-critical decisions.
      </p>
    </section>
  )
}
