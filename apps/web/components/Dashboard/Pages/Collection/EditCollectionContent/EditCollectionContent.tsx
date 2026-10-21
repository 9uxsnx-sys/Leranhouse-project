'use client'
import i18n from '@/lib/i18n'
import React, { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { ConceptIcon } from '@components/ui/icons'
import { IconButton } from '@components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/useDebounce'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  addResourceToCollection,
  removeResourceFromCollection,
} from '@services/courses/collections'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'

const ITEMS_PER_PAGE = 10

type EditCollectionContentProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function EditCollectionContent({ collection, onUpdated }: EditCollectionContentProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  const collectionUuid = collection?.collection_uuid

  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [isBulkWorking, setIsBulkWorking] = useState(false)
  const [kindFilter, setKindFilter] = useState<'' | 'course' | 'podcast'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'published' | 'draft'>('')

  const debouncedSearch = useDebounce(searchValue, 300)
  const isSearching = debouncedSearch.trim().length > 0

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [debouncedSearch, kindFilter, statusFilter])

  // Linked mode lists the collection members; searching switches the same
  // table to the organization resources that can still be added.
  const membersKey =
    collectionUuid && accessToken
      ? `${getAPIUrl()}collections/${collectionUuid}/members?filter=${
          isSearching ? 'available' : 'linked'
        }&search=${encodeURIComponent(debouncedSearch)}&kind=${kindFilter}&status=${statusFilter}&page=${page}&limit=${ITEMS_PER_PAGE}`
      : null

  const { data, error, isValidating, mutate } = useSWR(
    membersKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const rows: any[] = data?.items || []
  const total: number = data?.total || 0
  const isInitialLoading = !data && isValidating
  const isPageTransitioning = !!data && isValidating

  const refresh = useCallback(async () => {
    await mutate()
    await onUpdated()
  }, [mutate, onUpdated])

  const changePage = useCallback((nextPage: number) => {
    setPage(nextPage)
    setSelectedIds(new Set())
  }, [])

  const handleBulkAction = useCallback(async () => {
    const ids = Array.from(selectedIds).map(String)
    if (!collectionUuid || ids.length === 0 || isBulkWorking) return

    setIsBulkWorking(true)
    const toastId = toast.loading(
      isSearching
        ? t('collections.dashboard.content.adding')
        : t('collections.dashboard.content.removing')
    )

    let success = 0
    let failed = 0
    for (const resourceUuid of ids) {
      try {
        const res = isSearching
          ? await addResourceToCollection(collectionUuid, resourceUuid, accessToken)
          : await removeResourceFromCollection(collectionUuid, resourceUuid, accessToken)
        if (res.success) success += 1
        else failed += 1
      } catch {
        failed += 1
      }
    }

    setSelectedIds(new Set())
    await refresh()

    if (failed === 0) {
      toast.success(
        t(
          isSearching
            ? 'collections.dashboard.content.bulk_added_success'
            : 'collections.dashboard.content.bulk_removed_success',
          { count: success }
        ),
        { id: toastId }
      )
    } else {
      toast.error(
        t('collections.dashboard.content.bulk_partial', {
          success,
          error: failed,
        }),
        { id: toastId }
      )
    }
    setIsBulkWorking(false)
  }, [
    selectedIds,
    collectionUuid,
    isBulkWorking,
    isSearching,
    accessToken,
    refresh,
    t,
  ])

  const handleRemoveRow = useCallback(
    async (row: any) => {
      if (!collectionUuid || isBulkWorking) return
      setIsBulkWorking(true)
      const toastId = toast.loading(t('collections.dashboard.content.removing'))
      try {
        const res = await removeResourceFromCollection(
          collectionUuid,
          row.resource_uuid,
          accessToken
        )
        if (res.success) {
          await refresh()
          toast.success(
            t('collections.dashboard.content.bulk_removed_success', { count: 1 }),
            { id: toastId }
          )
        } else {
          toast.error(
            res.data?.detail || t('collections.dashboard.content.remove_error'),
            { id: toastId }
          )
        }
      } catch (err: any) {
        toast.error(
          err?.message || t('collections.dashboard.content.remove_error'),
          { id: toastId }
        )
      } finally {
        setIsBulkWorking(false)
      }
    },
    [collectionUuid, isBulkWorking, accessToken, refresh, t]
  )

  const hasActiveFilters = Boolean(kindFilter || statusFilter)

  const clearFilters = () => {
    setKindFilter('')
    setStatusFilter('')
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: t('collections.dashboard.content.item'),
      render: (row) => {
        const isPodcast = row.resource_type === 'podcast'
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            {isPodcast ? (
              <Headphones size={16} className="shrink-0 text-gray-400" />
            ) : (
              <BookOpen size={16} className="shrink-0 text-gray-400" />
            )}
            <span className="font-medium text-gray-900 truncate">{row.name}</span>
            {!row.published && (
              <span className="text-[11px] text-gray-400 shrink-0">
                {t('collections.dashboard.content.draft')}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'type',
      header: t('collections.dashboard.content.type'),
      width: '130px',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-gray-600">
          <span className="w-2.5 h-2.5 rounded bg-gray-300" />
          {row.resource_type === 'podcast'
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
      render: (row) =>
        row.access_type === 'paid' && row.price_amount ? (
          <span className="text-[13px] text-gray-600 tabular-nums">
            {row.price_amount.toLocaleString()}{' '}
            <span className="text-[11px] font-medium text-gray-400">
              {row.price_currency}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-gray-400">—</span>
        ),
    },
    {
      key: 'added',
      header: isSearching
        ? t('collections.dashboard.content.created')
        : t('collections.dashboard.content.added'),
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(row.creation_date)}
        </span>
      ),
    },
  ]

  if (!isSearching) {
    columns.push({
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
                aria-label={t('common.view_details')}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[150px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
              sideOffset={6}
            >
              <DropdownMenuItem
                onClick={() => handleRemoveRow(row)}
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
    })
  }

  const pagination = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">
        {t('dashboard.users.active_users.pagination.showing', {
          start: (page - 1) * ITEMS_PER_PAGE + 1,
          end: Math.min(page * ITEMS_PER_PAGE, total),
          total,
        })}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-xs text-gray-600 font-medium min-w-[64px] text-center">
          {t('dashboard.users.active_users.pagination.page', {
            current: page,
            total: Math.ceil(total / ITEMS_PER_PAGE),
          })}
        </span>
        <button
          onClick={() => changePage(page + 1)}
          disabled={page * ITEMS_PER_PAGE >= total}
          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Toolbar — same pattern as the Users tab and course Access tab */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('collections.dashboard.content.search_placeholder')}
            className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={handleBulkAction}
          disabled={isBulkWorking}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 ${
            isSearching ? 'text-gray-600' : 'text-red-600'
          } ${selectedIds.size === 0 ? 'invisible pointer-events-none' : ''}`}
        >
          {isBulkWorking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isSearching ? (
            <Plus size={14} />
          ) : (
            <Trash2 size={14} />
          )}
          {isSearching
            ? t('collections.dashboard.content.bulk_add', {
                count: selectedIds.size,
              })
            : t('collections.dashboard.content.bulk_remove', {
                count: selectedIds.size,
              })}
        </button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton
              size="small"
              variant="transparent"
              className="bg-white hover:bg-gray-50 shadow-borders-base relative"
              aria-label={t('collections.dashboard.content.filter')}
            >
              <ConceptIcon.filter size={14} />
              {hasActiveFilters && (
                <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[190px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
            sideOffset={6}
          >
            <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {t('collections.dashboard.content.filters.type')}
            </div>
            {[
              { value: '', label: t('collections.dashboard.content.filters.all_types') },
              { value: 'course', label: t('collections.dashboard.content.course') },
              { value: 'podcast', label: t('collections.dashboard.content.podcast') },
            ].map((option) => (
              <DropdownMenuItem
                key={`kind-${option.value}`}
                onClick={() => setKindFilter(option.value as '' | 'course' | 'podcast')}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {kindFilter === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {t('collections.dashboard.content.filters.status')}
            </div>
            {[
              { value: '', label: t('collections.dashboard.content.filters.all_statuses') },
              { value: 'published', label: t('collections.dashboard.content.filters.published') },
              { value: 'draft', label: t('collections.dashboard.content.filters.draft') },
            ].map((option) => (
              <DropdownMenuItem
                key={`status-${option.value}`}
                onClick={() =>
                  setStatusFilter(option.value as '' | 'published' | 'draft')
                }
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {statusFilter === option.value && (
                  <Check size={12} className="text-gray-500" />
                )}
              </DropdownMenuItem>
            ))}

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearFilters}
                  className="text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                >
                  <span className="text-xs font-medium text-red-600">
                    {t('collections.dashboard.content.filters.clear')}
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <TableCard>
          <EmptyState
            icon={Search}
            title={t('collections.dashboard.content.load_error')}
          />
        </TableCard>
      ) : isInitialLoading ? (
        <TableCard>
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        </TableCard>
      ) : rows.length === 0 ? (
        <TableCard>
          <EmptyState
            icon={isSearching ? Search : BookOpen}
            title={
              isSearching
                ? t('collections.dashboard.content.no_results')
                : t('collections.dashboard.content.no_courses')
            }
            description={
              isSearching
                ? undefined
                : t('collections.dashboard.content.linked_empty_description')
            }
          />
        </TableCard>
      ) : (
        <TableCard footer={total > ITEMS_PER_PAGE ? pagination : undefined}>
          <div className="relative">
            {isPageTransitioning && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
            <DataTable
              columns={columns}
              rows={rows}
              selectable
              getRowId={(row) => row.resource_uuid}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        </TableCard>
      )}
    </div>
  )
}

export default EditCollectionContent
