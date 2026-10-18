'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { updateCommunity } from '@services/communities/communities'
import { linkResourcesToUserGroup, unLinkResourcesToUserGroup } from '@services/usergroups/usergroups'
import { revalidateTags, swrFetcher } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import useSWR from 'swr'
import { getAPIUrl } from '@services/config/config'
import { Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchMatches } from '@/lib/search/normalize'
import { useDebounce } from '@/hooks/useDebounce'
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'

const CommunityEditAccess: React.FC = () => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const dispatch = useCommunityDispatch()
  const community = communityState?.community
  const accessToken = session?.data?.tokens?.access_token

  // Fetch linked user groups
  const { data: linkedGroups, mutate: mutateLinkedGroups } = useSWR(
    community?.community_uuid && org?.id
      ? `${getAPIUrl()}usergroups/resource/${community.community_uuid}?org_id=${org.id}`
      : null,
    (url) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  // Fetch all user groups in org
  const { data: allGroups } = useSWR(
    community && org ? `${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}` : null,
    (url) => swrFetcher(url, accessToken)
  )

  const [isClientPublic, setIsClientPublic] = useState<boolean | undefined>(undefined)
  const hasInitializedRef = useRef(false)
  const previousPublicRef = useRef<boolean | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])

  useEffect(() => {
    if (community?.public !== undefined && !hasInitializedRef.current) {
      setIsClientPublic(community.public)
      previousPublicRef.current = community.public
      hasInitializedRef.current = true
    }
  }, [community?.public])

  const handleSetPublic = useCallback(
    async (value: boolean) => {
      if (!community || isSaving) return
      setIsClientPublic(value)
      setIsSaving(true)
      try {
        const result = await updateCommunity(community.community_uuid, { public: value }, accessToken)
        if (result) {
          await revalidateTags(['communities'], org.slug)
          mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
          if (dispatch) {
            dispatch({ type: 'setCommunity', payload: { ...community, public: value } })
          }
          previousPublicRef.current = value
          toast.success(t('dashboard.courses.communities.access.toasts.update_success'))
        }
      } catch (error) {
        console.error('Failed to update community access:', error)
        setIsClientPublic(previousPublicRef.current)
        toast.error(t('dashboard.courses.communities.access.toasts.update_error'))
      } finally {
        setIsSaving(false)
      }
    },
    [community, accessToken, org?.slug, dispatch, isSaving, t]
  )

  const handleBulkUnlink = async () => {
    if (selectedGroups.length === 0 || !community) return

    try {
      const results = await Promise.all(
        selectedGroups.map(groupId =>
          unLinkResourcesToUserGroup(groupId, community.community_uuid, org.id, accessToken)
        )
      )
      const allSuccess = results.every(r => r.status === 200)
      if (allSuccess) {
        toast.success(t('dashboard.courses.communities.access.toasts.bulk_remove_success', { count: selectedGroups.length }))
        mutateLinkedGroups()
        setSelectedGroups([])
      } else {
        toast.error(t('dashboard.courses.communities.access.toasts.bulk_remove_partial'))
      }
    } catch {
      toast.error(t('dashboard.courses.communities.access.toasts.bulk_remove_error'))
    }
  }

  const handleBulkLink = async () => {
    if (selectedGroups.length === 0 || !community) return

    try {
      const results = await Promise.all(
        selectedGroups.map(groupId =>
          linkResourcesToUserGroup(groupId, community.community_uuid, org.id, accessToken)
        )
      )
      const allSuccess = results.every(r => r.status === 200)
      if (allSuccess) {
        toast.success(t('dashboard.courses.communities.access.toasts.bulk_add_success', { count: selectedGroups.length }))
        mutateLinkedGroups()
        setSelectedGroups([])
        setSearchQuery('')
      } else {
        toast.error(t('dashboard.courses.communities.access.toasts.bulk_add_partial'))
      }
    } catch {
      toast.error(t('dashboard.courses.communities.access.toasts.bulk_add_error'))
    }
  }

  if (!community) return null

  const linkedIds = new Set((linkedGroups || []).map((g: any) => g.id))

  // Determine which groups to show in the table
  const showSearchResults = searchQuery.trim().length > 0
  const tableGroups: any[] = showSearchResults
    ? (allGroups || []).filter((g: any) =>
        searchMatches(g.name, debouncedSearch) || searchMatches(g.description, debouncedSearch)
      )
    : linkedGroups || []

  const handleGroupSelectionChange = (next: Set<string | number>) => {
    setSelectedGroups(Array.from(next).map(Number))
  }

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: t('dashboard.courses.communities.table.name'),
      width: '260px',
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
      header: t('dashboard.courses.communities.table.description'),
      render: (group) => <span className="text-gray-500 truncate">{group.description || '—'}</span>,
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.courses.communities.access.search_placeholder')}
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={() => handleSetPublic(!isClientPublic)}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <span className={`w-2.5 h-2.5 rounded ${isClientPublic ? 'bg-green-500' : 'bg-red-500'}`} />
          {isClientPublic ? t('dashboard.courses.communities.access.public_badge') : t('dashboard.courses.communities.access.restricted_badge')}
        </button>
        {selectedGroups.length > 0 && (
          <button
            onClick={showSearchResults ? handleBulkLink : handleBulkUnlink}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 ${
              showSearchResults ? 'text-gray-600' : 'text-red-600'
            }`}
          >
            {showSearchResults ? t('dashboard.courses.communities.access.add_count', { count: selectedGroups.length }) : t('dashboard.courses.communities.access.delete_count', { count: selectedGroups.length })}
          </button>
        )}
      </div>

      {isClientPublic && !showSearchResults ? (
        <TableCard>
          <EmptyState
            icon={Users}
            title={t('dashboard.courses.communities.access.public_no_restrictions')}
          />
        </TableCard>
      ) : tableGroups.length === 0 ? (
        <TableCard>
          <EmptyState
            icon={Users}
            title={
              showSearchResults
                ? t('dashboard.courses.communities.access.no_groups_found')
                : t('dashboard.courses.communities.access.no_groups_linked')
            }
          />
        </TableCard>
      ) : (
        <TableCard>
          <DataTable
            columns={columns}
            rows={tableGroups}
            selectable
            getRowId={(group) => group.id}
            selectedIds={new Set<string | number>(selectedGroups)}
            onSelectionChange={handleGroupSelectionChange}
            rowClassName={(group) => (linkedIds.has(group.id) ? 'bg-gray-50/60' : '')}
          />
        </TableCard>
      )}
    </div>
  )
}

export default CommunityEditAccess
