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
import { Check, Search, ArrowUpDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchMatches } from '@/lib/search/normalize'
import { useDebounce } from '@/hooks/useDebounce'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconButton } from '@/components/ui/icon-button'

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
  const [isLinking, setIsLinking] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest'>('newest')
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [masterCheckboxChecked, setMasterCheckboxChecked] = useState(false)

  useEffect(() => {
    if (community?.public !== undefined && !hasInitializedRef.current) {
      setIsClientPublic(community.public)
      previousPublicRef.current = community.public
      hasInitializedRef.current = true
    }
  }, [community?.public])

  useEffect(() => {
    const linked = linkedGroups || []
    setMasterCheckboxChecked(
      linked.length > 0 && selectedGroups.length === linked.length
    )
  }, [linkedGroups, selectedGroups])

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

  const handleLink = async (groupId: number) => {
    if (!community) return
    setIsLinking(groupId)
    try {
      const res = await linkResourcesToUserGroup(groupId, community.community_uuid, org.id, accessToken)
      if (res.status === 200) {
        toast.success(t('dashboard.courses.communities.access.usergroups.toasts.link_success'))
        mutateLinkedGroups()
      } else {
        toast.error(res.data?.detail || 'Failed to link')
      }
    } catch {
      toast.error(t('dashboard.courses.communities.access.usergroups.toasts.link_error'))
    } finally {
      setIsLinking(null)
    }
  }

  const handleUnlink = async (groupId: number) => {
    if (!community) return
    setIsLinking(groupId)
    try {
      const res = await unLinkResourcesToUserGroup(groupId, community.community_uuid, org.id, accessToken)
      if (res.status === 200) {
        toast.success(t('dashboard.courses.communities.access.usergroups.toasts.unlink_success'))
        mutateLinkedGroups()
      } else {
        toast.error(res.data?.detail || 'Failed to unlink')
      }
    } catch {
      toast.error(t('dashboard.courses.communities.access.usergroups.toasts.unlink_error'))
    } finally {
      setIsLinking(null)
    }
  }

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId)
      }
      return [...prev, groupId]
    })
  }

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
        toast.success(`Removed ${selectedGroups.length} user group(s)`)
        mutateLinkedGroups()
        setSelectedGroups([])
      } else {
        toast.error('Some groups could not be removed')
      }
    } catch {
      toast.error('Failed to remove user groups')
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
        toast.success(`Added ${selectedGroups.length} user group(s)`)
        mutateLinkedGroups()
        setSelectedGroups([])
        setSearchQuery('')
      } else {
        toast.error('Some groups could not be added')
      }
    } catch {
      toast.error('Failed to add user groups')
    }
  }

  if (!community) return null

  const linkedIds = new Set((linkedGroups || []).map((g: any) => g.id))

  // Determine which groups to show in the table
  const showSearchResults = searchQuery.trim().length > 0
  let tableGroups: any[] = []
  if (showSearchResults) {
    tableGroups = (allGroups || []).filter((g: any) =>
      searchMatches(g.name, debouncedSearch) || searchMatches(g.description, debouncedSearch)
    )
  } else {
    const groups = linkedGroups || []
    const sorted = [...groups].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'newest':
          return new Date(b.creation_date || 0).getTime() - new Date(a.creation_date || 0).getTime()
        case 'oldest':
          return new Date(a.creation_date || 0).getTime() - new Date(b.creation_date || 0).getTime()
        default:
          return 0
      }
    })
    tableGroups = sorted
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user groups..."
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
          {isClientPublic ? 'Public' : 'Restricted'}
        </button>
        {selectedGroups.length > 0 && (
          <button
            onClick={showSearchResults ? handleBulkLink : handleBulkUnlink}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 ${
              showSearchResults ? 'text-gray-600' : 'text-red-600'
            }`}
          >
            {showSearchResults ? `Add ${selectedGroups.length}` : `Delete ${selectedGroups.length}`}
          </button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Sort user groups">
              <ArrowUpDown size={15} />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[140px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
            sideOffset={6}
          >
            {([
              { value: 'name-asc', label: 'Name A-Z' },
              { value: 'name-desc', label: 'Name Z-A' },
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ] as const).map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {sortBy === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[30px]">
                  {!showSearchResults && (
                    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                      <input
                        type="checkbox"
                        checked={masterCheckboxChecked}
                        onChange={(e) => {
                          setMasterCheckboxChecked(e.target.checked)
                          if (e.target.checked) {
                            setSelectedGroups((linkedGroups || []).map((g: any) => g.id))
                          } else {
                            setSelectedGroups([])
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                        <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                      </div>
                    </label>
                  )}
                </TableHead>
                <TableHead className="w-[200px] pl-2">
                  <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Name</span>
                </TableHead>
                <TableHead>
                  <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Description</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isClientPublic && tableGroups.length === 0 && !showSearchResults ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-8">
                    No user groups linked
                  </TableCell>
                </TableRow>
              ) : showSearchResults && tableGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-8">
                    No user groups found
                  </TableCell>
                </TableRow>
              ) : !isClientPublic || showSearchResults ? (
                tableGroups.map((group: any) => {
                  const isLinked = linkedIds.has(group.id)
                  return (
                    <TableRow
                      key={group.id}
                      className={`${selectedGroups.includes(group.id) ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-50`}
                      onClick={(e) => {
                        if (
                          e.target instanceof HTMLElement &&
                          (e.target.closest('button') ||
                            e.target.closest('input[type="checkbox"]') ||
                            e.target.closest('[role="menuitem"]') ||
                            e.target.closest('[role="menu"]'))
                        ) {
                          return
                        }
                        handleGroupSelect(group.id)
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={() => handleGroupSelect(group.id)}
                            className="sr-only peer"
                          />
                          <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                            <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                          </div>
                        </label>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 pl-2 truncate">{group.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm truncate">
                        {group.description || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-8">
                    Community is public — no access restrictions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default CommunityEditAccess
