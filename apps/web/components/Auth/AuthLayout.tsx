'use client'
import React from 'react'
import AuthBrandingPanel from '@components/Auth/AuthBrandingPanel'
import { useTranslation } from 'react-i18next'

interface AuthLayoutProps {
  org: any
  /** Kept for call-site compatibility — branding content is added in a later pass. */
  welcomeText?: string
  children: React.ReactNode
}

export default function AuthLayout({ org, children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1.4fr_1fr] h-screen bg-gray-50">
      {/* Left — branding image (content intentionally omitted for now) */}
      <div className="h-[180px] lg:h-full">
        <AuthBrandingPanel org={org} />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-auto">
        <div className="w-full max-w-[360px]">
          <div className="bg-white rounded-xl card-shadow-rest p-8">{children}</div>
          <p className="text-center text-xs text-gray-400 mt-6">
            {t('auth.privacy')} · {t('auth.terms')}
          </p>
        </div>
      </div>
    </div>
  )
}
