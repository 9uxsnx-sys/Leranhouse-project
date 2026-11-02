'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  /**
   * Optional fallback UI to render when an error is caught.
   * If not provided, the children are simply hidden (the boundary swallows the error silently).
   */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode)
  /**
   * Optional filter: only suppress errors matching this predicate.
   * Defaults to suppressing AbortErrors only.
   */
  shouldCatch?: (error: Error) => boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary that silently catches AbortErrors during React rendering.
 *
 * AbortErrors are expected during SWR revalidation and audio loading in
 * Next.js 16 + Turbopack — they indicate a cancelled in-flight request,
 * not an actual failure.  Turbopack's dev overlay catches these at the
 * React reconciler level, so neither `window.onerror` nor `unhandledrejection`
 * can suppress them.  This boundary catches them at the component tree level.
 */
export class AbortErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState | null {
    const isAbortError =
      error?.name === 'AbortError' ||
      error?.message?.includes('aborted') ||
      error?.message?.includes('signal is aborted')

    if (isAbortError) {
      // Swallow the error — it's a normal cancellation
      return { hasError: false, error: null }
    }

    // Re-throw non-AbortErrors
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isAbortError =
      error?.name === 'AbortError' ||
      error?.message?.includes('aborted') ||
      error?.message?.includes('signal is aborted')

    if (isAbortError) {
      // Silently ignore — expected during SWR revalidation
      return
    }

    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return (this.props.fallback as (error: Error) => React.ReactNode)(this.state.error!)
      }
      return this.props.fallback ?? null
    }

    return this.props.children
  }
}
