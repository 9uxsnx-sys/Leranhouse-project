'use client'
import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity } from '@components/Contexts/CommunityContext'
import { swrFetcher } from '@services/utils/ts/requests'
import useSWR from 'swr'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { BookOpen, Headphones, Info, ExternalLink } from 'lucide-react'

const CommunityEditAccess: React.FC = () => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const community = useCommunity()?.community
  const accessToken = session?.data?.tokens?.access_token

  // Access is not configured per community: it is always inherited from the
  // course or podcast the community is attached to.
  const linkedType = community?.resource_type
  const linkedUuid = community?.resource_uuid

  const { data: linkedResource } = useSWR(
    linkedType && linkedUuid
      ? `${getAPIUrl()}${linkedType === 'course' ? 'courses' : 'podcasts'}/${linkedUuid}`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  if (!community) return null

  if (!linkedType || !linkedUuid) {
    return (
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-dk-fg-1">
              {t('communities.access_inherited_title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dk-fg-3">
              {t('communities.access_inherited_no_parent')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isCourse = linkedType === 'course'
  const bareUuid = linkedUuid.replace(isCourse ? 'course_' : 'podcast_', '')
  const settingsHref = getUriWithOrg(
    org?.slug,
    '',
  ) + (isCourse
    ? `/dash/courses/course/${bareUuid}/access`
    : `/dash/podcasts/podcast/${bareUuid}/access`)

  const ResourceIcon = isCourse ? BookOpen : Headphones

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-4">
          {t('communities.linked_resource')}
        </h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-dk-raised text-gray-500 dark:text-dk-fg-3 flex items-center justify-center shrink-0">
              <ResourceIcon size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-dk-fg-1 truncate">
                {linkedResource?.name || t('communities.not_available')}
              </p>
              <p className="text-xs text-gray-400 dark:text-dk-fg-4">
                {isCourse ? t('communities.linked_course') : t('communities.linked_podcast')}
              </p>
            </div>
          </div>
          <Link
            href={settingsHref}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-card text-gray-600 dark:text-dk-fg-2 hover:bg-gray-50 dark:hover:bg-dk-raised transition-colors shrink-0"
          >
            <ExternalLink size={14} />
            {t('communities.manage_parent_access')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CommunityEditAccess
