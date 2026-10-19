'use client'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  BookCopy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { Button } from '@components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/useDebounce'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import {
  addCourseToCollection,
  getCollectionCourses,
  removeCourseFromCollection,
} from '@services/courses/collections'
import { getAPIUrl } from '@services/config/config'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { swrFetcher } from '@services/utils/ts/requests'
import { searchMatchesAny } from '@/lib/search/normalize'

const PAGE_SIZE = 20

type EditCollectionContentProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function accessLabel(accessType: string, t: any): string {
  switch (accessType) {
    case 'paid':
      return t('collections.dashboard.content.paid')
    case 'users_only':
      return t('collections.dashboard.content.private')
    default:
      return t('collections.dashboard.content.free')
  }
}

function EditCollectionContent({ collection, orgslug, onUpdated }: EditCollectionContentProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token

  const collectionUuid = collection?.collection_uuid
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [busyUuid, setBusyUuid] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const listKey =
    collectionUuid && accessToken
      ? `${getAPIUrl()}collections/${collectionUuid}/courses?search=${encodeURIComponent(
          debouncedSearch
        )}&page=${page}&limit=${PAGE_SIZE}`
      : null

  const { data: rows, isLoading, isValidating, mutate } = useSWR(
    listKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const courses: any[] = rows || []

  const orgCoursesKey =
    isPickerOpen && org?.id
      ? `${getAPIUrl()}courses/org_slug/${orgslug}/page/1/limit/500?include_unpublished=true`
      : null

  const { data: orgCourses } = useSWR(
    orgCoursesKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const memberUuids = useMemo(
    () => new Set((collection?.courses || []).map((course: any) => course.course_uuid)),
    [collection?.courses]
  )

  const availableCourses = useMemo(() => {
    const list: any[] = orgCourses || []
    const candidates = list.filter(
      (course: any) =>
        course.access_type !== 'users_only' && !memberUuids.has(course.course_uuid)
    )
    if (!pickerSearch.trim()) return candidates
    return candidates.filter((course: any) =>
      searchMatchesAny([course.name, course.description], pickerSearch)
    )
  }, [orgCourses, memberUuids, pickerSearch])

  const refresh = async () => {
    await mutate()
    await onUpdated()
  }

  const handleAdd = async (course: any) => {
    if (!collectionUuid || busyUuid) return
    setBusyUuid(course.course_uuid)
    try {
      const res = await addCourseToCollection(collectionUuid, course.course_uuid, accessToken)
      if (res.success === false) {
        toast.error(res.data?.detail || t('collections.dashboard.content.add_error'))
        return
      }
      await refresh()
      toast.success(t('collections.dashboard.content.added_success'))
    } catch (err: any) {
      toast.error(err?.message || t('collections.dashboard.content.add_error'))
    } finally {
      setBusyUuid(null)
    }
  }

  const handleRemove = async (course: any) => {
    if (!collectionUuid || busyUuid) return
    setBusyUuid(course.course_uuid)
    try {
      const res = await removeCourseFromCollection(
        collectionUuid,
        course.course_uuid,
        accessToken
      )
      if (res.success === false) {
        toast.error(res.data?.detail || t('collections.dashboard.content.remove_error'))
        return
      }
      await refresh()
      toast.success(t('collections.dashboard.content.removed_success'))
    } catch (err: any) {
      toast.error(err?.message || t('collections.dashboard.content.remove_error'))
    } finally {
      setBusyUuid(null)
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: t('collections.dashboard.content.course'),
      sortable: true,
      value: (row) => row.name || '',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-12 h-8 rounded-md bg-gray-100 overflow-hidden shrink-0">
            {row.thumbnail_image ? (
              <img
                src={getCourseThumbnailMediaDirectory(
                  org?.org_uuid,
                  row.course_uuid,
                  row.thumbnail_image
                )}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookCopy size={14} className="text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-900 truncate">{row.name}</span>
              {!row.published && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  {t('collections.dashboard.content.draft')}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'access',
      header: t('collections.dashboard.content.access'),
      width: '120px',
      render: (row) => (
        <span className="text-[13px] text-gray-600">{accessLabel(row.access_type, t)}</span>
      ),
    },
    {
      key: 'price',
      header: t('collections.dashboard.content.price'),
      width: '120px',
      render: (row) =>
        row.access_type === 'paid' && row.price_amount ? (
          <span className="text-[13px] text-gray-600">
            {row.price_amount.toLocaleString()} {row.price_currency}
          </span>
        ) : (
          <span className="text-[13px] text-gray-400">—</span>
        ),
    },
    {
      key: 'lessons',
      header: t('collections.dashboard.content.lessons'),
      width: '100px',
      align: 'right',
      sortable: true,
      value: (row) => row.lessons ?? 0,
      render: (row) => <span className="text-[13px] text-gray-600">{row.lessons ?? 0}</span>,
    },
    {
      key: 'added',
      header: t('collections.dashboard.content.added'),
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(row.creation_date)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                aria-label={t('collections.dashboard.actions')}
              >
                {busyUuid === row.course_uuid ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MoreHorizontal size={16} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[150px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
              sideOffset={6}
            >
              <DropdownMenuItem
                onClick={() => handleRemove(row)}
                className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-red-50 focus:bg-red-50"
              >
                <Trash2 size={14} className="text-red-500" />
                <span className="text-xs text-red-600">
                  {t('collections.dashboard.content.remove')}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('collections.dashboard.content.search_placeholder')}
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="small"
          className="gap-x-1.5"
          onClick={() => {
            setPickerSearch('')
            setIsPickerOpen(true)
          }}
        >
          <Plus size={14} />
          {t('collections.dashboard.content.add_course')}
        </Button>
      </div>

      {isLoading ? (
        <TableCard>
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        </TableCard>
      ) : courses.length === 0 ? (
        <TableCard>
          <EmptyState
            icon={BookCopy}
            title={
              debouncedSearch
                ? t('collections.dashboard.content.no_results')
                : t('collections.dashboard.content.no_courses')
            }
            description={
              debouncedSearch ? undefined : t('collections.dashboard.content.no_courses_description')
            }
            action={
              !debouncedSearch ? (
                <Button
                  variant="secondary"
                  size="small"
                  className="gap-x-1.5"
                  onClick={() => {
                    setPickerSearch('')
                    setIsPickerOpen(true)
                  }}
                >
                  <Plus size={14} />
                  {t('collections.dashboard.content.add_course')}
                </Button>
              ) : undefined
            }
          />
        </TableCard>
      ) : (
        <TableCard
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {t('collections.dashboard.content.course_count', { count: courses.length })}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-600 font-medium min-w-[64px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          }
        >
          <div className="relative">
            {isValidating && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
            <DataTable columns={columns} rows={courses} />
          </div>
        </TableCard>
      )}

      {/* Add course picker */}
      <Modal
        isDialogOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        minHeight="no-min"
        dialogTitle={t('collections.dashboard.content.add_course')}
        dialogDescription={t('collections.dashboard.content.picker_description')}
        dialogContent={
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder={t('collections.dashboard.content.search_placeholder')}
                className="w-full h-8 pl-8 pr-2 text-sm text-gray-700 border border-gray-300 rounded-lg placeholder:text-gray-500 focus:outline-none"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {availableCourses.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">
                  {t('collections.dashboard.content.no_available')}
                </p>
              ) : (
                availableCourses.map((course: any) => (
                  <div key={course.course_uuid} className="flex items-center gap-3 p-3">
                    <div className="w-12 h-8 rounded-md bg-gray-100 overflow-hidden shrink-0">
                      {course.thumbnail_image ? (
                        <img
                          src={getCourseThumbnailMediaDirectory(
                            org?.org_uuid,
                            course.course_uuid,
                            course.thumbnail_image
                          )}
                          alt={course.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookCopy size={14} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {course.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {accessLabel(course.access_type, t)}
                        {!course.published && ` · ${t('collections.dashboard.content.draft')}`}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleAdd(course)}
                      disabled={busyUuid === course.course_uuid}
                    >
                      {busyUuid === course.course_uuid ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      {t('collections.dashboard.content.add')}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        }
      />
    </div>
  )
}

export default EditCollectionContent
