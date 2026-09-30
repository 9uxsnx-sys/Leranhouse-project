'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import LearnHouseSpinner from '@components/Objects/Loaders/LearnHouseSpinner'
import Toast from '@components/Objects/StyledElements/Toast/Toast'
import UserAvatar from '@components/Objects/UserAvatar'
import { getAPIUrl } from '@services/config/config'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { removeUserFromOrg, removeUsersFromOrg, updateUserRole } from '@services/organizations/orgs'
import { swrFetcher } from '@services/utils/ts/requests'
import { Check, Search, Filter, LogOut, ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconButton } from '@/components/ui/icon-button'

const ITEMS_PER_PAGE = 10

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

function OrgUsers() {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token;

  const [page, setPage] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc'>('name-asc')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [groupFilter, setGroupFilter] = useState<string>('')
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

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', ITEMS_PER_PAGE.toString())
    if (searchValue) params.append('search', searchValue)
    return params.toString()
  }

  const usersUrl = org && access_token ? `${getAPIUrl()}orgs/${org?.id}/users?${buildQuery()}` : null
  const { data, isValidating } = useSWR(
    usersUrl,
    (url) => swrFetcher(url, access_token),
    {
      revalidateOnFocus: false,
    }
  )

  // Fetch available roles for the role dropdown
  const { data: roles } = useSWR(
    org && access_token ? `${getAPIUrl()}roles/org/${org.id}` : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const orgUsers = data?.items || []
  const total = data?.total || 0
  const isInitialLoading = !data && isValidating
  const isPageTransitioning = !!data && isValidating

  const visibleUserIds: number[] = orgUsers.map((u: any) => u.user.id)
  const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every((id: number) => selectedUserIds.has(id))

  const toggleSelectAll = useCallback(() => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleUserIds.forEach((id: number) => next.delete(id))
      } else {
        visibleUserIds.forEach((id: number) => next.add(id))
      }
      return next
    })
  }, [allVisibleSelected, visibleUserIds])

  const toggleSelectUser = useCallback((userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }, [])

  const handleRemoveUser = async (user_id: any) => {
    const toastId = toast.loading(t('dashboard.users.active_users.actions.removing'));
    const res = await removeUserFromOrg(org.id, user_id, access_token)
    if (res.status === 200) {
      await mutate(usersUrl)
      toast.success(t('dashboard.users.active_users.actions.remove_success'), {id:toastId});
    } else {
      toast.error(t('dashboard.users.active_users.actions.remove_error'), {id:toastId});
    }
  }

  const handleBatchRemove = async () => {
    const ids = Array.from(selectedUserIds)
    const toastId = toast.loading(`Removing ${ids.length} user(s)...`);
    const res = await removeUsersFromOrg(org.id, ids, access_token)
    if (res.status === 200) {
      setSelectedUserIds(new Set())
      await mutate(usersUrl)
      toast.success(`${ids.length} user(s) removed successfully`, {id:toastId});
    } else {
      toast.error('Error removing users', {id:toastId});
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setSelectedUserIds(new Set())
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setPage(1)
    setSelectedUserIds(new Set())
  }

  // Sort users A-Z or Z-A
  const sortUsers = (users: any[]) => {
    const sorted = [...users].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return `${a.user.first_name} ${a.user.last_name}`.localeCompare(`${b.user.first_name} ${b.user.last_name}`)
        case 'name-desc':
          return `${b.user.first_name} ${b.user.last_name}`.localeCompare(`${a.user.first_name} ${a.user.last_name}`)
        default:
          return 0
      }
    })
    return sorted
  }

  // Filter users by role, status, and group
  const filteredUsers = React.useMemo(() => {
    let result = orgUsers
    if (roleFilter) {
      result = result.filter((u: any) => u.role.name === roleFilter)
    }
    if (statusFilter) {
      result = result.filter((u: any) =>
        statusFilter === 'verified' ? u.user.email_verified : !u.user.email_verified
      )
    }
    if (groupFilter) {
      result = result.filter((u: any) =>
        u.usergroups?.some((g: any) => g.name === groupFilter)
      )
    }
    return result
  }, [orgUsers, roleFilter, statusFilter, groupFilter])

  // Extract unique group names from all users
  const allGroups = React.useMemo(() => {
    const groups = new Set<string>()
    orgUsers.forEach((u: any) => {
      u.usergroups?.forEach((g: any) => groups.add(g.name))
    })
    return Array.from(groups).sort()
  }, [orgUsers])

  const handleRoleChange = async (userId: number, roleId: number) => {
    const toastId = toast.loading('Updating role...')
    try {
      const res = await updateUserRole(org.id, userId, roleId, access_token)
      if (res.status === 200) {
        await mutate(usersUrl)
        toast.success('Role updated successfully', { id: toastId })
      } else {
        toast.error('Failed to update role', { id: toastId })
      }
    } catch {
      toast.error('Failed to update role', { id: toastId })
    }
  }

  // Role dropdown component matching contributors style
  const RoleDropdown = ({ user }: { user: any }) => {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <span className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-gray-700 text-sm">
            {user.role.name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="min-w-[120px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
          sideOffset={6}
        >
          {roles?.map((role: any) => (
            <DropdownMenuItem
              key={role.id}
              onClick={() => handleRoleChange(user.user.id, role.id)}
              className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
            >
              <span className="text-gray-700 text-xs">{role.name}</span>
              {user.role.id === role.id && <Check size={12} className="text-gray-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Status indicator matching contributors style
  const StatusIndicator = ({ user }: { user: any }) => {
    const isVerified = user.user.email_verified
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className={`w-2.5 h-2.5 rounded ${isVerified ? 'bg-green-500' : 'bg-red-500'}`} />
        {isVerified ? 'Verified' : 'Unverified'}
      </span>
    )
  }

  return (
    <div>
      <Toast></Toast>

      {/* Toolbar Row — matching contributors style */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search bar */}
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('dashboard.users.active_users.search_placeholder') || 'Search users...'}
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        {/* Bulk remove button — always rendered to prevent layout bounce */}
        <button
          onClick={handleBatchRemove}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-red-600 border-gray-200 hover:bg-gray-50 ${
            selectedUserIds.size === 0 ? 'invisible pointer-events-none' : ''
          }`}
        >
          <LogOut size={14} />
          Remove {selectedUserIds.size || 0}
        </button>

        {/* Filter dropdown with Role, Status, Group, and Sort */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Filter users">
              <Filter size={15} />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[170px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
            sideOffset={6}
          >
            {/* Role section */}
            {[
              { value: '', label: 'All roles' },
              ...(roles?.map((r: any) => ({ value: r.name, label: r.name })) || []),
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setRoleFilter(option.value)}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {roleFilter === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Status section */}
            {[
              { value: '', label: 'All statuses' },
              { value: 'verified', label: 'Verified' },
              { value: 'unverified', label: 'Unverified' },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {statusFilter === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Group section */}
            {[
              { value: '', label: 'All groups' },
              ...allGroups.map((g) => ({ value: g, label: g })),
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setGroupFilter(option.value)}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {groupFilter === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Sort section */}
            {[
              { value: 'name-asc', label: 'A-Z' },
              { value: 'name-desc', label: 'Z-A' },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value as 'name-asc' | 'name-desc')}
                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
              >
                <span className="text-gray-700 text-xs">{option.label}</span>
                {sortBy === option.value && <Check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {isInitialLoading ? (
        <div className="py-20 flex justify-center rounded-xl border border-gray-200">
          <LearnHouseSpinner size={36} />
        </div>
      ) : orgUsers.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400 text-sm font-medium">
              {searchValue
                ? 'No users found matching your search'
                : 'No users in this organization yet'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Loading overlay for page transitions */}
          {isPageTransitioning && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl">
              <LearnHouseSpinner size={28} />
            </div>
          )}

          {/* Table — matching contributors exactly */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[30px]">
                    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
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
                  <TableHead className="w-[130px]">
                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">Role</span>
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
                {sortUsers(filteredUsers).map((user: any) => (
                  <TableRow
                    key={user.user.id}
                    className={`${selectedUserIds.has(user.user.id) ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-50`}
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
                      toggleSelectUser(user.user.id)
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.user.id)}
                          onChange={() => toggleSelectUser(user.user.id)}
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
                          avatar_url={user.user.avatar_image ? getUserAvatarMediaDirectory(user.user.user_uuid, user.user.avatar_image) : ''}
                          rounded="rounded-full"
                          predefined_avatar={user.user.avatar_image === '' ? 'empty' : undefined}
                        />
                        <span className="font-medium truncate text-sm">
                          {user.user.first_name} {user.user.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      @{user.user.username}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm truncate">
                      {user.user.email}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RoleDropdown user={user} />
                    </TableCell>
                    <TableCell>
                      <StatusIndicator user={user} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(user.joined_at)}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-6 py-4 mt-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="text-xs text-gray-500 font-medium">
            {t('dashboard.users.active_users.pagination.showing', {
              start: (page - 1) * ITEMS_PER_PAGE + 1,
              end: Math.min(page * ITEMS_PER_PAGE, total),
              total
            }) || `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, total)} of ${total}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 font-medium min-w-[80px] text-center bg-white px-3 py-2 rounded-lg border border-gray-200">
              {t('dashboard.users.active_users.pagination.page', { current: page, total: Math.ceil(total / ITEMS_PER_PAGE) }) || `Page ${page} of ${Math.ceil(total / ITEMS_PER_PAGE)}`}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page * ITEMS_PER_PAGE >= total}
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setDetailUser(null)}
          />
          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-[340px] rounded-xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end pt-3 pr-3">
                <button
                  onClick={() => setDetailUser(null)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Avatar + name */}
              <div className="flex flex-col items-center px-6 pb-4">
                <UserAvatar
                  width={52}
                  border="border-2"
                  avatar_url={detailUser.user.avatar_image ? getUserAvatarMediaDirectory(detailUser.user.user_uuid, detailUser.user.avatar_image) : ''}
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

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Info rows */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Role</span>
                  <span className="text-sm text-gray-700">{detailUser.role.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${detailUser.user.email_verified ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {detailUser.user.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>

              {detailUser.usergroups?.length > 0 && (
                <>
                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Groups */}
                  <div className="px-6 py-4 space-y-2.5">
                    <span className="text-xs text-gray-400 block">Groups</span>
                    {detailUser.usergroups.map((g: any) => (
                      <div key={g.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{g.name}</span>
                        <span className="text-sm text-gray-400">{g.user_count ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Date rows */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Joined</span>
                  <span className="text-sm text-gray-700">{formatDate(detailUser.joined_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Last login</span>
                  <span className="text-sm text-gray-700">{formatDate(detailUser.user.last_login_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OrgUsers
