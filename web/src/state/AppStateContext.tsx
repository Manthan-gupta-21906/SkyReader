/**
 * Global App State Provider component using useReducer.
 */

import { useReducer, useEffect, useMemo, type ReactNode } from 'react'
import type { AppState, AppAction, ToastNotification } from './types'
import { STORAGE_KEYS } from '../config/constants'
import { settingRepo } from '../services/storage/repositories'
import {
  AppStateContext,
  loadInitialSettings,
  DEFAULT_SETTINGS,
  type AppContextValue,
} from './context'

const initialState: AppState = {
  settings: loadInitialSettings(),
  activeAnalysis: null,
  weatherCache: null,
  notifications: [],
  isAnalyzing: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      const updatedSettings = { ...state.settings, ...action.payload }
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
      } catch {
        // Ignore storage write error
      }
      return {
        ...state,
        settings: updatedSettings,
      }
    }

    case 'SET_ACTIVE_ANALYSIS':
      return {
        ...state,
        activeAnalysis: action.payload,
      }

    case 'SET_WEATHER_CACHE':
      return {
        ...state,
        weatherCache: action.payload,
      }

    case 'SET_IS_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload,
      }

    case 'ADD_NOTIFICATION': {
      const newNotification: ToastNotification = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        ...action.payload,
      }
      return {
        ...state,
        notifications: [...state.notifications.slice(-4), newNotification],
      }
    }

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }

    case 'RESET_SETTINGS': {
      try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS)
      } catch {
        // Ignore
      }
      return {
        ...state,
        settings: DEFAULT_SETTINGS,
      }
    }

    default:
      return state
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    async function syncToIndexedDb() {
      try {
        await settingRepo.save('theme', state.settings.theme)
        await settingRepo.save('location_mode', state.settings.locationMode)
        await settingRepo.save('units', state.settings.units)
        await settingRepo.save('manual_city', state.settings.manualCity)
        await settingRepo.save('activity', state.settings.activity)
        await settingRepo.save('active_model', state.settings.activeModel)
        await settingRepo.save('temperature', state.settings.temperature.toString())
        await settingRepo.save('rejection_threshold', state.settings.rejectionThreshold.toString())
        await settingRepo.save('rain_scale', state.settings.rainPenaltyScale)
        await settingRepo.save('enforce_storm_cap', state.settings.enforceStormCap ? 'true' : 'false')
        await settingRepo.save('outcome_window', state.settings.outcomeWindowHours.toString())
      } catch {
        // Silently tolerate storage sync failures
      }
    }
    syncToIndexedDb()
  }, [state.settings])

  const contextValue = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      updateSettings: (newSettings) =>
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings }),
      setAnalysis: (analysis) =>
        dispatch({ type: 'SET_ACTIVE_ANALYSIS', payload: analysis }),
      notify: (notification) =>
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
      dismissNotification: (id: string) =>
        dispatch({ type: 'DISMISS_NOTIFICATION', payload: id }),
    }),
    [state]
  )

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  )
}
