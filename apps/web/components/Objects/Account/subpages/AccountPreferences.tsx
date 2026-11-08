'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sliders } from 'lucide-react'

function AccountPreferences() {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
        {t('user.settings.preferences.title')}
      </h3>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sliders className="w-12 h-12 text-gray-200 mb-4" />
        <p className="text-gray-500 text-sm">
          {t('user.settings.preferences.coming_soon')}
        </p>
      </div>
    </div>
  )
}

export default AccountPreferences
