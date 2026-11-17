'use client'
import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  MessageCircle,
  Calendar,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Community } from '@services/communities/communities'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import useSWR from 'swr'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'

interface CommunitySidebarProps {
  community: Community
  discussionCount: number
  orgslug: string
}

export function CommunitySidebar({
  community,
  discussionCount,
  orgslug,
}: CommunitySidebarProps) {
  const { t, i18n } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  // A community inherits its access and context from the linked resource, so
  // resolve the course or podcast it belongs to.
  const { data: linkedCourse } = useSWR(
    community.resource_type === 'course' && community.resource_uuid
      ? `${getAPIUrl()}courses/${community.resource_uuid}`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )
  const { data: linkedPodcast } = useSWR(
    community.resource_type === 'podcast' && community.resource_uuid
      ? `${getAPIUrl()}podcasts/${community.resource_uuid}`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  // Fetch member count
  const { data: memberData } = useSWR(
    `${getAPIUrl()}communities/${community.community_uuid}/member-count`,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const memberCount = (memberData as { member_count?: number })?.member_count ?? 0

  // Dates follow the interface language rather than a hardcoded English month.
  const formatDate = (value?: string | null) => {
    if (!value) return t('communities.not_available')
    const parsed = dayjs(value)
    if (!parsed.isValid()) return t('communities.not_available')
    return new Intl.DateTimeFormat(i18n.language || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(parsed.toDate())
  }

  const createdDate = formatDate(community.creation_date)
  const updatedDate = formatDate(community.update_date)

  return (
    <div className="space-y-4">

      {/* ── CARD 1: Linked course or podcast ── */}
      {linkedCourse ? (
        <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
            {t('communities.linked_course')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-dk-fg-2 mb-4 leading-relaxed">
            {t('communities.linked_course_description')}
          </p>
          <Link
            href={getUriWithOrg(orgslug, `/course/${linkedCourse.course_uuid.replace('course_', '')}`)}
          >
            <Button variant="primary" size="large" className="w-full">
              {t('communities.go_to_course')}
            </Button>
          </Link>
        </div>
      ) : linkedPodcast ? (
        <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
            {t('communities.linked_podcast')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-dk-fg-2 mb-4 leading-relaxed">
            {t('communities.linked_podcast_description')}
          </p>
          <Link
            href={getUriWithOrg(orgslug, `/podcast/${linkedPodcast.podcast_uuid.replace('podcast_', '')}`)}
          >
            <Button variant="primary" size="large" className="w-full">
              {t('communities.go_to_podcast')}
            </Button>
          </Link>
        </div>
      ) : null}

      {/* ── CARD 2: This Community Includes ── */}
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
          {t('communities.sidebar_includes')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users size={16} className="text-gray-400 dark:text-dk-fg-3 shrink-0" />
            <span className="text-sm text-gray-600 dark:text-dk-fg-2">
              {memberCount}{' '}
              {memberCount === 1 ? t('communities.member') : t('communities.members')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-gray-400 dark:text-dk-fg-3 shrink-0" />
            <span className="text-sm text-gray-600 dark:text-dk-fg-2">
              {discussionCount}{' '}
              {discussionCount === 1 ? t('communities.discussion') : t('communities.discussions')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400 dark:text-dk-fg-3 shrink-0" />
            <span className="text-sm text-gray-600 dark:text-dk-fg-2">
              {t('communities.created_on', { date: createdDate })}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Updates ── */}
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
          {t('communities.updates')}
        </h3>
        <div className="flex items-center gap-3">
          <RefreshCw size={16} className="text-gray-400 dark:text-dk-fg-3 shrink-0" />
          <span className="text-sm text-gray-600 dark:text-dk-fg-2">
            {t('communities.last_updated', { date: updatedDate })}
          </span>
        </div>
      </div>

      {/* ── CARD 4: Community Guidelines ── */}
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
          {t('communities.community_guidelines')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-dk-fg-2 leading-relaxed">
          {t('communities.community_guidelines_text')}
        </p>
      </div>
    </div>
  )
}

export default CommunitySidebar
