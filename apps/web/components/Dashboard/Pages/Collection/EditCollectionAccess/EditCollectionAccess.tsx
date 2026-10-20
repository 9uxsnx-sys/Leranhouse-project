'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  GlobeLock,
  Info,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import UserAvatar from '@components/Objects/UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import {
  linkUsersToCollection,
  unlinkUsersFromCollection,
  updateCollection,
} from '@services/courses/collections'
import {
  grantResourceEntitlements,
  revokeResourceEntitlements,
} from '@services/payments/entitlements'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { linkResourcesToUserGroup, unLinkResourcesToUserGroup } from '@services/usergroups/usergroups'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { revalidateTags, swrFetcher } from '@services/utils/ts/requests'

type EditCollectionAccessProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

type AccessMode = 'public' | 'users_only' | 'paid'

const MODE_ORDER: AccessMode[] = ['public', 'users_only', 'paid']

const MODE_DOT: Record<AccessMode, string> = {
  public: 'bg-emerald-500',
  users_only: 'bg-amber-500',
  paid: 'bg-indigo-500',
}

const USERS_PER_PAGE = 10

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function EditCollectionAccess({ collection, orgslug, onUpdated }: EditCollectionAccessProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any

  const collectionUuid = collection?.collection_uuid
  const mode: AccessMode =
    (collection?.access_type as AccessMode) ||
    (collection?.public ? 'public' : 'users_only')
  const isPublished = collection?.published ?? false

  const [isSwitchingMode, setIsSwitchingMode] = useState(false)
  const [isSwitchingPublish, setIsSwitchingPublish] = useState(false)
  const [isBulkWorking, setIsBulkWorking] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string | number>>(new Set())
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string | number>>(new Set())
  const [detailUser, setDetailUser] = useState<any>(null)

  const debouncedSearch = useDebounce(searchValue, 300)
  const isSearching = debouncedSearch.trim().length > 0

  useEffect(() => {
    setPage(1)
    setSelectedUserIds(new Set())
    setSelectedGroupIds(new Set())
  }, [debouncedSearch, mode])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailUser(null)
    }
    if (detailUser) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [detailUser])

  const refreshAll = useCallback(async () => {
    await Promise.all([onUpdated(), revalidateTags(['collections'], orgslug)])
  }, [onUpdated, orgslug])

  // ── Users linked to the collection (Public / Paid modes) ─────────────────
  const accessQuery = `search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${USERS_PER_PAGE}`
  const accessKey =
    (mode === 'public' || mode === 'paid') && collectionUuid && org?.id && access_token
      ? mode === 'public'
        ? `${getAPIUrl()}collections/${collectionUuid}/access/users?filter=${
            isSearching ? 'available' : 'enrolled'
          }&${accessQuery}`
        : `${getAPIUrl()}payments/${org.id}/entitlements${
            isSearching ? '/candidates' : ''
          }?resource_uuid=${encodeURIComponent(collectionUuid)}&${accessQuery}`
      : null

  const {
    data: accessData,
    isValidating: accessValidating,
    error: accessError,
    mutate: mutateAccess,
  } = useSWR(accessKey, (url: string) => swrFetcher(url, access_token), {
    revalidateOnFocus: false,
  })

  const accessRows = accessData?.items || []
  const accessTotal = accessData?.total || 0
  const isInitialAccessLoading = !accessData && accessValidating
  const isAccessPageTransitioning = !!accessData && accessValidating

  // ── User groups (Private mode) ──────────────────────────────────────────
  const linkedKey =
    mode === 'users_only' && collectionUuid && org?.id
      ? `${getAPIUrl()}usergroups/resource/${collectionUuid}?org_id=${org.id}`
      : null

  const {
    data: linkedGroups,
    isValidating: linkedValidating,
    mutate: mutateLinkedGroups,
  } = useSWR(linkedKey, (url: string) => swrFetcher(url, access_token), {
    revalidateOnFocus: false,
  })

  const allGroupsKey =
    mode === 'users_only' && org?.id
      ? `${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}`
      : null

  const { data: allGroups } = useSWR(allGroupsKey, (url: string) => swrFetcher(url, access_token), {
    revalidateOnFocus: false,
  })

  const linkedIds = useMemo(
    () => new Set<number>((linkedGroups || []).map((group: any) => group.id)),
    [linkedGroups]
  )

  const groupRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return linkedGroups || []
    // Already linked groups are filtered out of the search results.
    return (allGroups || []).filter(
      (group: any) =>
        !linkedIds.has(group.id) &&
        ((group.name || '').toLowerCase().includes(query) ||
          (group.description || '').toLowerCase().includes(query))
    )
  }, [debouncedSearch, allGroups, linkedGroups, linkedIds])

  // ── Actions ─────────────────────────────────────────────────────────────
  const applyMode = useCallback(
    async (nextMode: AccessMode) => {
      if (!collectionUuid || isSwitchingMode) return
      setIsSwitchingMode(true)
      try {
        const res = await updateCollection(
          collectionUuid,
          { access_type: nextMode },
          access_token
        )
        if (res.success === false) {
          toast.error(res.data?.detail || t('dashboard.courses.access.mode_change_error'))
          return
        }
        setSearchValue('')
        await refreshAll()
        toast.success(t(`dashboard.courses.access.mode_changed.${nextMode}`))
      } catch (error: any) {
        toast.error(error?.message || t('dashboard.courses.access.mode_change_error'))
      } finally {
        setIsSwitchingMode(false)
      }
    },
    [collectionUuid, isSwitchingMode, access_token, refreshAll, t]
  )

  const cycleMode = useCallback(() => {
    if (!collectionUuid || isSwitchingMode) return

    const index = MODE_ORDER.indexOf(mode)
    const nextMode = MODE_ORDER[(index + 1) % MODE_ORDER.length]

    if (nextMode === 'paid' && !((collection?.price_amount || 0) > 0)) {
      // Paid is skipped until an offer price exists; price lives in Offers.
      toast.error(t('dashboard.courses.access.price_not_set'))
      applyMode(MODE_ORDER[(index + 2) % MODE_ORDER.length])
      return
    }

    applyMode(nextMode)
  }, [collectionUuid, isSwitchingMode, mode, collection?.price_amount, t, applyMode])

  const togglePublish = useCallback(async () => {
    if (!collectionUuid || isSwitchingPublish) return
    const nextPublished = !isPublished
    setIsSwitchingPublish(true)
    try {
      const res = await updateCollection(
        collectionUuid,
        { published: nextPublished },
        access_token
      )
      if (res.success === false) {
        toast.error(res.data?.detail || t('dashboard.courses.publish_error'))
        return
      }
      await refreshAll()
      toast.success(
        nextPublished
          ? t('dashboard.courses.published_success')
          : t('dashboard.courses.unpublished_success')
      )
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.courses.publish_error'))
    } finally {
      setIsSwitchingPublish(false)
    }
  }, [collectionUuid, isSwitchingPublish, isPublished, access_token, refreshAll, t])

  const applyUserSelection = useCallback(
    async (action: 'link' | 'unlink') => {
      if (!collectionUuid || !org?.id || selectedUserIds.size === 0 || isBulkWorking) return
      const ids = Array.from(selectedUserIds).map(Number)
      setIsBulkWorking(true)
      try {
        const res =
          mode === 'paid'
            ? action === 'link'
              ? await grantResourceEntitlements(org.id, collectionUuid, ids, access_token)
              : await revokeResourceEntitlements(org.id, collectionUuid, ids, access_token)
            : action === 'link'
              ? await linkUsersToCollection(collectionUuid, ids, access_token)
              : await unlinkUsersFromCollection(collectionUuid, ids, access_token)

        if (res.status === 200) {
          setSelectedUserIds(new Set())
          await mutateAccess()
          await refreshAll()
          toast.success(
            t(
              action === 'link'
                ? 'dashboard.courses.access.users.added'
                : 'dashboard.courses.access.users.removed',
              { count: ids.length }
            )
          )
        } else {
          toast.error(
            t(
              action === 'link'
                ? 'dashboard.courses.access.users.add_partial'
                : 'dashboard.courses.access.users.remove_partial'
            )
          )
        }
      } catch (error: any) {
        toast.error(
          error?.message ||
            t(
              action === 'link'
                ? 'dashboard.courses.access.users.add_error'
                : 'dashboard.courses.access.users.remove_error'
            )
        )
      } finally {
        setIsBulkWorking(false)
      }
    },
    [collectionUuid, org?.id, mode, selectedUserIds, isBulkWorking, access_token, mutateAccess, refreshAll, t]
  )

  const applyGroupSelection = useCallback(
    async (action: 'link' | 'unlink') => {
      if (!collectionUuid || !org?.id || selectedGroupIds.size === 0 || isBulkWorking) return
      const ids = Array.from(selectedGroupIds).map(Number)
      setIsBulkWorking(true)
      try {
        const results = await Promise.all(
          ids.map((groupId) =>
            action === 'link'
              ? linkResourcesToUserGroup(groupId, collectionUuid, org.id, access_token)
              : unLinkResourcesToUserGroup(groupId, collectionUuid, org.id, access_token)
          )
        )
        const allOk = results.every((res) => res.status === 200)
        await mutateLinkedGroups()
        await refreshAll()
        setSelectedGroupIds(new Set())
        if (allOk) {
          toast.success(
            t(
              action === 'link'
                ? 'dashboard.courses.access.groups.added'
                : 'dashboard.courses.access.groups.removed',
              { count: ids.length }
            )
          )
        } else {
          toast.error(
            t(
              action === 'link'
                ? 'dashboard.courses.access.groups.add_partial'
                : 'dashboard.courses.access.groups.remove_partial'
            )
          )
        }
      } catch (error: any) {
        toast.error(
          error?.message ||
            t(
              action === 'link'
                ? 'dashboard.courses.access.groups.link_error'
                : 'dashboard.courses.access.groups.unlink_error'
            )
        )
      } finally {
        setIsBulkWorking(false)
      }
    },
    [collectionUuid, org?.id, selectedGroupIds, isBulkWorking, access_token, mutateLinkedGroups, refreshAll, t]
  )

  const changePage = useCallback((nextPage: number) => {
    setPage(nextPage)
    setSelectedUserIds(new Set())
  }, [])

  const handleRemoveUserRow = useCallback(
    async (row: any) => {
      if (!collectionUuid || !org?.id || isBulkWorking || !row?.user?.id) return
      setIsBulkWorking(true)
      const toastId = toast.loading(t('dashboard.courses.access.users.removing'))
      try {
        const res =
          mode === 'paid'
            ? await revokeResourceEntitlements(org.id, collectionUuid, [row.user.id], access_token)
            : await unlinkUsersFromCollection(collectionUuid, [row.user.id], access_token)
        if (res.status === 200) {
          await mutateAccess()
          await refreshAll()
          toast.success(t('dashboard.courses.access.users.removed', { count: 1 }), { id: toastId })
        } else {
          toast.error(t('dashboard.courses.access.users.remove_error'), { id: toastId })
        }
      } catch {
        toast.error(t('dashboard.courses.access.users.remove_error'), { id: toastId })
      } finally {
        setIsBulkWorking(false)
      }
    },
    [collectionUuid, org?.id, mode, isBulkWorking, access_token, mutateAccess, refreshAll, t]
  )

  const handleRemoveGroupRow = useCallback(
    async (group: any) => {
      if (!collectionUuid || !org?.id || isBulkWorking || !group?.id) return
      setIsBulkWorking(true)
      const toastId = toast.loading(t('dashboard.courses.access.groups.removing'))
      try {
        const res = await unLinkResourcesToUserGroup(group.id, collectionUuid, org.id, access_token)
        if (res.status === 200) {
          await mutateLinkedGroups()
          await refreshAll()
          toast.success(t('dashboard.courses.access.groups.removed', { count: 1 }), { id: toastId })
        } else {
          toast.error(t('dashboard.courses.access.groups.unlink_error'), { id: toastId })
        }
      } catch {
        toast.error(t('dashboard.courses.access.groups.unlink_error'), { id: toastId })
      } finally {
        setIsBulkWorking(false)
      }
    },
    [collectionUuid, org?.id, isBulkWorking, access_token, mutateLinkedGroups, refreshAll, t]
  )

  if (!collection) return null

  const searchPlaceholder =
    mode === 'users_only'
      ? t('dashboard.courses.access.search_groups')
      : t('dashboard.courses.access.search_users')

  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: t('dashboard.courses.access.users.table.name'),
      sortable: true,
      value: (row) => `${row.user.first_name} ${row.user.last_name}`,
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar
            width={30}
            border="border-2"
            avatar_url={
              row.user.avatar_image
                ? getUserAvatarMediaDirectory(row.user.user_uuid, row.user.avatar_image)
                : ''
            }
            rounded="rounded-full"
            predefined_avatar={row.user.avatar_image === '' ? 'empty' : undefined}
          />
          <span className="font-medium text-gray-900 truncate">
            {row.user.first_name} {row.user.last_name}
          </span>
        </div>
      ),
    },
    {
      key: 'username',
      header: t('dashboard.courses.access.users.table.username'),
      width: '170px',
      render: (row) => <span className="text-gray-500">@{row.user.username}</span>,
    },
    {
      key: 'email',
      header: t('dashboard.courses.access.users.table.email'),
      width: '240px',
      render: (row) => <span className="text-gray-500 truncate">{row.user.email}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      width: '140px',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded ${row.user.email_verified ? 'bg-green-500' : 'bg-red-500'}`} />
          {row.user.email_verified
            ? t('dashboard.users.users.status.verified')
            : t('dashboard.users.users.status.unverified')}
        </span>
      ),
    },
    {
      key: 'joined',
      header: isSearching
        ? t('dashboard.courses.access.users.table.joined')
        : t('dashboard.courses.access.users.table.enrolled'),
      width: '140px',
      align: 'right',
      sortable: true,
      value: (row) => row.enrolled_at || row.joined_at || '',
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(isSearching ? row.joined_at : row.enrolled_at)}
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
                onClick={() => setDetailUser(row)}
                className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <Info size={14} className="text-gray-400" />
                <span className="text-gray-700 text-xs">
                  {t('dashboard.courses.access.details')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRemoveUserRow(row)}
                className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-red-50 focus:bg-red-50"
              >
                <Trash2 size={14} className="text-red-500" />
                <span className="text-xs text-red-600">
                  {t('dashboard.courses.access.delete')}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  const groupColumns: Column<any>[] = [
    {
      key: 'name',
      header: t('dashboard.courses.access.groups.table.name'),
      width: '280px',
      sortable: true,
      value: (group) => group.name || '',
      render: (group) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Users size={16} className="shrink-0 text-gray-400" />
          <span className="font-medium text-gray-900 truncate">{group.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('dashboard.courses.access.groups.table.description'),
      render: (group) => (
        <span className="text-gray-500 truncate">{group.description || '—'}</span>
      ),
    },
    {
      key: 'members',
      header: t('dashboard.courses.access.groups.table.members'),
      width: '120px',
      sortable: true,
      value: (group) => group.members_count ?? 0,
      render: (group) => (
        <span className="inline-flex items-center gap-1.5 text-gray-500">
          <Users size={14} className="text-gray-400" />
          {group.members_count ?? 0}
        </span>
      ),
    },
    {
      key: 'added',
      header: t('dashboard.courses.access.groups.table.added'),
      width: '140px',
      align: 'right',
      sortable: true,
      value: (group) => group.linked_at || '',
      render: (group) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(group.linked_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (group) => (
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
                onClick={() => handleRemoveGroupRow(group)}
                className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-red-50 focus:bg-red-50"
              >
                <Trash2 size={14} className="text-red-500" />
                <span className="text-xs text-red-600">
                  {t('dashboard.courses.access.delete')}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  const pagination = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">
        {t('dashboard.users.active_users.pagination.showing', {
          start: (page - 1) * USERS_PER_PAGE + 1,
          end: Math.min(page * USERS_PER_PAGE, accessTotal),
          total: accessTotal,
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
            total: Math.ceil(accessTotal / USERS_PER_PAGE),
          })}
        </span>
        <button
          onClick={() => changePage(page + 1)}
          disabled={page * USERS_PER_PAGE >= accessTotal}
          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )

  const selectedCount =
    mode === 'users_only' ? selectedGroupIds.size : selectedUserIds.size

  const handleToolbarAction = () => {
    if (mode === 'users_only') {
      applyGroupSelection(isSearching ? 'link' : 'unlink')
    } else {
      applyUserSelection(isSearching ? 'link' : 'unlink')
    }
  }

  return (
    <div>
      {/* ── TOOLBAR ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={handleToolbarAction}
          disabled={isBulkWorking}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 ${
            isSearching ? 'text-gray-600' : 'text-red-600'
          } ${selectedCount === 0 ? 'invisible pointer-events-none' : ''}`}
        >
          {isBulkWorking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isSearching ? (
            <UserPlus size={14} />
          ) : (
            <UserMinus size={14} />
          )}
          {isSearching
            ? t(
                  mode === 'users_only'
                      ? 'dashboard.courses.access.groups.add_count'
                      : 'dashboard.courses.access.users.add_count',
                  { count: selectedCount }
              )
            : t(
                  mode === 'users_only'
                      ? 'dashboard.courses.access.groups.remove_count'
                      : 'dashboard.courses.access.users.remove_count',
                  { count: selectedCount }
              )}
        </button>

        <button
          onClick={cycleMode}
          disabled={isSwitchingMode}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {isSwitchingMode ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <span className={`w-2.5 h-2.5 rounded ${MODE_DOT[mode]}`} />
          )}
          <span>{t(`dashboard.courses.access.modes.${mode}`)}</span>
        </button>

        <button
          onClick={togglePublish}
          disabled={isSwitchingPublish}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {isSwitchingPublish ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isPublished ? (
            <Globe size={14} />
          ) : (
            <GlobeLock size={14} />
          )}
          <span>
            {isPublished
              ? t('dashboard.courses.published')
              : t('dashboard.courses.unpublished')}
          </span>
        </button>
      </div>

      {/* ── PUBLIC / PAID MODE: learners linked to the collection ── */}
      {(mode === 'public' || mode === 'paid') && (
        accessError ? (
          <TableCard>
            <EmptyState
              icon={mode === 'paid' ? CreditCard : Users}
              title={
                accessError?.status === 403
                  ? t('dashboard.courses.access.users.forbidden')
                  : t('dashboard.courses.access.users.load_error')
              }
            />
          </TableCard>
        ) : isInitialAccessLoading ? (
          <TableCard>
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          </TableCard>
        ) : accessRows.length === 0 ? (
          <TableCard>
            <EmptyState
              icon={mode === 'paid' ? CreditCard : Users}
              title={
                isSearching
                  ? t('dashboard.courses.access.users.no_results')
                  : mode === 'paid'
                    ? t('dashboard.courses.access.paid.no_access')
                    : t('dashboard.courses.access.users.no_enrolled')
              }
            />
          </TableCard>
        ) : (
          <TableCard footer={accessTotal > USERS_PER_PAGE ? pagination : undefined}>
            <div className="relative">
              {isAccessPageTransitioning && (
                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
              <DataTable
                columns={userColumns}
                rows={accessRows}
                selectable
                getRowId={(row) => row.user.id}
                selectedIds={selectedUserIds}
                onSelectionChange={setSelectedUserIds}
              />
            </div>
          </TableCard>
        )
      )}

      {/* ── PRIVATE MODE: user groups linked to this collection ── */}
      {mode === 'users_only' && (
        linkedValidating && !linkedGroups ? (
          <TableCard>
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          </TableCard>
        ) : groupRows.length === 0 ? (
          <TableCard>
            {isSearching ? (
              <EmptyState
                icon={Users}
                title={t('dashboard.courses.access.groups.no_results')}
              />
            ) : (allGroups || []).length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('dashboard.courses.access.groups.no_groups')}
                action={
                  <Link
                    href={getUriWithOrg(org?.slug, '') + '/dash/users/settings/usergroups'}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    {t('dashboard.courses.access.groups.create_group')}
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={Users}
                title={t('dashboard.courses.access.groups.no_linked')}
                description={t('dashboard.courses.access.groups.no_linked_description')}
              />
            )}
          </TableCard>
        ) : (
          <TableCard>
            <DataTable
              columns={groupColumns}
              rows={groupRows}
              selectable
              getRowId={(group) => group.id}
              selectedIds={selectedGroupIds}
              onSelectionChange={setSelectedGroupIds}
            />
          </TableCard>
        )
      )}

      {/* ── USER DETAILS PANEL ── */}
      {detailUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setDetailUser(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-[340px] rounded-xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end pt-3 pr-3">
                <button
                  onClick={() => setDetailUser(null)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center px-6 pb-4">
                <UserAvatar
                  width={52}
                  border="border-2"
                  avatar_url={
                    detailUser.user.avatar_image
                      ? getUserAvatarMediaDirectory(
                          detailUser.user.user_uuid,
                          detailUser.user.avatar_image
                        )
                      : ''
                  }
                  rounded="rounded-full"
                  predefined_avatar={detailUser.user.avatar_image === '' ? 'empty' : undefined}
                />
                <span className="mt-3 text-base font-semibold text-gray-800">
                  {detailUser.user.first_name} {detailUser.user.last_name}
                </span>
                <span className="text-xs text-gray-400">
                  @{detailUser.user.username}
                </span>
                <span className="text-sm text-gray-500 mt-0.5">
                  {detailUser.user.email}
                </span>
              </div>

              <div className="border-t border-gray-100" />

              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {t('dashboard.users.active_users.table.role')}
                  </span>
                  <span className="text-sm text-gray-700">
                    {detailUser.role?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{t('common.status')}</span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-700">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        detailUser.user.email_verified ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                    />
                    {detailUser.user.email_verified
                      ? t('dashboard.users.users.status.verified')
                      : t('dashboard.users.users.status.unverified')}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {t('dashboard.courses.access.users.table.enrolled')}
                  </span>
                  <span className="text-sm text-gray-700">
                    {formatDate(detailUser.enrolled_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {t('dashboard.users.users.table.joined')}
                  </span>
                  <span className="text-sm text-gray-700">
                    {formatDate(detailUser.joined_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {t('dashboard.users.users.table.last_login')}
                  </span>
                  <span className="text-sm text-gray-700">
                    {formatDate(detailUser.user.last_login_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EditCollectionAccess
