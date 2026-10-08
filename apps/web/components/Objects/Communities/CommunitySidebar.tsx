'use client'
import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  MessageCircle,
  Calendar,
  RefreshCw,
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
  const { t } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  // Fetch linked course if community has a course_id
  const { data: linkedCourse } = useSWR(
    community.course_id ? `${getAPIUrl()}courses/id/${community.course_id}` : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const createdDate = dayjs(community.creation_date).format('MMM D, YYYY')
  const updatedDate = community.update_date
    ? dayjs(community.update_date).format('MMM D, YYYY')
    : null

  return (
    <div className="space-y-4">

      {/* ── CARD 1: Linked Course / Linked Podcast ── */}
      {linkedCourse ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">Linked Course</h3>
          <p className="text-sm text-gray-500 mb-2 leading-snug">
            This community is linked to a course
          </p>
          <Link
            href={getUriWithOrg(orgslug, `/course/${linkedCourse.course_uuid.replace('course_', '')}`)}
          >
            <Button variant="primary" size="large" className="w-full">
              Go to Course
            </Button>
          </Link>
        </div>
      ) : null}

      {/* ── CARD 2: This Community Includes ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          This Community Includes
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              {discussionCount} {discussionCount === 1 ? 'discussion' : 'discussions'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              Created {createdDate}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Updates ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Updates</h3>
        <div className="flex items-center gap-3">
          <RefreshCw size={16} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">
            Last updated {updatedDate || 'N/A'}
          </span>
        </div>
      </div>

      {/* ── CARD 4: Community Guidelines ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
          {t('communities.community_guidelines')}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {t('communities.community_guidelines_text')}
        </p>
      </div>
    </div>
  )
}

export default CommunitySidebar
