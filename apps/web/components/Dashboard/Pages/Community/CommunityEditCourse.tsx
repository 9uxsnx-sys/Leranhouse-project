'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity } from '@components/Contexts/CommunityContext'
import {
  linkCommunityToResource,
  unlinkCommunityFromResource,
} from '@services/communities/communities'
import { getOrgCourses } from '@services/courses/courses'
import { getOrgPodcasts } from '@services/podcasts/podcasts'
import { revalidateTags, swrFetcher } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import useSWR from 'swr'
import { getAPIUrl } from '@services/config/config'
import { BookOpen, Headphones, Search, Loader2, Link2, Unlink } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchMatches } from '@/lib/search/normalize'
import { useDebounce } from '@/hooks/useDebounce'
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'

interface ResourceOption {
  uuid: string
  name: string
  description?: string | null
}

const CommunityEditCourse: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const community = useCommunity()?.community
  const accessToken = session?.data?.tokens?.access_token

  const [resourceType, setResourceType] = useState<'course' | 'podcast'>('course')
  const [courses, setCourses] = useState<ResourceOption[]>([])
  const [podcasts, setPodcasts] = useState<ResourceOption[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The community inherits its access from the linked resource, so show the
  // resolved parent instead of storing a display name on the row.
  const linkedType = community?.resource_type
  const linkedUuid = community?.resource_uuid

  useEffect(() => {
    if (community?.resource_type) setResourceType(community.resource_type)
  }, [community?.resource_type])

  useEffect(() => {
    const fetchResources = async () => {
      if (!org?.slug) return
      setIsLoadingResources(true)
      try {
        const [courseRows, podcastRows] = await Promise.all([
          getOrgCourses(org.slug, null, accessToken, true),
          getOrgPodcasts(org.slug, null, accessToken, true),
        ])
        setCourses(
          (courseRows || []).map((course: any) => ({
            uuid: course.course_uuid,
            name: course.name,
            description: course.description,
          }))
        )
        setPodcasts(
          (podcastRows || []).map((podcast: any) => ({
            uuid: podcast.podcast_uuid,
            name: podcast.name,
            description: podcast.description,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch linkable resources:', error)
      } finally {
        setIsLoadingResources(false)
      }
    }
    fetchResources()
  }, [org?.slug, accessToken])

  const { data: linkedResource } = useSWR(
    linkedType && linkedUuid
      ? `${getAPIUrl()}${linkedType === 'course' ? 'courses' : 'podcasts'}/${linkedUuid}`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const options = resourceType === 'course' ? courses : podcasts

  const showSearchResults = searchQuery.trim().length > 0
  const tableResources: ResourceOption[] = useMemo(() => {
    if (showSearchResults) {
      return options.filter(
        (option) =>
          searchMatches(option.name, debouncedSearch) ||
          (option.description && searchMatches(option.description, debouncedSearch))
      )
    }
    if (!linkedResource) return []
    return [
      {
        uuid: linkedUuid as string,
        name: linkedResource.name,
        description: linkedResource.description,
      },
    ]
  }, [options, showSearchResults, debouncedSearch, linkedResource, linkedUuid])

  if (!community) return null

  const refreshCommunity = async () => {
    await revalidateTags(['communities'], org.slug)
    mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
    router.refresh()
  }

  const handleLink = async () => {
    if (!selectedResource) return
    setIsSubmitting(true)
    try {
      await linkCommunityToResource(
        community.community_uuid,
        resourceType,
        selectedResource,
        accessToken
      )
      await refreshCommunity()
      toast.success(t('dashboard.courses.communities.course.toasts.link_success'))
      setSelectedResource(null)
      setSearchQuery('')
    } catch {
      toast.error(t('dashboard.courses.communities.course.toasts.link_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    setIsSubmitting(true)
    try {
      await unlinkCommunityFromResource(community.community_uuid, accessToken)
      await refreshCommunity()
      toast.success(t('dashboard.courses.communities.course.toasts.unlink_success'))
      setSelectedResource(null)
    } catch {
      toast.error(t('dashboard.courses.communities.course.toasts.unlink_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelect = (uuid: string) => {
    setSelectedResource((prev) => (prev === uuid ? null : uuid))
  }

  const ResourceIcon = resourceType === 'course' ? BookOpen : Headphones

  const columns: Column<ResourceOption>[] = [
    {
      key: 'state',
      header: '',
      width: '56px',
      render: (resource) => (
        <span
          className="flex items-center justify-center w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="flex items-center justify-center cursor-pointer w-4 h-4">
            <input
              type="checkbox"
              checked={selectedResource === resource.uuid}
              onChange={() => handleSelect(resource.uuid)}
              className="sr-only peer"
            />
            <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 text-white hidden peer-checked:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 6l3 3 5-6" />
              </svg>
            </div>
          </label>
        </span>
      ),
    },
    {
      key: 'name',
      header: t('dashboard.courses.communities.table.name'),
      width: '280px',
      sortable: true,
      value: (resource) => resource.name || '',
      render: (resource) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-[30px] h-[30px] shrink-0 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <ResourceIcon size={15} />
          </span>
          <span className="font-medium text-gray-900 truncate">{resource.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('dashboard.courses.communities.table.description'),
      render: (resource) => (
        <span className="text-gray-500 truncate">{resource.description || '—'}</span>
      ),
    },
  ]

  const isCurrentlyLinked = !showSearchResults && !!linkedResource

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {/* Course / Podcast switch */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100">
          <button
            type="button"
            onClick={() => {
              setResourceType('course')
              setSelectedResource(null)
              setSearchQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              resourceType === 'course'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={14} />
            {t('dashboard.courses.communities.course.tab_course')}
          </button>
          <button
            type="button"
            onClick={() => {
              setResourceType('podcast')
              setSelectedResource(null)
              setSearchQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              resourceType === 'podcast'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Headphones size={14} />
            {t('dashboard.courses.communities.course.tab_podcast')}
          </button>
        </div>

        <div className="relative w-72">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              resourceType === 'course'
                ? t('dashboard.courses.communities.course.search_courses')
                : t('dashboard.courses.communities.course.search_podcasts')
            }
            className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        {selectedResource && (
          <button
            onClick={showSearchResults ? handleLink : handleUnlink}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 ${
              showSearchResults ? 'text-gray-600' : 'text-red-600'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : showSearchResults ? (
              <Link2 size={14} />
            ) : (
              <Unlink size={14} />
            )}
            {showSearchResults ? t('common.add') : t('common.delete')}
          </button>
        )}
      </div>

      {community && !linkedResource && !showSearchResults && (
        <p className="mb-4 text-sm text-gray-500">
          {t('dashboard.courses.communities.course.no_resource_linked')}
        </p>
      )}

      {isLoadingResources ? (
        <TableCard>
          <div className="py-16 flex justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        </TableCard>
      ) : tableResources.length === 0 ? (
        <TableCard>
          <EmptyState
            icon={ResourceIcon}
            title={
              showSearchResults
                ? resourceType === 'course'
                  ? t('dashboard.courses.communities.course.no_courses')
                  : t('dashboard.courses.communities.course.no_podcasts')
                : t('dashboard.courses.communities.course.no_resource_linked')
            }
          />
        </TableCard>
      ) : (
        <TableCard>
          <DataTable
            columns={columns}
            rows={tableResources}
            onRowClick={(resource) => handleSelect(resource.uuid)}
            rowClassName={(resource) =>
              selectedResource === resource.uuid ? 'bg-gray-50' : ''
            }
          />
        </TableCard>
      )}

      {isCurrentlyLinked && (
        <p className="mt-4 text-xs text-gray-400">
          {t('dashboard.courses.communities.course.unlink_hint')}
        </p>
      )}
    </div>
  )
}

export default CommunityEditCourse
