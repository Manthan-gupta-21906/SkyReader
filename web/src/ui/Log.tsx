import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLOUD_CLASSES } from '../domain/cloud-data'
import { computeSampleAdvice } from '../advice/engine'

/** Simulated log entries for demo (real app would use IndexedDB) */
interface LogEntry {
  id: number
  observed_at: string
  cloud_code: string
  cloud_name: string
  cloud_icon: string
  verdict: string
  verdictLabel: string
  score: number
  outcome?: 'held_up' | 'missed' | 'inconclusive' | 'pending'
  place_label?: string
}

function generateDemoLogs(): LogEntry[] {
  const now = Date.now()
  const entries: LogEntry[] = []
  const locations = ['Nearby', 'Downtown', 'Hillside', 'Park', 'Lakefront']
  const outcomes: ('held_up' | 'missed' | 'pending')[] = ['held_up', 'held_up', 'held_up', 'missed', 'pending']

  for (let i = 0; i < 8; i++) {
    const cloud = CLOUD_CLASSES[Math.floor(Math.random() * CLOUD_CLASSES.length)]
    const advice = computeSampleAdvice(cloud)
    entries.push({
      id: i + 1,
      observed_at: new Date(now - i * 3600000 * (3 + Math.random() * 8)).toISOString(),
      cloud_code: cloud.code,
      cloud_name: cloud.name,
      cloud_icon: cloud.icon,
      verdict: advice.verdict,
      verdictLabel: advice.verdictLabel,
      score: advice.score,
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      place_label: locations[Math.floor(Math.random() * locations.length)],
    })
  }

  return entries.sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = Math.round((now.getTime() - d.getTime()) / 3600000)

  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffH < 48) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Log() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterVerdict, setFilterVerdict] = useState<string>('all')

  useEffect(() => {
    setLogs(generateDemoLogs())
  }, [])

  const filtered = filterVerdict === 'all'
    ? logs
    : logs.filter(l => l.verdict === filterVerdict)

  const stats = {
    total: logs.length,
    accuracy: logs.filter(l => l.outcome === 'held_up').length,
    missed: logs.filter(l => l.outcome === 'missed').length,
    pending: logs.filter(l => l.outcome === 'pending').length,
  }

  const handleEntryClick = (entry: LogEntry) => {
    const cloud = CLOUD_CLASSES.find(c => c.code === entry.cloud_code)
    if (cloud) {
      const advice = computeSampleAdvice(cloud)
      navigate('/result', { state: { cloud, advice, isDemo: true } })
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="glow-text">Sky Log</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm">
          Your sky observations and how the tips held up.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-star-white)]">{stats.total}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wide">Total</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-verdict-go)]">{stats.accuracy}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wide">Accurate</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-supernova-red)]">{stats.missed}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wide">Missed</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-[var(--color-aurora-cyan)]">{stats.pending}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wide">Pending</p>
        </div>
      </div>

      {/* Accuracy Indicator */}
      {stats.total > 0 && (stats.accuracy + stats.missed) > 0 && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide">Tip Accuracy</span>
            <span className="text-sm font-bold text-[var(--color-star-white)]">
              {Math.round((stats.accuracy / (stats.accuracy + stats.missed)) * 100)}%
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${Math.round((stats.accuracy / (stats.accuracy + stats.missed)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'go', label: 'Go' },
          { key: 'go_with_care', label: 'Care' },
          { key: 'wait', label: 'Wait' },
          { key: 'stay_in', label: 'Stay' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterVerdict(key)}
            className={`btn btn-sm whitespace-nowrap ${filterVerdict === key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-[var(--color-space-100)]">No observations yet. Take a sky photo to start logging!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="glass-card p-4 w-full text-left group hover:scale-[1.01] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Cloud icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,211,238,0.08)' }}>
                  <span className="text-2xl">{entry.cloud_icon}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors">
                      {entry.cloud_name}
                    </h3>
                    <span className="text-xs text-[var(--color-space-200)]">{entry.cloud_code}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--color-space-200)]">{formatTime(entry.observed_at)}</span>
                    {entry.place_label && (
                      <>
                        <span className="text-[var(--color-space-300)]">·</span>
                        <span className="text-xs text-[var(--color-space-200)]">{entry.place_label}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Verdict + Outcome */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`badge badge-${entry.verdict === 'go' ? 'go' : entry.verdict === 'go_with_care' ? 'care' : entry.verdict === 'wait' ? 'wait' : 'stay'}`}>
                    {entry.verdictLabel}
                  </span>
                  {entry.outcome && (
                    <span className={`text-[10px] font-medium ${
                      entry.outcome === 'held_up' ? 'text-[var(--color-verdict-go)]' :
                      entry.outcome === 'missed' ? 'text-[var(--color-supernova-red)]' :
                      'text-[var(--color-space-200)]'
                    }`}>
                      {entry.outcome === 'held_up' ? '✓ Held up' :
                       entry.outcome === 'missed' ? '✗ Missed' :
                       '⏳ Pending'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Demo notice */}
      <p className="text-center text-xs text-[var(--color-space-200)] mt-6">
        📌 Demo data shown. Real observations will be saved locally on your device.
      </p>
    </section>
  )
}