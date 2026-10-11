/**
 * Advice engine verdict, scoring penalties, and recommendation types.
 */

export type Verdict = 'go' | 'go_with_care' | 'wait' | 'stay_in'

export interface Penalty {
  factor: string
  penalty: number
  text: string
}

export type AdviceHardRule = 'storm_cap' | 'excessive_rain' | 'extreme_wind'

export interface AdviceResult {
  score: number
  verdict: Verdict
  verdictLabel: string
  penalties: Penalty[]
  suggestion: string
  hard_rule_hit: AdviceHardRule | null
  cloudExplanation: string
}
