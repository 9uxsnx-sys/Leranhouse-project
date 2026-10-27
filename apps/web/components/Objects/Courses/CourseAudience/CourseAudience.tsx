'use client'

import React from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Check, X } from 'lucide-react'

interface CourseAudienceProps {
  forItems: string[]
  notForItems: string[]
}

export default function CourseAudience({ forItems, notForItems }: CourseAudienceProps) {
  if (forItems.length === 0 && notForItems.length === 0) return null

  return (
    <div>
      <Heading level="h1" className="!text-2xl mb-4">Who This Is For</Heading>
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
        <div className="flex flex-col gap-0.5">
          <Heading level="h2">This course is for you if&hellip;</Heading>
          <Text size="base" className="text-ui-fg-muted">You identify with any of these</Text>
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
            <div className="border-t border-gray-100 my-4" />
            <div className="flex flex-col gap-0.5">
              <Heading level="h2">This course is NOT for you if&hellip;</Heading>
              <Text size="base" className="text-ui-fg-muted">You might want to look elsewhere</Text>
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
