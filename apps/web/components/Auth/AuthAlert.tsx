'use client'
import React from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AuthAlertVariant = 'error' | 'success' | 'warning' | 'info'

const VARIANTS: Record<
  AuthAlertVariant,
  { wrapper: string; icon: string; text: string }
> = {
  error: {
    wrapper: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
    icon: 'text-rose-500 dark:text-rose-400',
    text: 'text-rose-900 dark:text-rose-200',
  },
  success: {
    wrapper: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-900 dark:text-emerald-200',
  },
  warning: {
    wrapper: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-100',
  },
  info: {
    wrapper: 'bg-gray-50 dark:bg-dk-raised border-gray-200 dark:border-dk-line-strong',
    icon: 'text-gray-500 dark:text-dk-fg-3',
    text: 'text-gray-700 dark:text-dk-fg-2',
  },
}

const ICONS: Record<AuthAlertVariant, React.ElementType> = {
  error: AlertTriangle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

/**
 * Inline alert for the auth surfaces. Replaces the old full-width coloured
 * bars so errors/success read as part of the calm, neutral design system.
 */
export default function AuthAlert({
  variant = 'error',
  children,
  action,
  className,
}: {
  variant?: AuthAlertVariant
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  const v = VARIANTS[variant]
  const Icon = ICONS[variant]

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3.5 py-3',
        v.wrapper,
        className
      )}
    >
      <Icon size={16} className={cn('mt-0.5 shrink-0', v.icon)} />
      <div className={cn('flex-1 text-[13px] leading-relaxed', v.text)}>
        {children}
        {action && <div className="mt-1.5">{action}</div>}
      </div>
    </div>
  )
}
