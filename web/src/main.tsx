/**
 * Application Entry Point.
 * Sets up React Root, HashRouter, AppStateProvider, and Route definitions.
 */

import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { StrictMode } from 'react'
import './index.css'

import App from './App'
import { AppStateProvider } from './state/AppStateContext'
import { SkyPage } from './pages/SkyPage'
import { LogPage } from './pages/LogPage'
import { AtlasPage } from './pages/AtlasPage'
import { SettingsPage } from './pages/SettingsPage'
import { ResultPage } from './pages/ResultPage'
import { OnboardingPage } from './pages/OnboardingPage'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SkyPage /> },
      { path: 'log', element: <LogPage /> },
      { path: 'atlas', element: <AtlasPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'result', element: <ResultPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root DOM element')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  </StrictMode>
)