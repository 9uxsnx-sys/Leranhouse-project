'use client'

import React from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CourseAudienceProps {
  forItems: string[]
  notForItems: string[]
}

export default function CourseAudience({ forItems, notForItems }: CourseAudienceProps) {
  const { t } = useTranslation()
  if (forItems.length === 0 && notForItems.length === 0) return null

  return (
    <div>
      <Heading level="h1" className="!text-2xl mb-4">{t('course.page.audience_title')}</Heading>
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-5">
        <div className="flex flex-col gap-0.5">
          <Heading level="h2">{t('course.page.audience_for_title')}</Heading>
          <Text size="base" className="text-ui-fg-muted">{t('course.page.audience_for_subtitle')}</Text>
        </div>
        <ul className="mt-3 space-y-2 ps-3">
          {forItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check size={16} className="mt-[5px] text-ui-fg-muted shrink-0" />
              <Text size="base" className="text-[15px]">{item}</Text>
            </li>
          ))}
        </ul>

        {notForItems.length > 0 && (
          <>
            <div className="flex flex-col gap-0.5 mt-5">
              <Heading level="h2">{t('course.page.audience_not_for_title')}</Heading>
              <Text size="base" className="text-ui-fg-muted">{t('course.page.audience_not_for_subtitle')}</Text>
            </div>
            <ul className="mt-3 space-y-2 ps-3">
              {notForItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <X size={16} className="mt-[5px] text-ui-fg-muted shrink-0" />
                  <Text size="base" className="text-[15px]">{item}</Text>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
