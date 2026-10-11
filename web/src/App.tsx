/**
 * Root Application Layout.
 * Assembles ErrorBoundary, Navbar, SkyBackground, ToastContainer, and Route Outlet.
 */

import { Outlet } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { SkyBackground } from './components/layout/SkyBackground'
import { ToastContainer } from './components/common/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen relative flex flex-col selection:bg-[var(--color-aurora-cyan)] selection:text-[var(--color-space-900)]">
        {/* Animated starry sky background */}
        <SkyBackground />

        {/* Global responsive navigation bar */}
        <Navbar />

        {/* Main page content area */}
        <main className="relative z-10 flex-1 pb-24 md:pb-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Global Toast notifications banner */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}