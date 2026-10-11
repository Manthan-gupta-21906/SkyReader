/**
 * Custom hook managing observation history, statistical calculation, and filtering.
 */

import { useState, useMemo, useCallback } from 'react'
import { CLOUD_CLASSES } from '../domain/clouds/cloudData'
import { computeSampleAdvice } from '../domain/advice/adviceEngine'
import type { Verdict } from '../types/advice'
import { observationRepo } from '../services/storage/repositories'

export interface LogEntry {
  id: number
  observed_at: string
  cloud_code: string
  cloud_name: string
  cloud_icon: string
  verdict: Verdict
  verdictLabel: string
  score: number
  outcome?: 'held_up' | 'missed' | 'inconclusive' | 'pending'
  place_label?: string
}

export interface ObservationStats {
  total: number
  accuracy: number
  missed: number
  pending: number
  accuracyPercentage: number
}

export function generateDemoLogs(): LogEntry[] {
  const now = Date.now()
  const entries: LogEntry[] = []
  const locations = ['Nearby', 'Downtown', 'Hillside', 'Park', 'Lakefront']
  const outcomes: ('held_up' | 'missed' | 'pending')[] = [
    'held_up',
    'held_up',
    'held_up',
    'missed',
    'pending',
  ]

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

  return entries.sort(
    (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime()
  )
}

export function useObservations() {
  const [logs, setLogs] = useState<LogEntry[]>(() => generateDemoLogs())
  const [filterVerdict, setFilterVerdict] = useState<string>('all')

  const filteredLogs = useMemo(() => {
    if (filterVerdict === 'all') return logs
    return logs.filter((l) => l.verdict === filterVerdict)
  }, [logs, filterVerdict])

  const stats = useMemo<ObservationStats>(() => {
    const total = logs.length
    const accuracy = logs.filter((l) => l.outcome === 'held_up').length
    const missed = logs.filter((l) => l.outcome === 'missed').length
    const pending = logs.filter((l) => l.outcome === 'pending').length
    const evaluated = accuracy + missed
    const accuracyPercentage = evaluated > 0 ? Math.round((accuracy / evaluated) * 100) : 0

    return {
      total,
      accuracy,
      missed,
      pending,
      accuracyPercentage,
    }
  }, [logs])

  const addObservation = useCallback((newEntry: LogEntry) => {
    setLogs((prev) => [newEntry, ...prev])
  }, [])

  const clearAllLogs = useCallback(async () => {
    try {
      await observationRepo.deleteAll()
      setLogs([])
    } catch {
      // Silently clear local memory if storage fails
      setLogs([])
    }
  }, [])

  return {
    logs,
    filteredLogs,
    stats,
    filterVerdict,
    setFilterVerdict,
    addObservation,
    clearAllLogs,
  }
}
