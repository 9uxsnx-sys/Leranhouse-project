'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ExternalLink } from 'lucide-react'
import { getMailProvider } from '@/lib/mailProviders'

/**
 * Shared "Check your email" state used by the forgot-password and
 * sign-up flows. Only the `message` differs between them.
 */
export default function CheckEmailState({
  email,
  message,
}: {
  email: string
  message: string
}) {
  const mailProvider = getMailProvider(email)

  return (
    <div className="text-center py-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Check size={22} className="text-gray-800" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900">
        Check your email
      </h2>
      <p className="mt-1.5 text-sm text-gray-500">
        {message}{' '}
        <span className="text-gray-700">{email || 'your inbox'}</span>.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        {mailProvider && (
          <a
            href={mailProvider.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline"
          >
            Open {mailProvider.name}
            <ExternalLink size={14} />
          </a>
        )}
        <Link
          href="/test-dev/auth"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
