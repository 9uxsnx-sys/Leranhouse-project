'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMailProvider } from '@/lib/mailProviders'
import { authLinkClass } from './authStyles'

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
  const { t } = useTranslation()
  const mailProvider = getMailProvider(email)

  return (
    <div className="text-center py-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Check size={22} className="text-gray-800" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900">
        {t('auth.check_email_title')}
      </h2>
      <p className="mt-1.5 text-sm text-gray-500">
        {message}{' '}
        <span className="text-gray-700">{email || t('auth.your_inbox')}</span>.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        {mailProvider && (
          <a
            href={mailProvider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={authLinkClass}
          >
            {t('auth.open_mailbox', { provider: mailProvider.name })}
            <ExternalLink size={14} />
          </a>
        )}
        <Link href="/login" className={authLinkClass}>
          <ArrowLeft size={14} />
          {t('auth.back_to_sign_in')}
        </Link>
      </div>
    </div>
  )
}
