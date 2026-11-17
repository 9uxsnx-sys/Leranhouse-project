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
import {
  BookOpen,
  Headphones,
  Search,
  Loader2,
  Link2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { searchMatches } from '@/lib/search/normalize'
import { useDebounce } from '@/hooks/useDebounce'
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'

interface ResourceOption {
  uuid: string
  name: string
  description?: string | null
  published?: boolean
  access_type?: string | null
  price_amount?: number | null
  price_currency?: string | null
  creation_date?: string | null
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const CommunityEditCourse: React.FC = () => {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const community = useCommunity()?.community
  const accessToken = session?.data?.tokens?.access_token
  const locale = i18n.language || 'en'

  const [resourceType, setResourceType] = useState<'course' | 'podcast'>('course')
  const [courses, setCourses] = useState<ResourceOption[]>([])
  const [podcasts, setPodcasts] = useState<ResourceOption[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
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
            published: course.published,
            access_type: course.access_type,
            price_amount: course.price_amount,
            price_currency: course.price_currency,
            creation_date: course.creation_date,
          }))
        )
        setPodcasts(
          (podcastRows || []).map((podcast: any) => ({
            uuid: podcast.podcast_uuid,
            name: podcast.name,
            description: podcast.description,
            published: podcast.published,
            access_type: podcast.access_type,
            price_amount: podcast.price_amount,
            price_currency: podcast.price_currency,
            creation_date: podcast.creation_date,
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
        published: linkedResource.published,
        access_type: linkedResource.access_type,
        price_amount: linkedResource.price_amount,
        price_currency: linkedResource.price_currency,
        creation_date: linkedResource.creation_date,
      },
    ]
  }, [options, showSearchResults, debouncedSearch, linkedResource, linkedUuid])

  if (!community) return null

  const refreshCommunity = async () => {
    await revalidateTags(['communities'], org.slug)
    mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
    router.refresh()
  }

  const linkResource = async (uuid: string) => {
    setIsSubmitting(true)
    try {
      await linkCommunityToResource(
        community.community_uuid,
        resourceType,
        uuid,
        accessToken
      )
      await refreshCommunity()
      toast.success(t('dashboard.courses.communities.course.toasts.link_success'))
      setSelectedIds(new Set())
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
      setSelectedIds(new Set())
    } catch {
      toast.error(t('dashboard.courses.communities.course.toasts.unlink_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Linking is one resource at a time, so the checkbox behaves like a radio
  // while keeping the table's selection styling from the collection editor.
  const handleSelectionChange = (next: Set<string | number>) => {
    const picked = Array.from(next)
    setSelectedIds(new Set(picked.length ? [picked[picked.length - 1]] : []))
  }

  const handleBulkAction = () => {
    const [uuid] = Array.from(selectedIds)
    if (!uuid) return
    if (showSearchResults) linkResource(String(uuid))
    else handleUnlink()
  }

  const ResourceIcon = resourceType === 'course' ? BookOpen : Headphones

  const columns: Column<ResourceOption>[] = [
    {
      key: 'name',
      header: t('collections.dashboard.content.item'),
      render: (resource) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <ResourceIcon size={16} className="shrink-0 text-gray-400 dark:text-dk-fg-3" />
          <span className="font-medium text-gray-900 dark:text-dk-fg-1 truncate">
            {resource.name}
          </span>
          {resource.published === false && (
            <span className="text-[11px] text-gray-400 dark:text-dk-fg-4 shrink-0">
              {t('collections.dashboard.content.draft')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: t('collections.dashboard.content.type'),
      width: '130px',
      render: () => (
        <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-dk-fg-2">
          <span className="w-2.5 h-2.5 rounded bg-gray-300 dark:bg-dk-track" />
          {resourceType === 'podcast'
            ? t('collections.dashboard.content.podcast')
            : t('collections.dashboard.content.course')}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('collections.dashboard.content.price'),
      width: '140px',
      align: 'right',
      render: (resource) =>
        resource.access_type === 'paid' && resource.price_amount ? (
          <span className="text-[13px] text-gray-600 dark:text-dk-fg-2 tabular-nums">
            {resource.price_amount.toLocaleString(locale)}{' '}
            <span className="text-[11px] font-medium text-gray-400 dark:text-dk-fg-4">
              {resource.price_currency}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-gray-400 dark:text-dk-fg-4">—</span>
        ),
    },
    {
      key: 'added',
      header: showSearchResults
        ? t('collections.dashboard.content.created')
        : t('collections.dashboard.content.added'),
      width: '140px',
      align: 'right',
      render: (resource) => (
        <span className="text-[13px] text-gray-400 dark:text-dk-fg-4 whitespace-nowrap">
          {formatDate(resource.creation_date, locale)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (resource) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dk-raised text-gray-400 dark:text-dk-fg-3 hover:text-gray-600 dark:hover:text-dk-fg-1 transition-all"
                aria-label={t('common.view_details')}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[150px] rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-raised p-1 shadow-md"
              sideOffset={6}
            >
              {showSearchResults ? (
                <DropdownMenuItem
                  onClick={() => linkResource(resource.uuid)}
                  className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer text-gray-700 dark:text-dk-fg-2 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-dk-track focus:bg-gray-100 dark:focus:bg-dk-track"
                >
                  <Link2 size={14} />
                  <span className="text-xs">{t('common.add')}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleUnlink}
                  className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10"
                >
                  <Trash2 size={14} className="text-red-500" />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {t('collections.dashboard.content.remove')}
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Toolbar — same pattern as the collection content tab */}
      <div className="flex items-center gap-3 mb-5">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-dk-card">
          <button
            type="button"
            onClick={() => {
              setResourceType('course')
              setSelectedIds(new Set())
              setSearchQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              resourceType === 'course'
                ? 'bg-white dark:bg-dk-raised text-gray-900 dark:text-dk-fg-1 shadow-sm'
                : 'text-gray-500 dark:text-dk-fg-3 hover:text-gray-700 dark:hover:text-dk-fg-1'
            }`}
          >
            <BookOpen size={14} />
            {t('dashboard.courses.communities.course.tab_course')}
          </button>
          <button
            type="button"
            onClick={() => {
              setResourceType('podcast')
              setSelectedIds(new Set())
              setSearchQuery('')
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              resourceType === 'podcast'
                ? 'bg-white dark:bg-dk-raised text-gray-900 dark:text-dk-fg-1 shadow-sm'
                : 'text-gray-500 dark:text-dk-fg-3 hover:text-gray-700 dark:hover:text-dk-fg-1'
            }`}
          >
            <Headphones size={14} />
            {t('dashboard.courses.communities.course.tab_podcast')}
          </button>
        </div>

        <div className="relative w-80">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-dk-fg-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedIds(new Set())
            }}
            placeholder={
              resourceType === 'course'
                ? t('dashboard.courses.communities.course.search_courses')
                : t('dashboard.courses.communities.course.search_podcasts')
            }
            className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 dark:text-dk-fg-1 bg-white dark:bg-dk-card shadow-borders-base rounded-md placeholder:text-gray-500 dark:placeholder:text-dk-fg-4 focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={handleBulkAction}
          disabled={isSubmitting}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white dark:bg-dk-card border-gray-200 dark:border-dk-line hover:bg-gray-50 dark:hover:bg-dk-raised disabled:opacity-50 ${
            showSearchResults ? 'text-gray-600 dark:text-dk-fg-2' : 'text-red-600 dark:text-red-400'
          } ${selectedIds.size === 0 ? 'invisible pointer-events-none' : ''}`}
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : showSearchResults ? (
            <Plus size={14} />
          ) : (
            <Trash2 size={14} />
          )}
          {showSearchResults
            ? t('collections.dashboard.content.bulk_add', { count: selectedIds.size })
            : t('collections.dashboard.content.bulk_remove', { count: selectedIds.size })}
        </button>
      </div>

      {isLoadingResources ? (
        <TableCard>
          <div className="py-16 flex justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400 dark:text-dk-fg-3" />
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
            selectable
            getRowId={(row) => row.uuid}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            rowClassName={(resource) =>
              selectedIds.has(resource.uuid) ? 'bg-gray-50 dark:bg-dk-raised/60' : ''
            }
          />
        </TableCard>
      )}

      {!showSearchResults && linkedResource && (
        <p className="mt-4 text-xs text-gray-400 dark:text-dk-fg-4">
          {t('dashboard.courses.communities.course.unlink_hint')}
        </p>
      )}
    </div>
  )
}

export default CommunityEditCourse
