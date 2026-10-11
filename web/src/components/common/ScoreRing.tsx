/**
 * Animated SVG score gauge displaying outdoor verdict score (0–100).
 */

import { VERDICT_COLORS } from '../../config/constants'
import type { Verdict } from '../../types/advice'

export interface ScoreRingProps {
  score: number
  verdict: Verdict
  size?: number
  strokeWidth?: number
}

export function ScoreRing({
  score,
  verdict,
  size = 100,
  strokeWidth = 8,
}: ScoreRingProps) {
  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference
  const color = VERDICT_COLORS[verdict] || '#38bdf8'

  return (
    <div
      className="score-ring inline-flex items-center justify-center relative"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Outdoor score: ${clampedScore} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span
        className="score-ring-value absolute font-mono font-bold"
        style={{ color, fontSize: size * 0.32 }}
      >
        {clampedScore}
      </span>
    </div>
  )
}
