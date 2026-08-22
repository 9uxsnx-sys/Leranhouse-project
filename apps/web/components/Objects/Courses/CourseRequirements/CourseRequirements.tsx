'use client'

import React from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

interface CourseRequirementsProps {
  title?: string
  subtitle?: string
  items?: string[]
}

const DEFAULT_ITEMS = [
  'A computer with a stable internet connection — any modern laptop or desktop works',
  'Figma installed (free tier is perfectly fine for the entire course)',
  'A willingness to practice regularly and experiment with new ideas',
  'No prior design experience is required — we will start from the basics',
]

export default function CourseRequirements({
  title = 'Requirements',
  subtitle = 'What you\u2019ll need before starting',
  items = DEFAULT_ITEMS,
}: CourseRequirementsProps) {
  return (
    <div>
      <Heading level="h1" className="!text-2xl mb-2">What requirements you need</Heading>
      <Text size="base" className="text-ui-fg-subtle leading-relaxed mb-4">
        Before you start this course, make sure you have the following tools and mindset ready. Everything listed here is free or already available on most computers.
      </Text>
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
        <div className="flex flex-col gap-0.5">
          <Heading level="h2">{title}</Heading>
          <Text size="base" className="text-ui-fg-muted">{subtitle}</Text>
        </div>
        <ul className="mt-3 space-y-2 pl-3">
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
