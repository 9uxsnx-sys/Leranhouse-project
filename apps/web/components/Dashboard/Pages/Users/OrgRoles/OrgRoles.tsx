'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge'
import { getAPIUrl } from '@services/config/config'
import { createRole, deleteRole, updateRole } from '@services/roles/roles'
import { swrFetcher } from '@services/utils/ts/requests'
import { PlanLevel } from '@services/plans/plans'
import { Shield, Globe, Lock, Eye, Check, XCircle, Search, Users, Loader2, ArrowLeft, BookOpen, UserCheck, FolderOpen, Building, FileText, Activity, Monitor, CheckSquare, Square, MoreVertical, Trash2, Plus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useTranslation } from 'react-i18next'
import { usePlan } from '@components/Hooks/usePlan'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import FormLayout, { FormField, FormLabelAndMessage, Input, Textarea } from '@components/Objects/StyledElements/Form/Form'
import * as Form from '@radix-ui/react-form'
import { useFormik } from 'formik'

// ── Types ──

interface Rights {
    courses: {
        action_create: boolean;
        action_read: boolean;
        action_read_own: boolean;
        action_update: boolean;
        action_update_own: boolean;
        action_delete: boolean;
        action_delete_own: boolean;
    };
    users: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    usergroups: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    collections: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    organizations: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    coursechapters: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    activities: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    roles: {
        action_create: boolean;
        action_read: boolean;
        action_update: boolean;
        action_delete: boolean;
    };
    dashboard: {
        action_access: boolean;
    };
}

