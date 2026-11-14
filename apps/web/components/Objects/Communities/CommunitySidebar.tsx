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

  // Fetch linked course if community has a course_id
  const { data: linkedCourse } = useSWR(
    community.course_id ? `${getAPIUrl()}courses/id/${community.course_id}` : null,
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

      {/* ── CARD 1: Linked Course / Linked Podcast ── */}
      {linkedCourse ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('communities.linked_course')}
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
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
      ) : null}

      {/* ── CARD 2: This Community Includes ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('communities.sidebar_includes')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              {memberCount}{' '}
              {memberCount === 1 ? t('communities.member') : t('communities.members')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              {discussionCount}{' '}
              {discussionCount === 1 ? t('communities.discussion') : t('communities.discussions')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              {t('communities.created_on', { date: createdDate })}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Updates ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('communities.updates')}
        </h3>
        <div className="flex items-center gap-3">
          <RefreshCw size={16} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">
            {t('communities.last_updated', { date: updatedDate })}
          </span>
        </div>
      </div>

      {/* ── CARD 4: Community Guidelines ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('communities.community_guidelines')}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('communities.community_guidelines_text')}
        </p>
      </div>
    </div>
  )
}

export default CommunitySidebar
