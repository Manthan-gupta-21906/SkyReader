import { useLocation, useNavigate, Link } from 'react-router-dom'
import { type CloudInfo, CLOUD_CLASSES } from '../domain/cloud-data'
import { computeSampleAdvice, type AdviceResult } from '../advice/engine'

/** Score ring SVG */
function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const colors: Record<string, string> = {
    go: '#10b981',
    go_with_care: '#f59e0b',
    wait: '#f97316',
    stay_in: '#ef4444',
  }
  const color = colors[verdict] || '#38bdf8'

  return (
    <div className="score-ring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <span className="score-ring-value" style={{ color }}>{score}</span>
    </div>
  )
}

/** Confidence bar */
function ConfidenceBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-space-100)] w-28 truncate">{label}</span>
      <div className="confidence-bar flex-1">
        <div className="confidence-fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-[var(--color-star-white)] w-10 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

export default function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as {
    cloud?: CloudInfo
    advice?: AdviceResult
    photoUrl?: string
    isDemo?: boolean
  } | null

  // If no state, redirect to home
  if (!state?.cloud) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="glass-card p-8">
          <span className="text-5xl mb-4 block">🔭</span>
          <h2 className="text-xl font-semibold text-[var(--color-star-white)] mb-2">No Sky Data</h2>
          <p className="text-[var(--color-space-100)] mb-6">Take a sky photo or try a sample to see results.</p>
          <Link to="/" className="btn btn-primary">Go to Sky Capture</Link>
        </div>
      </section>
    )
  }

  const cloud = state.cloud
  const advice = state.advice || computeSampleAdvice(cloud)
  const photoUrl = state.photoUrl
  const isDemo = state.isDemo

  // Generate top-3 predictions (simulated for demo)
  const top3 = generateTop3(cloud)

  const verdictClasses: Record<string, string> = {
    go: 'verdict-go',
    go_with_care: 'verdict-go-care',
    wait: 'verdict-wait',
    stay_in: 'verdict-stay',
  }

  const verdictIcons: Record<string, string> = {
    go: '✅',
    go_with_care: '⚠️',
    wait: '⏳',
    stay_in: '🚫',
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Storm Warning Banner */}
      {advice.hard_rule_hit === 'storm_cap' && (
        <div className="glass-card p-4 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-supernova-red)]">Storm Risk</p>
            <p className="text-xs text-[var(--color-space-100)]">Avoid open ground and high places. Seek robust shelter immediately.</p>
          </div>
        </div>
      )}

      {/* Verdict Card */}
      <div className={`verdict-card ${verdictClasses[advice.verdict]}`}>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <ScoreRing score={advice.score} verdict={advice.verdict} />
            <div className="text-left">
              <p className="text-sm font-medium opacity-80 uppercase tracking-wide">{verdictIcons[advice.verdict]} Verdict</p>
              <p className="text-3xl font-extrabold tracking-tight">{advice.verdictLabel}</p>
            </div>
          </div>
          <p className="text-sm opacity-90 max-w-md mx-auto">{advice.suggestion}</p>
        </div>
      </div>

      {/* Two-column on desktop */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Cloud Card */}
        <div className="glass-card overflow-hidden">
          {photoUrl && (
            <img src={photoUrl} alt="Your sky photo" className="w-full h-48 object-cover" />
          )}
          {!photoUrl && (
            <div className="w-full h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(129,140,248,0.1))' }}>
              <span className="text-6xl">{cloud.icon}</span>
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge badge-${cloud.altitude_band === 'vertical' ? 'vertical' : cloud.altitude_band}`}>
                {cloud.altitude_band}
              </span>
              <span className="text-xs text-[var(--color-space-200)]">{cloud.code}</span>
              {isDemo && <span className="badge badge-neutral">Demo</span>}
            </div>
            <h2 className="text-xl font-bold text-[var(--color-star-white)] mb-3">{cloud.name}</h2>

            {/* Top-3 predictions */}
            <div className="space-y-2">
              {top3.map((pred, i) => (
                <ConfidenceBar key={i} label={pred.name} value={pred.confidence} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* What it usually means */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-2">
              What it usually means
            </h3>
            <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
              {cloud.usual_meaning}
            </p>
          </div>

          {/* Why this verdict */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-3">
              Why this verdict
            </h3>
            {advice.penalties.length === 0 ? (
              <p className="text-sm text-[var(--color-aurora-green)]">No concerns — conditions look excellent!</p>
            ) : (
              <div className="space-y-3">
                {advice.penalties.slice(0, 4).map((pen, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        background: pen.penalty >= 30 ? 'rgba(239,68,68,0.15)' :
                                    pen.penalty >= 15 ? 'rgba(249,115,22,0.15)' :
                                    'rgba(245,158,11,0.15)',
                        color: pen.penalty >= 30 ? 'var(--color-supernova-red)' :
                               pen.penalty >= 15 ? 'var(--color-verdict-wait)' :
                               'var(--color-verdict-go-care)',
                      }}
                    >
                      -{pen.penalty}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-star-white)]">{pen.factor}</p>
                      <p className="text-xs text-[var(--color-space-200)]">{pen.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What to do */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide mb-2">
              What to do
            </h3>
            <p className="text-sm text-[var(--color-star-dim)] leading-relaxed">
              {cloud.what_to_do}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/')} className="btn btn-primary flex-1 min-w-[140px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Retake
        </button>
        <Link to={`/atlas`} className="btn btn-ghost flex-1 min-w-[140px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
          Cloud Atlas
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-[var(--color-space-200)] pb-4">
        ⚠️ Not an official forecast. Always check local weather services for safety-critical decisions.
      </p>
    </section>
  )
}

/** Generate simulated top-3 predictions from a cloud */
function generateTop3(primary: CloudInfo): { name: string; confidence: number }[] {
  const confidence1 = 0.65 + Math.random() * 0.25
  const remaining = 1 - confidence1
  const others = CLOUD_CLASSES.filter(c => c.code !== primary.code)
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 2)
  const conf2 = remaining * (0.5 + Math.random() * 0.3)
  const conf3 = remaining - conf2

  return [
    { name: primary.name, confidence: confidence1 },
    { name: shuffled[0].name, confidence: Math.max(0.02, conf2) },
    { name: shuffled[1].name, confidence: Math.max(0.01, conf3) },
  ]
}