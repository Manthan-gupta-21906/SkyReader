/**
 * Reusable status badge component for verdicts, altitude bands, and demo markers.
 */

import type { Verdict } from '../../types/advice'
import type { AltitudeBand } from '../../types/cloud'
import { VERDICT_BADGES } from '../../config/constants'
import { ALTITUDE_BANDS } from '../../domain/clouds/cloudData'

export interface StatusBadgeProps {
  type: 'verdict' | 'altitude' | 'tag'
  verdict?: Verdict
  altitude?: AltitudeBand
  label?: string
  className?: string
}

export function StatusBadge({
  type,
  verdict,
  altitude,
  label,
  className = '',
}: StatusBadgeProps) {
  if (type === 'verdict' && verdict) {
    const badgeClass = VERDICT_BADGES[verdict] || 'badge-neutral'
    const displayLabel =
      label || (verdict === 'go' ? 'Go' : verdict === 'go_with_care' ? 'Go with Care' : verdict === 'wait' ? 'Wait' : 'Stay In')

    return <span className={`badge ${badgeClass} text-[10px] ${className}`}>{displayLabel}</span>
  }

  if (type === 'altitude' && altitude) {
    const bandInfo = ALTITUDE_BANDS[altitude]
    const bandClass = altitude === 'vertical' ? 'badge-vertical' : `badge-${altitude}`
    return (
      <span className={`badge ${bandClass} text-[10px] ${className}`}>
        {label || bandInfo?.label || altitude}
      </span>
    )
  }

  return (
    <span className={`badge badge-neutral text-[10px] ${className}`}>
      {label}
    </span>
  )
}
