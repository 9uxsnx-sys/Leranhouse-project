'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import LearnHouseSpinner from '@components/Objects/Loaders/LearnHouseSpinner'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import UserAvatar from '@components/Objects/UserAvatar'
import { getAPIUrl } from '@services/config/config'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { searchMatchesAny } from '@/lib/search/normalize'
import { createUserGroup, updateUserGroup, deleteUserGroup, linkUsersToUserGroup, unlinkUsersFromUserGroup } from '@services/usergroups/usergroups'
import { swrFetcher } from '@services/utils/ts/requests'
import { Search, ArrowUpDown, CheckSquare, MoreVertical, Copy, Trash2, Users, Loader2, Check, SaveAllIcon, LogOut, ArrowLeft, Filter, ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react'
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePlan } from '@components/Hooks/usePlan'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return '—'
  }
}

function OrgUserGroups() {
    const { t } = useTranslation()
    const org = useOrg() as any
    const session = useLHSession() as any
    const access_token = session?.data?.tokens?.access_token;
    const currentPlan = usePlan()

    // Navigation: null = group list, membersGroupId = members table, selectedGroupId = edit detail
    const [membersGroupId, setMembersGroupId] = useState<number | null>(null)
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

    const [isCreating, setIsCreating] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [justSaved, setJustSaved] = React.useState(false)
    const [editName, setEditName] = React.useState('')
    const [editDescription, setEditDescription] = React.useState('')
    const [searchValue, setSearchValue] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [isSelectMode, setIsSelectMode] = useState(false)
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set())

    const ITEMS_PER_PAGE = 10

    // Members view states
    const [membersSearch, setMembersSearch] = useState('')
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set())
    const [membersPage, setMembersPage] = useState(1)
    const [membersSortBy, setMembersSortBy] = useState<'name-asc' | 'name-desc'>('name-asc')
    const [membersStatusFilter, setMembersStatusFilter] = useState<string>('')
    const [detailUser, setDetailUser] = useState<any>(null)

    // Close detail panel on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDetailUser(null)
        }
        if (detailUser) {
            window.addEventListener('keydown', handleEsc)
        }
        return () => window.removeEventListener('keydown', handleEsc)
    }, [detailUser])

    // Fetch all usergroups (for group list + currentGroup lookup)
    const { data: usergroups, isValidating: isUsergroupsValidating } = useSWR(
        org && access_token ? `${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}` : null,
        (url) => swrFetcher(url, access_token),
        { revalidateOnFocus: false }
    )
    const isInitialLoading = !usergroups && isUsergroupsValidating

    // Fetch members via org users endpoint (supports server-side search + pagination)
    const buildMembersQuery = () => {
        const params = new URLSearchParams()
        params.append('usergroup_id', membersGroupId!.toString())
        params.append('page', membersPage.toString())
        params.append('limit', ITEMS_PER_PAGE.toString())
        if (membersSearch.trim()) {
            params.append('search', membersSearch.trim())
            params.append('usergroup_filter', 'not_in_group')
        } else {
            params.append('usergroup_filter', 'in_group')
        }
        return params.toString()
    }
    const membersUrl = org && access_token && membersGroupId
        ? `${getAPIUrl()}orgs/${org.id}/users?${buildMembersQuery()}`
        : null
    const { data: usersData, isValidating: isMembersValidating } = useSWR(
        membersUrl,
        (url) => swrFetcher(url, access_token),
        { keepPreviousData: true }
    )
    const isMembersLoading = !usersData && isMembersValidating
    const isMembersPageTransitioning = !!usersData && isMembersValidating

    const currentGroup = useMemo(() => {
        if (!usergroups || !membersGroupId) return null
        return usergroups.find((g: any) => g.id === membersGroupId)
    }, [usergroups, membersGroupId])

    // Transform, filter (status only), and sort members
    const processedMembers = useMemo(() => {
        if (!usersData) return []
        // Map from org users response format to flat user object
        let result = (usersData.items || []).map((item: any) => ({
            id: item.user.id,
            first_name: item.user.first_name,
            last_name: item.user.last_name,
            username: item.user.username,
            email: item.user.email,
            email_verified: item.user.email_verified,
            user_uuid: item.user.user_uuid,
            avatar_image: item.user.avatar_image,
            creation_date: item.user.creation_date,
            last_login_at: item.user.last_login_at,
            is_in_group: (item.usergroups || []).some((ug: any) => ug.id === membersGroupId),
        }))

        // Status filter (client-side)
        if (membersStatusFilter) {
            result = result.filter((u: any) =>
                membersStatusFilter === 'verified' ? u.email_verified : !u.email_verified
            )
        }

        // Sort (client-side)
        result.sort((a: any, b: any) => {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
            return membersSortBy === 'name-asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })

        return result
    }, [usersData, membersGroupId, membersStatusFilter, membersSortBy])

    const totalMembers = usersData?.total || 0
    const totalMembersPages = Math.ceil(totalMembers / ITEMS_PER_PAGE)
    const paginatedMembers = processedMembers // server already paginated

    // Determine action type: searching → Add, not searching → Remove
    const hasSelectedMembers = selectedMemberIds.size > 0
    const isMembersSearchActive = membersSearch.trim().length > 0

    const visibleMemberIds: number[] = paginatedMembers.map((u: any) => u.id)
    const allMembersSelected = visibleMemberIds.length > 0 && visibleMemberIds.every((id: number) => selectedMemberIds.has(id))

    const toggleSelectAllMembers = useCallback(() => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev)
            if (allMembersSelected) {
                visibleMemberIds.forEach((id: number) => next.delete(id))
            } else {
                visibleMemberIds.forEach((id: number) => next.add(id))
            }
            return next
        })
    }, [allMembersSelected, visibleMemberIds])

    const toggleSelectMember = useCallback((userId: number) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev)
            if (next.has(userId)) next.delete(userId)
            else next.add(userId)
            return next
        })
    }, [])

    const handleMembersPageChange = (newPage: number) => {
        setMembersPage(newPage)
        setSelectedMemberIds(new Set())
    }

    const handleMembersSearchChange = (value: string) => {
        setMembersSearch(value)
        setMembersPage(1)
        setSelectedMemberIds(new Set())
    }

    const handleAddMembers = async () => {
        if (selectedMemberIds.size === 0 || !membersGroupId) return
        const ids = Array.from(selectedMemberIds)
        const toastId = toast.loading(`Adding ${ids.length} user(s)...`)
        try {
            const res = await linkUsersToUserGroup(membersGroupId, ids, org.id, access_token)
            if (res.status === 200) {
                setSelectedMemberIds(new Set())
                const baseUrl = `${getAPIUrl()}orgs/${org.id}/users`
                mutate((key: string) => typeof key === 'string' && key.startsWith(baseUrl))
                toast.success(`${ids.length} user(s) added`, { id: toastId })
            } else {
                toast.error('Failed to add users', { id: toastId })
            }
        } catch {
            toast.error('Failed to add users', { id: toastId })
        }
    }

    const handleRemoveMembers = async () => {
        if (selectedMemberIds.size === 0 || !membersGroupId) return
        const ids = Array.from(selectedMemberIds)
        const toastId = toast.loading(`Removing ${ids.length} user(s)...`)
        try {
            const res = await unlinkUsersFromUserGroup(membersGroupId, ids, org.id, access_token)
            if (res.status === 200) {
                setSelectedMemberIds(new Set())
                // Invalidate all org users cache keys (URL varies by search/page)
                const baseUrl = `${getAPIUrl()}orgs/${org.id}/users`
                mutate((key: string) => typeof key === 'string' && key.startsWith(baseUrl))
                toast.success(`${ids.length} user(s) removed`, { id: toastId })
            } else {
                toast.error('Failed to remove users', { id: toastId })
            }
        } catch {
            toast.error('Failed to remove users', { id: toastId })
        }
    }

    // ── Group list helpers ──
    const filteredUsergroups = useMemo(() => {
        if (!usergroups) return []
        let result = [...usergroups]
        if (searchValue.trim()) {
            result = result.filter((group: any) =>
                searchMatchesAny([group.name, group.description], searchValue)
            )
        }
        result.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase()
            const nameB = (b.name || '').toLowerCase()
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })
        return result
    }, [usergroups, searchValue, sortOrder])

    const toggleGroupSelection = (id: number) => {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const deleteUserGroupUI = async (usergroup_id: any) => {
        const toastId = toast.loading(t('dashboard.users.usergroups.toasts.deleting'));
        const res = await deleteUserGroup(usergroup_id, org.id, access_token)
        if (res.status == 200) {
            mutate(`${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}`)
            toast.success(t('dashboard.users.usergroups.toasts.delete_success'), { id: toastId })
        }
        else {
            toast.error(t('dashboard.users.usergroups.toasts.delete_error'), { id: toastId })
        }
    }

    const handleCreateGroup = async () => {
        if (!access_token || !org) return
        setIsCreating(true)
        try {
            const body = {
                name: 'New User Group',
                description: '',
                org_id: org.id,
            }
            const res = await createUserGroup(body, access_token)
            if (res.status === 200 || res.status === 201) {
                mutate(`${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}`)
                toast.success('User group created')
            } else {
                toast.error('Failed to create user group')
            }
        } catch {
            toast.error('Failed to create user group')
        } finally {
            setIsCreating(false)
        }
    }

    const handleGroupClick = (groupId: number) => {
        if (isSelectMode) {
            toggleGroupSelection(groupId)
        } else {
            setMembersGroupId(groupId)
            setMembersSearch('')
            setSelectedMemberIds(new Set())
        }
    }

    // ── State 3: Members Table ──
    if (membersGroupId) {
        return (
            <PlanRestrictedFeature
                currentPlan={currentPlan}
                requiredPlan="standard"
                icon={Users}
                titleKey="common.plans.feature_restricted.usergroups.title"
                descriptionKey="common.plans.feature_restricted.usergroups.description"
            >
                <div className="mt-6">
                    {/* ── ACTION ROW (matches Users/Contributors pattern) ── */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative w-80">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <input
                            type="text"
                            value={membersSearch}
                            onChange={(e) => {
                                setMembersSearch(e.target.value)
                                setMembersPage(1)
                                setSelectedMemberIds(new Set())
                            }}
                            placeholder="Search members..."
                            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                        />
                        </div>

                        <div className="flex-1" />

                        {/* Action button — always rendered to prevent layout bounce, shows Remove or Add based on search state */}
                        <button
                            onClick={isMembersSearchActive ? handleAddMembers : handleRemoveMembers}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 ${
                                isMembersSearchActive ? 'text-black' : 'text-red-600'
                            } ${
                                hasSelectedMembers ? '' : 'invisible pointer-events-none'
                            }`}
                        >
                            {isMembersSearchActive ? <Users size={14} /> : <LogOut size={14} />}
                            {isMembersSearchActive ? 'Add' : 'Remove'} {selectedMemberIds.size || 0}
                        </button>

                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Filter members">
                                    <Filter size={15} />
                                </IconButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="min-w-[170px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
                                sideOffset={6}
                            >
                                {[
                                    { value: '', label: 'All statuses' },
                                    { value: 'verified', label: 'Verified' },
                                    { value: 'unverified', label: 'Unverified' },
                                ].map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => { setMembersStatusFilter(option.value); setMembersPage(1) }}
                                        className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                                    >
                                        <span className="text-gray-700 text-xs">{option.label}</span>
                                        {membersStatusFilter === option.value && <Check size={12} className="text-gray-500" />}
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />

                                {[
                                    { value: 'name-asc', label: 'A-Z' },
                                    { value: 'name-desc', label: 'Z-A' },
                                ].map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => setMembersSortBy(option.value as 'name-asc' | 'name-desc')}
                                        className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                                    >
                                        <span className="text-gray-700 text-xs">{option.label}</span>
                                        {membersSortBy === option.value && <Check size={12} className="text-gray-500" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* ── TABLE (always rendered, even when empty) ── */}
                    <div className="relative">
                        {isMembersLoading && (
                            <div className="py-20 flex justify-center rounded-xl border border-gray-200">
                                <LearnHouseSpinner size={36} />
                            </div>
                        )}

                        {!isMembersLoading && (
                            <>
                                {/* Loading overlay for page transitions */}
                                {isMembersPageTransitioning && (
                                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
                                        <LearnHouseSpinner size={28} />
                                    </div>
                                )}

                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                    <Table className="table-fixed">
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="w-[30px]">
                                                    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={allMembersSelected}
                                                            onChange={toggleSelectAllMembers}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                                                            <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                                                        </div>
                                                    </label>
                                                </TableHead>
                                                <TableHead className="w-[160px]">
                                                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Name</span>
                                                </TableHead>
                                                <TableHead className="w-[130px]">
                                                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Username</span>
                                                </TableHead>
                                                <TableHead className="w-[180px]">
                                                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Email</span>
                                                </TableHead>
                                                <TableHead className="w-[120px]">
                                                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Status</span>
                                                </TableHead>
                                                <TableHead className="w-[140px]">
                                                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Joined</span>
                                                </TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedMembers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Users size={32} className="text-gray-300" />
                                                            <span className="text-sm text-gray-400 font-medium">
                                                                {membersSearch
                                                                    ? 'No members found matching your search'
                                                                    : 'No users in this group yet'
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedMembers.map((user: any) => (
                                                    <TableRow
                                                        key={user.id}
                                                        className={`${selectedMemberIds.has(user.id) ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-50`}
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
                                                            toggleSelectMember(user.id)
                                                        }}
                                                    >
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedMemberIds.has(user.id)}
                                                                    onChange={() => toggleSelectMember(user.id)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                                                                    <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                                                                </div>
                                                            </label>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <UserAvatar
                                                                    width={30}
                                                                    border='border-2'
                                                                    avatar_url={user.avatar_image ? getUserAvatarMediaDirectory(user.user_uuid, user.avatar_image) : ''}
                                                                    rounded="rounded-full"
                                                                    predefined_avatar={user.avatar_image === '' ? 'empty' : undefined}
                                                                />
                                                                <span className="font-medium truncate text-sm">
                                                                    {user.first_name} {user.last_name}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-500 text-sm">
                                                            @{user.username}
                                                        </TableCell>
                                                        <TableCell className="text-gray-500 text-sm truncate">
                                                            {user.email}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center gap-1.5 text-sm">
                                                                <span className={`w-2.5 h-2.5 rounded ${user.email_verified ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                {user.email_verified ? 'Verified' : 'Unverified'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-gray-500 text-sm">
                                                            {formatDate(user.creation_date)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setDetailUser(user)
                                                                }}
                                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                                                                title="View details"
                                                            >
                                                                <MoreHorizontal size={16} />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalMembers > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between px-6 py-4 mt-4 border border-gray-200 rounded-xl bg-gray-50/50">
                            <div className="text-xs text-gray-500 font-medium">
                                Showing {(membersPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(membersPage * ITEMS_PER_PAGE, totalMembers)} of {totalMembers}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleMembersPageChange(membersPage - 1)}
                                    disabled={membersPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="text-sm text-gray-600 font-medium min-w-[80px] text-center bg-white px-3 py-2 rounded-lg border border-gray-200">
                                    Page {membersPage} of {totalMembersPages}
                                </span>
                                <button
                                    onClick={() => handleMembersPageChange(membersPage + 1)}
                                    disabled={membersPage * ITEMS_PER_PAGE >= totalMembers}
                                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Detail panel — floating card */}
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
                                            avatar_url={detailUser.avatar_image ? getUserAvatarMediaDirectory(detailUser.user_uuid, detailUser.avatar_image) : ''}
                                            rounded="rounded-full"
                                            predefined_avatar={detailUser.avatar_image === '' ? 'empty' : undefined}
                                        />
                                        <span className="mt-3 text-base font-semibold text-gray-800">
                                            {detailUser.first_name} {detailUser.last_name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            @{detailUser.username}
                                        </span>
                                        <span className="text-sm text-gray-500 mt-0.5">
                                            {detailUser.email}
                                        </span>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    <div className="px-6 py-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Status</span>
                                            <span className="flex items-center gap-1.5 text-sm text-gray-700">
                                                <span className={`w-2 h-2 rounded-full ${detailUser.email_verified ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                {detailUser.email_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    <div className="px-6 py-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Joined</span>
                                            <span className="text-sm text-gray-700">{formatDate(detailUser.creation_date)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Last login</span>
                                            <span className="text-sm text-gray-700">{formatDate(detailUser.last_login_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </PlanRestrictedFeature>
        )
    }

    // ── State 2: Group Detail / Edit ──
    if (selectedGroupId) {
        const group = usergroups?.find((g: any) => g.id === selectedGroupId)

        if (group && editName === '' && editDescription === '') {
            setEditName(group.name || '')
            setEditDescription(group.description || '')
            setJustSaved(true)
        }

        const handleSaveGroup = async () => {
            if (!access_token || !org || !group) return
            if (!editName.trim()) {
                toast.error('Name is required')
                return
            }
            setIsSaving(true)
            try {
                const body = {
                    name: editName.trim(),
                    description: editDescription.trim(),
                    org_id: org.id,
                }
                const res = await updateUserGroup(group.id, org.id, access_token, body)
                if (res.success) {
                    mutate(`${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}`)
                    setJustSaved(true)
                } else {
                    toast.error(res.data?.message || 'Failed to save group')
                }
            } catch {
                toast.error('Failed to save group')
            } finally {
                setIsSaving(false)
            }
        }
        return (
            <PlanRestrictedFeature
                currentPlan={currentPlan}
                requiredPlan="standard"
                icon={Users}
                titleKey="common.plans.feature_restricted.usergroups.title"
                descriptionKey="common.plans.feature_restricted.usergroups.description"
            >
                <div className="mt-6">
                    {/* ── ACTION ROW ── */}
                    <div className="flex items-center justify-end mb-5">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveGroup}
                                disabled={isSaving || justSaved}
                                className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                                    isSaving
                                        ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                                        : justSaved
                                        ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                                        : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : justSaved ? (
                                    <Check size={14} />
                                ) : (
                                    <SaveAllIcon size={14} />
                                )}
                                <span>{isSaving ? 'Saving...' : justSaved ? 'Saved' : 'Save'}</span>
                            </button>
                        </div>
                    </div>

                    {/* ── BASIC INFORMATION ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Basic Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Name
                                </label>
                                <Input
                                    value={editName}
                                    onChange={(e) => { setEditName(e.target.value); setJustSaved(false) }}
                                    placeholder="Group name"
                                    className="bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description
                                </label>
                                <Textarea
                                    value={editDescription}
                                    onChange={(e) => { setEditDescription(e.target.value); setJustSaved(false) }}
                                    placeholder="Group description"
                                    rows={3}
                                    className="bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </PlanRestrictedFeature>
        )
    }

    // ── State 1: Group List ──
    return (
        <PlanRestrictedFeature
            currentPlan={currentPlan}
            requiredPlan="standard"
            icon={Users}
            titleKey="common.plans.feature_restricted.usergroups.title"
            descriptionKey="common.plans.feature_restricted.usergroups.description"
        >
            {/* Toolbar Row */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={t('dashboard.users.usergroups.search_placeholder')}
                        className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                    />
                </div>

                <span className="text-xs text-gray-400 whitespace-nowrap">
                    {filteredUsergroups.length} {filteredUsergroups.length === 1
                        ? t('dashboard.users.usergroups.count.singular')
                        : t('dashboard.users.usergroups.count.plural')}
                </span>

                <div className="flex-1" />

                <Button variant="primary" size="small" onClick={handleCreateGroup} disabled={isCreating} className="gap-x-1.5">
                    {isCreating ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        '+'
                    )}
                    &nbsp;&nbsp;Create
                </Button>

                <Button variant="secondary" size="small" onClick={() => setIsSelectMode(!isSelectMode)} className="gap-1.5">
                    <CheckSquare size={14} strokeWidth={2.5} />
                    <span className="font-semibold">{isSelectMode ? 'Cancel' : 'Select'}</span>
                </Button>

                <IconButton
                    size="small"
                    variant="transparent"
                    className="bg-white hover:bg-gray-50 shadow-borders-base"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    aria-label="Sort groups"
                >
                    <ArrowUpDown size={15} />
                </IconButton>
            </div>

            {/* Group Cards */}
            <div className="space-y-3">
                {isInitialLoading ? (
                    <div className="py-20 flex justify-center">
                        <LearnHouseSpinner size={36} />
                    </div>
                ) : filteredUsergroups.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                        <Users size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-400">
                            {searchValue
                                ? t('dashboard.users.usergroups.no_results')
                                : t('dashboard.users.usergroups.no_groups')
                            }
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                            {searchValue
                                ? 'Try a different search term'
                                : t('dashboard.users.usergroups.actions.create')
                            }
                        </p>
                    </div>
                ) : (
                    filteredUsergroups.map((usergroup: any) => {
                        const isSelected = selectedGroupIds.has(usergroup.id)
                        return (
                            <div
                                key={usergroup.id}
                                onClick={() => handleGroupClick(usergroup.id)}
                                className={`w-full text-left px-5 py-4 rounded-xl bg-white shadow-borders-base transition-colors flex items-center justify-between group ${
                                    isSelectMode
                                        ? isSelected
                                            ? 'ring-2 ring-blue-500/40 border-blue-200 cursor-pointer'
                                            : 'hover:border-gray-200 cursor-pointer'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {isSelectMode ? (
                                        <div
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleGroupSelection(usergroup.id)
                                            }}
                                        >
                                            {isSelected && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    ) : null}

                                    <Users size={18} className="text-gray-400 flex-shrink-0" />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {usergroup.name}
                                        </p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-28">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditName('')
                                                setEditDescription('')
                                                setJustSaved(false)
                                                setSelectedGroupId(usergroup.id)
                                            }}
                                            className="gap-2"
                                        >
                                            <Copy size={14} />
                                            {t('dashboard.users.usergroups.actions.edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteUserGroupUI(usergroup.id)
                                            }}
                                            className="gap-2 text-red-600"
                                        >
                                            <Trash2 size={14} />
                                            {t('dashboard.users.usergroups.actions.delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })
                )}
            </div>

        </PlanRestrictedFeature>
    )
}

export default OrgUserGroups