const defaultRights: Rights = {
    courses: { action_create: false, action_read: false, action_read_own: false, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
    users: { action_create: false, action_read: false, action_update: false, action_delete: false },
    usergroups: { action_create: false, action_read: false, action_update: false, action_delete: false },
    collections: { action_create: false, action_read: false, action_update: false, action_delete: false },
    organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
    coursechapters: { action_create: false, action_read: false, action_update: false, action_delete: false },
    activities: { action_create: false, action_read: false, action_update: false, action_delete: false },
    roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
    dashboard: { action_access: false },
}

const predefinedRoles: Record<string, { name: string; description: string; rights: Rights }> = {
    'Admin': {
        name: 'Admin',
        description: 'Full platform control with all permissions',
        rights: {
            courses: { action_create: true, action_read: true, action_read_own: true, action_update: true, action_update_own: true, action_delete: true, action_delete_own: true },
            users: { action_create: true, action_read: true, action_update: true, action_delete: true },
            usergroups: { action_create: true, action_read: true, action_update: true, action_delete: true },
            collections: { action_create: true, action_read: true, action_update: true, action_delete: true },
            organizations: { action_create: true, action_read: true, action_update: true, action_delete: true },
            coursechapters: { action_create: true, action_read: true, action_update: true, action_delete: true },
            activities: { action_create: true, action_read: true, action_update: true, action_delete: true },
            roles: { action_create: true, action_read: true, action_update: true, action_delete: true },
            dashboard: { action_access: true },
        },
    },
    'Course Manager': {
        name: 'Course Manager',
        description: 'Can manage courses, chapters, and activities',
        rights: {
            courses: { action_create: true, action_read: true, action_read_own: true, action_update: true, action_update_own: true, action_delete: false, action_delete_own: true },
            users: { action_create: false, action_read: true, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: true, action_update: false, action_delete: false },
            collections: { action_create: true, action_read: true, action_update: true, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: true, action_read: true, action_update: true, action_delete: false },
            activities: { action_create: true, action_read: true, action_update: true, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Instructor': {
        name: 'Instructor',
        description: 'Can create and manage their own courses',
        rights: {
            courses: { action_create: true, action_read: true, action_read_own: true, action_update: false, action_update_own: true, action_delete: false, action_delete_own: true },
            users: { action_create: false, action_read: false, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: false, action_update: false, action_delete: false },
            collections: { action_create: false, action_read: true, action_update: false, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: true, action_read: true, action_update: false, action_delete: false },
            activities: { action_create: true, action_read: true, action_update: false, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Viewer': {
        name: 'Viewer',
        description: 'Read-only access to courses and content',
        rights: {
            courses: { action_create: false, action_read: true, action_read_own: true, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
            users: { action_create: false, action_read: false, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: false, action_update: false, action_delete: false },
            collections: { action_create: false, action_read: true, action_update: false, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: false, action_read: true, action_update: false, action_delete: false },
            activities: { action_create: false, action_read: true, action_update: false, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Content Creator': {
        name: 'Content Creator',
        description: 'Can create and edit content but not manage users',
        rights: {
            courses: { action_create: true, action_read: true, action_read_own: true, action_update: true, action_update_own: true, action_delete: false, action_delete_own: false },
            users: { action_create: false, action_read: false, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: false, action_update: false, action_delete: false },
            collections: { action_create: true, action_read: true, action_update: true, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: true, action_read: true, action_update: true, action_delete: false },
            activities: { action_create: true, action_read: true, action_update: true, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'User Manager': {
        name: 'User Manager',
        description: 'Can manage users and user groups',
        rights: {
            courses: { action_create: false, action_read: true, action_read_own: true, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
            users: { action_create: true, action_read: true, action_update: true, action_delete: true },
            usergroups: { action_create: true, action_read: true, action_update: true, action_delete: true },
            collections: { action_create: false, action_read: true, action_update: false, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: false, action_read: true, action_update: false, action_delete: false },
            activities: { action_create: false, action_read: true, action_update: false, action_delete: false },
            roles: { action_create: false, action_read: true, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Moderator': {
        name: 'Moderator',
        description: 'Can moderate content and manage activities',
        rights: {
            courses: { action_create: false, action_read: true, action_read_own: true, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
            users: { action_create: false, action_read: true, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: true, action_update: false, action_delete: false },
            collections: { action_create: false, action_read: true, action_update: true, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: false, action_read: true, action_update: true, action_delete: false },
            activities: { action_create: false, action_read: true, action_update: true, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Analyst': {
        name: 'Analyst',
        description: 'Read-only access with analytics capabilities',
        rights: {
            courses: { action_create: false, action_read: true, action_read_own: true, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
            users: { action_create: false, action_read: true, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: true, action_update: false, action_delete: false },
            collections: { action_create: false, action_read: true, action_update: false, action_delete: false },
            organizations: { action_create: false, action_read: true, action_update: false, action_delete: false },
            coursechapters: { action_create: false, action_read: true, action_update: false, action_delete: false },
            activities: { action_create: false, action_read: true, action_update: false, action_delete: false },
            roles: { action_create: false, action_read: true, action_update: false, action_delete: false },
            dashboard: { action_access: true },
        },
    },
    'Guest': {
        name: 'Guest',
        description: 'Limited access for external users',
        rights: {
            courses: { action_create: false, action_read: true, action_read_own: false, action_update: false, action_update_own: false, action_delete: false, action_delete_own: false },
            users: { action_create: false, action_read: false, action_update: false, action_delete: false },
            usergroups: { action_create: false, action_read: false, action_update: false, action_delete: false },
            collections: { action_create: false, action_read: true, action_update: false, action_delete: false },
            organizations: { action_create: false, action_read: false, action_update: false, action_delete: false },
            coursechapters: { action_create: false, action_read: true, action_update: false, action_delete: false },
            activities: { action_create: false, action_read: true, action_update: false, action_delete: false },
            roles: { action_create: false, action_read: false, action_update: false, action_delete: false },
            dashboard: { action_access: false },
        },
    },
}

// ── Helpers ──

const isSystemRole = (role: any) => {
    if (role.role_type === 'TYPE_GLOBAL') return true
    if (role.role_uuid && role.role_uuid.startsWith('role_global_')) return true
    if (role.id && [1, 2, 3, 4].includes(role.id)) return true
    if (role.name && ['Admin', 'Maintainer', 'Instructor', 'User'].includes(role.name)) return true
    return false
}

const getRightsSummary = (rights: any) => {
    if (!rights) return 'No permissions'
    const totalPermissions = Object.keys(rights).reduce((acc, key) => {
        if (typeof rights[key] === 'object') {
            return acc + Object.keys(rights[key]).filter(k => rights[key][k] === true).length
        }
        return acc
    }, 0)
    return `${totalPermissions} permission${totalPermissions !== 1 ? 's' : ''}`
}

const formatActionName = (action: string) => {
    return action
        .replace('action_', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const formatResourceName = (resource: string) => {
    const resourceNames: Record<string, string> = {
        courses: 'Courses',
        users: 'Users',
        usergroups: 'User Groups',
        collections: 'Collections',
        organizations: 'Organizations',
        coursechapters: 'Course Chapters',
        activities: 'Activities',
        roles: 'Roles',
        dashboard: 'Dashboard',
    }
    return resourceNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1)
}

// ── Sub-components ──

const RightsDetailView = ({ rights }: { rights: any }) => {
    if (!rights || Object.keys(rights).length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No permissions configured
            </div>
        )
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(rights).map(([resource, actions]: [string, any]) => (
                <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                        {formatResourceName(resource)}
                    </div>
                    <div className="p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(actions).map(([action, enabled]: [string, any]) => (
                                <div
                                    key={action}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                                        enabled
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-gray-50 text-gray-400'
                                    }`}
                                >
                                    {enabled ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-gray-300" />
                                    )}
                                    <span>{formatActionName(action)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

const PermissionSection = ({
    title,
    icon: Icon,
    section,
    permissions,
    rights,
    onRightChange,
    onSelectAll,
}: {
    title: string
    icon: any
    section: keyof Rights
    permissions: string[]
    rights: Rights
    onRightChange: (section: keyof Rights, action: string, value: boolean) => void
    onSelectAll: (section: keyof Rights, value: boolean) => void
}) => {
    const sectionRights = rights[section] as any
    const allSelected = permissions.every((perm) => sectionRights[perm])
    const someSelected = permissions.some((perm) => sectionRights[perm]) && !allSelected

    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={() => onSelectAll(section, !allSelected)}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto transition-colors"
                >
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span className="hidden sm:inline">{allSelected ? 'Deselect all' : 'Select all'}</span>
                    <span className="sm:hidden">{allSelected ? 'Deselect' : 'Select'}</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={rights[section]?.[permission as keyof typeof rights[typeof section]] || false}
                            onChange={(e) => onRightChange(section, permission, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                            {formatActionName(permission)}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    )
}

// ── Main Component ──

function OrgRoles() {
    const { t } = useTranslation()
    const org = useOrg() as any
    const session = useLHSession() as any
    const access_token = session?.data?.tokens?.access_token
    const currentPlan = usePlan()
    const rf = org?.config?.config?.resolved_features
    const canCreateRoles = rf?.roles?.enabled === true

    // View state: 'list' | 'edit'
    const [view, setView] = useState<'list' | 'edit'>('list')
    const [selectedRole, setSelectedRole] = useState<any>(null)
    const [isCreating, setIsCreating] = useState(false)

    // List state
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'system' | 'custom'>('all')

    // Modal state
    const [viewRightsModal, setViewRightsModal] = useState(false)
    const [modalRole, setModalRole] = useState<any>(null)

    // Edit state
    const [rights, setRights] = useState<Rights>(defaultRights)

    // ── Data Fetching ──
    const { data: roles, isValidating: isLoadingRoles } = useSWR(
        org ? `${getAPIUrl()}roles/org/${org.id}` : null,
        (url) => swrFetcher(url, access_token),
        { revalidateOnFocus: false }
    )

    // ── Filter & Search ──
    const filteredRoles = useMemo(() => {
        if (!roles) return []
        let result = [...roles]

        // Filter
        if (roleFilter === 'system') {
            result = result.filter((r: any) => isSystemRole(r))
        } else if (roleFilter === 'custom') {
            result = result.filter((r: any) => !isSystemRole(r))
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((r: any) =>
                r.name?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
            )
        }

        return result
    }, [roles, searchQuery, roleFilter])

    // ── Handlers ──

    const handleCreateRole = async () => {
        if (!access_token || !org || isCreating) return
        setIsCreating(true)
        try {
            const res = await createRole({
                name: 'New Role',
                description: 'Custom role',
                org_id: org.id,
                rights: defaultRights,
            }, access_token)
            if (res.status === 200 || res.status === 201) {
                mutate(`${getAPIUrl()}roles/org/${org.id}`)
                const newRole = res.data
                setSelectedRole(newRole)
                setRights(newRole.rights || defaultRights)
                setView('edit')
                toast.success('Role created')
            } else {
                toast.error('Failed to create role')
            }
        } catch {
            toast.error('Failed to create role')
        } finally {
            setIsCreating(false)
        }
    }

    const handleRoleClick = (role: any) => {
        if (isSystemRole(role)) return // Don't navigate to edit for system roles
        setSelectedRole(role)
        setRights(role.rights || defaultRights)
        setView('edit')
    }

    const handleBackToList = () => {
        setView('list')
        setSelectedRole(null)
    }

    const handleViewRights = (role: any) => {
        setModalRole(role)
        setViewRightsModal(true)
    }

    const deleteRoleUI = async (role_id: any) => {
        const toastId = toast.loading('Deleting role...')
        const res = await deleteRole(role_id, org.id, access_token)
        if (res.status === 200) {
            mutate(`${getAPIUrl()}roles/org/${org.id}`)
            toast.success('Role deleted', { id: toastId })
        } else {
            toast.error('Failed to delete role', { id: toastId })
        }
    }

    // ── Edit Form ──

    const formik = useFormik({
        initialValues: {
            name: selectedRole?.name || '',
            description: selectedRole?.description || '',
        },
        enableReinitialize: true,
        validate: (values) => {
            const errors: any = {}
            if (!values.name) errors.name = 'Name is required'
            else if (values.name.length < 2) errors.name = 'Name must be at least 2 characters'
            if (!values.description) errors.description = 'Description is required'
            else if (values.description.length < 10) errors.description = 'Description must be at least 10 characters'
            return errors
        },
        onSubmit: async (values) => {
            if (!selectedRole) return
            const toastID = toast.loading('Saving role...')

            const formattedRights = {
                courses: {
                    action_create: rights.courses?.action_create || false,
                    action_read: rights.courses?.action_read || false,
                    action_read_own: rights.courses?.action_read_own || false,
                    action_update: rights.courses?.action_update || false,
                    action_update_own: rights.courses?.action_update_own || false,
                    action_delete: rights.courses?.action_delete || false,
                    action_delete_own: rights.courses?.action_delete_own || false,
                },
                users: {
                    action_create: rights.users?.action_create || false,
                    action_read: rights.users?.action_read || false,
                    action_update: rights.users?.action_update || false,
                    action_delete: rights.users?.action_delete || false,
                },
                usergroups: {
                    action_create: rights.usergroups?.action_create || false,
                    action_read: rights.usergroups?.action_read || false,
                    action_update: rights.usergroups?.action_update || false,
                    action_delete: rights.usergroups?.action_delete || false,
                },
                collections: {
                    action_create: rights.collections?.action_create || false,
                    action_read: rights.collections?.action_read || false,
                    action_update: rights.collections?.action_update || false,
                    action_delete: rights.collections?.action_delete || false,
                },
                organizations: {
                    action_create: rights.organizations?.action_create || false,
                    action_read: rights.organizations?.action_read || false,
                    action_update: rights.organizations?.action_update || false,
                    action_delete: rights.organizations?.action_delete || false,
                },
                coursechapters: {
                    action_create: rights.coursechapters?.action_create || false,
                    action_read: rights.coursechapters?.action_read || false,
                    action_update: rights.coursechapters?.action_update || false,
                    action_delete: rights.coursechapters?.action_delete || false,
                },
                activities: {
                    action_create: rights.activities?.action_create || false,
                    action_read: rights.activities?.action_read || false,
                    action_update: rights.activities?.action_update || false,
                    action_delete: rights.activities?.action_delete || false,
                },
                roles: {
                    action_create: rights.roles?.action_create || false,
                    action_read: rights.roles?.action_read || false,
                    action_update: rights.roles?.action_update || false,
                    action_delete: rights.roles?.action_delete || false,
                },
                dashboard: {
                    action_access: rights.dashboard?.action_access || false,
                },
            }

            const res = await updateRole(selectedRole.id, {
                name: values.name,
                description: values.description,
                org_id: org.id,
                rights: formattedRights,
            }, access_token)
            if (res.status === 200) {
                mutate(`${getAPIUrl()}roles/org/${org.id}`)
                toast.success('Role saved', { id: toastID })
            } else {
                toast.error('Failed to save role', { id: toastID })
            }
        },
    })

    const handleRightChange = (section: keyof Rights, action: string, value: boolean) => {
        setRights((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [action]: value,
            } as any,
        }))
    }

    const handleSelectAll = (section: keyof Rights, value: boolean) => {
        setRights((prev) => ({
            ...prev,
            [section]: Object.keys(prev[section]).reduce((acc, key) => ({
                ...acc,
                [key]: value,
            }), {} as any),
        }))
    }

    const handlePredefinedRole = (roleKey: string) => {
        const role = predefinedRoles[roleKey]
        if (role) {
            formik.setFieldValue('name', role.name)
            formik.setFieldValue('description', role.description)
            setRights(role.rights as Rights)
        }
    }

    // ── Render: Edit View ──

    if (view === 'edit' && selectedRole) {
        return (
            <div>
                <FormLayout onSubmit={formik.handleSubmit}>
                    <div className="space-y-3">
                        {/* ── ACTION ROW ── */}
                        <div className="flex items-center justify-between">
                            {/* Left: Back */}
                            <button
                                onClick={handleBackToList}
                                className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                <span>Back to roles</span>
                            </button>

                            {/* Right: Cancel + Save */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleBackToList}
                                    className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <Form.Submit asChild>
                                    <button
                                        type="submit"
                                        disabled={formik.isSubmitting}
                                        className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-transparent bg-black text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {formik.isSubmitting ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Role'
                                        )}
                                    </button>
                                </Form.Submit>
                            </div>
                        </div>

                        {/* ── BASIC INFORMATION ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Basic Information</h3>
                            <div className="space-y-4">
                                <FormField name="name">
                                    <FormLabelAndMessage label="Role Name" message={formik.errors.name} />
                                    <Form.Control asChild>
                                        <Input
                                            onChange={formik.handleChange}
                                            value={formik.values.name}
                                            type="text"
                                            required
                                            placeholder="e.g. Course Manager"
                                        />
                                    </Form.Control>
                                </FormField>

                                <FormField name="description">
                                    <FormLabelAndMessage label="Description" message={formik.errors.description} />
                                    <Form.Control asChild>
                                        <Textarea
                                            onChange={formik.handleChange}
                                            value={formik.values.description}
                                            required
                                            placeholder="Describe what this role can do..."
                                        />
                                    </Form.Control>
                                </FormField>
                            </div>
                        </div>

                        {/* ── PREDEFINED RIGHTS ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Predefined Rights</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.keys(predefinedRoles).map((roleKey) => (
                                    <button
                                        key={roleKey}
                                        type="button"
                                        onClick={() => handlePredefinedRole(roleKey)}
                                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left bg-white shadow-sm hover:shadow-md"
                                    >
                                        <div className="font-medium text-gray-900 text-sm">
                                            {predefinedRoles[roleKey].name}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {predefinedRoles[roleKey].description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── PERMISSIONS ── */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Permissions</h3>
                            <div className="space-y-4">
                                <PermissionSection
                                    title="Courses"
                                    icon={BookOpen}
                                    section="courses"
                                    permissions={['action_create', 'action_read', 'action_read_own', 'action_update', 'action_update_own', 'action_delete', 'action_delete_own']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Users"
                                    icon={Users}
                                    section="users"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="User Groups"
                                    icon={UserCheck}
                                    section="usergroups"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Collections"
                                    icon={FolderOpen}
                                    section="collections"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Organizations"
                                    icon={Building}
                                    section="organizations"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Course Chapters"
                                    icon={FileText}
                                    section="coursechapters"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Activities"
                                    icon={Activity}
                                    section="activities"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Roles"
                                    icon={Shield}
                                    section="roles"
                                    permissions={['action_create', 'action_read', 'action_update', 'action_delete']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                                <PermissionSection
                                    title="Dashboard"
                                    icon={Monitor}
                                    section="dashboard"
                                    permissions={['action_access']}
                                    rights={rights}
                                    onRightChange={handleRightChange}
                                    onSelectAll={handleSelectAll}
                                />
                            </div>
                        </div>
                    </div>
                </FormLayout>
            </div>
        )
    }

    // ── Render: List View ──

    return (
        <>
            {/* Toolbar Row */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search roles..."
                        className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                    />
                </div>

                <span className="text-xs text-gray-400 whitespace-nowrap">
                    {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}
                </span>

                <div className="flex-1" />

                {/* Create Role button */}
                {canCreateRoles ? (
                    <Button variant="primary" size="small" onClick={handleCreateRole} disabled={isCreating} className="gap-x-1.5">
                        {isCreating ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            '+'
                        )}
                        &nbsp;&nbsp;Create
                    </Button>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed transition-colors"
                        >
                            <Lock size={14} />
                            <span>Create</span>
                        </button>
                        <PlanBadge currentPlan={currentPlan} requiredPlan={(rf?.roles?.required_plan || 'pro') as PlanLevel} />
                    </div>
                )}

                {/* Filter dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Filter roles">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 4.5H12.5M4.5 7.5H10.5M6.5 10.5H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[170px] rounded-lg border border-gray-200 bg-white p-1 shadow-md" sideOffset={6}>
                        {[
                            { value: 'all', label: 'All roles' },
                            { value: 'system', label: 'System roles' },
                            { value: 'custom', label: 'Custom roles' },
                        ].map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => setRoleFilter(option.value as 'all' | 'system' | 'custom')}
                                className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                            >
                                <span className="text-gray-700 text-xs">{option.label}</span>
                                {roleFilter === option.value && <Check size={12} className="text-gray-500" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Role Cards */}
            <div className="space-y-3">
                {isLoadingRoles ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 size={36} className="animate-spin text-gray-300" />
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                        <Shield size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-400">
                            {searchQuery || roleFilter !== 'all'
                                ? 'No roles match your search'
                                : 'No roles yet'
                            }
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                            {searchQuery || roleFilter !== 'all'
                                ? 'Try a different search term or filter'
                                : 'Click "Create" to add your first role'
                            }
                        </p>
                    </div>
                ) : (
                    filteredRoles.map((role: any) => {
                        const isSystem = isSystemRole(role)
                        return (
                            <div
                                key={role.id}
                                onClick={() => handleRoleClick(role)}
                                className={`w-full text-left px-5 py-4 rounded-xl bg-white shadow-borders-base transition-colors flex items-center justify-between group ${
                                    isSystem ? 'opacity-70 cursor-default' : 'hover:border-gray-200 cursor-pointer'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Shield size={18} className="text-gray-400 flex-shrink-0" />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {role.name}
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
                                    <DropdownMenuContent align="end" className="w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewRights(role)
                                            }}
                                            className="gap-2 text-sm rounded-md px-2.5 py-1.5 cursor-pointer"
                                        >
                                            <Eye size={14} />
                                            View Rights
                                        </DropdownMenuItem>
                                        {!isSystem && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <ConfirmationModal
                                                    confirmationButtonText="Delete"
                                                    confirmationMessage={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`}
                                                    dialogTitle="Delete Role"
                                                    dialogTrigger={
                                                        <div
                                                            className="flex items-center gap-2 text-sm rounded-md px-2.5 py-1.5 text-red-600 cursor-pointer hover:bg-red-50"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            role="menuitem"
                                                            tabIndex={0}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </div>
                                                    }
                                                    functionToExecute={() => {
                                                        deleteRoleUI(role.id)
                                                    }}
                                                    status="warning"
                                                />
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })
                )}
            </div>

            {/* View Rights Modal */}
            <Modal
                isDialogOpen={viewRightsModal && modalRole !== null}
                onOpenChange={() => setViewRightsModal(!viewRightsModal)}
                minHeight="md"
                minWidth="lg"
                dialogContent={<RightsDetailView rights={modalRole?.rights} />}
                dialogTitle={`Rights: ${modalRole?.name || ''}`}
                dialogDescription="Detailed view of all permissions for this role."
            />
        </>
    )
}

export default OrgRoles
