'use client'

import React from 'react'
import PaymentResultCard from '@components/Objects/Payments/PaymentResultCard'

const STATES = [
  {
    label: 'Success — activating',
    variant: 'processing' as const,
    title: 'Payment received',
    description:
      "We're activating your access. This usually takes a few seconds.",
    metaLabel: 'Total paid · 1,500 DZD',
  },
  {
    label: 'Success — access active',
    variant: 'active' as const,
    title: "You're all set",
    description: 'You now have access to UI/UX Masterclass: Design Thinking.',
    metaLabel: 'Total paid · 1,500 DZD',
  },
  {
    label: 'Success — still confirming',
    variant: 'pending' as const,
    title: 'Payment received',
    description:
      "We're still confirming the payment. You can go back to the course — it will unlock automatically once the confirmation arrives.",
    metaLabel: 'Total paid · 1,500 DZD',
  },
  {
    label: 'Failure',
    variant: 'failure' as const,
    title: 'Payment failed',
    description:
      'Your payment was not completed and you have not been charged. You can try again from the course page.',
    metaLabel: null,
  },
]

export default function PaymentResultPreviewPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Payment result pages</h1>
        <p className="text-sm text-gray-500 mt-1">
          Blank page, centered content. Both real routes use this exact block.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-16 mt-6">
          {STATES.map((state) => (
            <div key={state.label} className="flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {state.label}
              </p>
              <div className="flex-1 flex items-center justify-center py-16">
                <PaymentResultCard
                  variant={state.variant}
                  title={state.title}
                  description={state.description}
                  metaLabel={state.metaLabel}
                  orderRef="order_01hjjj9aymmrwe664nbzrv84sg"
                  backLabel="Back to course"
                  secondaryLabel="View my courses"
                  onBack={() => window.history.back()}
                  onSecondary={() => window.history.back()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
