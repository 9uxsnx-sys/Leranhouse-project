'use client'

import React from 'react'
import { Podcast } from '@services/podcasts/podcasts'
import { useOrg } from '@components/Contexts/OrgContext'
import { getPodcastThumbnailMediaDirectory } from '@services/media/media'
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
  const org = useOrg() as any

  const thumbnailUrl = podcast.thumbnail_image && org
    ? getPodcastThumbnailMediaDirectory(org.org_uuid, podcast.podcast_uuid, podcast.thumbnail_image)
    : '/empty_thumbnail.png'

  return (
    <div className="space-y-4">
      {/* Container 1: Podcast Info — Card */}
      <div className="rounded-xl bg-white border border-black/10 overflow-hidden">
        {/* 1:1 square thumbnail */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={thumbnailUrl}
            alt={podcast.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Title + description */}
        <div className="px-5 pt-4 pb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {podcast.name}
          </h3>
          {podcast.description && (
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              {podcast.description}
            </p>
          )}
        </div>
      </div>

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
