'use client'
import React from 'react'

export type PaymentStatus = 'paid' | 'failed' | 'pending' | 'refunded'

const STATUS_SQUARE: Record<PaymentStatus, string> = {
  paid: 'bg-green-500',
  failed: 'bg-red-500',
  pending: 'bg-amber-500',
  refunded: 'bg-gray-400',
}

/**
 * Status cell used by every payments table: a small rounded square in the
 * status colour plus the label in plain text (same pattern as the Users table
 * and the Contributors tab). No pills, no badges.
 */
export function PaymentStatusDot({ status, label }: { status: PaymentStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`w-2.5 h-2.5 rounded ${STATUS_SQUARE[status]}`} />
      {label}
    </span>
  )
}
