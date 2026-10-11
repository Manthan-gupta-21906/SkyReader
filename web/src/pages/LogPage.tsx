/**
 * Log Page – Observation diary, prediction outcomes, and advice accuracy indicators.
 */

import { useNavigate } from 'react-router-dom'
import { useObservations, type LogEntry } from '../hooks/useObservations'
import { CLOUD_CLASSES } from '../domain/clouds/cloudData'
import { computeSampleAdvice } from '../domain/advice/adviceEngine'
import { formatRelativeTime } from '../utils/formatters'
import { StatusBadge } from '../components/common/StatusBadge'
import { useAppState } from '../state/useAppState'

export function LogPage() {
  const navigate = useNavigate()
  const { setAnalysis } = useAppState()
  const { filteredLogs, stats, filterVerdict, setFilterVerdict } = useObservations()

  const handleEntryClick = (entry: LogEntry) => {
    const cloud = CLOUD_CLASSES.find((c) => c.code === entry.cloud_code)
    if (cloud) {
      const advice = computeSampleAdvice(cloud)
      setAnalysis({ cloud, advice, isDemo: true })
      navigate('/result', { state: { cloud, advice, isDemo: true } })
    }
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="glow-text">Sky Log</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-sm">
          Your sky observations and outdoor verdict historical accuracy tracking.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-star-white)]">{stats.total}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wider mt-0.5">Total</p>
        </div>
        <div className="glass-card p-3.5 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-verdict-go)]">{stats.accuracy}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wider mt-0.5">Accurate</p>
        </div>
        <div className="glass-card p-3.5 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-supernova-red)]">{stats.missed}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wider mt-0.5">Missed</p>
        </div>
        <div className="glass-card p-3.5 text-center">
          <p className="text-2xl font-bold font-mono text-[var(--color-aurora-cyan)]">{stats.pending}</p>
          <p className="text-[10px] text-[var(--color-space-200)] uppercase tracking-wider mt-0.5">Pending</p>
        </div>
      </div>

      {/* Accuracy Indicator Bar */}
      {stats.total > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--color-aurora-cyan)] uppercase tracking-wide">
              Tip Accuracy Reliability
            </span>
            <span className="text-sm font-bold font-mono text-[var(--color-star-white)]">
              {stats.accuracyPercentage}%
            </span>
          </div>
          <div className="confidence-bar h-2.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="confidence-fill bg-[var(--color-aurora-cyan)] h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.accuracyPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            className={`btn btn-sm whitespace-nowrap cursor-pointer ${
              filterVerdict === key ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log Entries List */}
      {filteredLogs.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <span className="text-4xl block">📋</span>
          <p className="text-[var(--color-space-100)] text-sm">
            No observations match this filter. Take a sky photo to start logging!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="glass-card p-4 w-full text-left group hover:scale-[1.008] transition-all cursor-pointer flex items-center justify-between gap-4 border hover:border-[rgba(34,211,238,0.3)]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,211,238,0.08)' }}
                >
                  <span className="text-2xl filter drop-shadow">{entry.cloud_icon}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors truncate">
                      {entry.cloud_name}
                    </h3>
                    <span className="text-xs text-[var(--color-space-200)] font-mono">
                      {entry.cloud_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-space-200)]">
                    <span>{formatRelativeTime(entry.observed_at)}</span>
                    {entry.place_label && (
                      <>
                        <span className="text-[var(--color-space-300)]">·</span>
                        <span>{entry.place_label}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Verdict & Outcome Badges */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge type="verdict" verdict={entry.verdict} label={entry.verdictLabel} />
                {entry.outcome && (
                  <span
                    className={`text-[10px] font-medium ${
                      entry.outcome === 'held_up'
                        ? 'text-[var(--color-verdict-go)]'
                        : entry.outcome === 'missed'
                        ? 'text-[var(--color-supernova-red)]'
                        : 'text-[var(--color-space-200)]'
                    }`}
                  >
                    {entry.outcome === 'held_up'
                      ? '✓ Held up'
                      : entry.outcome === 'missed'
                      ? '✗ Missed'
                      : '⏳ Pending'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[var(--color-space-200)] pt-4">
        📌 Demo entries demonstrated above. Real observations are stored locally in your browser&apos;s IndexedDB.
      </p>
    </section>
  )
}
