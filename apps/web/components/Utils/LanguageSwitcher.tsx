'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Language, ChevronDownMini, Check } from '@components/Objects/Icons/MedusaIcons'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import { changeLanguage } from '@/lib/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { getMenuColorClasses } from '@services/utils/ts/colorUtils'

const LanguageSwitcher = ({ primaryColor = '' }: { primaryColor?: string }) => {
  const { i18n, t } = useTranslation()
  const colors = getMenuColorClasses(primaryColor)

  const currentLangCode = i18n.language.split('-')[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors outline-none ${colors.iconBtn}`}>
          <Language className="h-4 w-4" />
          <span>{currentLangCode}</span>
          <ChevronDownMini className="text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-[180px] z-dropdown"
        align="end"
      >
        {AVAILABLE_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              try {
                localStorage.setItem('i18nextLng_userPicked', '1')
              } catch {}
              changeLanguage(language.code)
            }}
          >
            <span className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-400 w-5">{language.code.toUpperCase()}</span>
              <span>{language.nativeName}</span>
            </span>
            {i18n.language.split('-')[0] === language.code && <Check className="h-4 w-4 text-black" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher

