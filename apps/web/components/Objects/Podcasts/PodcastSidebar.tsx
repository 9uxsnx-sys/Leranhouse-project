'use client'

import React from 'react'
import { Podcast } from '@services/podcasts/podcasts'
import { Mic } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

interface PodcastSidebarProps {
  podcast: Podcast
}

const MOCK_UPDATES = [
  { title: 'New episode added', description: 'Latest episode now available for streaming', date: 'Sep 2026' },
  { title: 'Podcast launched', description: 'Initial release with first set of episodes', date: 'Aug 2026' },
]

export function PodcastSidebar({ podcast }: PodcastSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Container 1: Podcast Info */}
      <Container className="pt-6 pb-6">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-gray-900 shrink-0" />
          <p className="text-base font-semibold text-gray-900">{podcast.name}</p>
        </div>
        {podcast.description && (
          <p className="text-sm text-gray-500 mt-2">
            {podcast.description}
          </p>
        )}
      </Container>

      {/* Container 3: Updates */}
      <Container className="pt-6 pb-6">
        <Heading level="h3">Updates</Heading>
        <div className="mt-4">
          <div className="relative pl-5 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-gray-300 space-y-4">
            {MOCK_UPDATES.map((update, idx) => (
              <div key={idx} className="relative">
                <Text weight="plus" size="small">{update.title}</Text>
                <Text size="xsmall" className="text-ui-fg-muted mt-0.5 leading-snug">{update.description}</Text>
                <Text size="xsmall" className="text-ui-fg-disabled mt-0.5 block">{update.date}</Text>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}
