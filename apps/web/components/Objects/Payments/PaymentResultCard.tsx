'use client'

import React from 'react'
import { ArrowLeft, Check, Clock, Loader2, X } from 'lucide-react'

export type PaymentResultVariant = 'processing' | 'active' | 'pending' | 'failure'

const VARIANTS = {
  processing: { Icon: Loader2, iconClass: 'text-gray-400 animate-spin' },
  active: { Icon: Check, iconClass: 'text-gray-900' },
  pending: { Icon: Clock, iconClass: 'text-gray-700' },
  failure: { Icon: X, iconClass: 'text-gray-900' },
} as const

interface PaymentResultCardProps {
  variant: PaymentResultVariant
  title: string
  description: string
  /** Muted summary line, e.g. "Total paid · 1,500 DZD". */
  metaLabel?: string | null
  orderRef?: string | null
  backLabel: string
  secondaryLabel?: string
  onBack: () => void
  onSecondary?: () => void
}

/**
 * Presentational result block shared by the real success/failure pages and
 * `/test-dev/payment`. Deliberately card-less: the page is blank, the content
 * is centered, and type does the work — same restraint as the auth screens.
 */
export default function PaymentResultCard({
  variant,
  title,
  description,
  metaLabel,
  orderRef,
  backLabel,
  secondaryLabel,
  onBack,
  onSecondary,
}: PaymentResultCardProps) {
  const visual = VARIANTS[variant]

  return (
    <div className="w-full max-w-md text-center">
      <visual.Icon
        size={30}
        strokeWidth={1.5}
        className={`mx-auto ${visual.iconClass}`}
      />

      <h1 className="mt-7 text-2xl md:text-[28px] font-semibold tracking-tight text-gray-900">
        {title}
      </h1>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed">{description}</p>

      {(metaLabel || orderRef) && (
        <div className="mt-5 space-y-1">
          {metaLabel && (
            <p className="text-sm font-medium text-gray-700">{metaLabel}</p>
          )}
          {orderRef && (
            <p className="text-xs font-mono text-gray-400 truncate">{orderRef}</p>
          )}
        </div>
      )}

      <div className="mt-9 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-7 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-sm font-semibold text-white shadow-sm hover:bg-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </button>

        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="text-sm font-semibold text-gray-900 hover:underline cursor-pointer"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}
