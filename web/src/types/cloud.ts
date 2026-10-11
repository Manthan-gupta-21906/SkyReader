/**
 * Cloud domain types based on the 10 WMO Genera classification standards.
 */

export type AltitudeBand = 'high' | 'mid' | 'low' | 'vertical' | 'none'

export type SignalType =
  | 'neutral'
  | 'change_coming'
  | 'rain_building'
  | 'rain_now'
  | 'storm'
  | 'low_visibility'

export interface CloudInfo {
  label_index: number
  code: string
  name: string
  altitude_band: AltitudeBand
  how_to_spot: string
  usual_meaning: string
  what_to_do: string
  signal_type: SignalType
  signal_weight: number
  is_storm_signal: boolean
  icon: string
}

export interface AltitudeBandMeta {
  label: string
  position: number
}
