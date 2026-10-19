'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  CreditCard,
  Globe,
  GlobeLock,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'

import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import UserAvatar from '@components/Objects/UserAvatar'
import { Button } from '@components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { updateCollection } from '@services/courses/collections'
import {
  grantResourceEntitlements,
  revokeResourceEntitlements,
} from '@services/payments/entitlements'
import {
  linkResourcesToUserGroup,
  unLinkResourcesToUserGroup,
} from '@services/usergroups/usergroups'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { getAPIUrl } from '@services/config/config'
import { revalidateTags, swrFetcher } from '@services/utils/ts/requests'

const PAGE_SIZE = 10

const MODE_DOT: Record<string, string> = {
  public: 'bg-emerald-500',
  users_only: 'bg-amber-500',
  paid: 'bg-indigo-500',
}

type EditCollectionAccessProps = {
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

function EditCollectionAccess({ collection, orgslug, onUpdated }: EditCollectionAccessProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token

  const collectionUuid = collection?.collection_uuid
  const storedMode: string = collection?.access_type || 'public'
  const isPublished = collection?.published ?? false

  // Selecting Paid without a price first reveals the price card; the mode is
  // only persisted once a positive price is saved (the API rejects paid with
  // no price).
  const [pendingPaid, setPendingPaid] = useState(false)
  const mode = pendingPaid ? 'paid' : storedMode

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isWorking, setIsWorking] = useState(false)
  const [priceValue, setPriceValue] = useState<string>(
    collection?.price_amount ? String(collection.price_amount) : ''
  )

  const debouncedSearch = useDebounce(search, 300)
  const isSearching = debouncedSearch.trim().length > 0

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, mode])

  useEffect(() => {
    setPriceValue(collection?.price_amount ? String(collection.price_amount) : '')
  }, [collection?.price_amount])

  // ── Paid roster ──────────────────────────────────────────────────────────
  const entitlementKey =
    mode === 'paid' && collectionUuid && org?.id && accessToken
      ? `${getAPIUrl()}payments/${org.id}/entitlements${
          isSearching ? '/candidates' : ''
        }?resource_uuid=${encodeURIComponent(collectionUuid)}&search=${encodeURIComponent(
          debouncedSearch
        )}&page=${page}&limit=${PAGE_SIZE}`
      : null

  const {
    data: entitlementData,
    isLoading: entitlementLoading,
    mutate: mutateEntitlements,
  } = useSWR(entitlementKey, (url: string) => swrFetcher(url, accessToken), {
    revalidateOnFocus: false,
  })

  // ── User groups ──────────────────────────────────────────────────────────
  const linkedGroupsKey =
    mode === 'users_only' && collectionUuid && org?.id
      ? `${getAPIUrl()}usergroups/resource/${collectionUuid}?org_id=${org.id}`
      : null

  const { data: linkedGroups, mutate: mutateLinkedGroups } = useSWR(
    linkedGroupsKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const allGroupsKey =
    mode === 'users_only' && org?.id
      ? `${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}`
      : null

  const { data: allGroups } = useSWR(
    allGroupsKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const linkedIds = useMemo(
    () => new Set<number>((linkedGroups || []).map((group: any) => group.id)),
    [linkedGroups]
  )

  const groupRows = useMemo(() => {
    if (!isSearching) return linkedGroups || []
    const query = debouncedSearch.trim().toLowerCase()
    return (allGroups || []).filter(
      (group: any) =>
        !linkedIds.has(group.id) &&
        ((group.name || '').toLowerCase().includes(query) ||
          (group.description || '').toLowerCase().includes(query))
    )
  }, [isSearching, debouncedSearch, allGroups, linkedGroups, linkedIds])

  const refreshAll = useCallback(async () => {
    await Promise.all([onUpdated(), revalidateTags(['collections'], orgslug)])
  }, [onUpdated, orgslug])

  const applyMode = useCallback(
    async (nextMode: string) => {
      if (!collectionUuid || isWorking || nextMode === mode) return

      if (nextMode === 'paid' && !((collection?.price_amount || 0) > 0)) {
        // No price yet — surface the price editor instead of calling the API.
        setPendingPaid(true)
        setSearch('')
        return
      }

      setPendingPaid(false)
      setIsWorking(true)
      try {
        const res = await updateCollection(collectionUuid, { access_type: nextMode }, accessToken)
        if (res.success === false) {
          toast.error(res.data?.detail || t('collections.dashboard.access.mode_error'))
          return
        }
        setSearch('')
        await refreshAll()
        toast.success(t(`collections.dashboard.access.modes.${nextMode}`))
      } finally {
        setIsWorking(false)
      }
    },
    [collectionUuid, isWorking, mode, collection?.price_amount, accessToken, refreshAll, t]
  )

  const savePrice = useCallback(async () => {
    if (!collectionUuid || isWorking) return
    const amount = Number.parseInt(priceValue, 10)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('collections.dashboard.access.price_required'))
      return
    }
    setIsWorking(true)
    try {
      const res = await updateCollection(
        collectionUuid,
        { access_type: 'paid', price_amount: amount },
        accessToken
      )
      if (res.success === false) {
        toast.error(res.data?.detail || t('collections.dashboard.access.price_error'))
        return
      }
      setPendingPaid(false)
      await refreshAll()
      toast.success(t('collections.dashboard.access.price_saved'))
    } finally {
      setIsWorking(false)
    }
  }, [collectionUuid, isWorking, priceValue, accessToken, refreshAll, t])

  const togglePublish = useCallback(async () => {
    if (!collectionUuid || isWorking) return
    setIsWorking(true)
    const next = !isPublished
    try {
      const res = await updateCollection(collectionUuid, { published: next }, accessToken)
      if (res.success === false) {
        toast.error(res.data?.detail || t('dashboard.courses.publish_error'))
        return
      }
      await refreshAll()
      toast.success(
        next ? t('dashboard.courses.published_success') : t('dashboard.courses.unpublished_success')
      )
    } finally {
      setIsWorking(false)
    }
  }, [collectionUuid, isWorking, isPublished, accessToken, refreshAll, t])

  const grantUser = useCallback(
    async (userId: number) => {
      if (!collectionUuid || !org?.id || isWorking) return
      setIsWorking(true)
      try {
        const res = await grantResourceEntitlements(
          org.id,
          collectionUuid,
          [userId],
          accessToken
        )
        if (res.status === 200) {
          await mutateEntitlements()
          await onUpdated()
          toast.success(t('collections.dashboard.access.user_added'))
        } else {
          toast.error(t('collections.dashboard.access.user_error'))
        }
      } finally {
        setIsWorking(false)
      }
    },
    [collectionUuid, org?.id, isWorking, accessToken, mutateEntitlements, onUpdated, t]
  )

  const revokeUser = useCallback(
    async (userId: number) => {
      if (!collectionUuid || !org?.id || isWorking) return
      setIsWorking(true)
      try {
        const res = await revokeResourceEntitlements(
          org.id,
          collectionUuid,
          [userId],
          accessToken
        )
        if (res.status === 200) {
          await mutateEntitlements()
          await onUpdated()
          toast.success(t('collections.dashboard.access.user_removed'))
        } else {
          toast.error(t('collections.dashboard.access.user_error'))
        }
      } finally {
        setIsWorking(false)
      }
    },
    [collectionUuid, org?.id, isWorking, accessToken, mutateEntitlements, onUpdated, t]
  )

  const toggleGroup = useCallback(
    async (groupId: number, isLinked: boolean) => {
      if (!collectionUuid || !org?.id || isWorking) return
      setIsWorking(true)
      try {
        const res = isLinked
          ? await unLinkResourcesToUserGroup(groupId, collectionUuid, org.id, accessToken)
          : await linkResourcesToUserGroup(groupId, collectionUuid, org.id, accessToken)
        if (res.status === 200) {
          await mutateLinkedGroups()
          await onUpdated()
          toast.success(
            isLinked
              ? t('collections.dashboard.access.group_removed')
              : t('collections.dashboard.access.group_added')
          )
        } else {
          toast.error(t('collections.dashboard.access.group_error'))
        }
      } finally {
        setIsWorking(false)
      }
    },
    [collectionUuid, org?.id, isWorking, accessToken, mutateLinkedGroups, onUpdated, t]
  )

  const userRows = entitlementData?.items || []
  const total = entitlementData?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: t('collections.dashboard.access.user'),
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
      key: 'email',
      header: t('collections.dashboard.access.email'),
      width: '240px',
      render: (row) => <span className="text-gray-500 truncate">{row.user.email}</span>,
    },
    {
      key: 'granted',
      header: t('collections.dashboard.access.granted'),
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(row.enrolled_at || row.joined_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (row) =>
        isSearching ? (
          <Button
            variant="secondary"
            size="small"
            onClick={() => grantUser(row.user.id)}
            disabled={isWorking}
          >
            <Plus size={14} />
          </Button>
        ) : (
          <button
            onClick={() => revokeUser(row.user.id)}
            disabled={isWorking}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-all disabled:opacity-40"
            aria-label={t('collections.dashboard.access.remove')}
          >
            <Trash2 size={15} />
          </button>
        ),
    },
  ]

  const groupColumns: Column<any>[] = [
    {
      key: 'name',
      header: t('collections.dashboard.access.group'),
      width: '280px',
      render: (group) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Users size={16} className="shrink-0 text-gray-400" />
          <span className="font-medium text-gray-900 truncate">{group.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('collections.dashboard.access.description'),
      render: (group) => (
        <span className="text-gray-500 truncate">{group.description || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (group) => {
        const isLinked = linkedIds.has(group.id)
        return (
          <button
            onClick={() => toggleGroup(group.id, isLinked)}
            disabled={isWorking}
            className={`p-1.5 rounded-md transition-all disabled:opacity-40 ${
              isLinked
                ? 'hover:bg-red-50 text-red-400 hover:text-red-600'
                : 'hover:bg-emerald-50 text-emerald-600'
            }`}
            aria-label={isLinked ? t('collections.dashboard.access.remove') : t('collections.dashboard.access.add')}
          >
            {isLinked ? <Trash2 size={15} /> : <Plus size={15} />}
          </button>
        )
      },
    },
  ]

  const pagination = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">
        {t('collections.dashboard.access.total', { count: total })}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ‹
        </button>
        <span className="text-xs text-gray-600 font-medium min-w-[64px] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ›
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {mode !== 'public' && (
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                mode === 'users_only'
                  ? t('collections.dashboard.access.search_groups')
                  : t('collections.dashboard.access.search_users')
              }
              className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        )}

        <div className="flex-1" />

        {/* Mode segmented control */}
        <div className="inline-flex items-center gap-1 p-1 bg-white shadow-borders-base rounded-lg">
          {(['public', 'users_only', 'paid'] as const).map((value) => (
            <button
              key={value}
              onClick={() => applyMode(value)}
              disabled={isWorking}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors ${
                mode === value
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded ${MODE_DOT[value]}`} />
              {t(`collections.dashboard.access.modes.${value}`)}
            </button>
          ))}
        </div>

        <button
          onClick={togglePublish}
          disabled={isWorking}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          {isWorking ? (
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

      {mode === 'public' && (
        <TableCard>
          <EmptyState
            icon={Globe}
            title={t('collections.dashboard.access.public_title')}
            description={t('collections.dashboard.access.public_description')}
          />
        </TableCard>
      )}

      {mode === 'paid' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
              {t('collections.dashboard.access.price_title')}
            </h3>
            <div className="flex items-end gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">
                  {t('collections.dashboard.access.price_label')}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    placeholder="0"
                    className="w-40 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">DZD</span>
                </div>
              </label>
              <Button variant="primary" size="small" onClick={savePrice} disabled={isWorking}>
                {isWorking && <Loader2 size={14} className="animate-spin" />}
                {t('dashboard.courses.save.save')}
              </Button>
            </div>
          </div>

          <TableCard footer={total > PAGE_SIZE ? pagination : undefined}>
            {entitlementLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : userRows.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={
                  isSearching
                    ? t('collections.dashboard.access.no_results')
                    : t('collections.dashboard.access.no_buyers')
                }
              />
            ) : (
              <DataTable columns={userColumns} rows={userRows} />
            )}
          </TableCard>
        </>
      )}

      {mode === 'users_only' && (
        <TableCard>
          {groupRows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={
                isSearching
                  ? t('collections.dashboard.access.no_results')
                  : (allGroups || []).length === 0
                    ? t('collections.dashboard.access.no_groups')
                    : t('collections.dashboard.access.no_linked_groups')
              }
              description={
                isSearching
                  ? undefined
                  : t('collections.dashboard.access.groups_description')
              }
            />
          ) : (
            <DataTable columns={groupColumns} rows={groupRows} />
          )}
        </TableCard>
      )}
    </div>
  )
}

export default EditCollectionAccess
