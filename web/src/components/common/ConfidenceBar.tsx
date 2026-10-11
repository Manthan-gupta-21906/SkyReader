/**
 * Reusable progress bar visualizing model prediction confidence.
 */

export interface ConfidenceBarProps {
  label: string
  value: number // 0 to 1
  className?: string
}

export function ConfidenceBar({ label, value, className = '' }: ConfidenceBarProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-xs text-[var(--color-space-100)] w-28 truncate">{label}</span>
      <div className="confidence-bar flex-1 bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
        <div
          className="confidence-fill bg-[var(--color-aurora-cyan)] h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold font-mono text-[var(--color-star-white)] w-10 text-right">
        {percentage}%
      </span>
    </div>
  )
}
