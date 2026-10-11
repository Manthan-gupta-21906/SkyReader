/**
 * React Error Boundary component.
 * Catches unhandled runtime exceptions in UI render tree and renders a recovery screen.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SkyReader ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-space-900)] text-[var(--color-star-white)]">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-4 border border-[rgba(239,68,68,0.3)] shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(239,68,68,0.15)] flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-[var(--color-star-white)]">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-space-200)] leading-relaxed">
              SkyReader encountered an unexpected error while rendering this page.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-[rgba(0,0,0,0.4)] text-[11px] font-mono text-left text-[var(--color-supernova-red)] overflow-auto max-h-32 border border-[rgba(255,255,255,0.05)]">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="btn btn-primary w-full justify-center py-2.5"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
