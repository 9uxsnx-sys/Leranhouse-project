'use client'

import React from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { useTranslation } from 'react-i18next'

interface CourseLearningsProps {
  title?: string
  subtitle?: string
  items?: string[]
}

const DEFAULT_ITEMS = [
  'Understand core UI/UX design principles like hierarchy, contrast, and balance, and learn how to apply them effectively in real-world projects across different platforms and screen sizes',
  'Master Figma prototyping workflows including auto-layout, component properties, interactive variants, and design system creation from scratch',
  'Build scalable, reusable component libraries that maintain consistency across your entire product ecosystem while reducing development handoff friction',
  'Implement "quiet luxury" and minimalist layout structures using ample whitespace, refined typography, and subtle interactions that feel premium',
  'Design conversion-optimized high-end digital experiences that guide users naturally toward key actions without feeling manipulative or cluttered',
  'Apply 8pt grid systems and spatial cadence to layouts, creating harmonious vertical rhythm and visual order that feels intentional and polished',
  'Create responsive designs that work across all devices',
  'Develop a professional design portfolio with real projects',
]

export default function CourseLearnings({
  title,
  subtitle,
  items = DEFAULT_ITEMS,
}: CourseLearningsProps) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
        <div className="flex flex-col gap-0.5">
          <Heading level="h2">{title ?? t('course.page.learnings_title')}</Heading>
          <Text size="base" className="text-ui-fg-muted">{subtitle ?? t('course.page.learnings_subtitle')}</Text>
        </div>
        <ul className="mt-3 space-y-2 ps-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-4">
              <span className="text-ui-fg-muted shrink-0">&rsaquo;</span>
              <Text size="base" className="text-[15px]">{item}</Text>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
