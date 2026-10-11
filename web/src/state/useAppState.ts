/**
 * Custom hook for consuming global application state.
 */

import { useContext } from 'react'
import { AppStateContext, type AppContextValue } from './context'

export function useAppState(): AppContextValue {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
