'use client'
import React, { useEffect } from 'react'
import '../lib/i18n'
import { SessionProvider } from '@components/Contexts/AuthContext'
import LHSessionProvider from '@components/Contexts/LHSessionContext'
import I18nProvider from '@components/Contexts/I18nContext'

/** Suppress AbortError noise from Next.js internal fetch cancellations */
function AbortErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Patch console.error to suppress AbortError messages that Next.js dev overlay logs
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const msg = args.join(' ')
      if (
        msg.includes('AbortError') ||
        msg.includes('signal is aborted') ||
        msg.includes('The user aborted a request') ||
        msg.includes('aborted without reason')
      ) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    // Catch unhandled rejections and runtime errors as a fallback.
    // Check both `name` and `message` because Turbopack wraps the original error.
    const isAbortError = (reason: unknown): boolean => {
      if (!reason) return false
      if (typeof reason === 'object') {
        const obj = reason as any
        return (
          obj?.name === 'AbortError' ||
          obj?.message?.includes('aborted') ||
          obj?.message?.includes('signal is aborted')
        )
      }
      if (typeof reason === 'string') {
        return reason.includes('aborted') || reason.includes('AbortError')
      }
      return false
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault()
      }
    }
    const errorHandler = (event: ErrorEvent) => {
      if (isAbortError(event.error) || isAbortError(event.message)) {
        event.preventDefault()
      }
    }
    window.addEventListener('unhandledrejection', rejectionHandler)
    window.addEventListener('error', errorHandler)

    return () => {
      console.error = originalConsoleError
      window.removeEventListener('unhandledrejection', rejectionHandler)
      window.removeEventListener('error', errorHandler)
    }
  }, [])
  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={600000}>
      <LHSessionProvider>
        <I18nProvider>
          <AbortErrorSuppressor>{children}</AbortErrorSuppressor>
        </I18nProvider>
      </LHSessionProvider>
    </SessionProvider>
  )
}
