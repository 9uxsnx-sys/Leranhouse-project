import { useCourse, useCourseDispatch } from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getAPIUrl } from '@services/config/config'
import { bulkAddContributors, bulkRemoveContributors, editContributor } from '@services/courses/courses'
import { searchOrgContent } from '@services/search/search'
import { swrFetcher } from '@services/utils/ts/requests'
import { Check, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useTranslation } from 'react-i18next'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { useDebounce } from '@/hooks/useDebounce'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import UserAvatar from '@components/Objects/UserAvatar'

type EditCourseContributorsProps = {
    orgslug: string
    course_uuid?: string
}

type ContributorRole = 'CREATOR' | 'CONTRIBUTOR' | 'MAINTAINER' | 'REPORTER'
type ContributorStatus = 'ACTIVE' | 'INACTIVE'

interface SearchUser {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_image: string;
    avatar_url?: string;
    id: number;
    user_uuid: string;
    creation_date?: string;
}

interface Contributor {
    id: string;
    user_id: string;
    authorship: ContributorRole;
    authorship_status: ContributorStatus;
    creation_date: string;
    user: {
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar_image: string;
        user_uuid: string;
    }
}

// Helper function for date formatting
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

function EditCourseContributors(props: EditCourseContributorsProps) {
    const { t } = useTranslation()
    const session = useLHSession() as any;
    const access_token = session?.data?.tokens?.access_token;
    const course = useCourse() as any;
    const { isLoading, courseStructure } = course as any;
    const dispatchCourse = useCourseDispatch() as any;
    const org = useOrg() as any;

    const { data: contributors } = useSWR<Contributor[]>(
        courseStructure ? `${getAPIUrl()}courses/${courseStructure.course_uuid}/contributors` : null,
        (url: string) => swrFetcher(url, access_token),
        { revalidateOnFocus: false }
    );

    const [isOpenToContributors, setIsOpenToContributors] = useState<boolean | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedContributors, setSelectedContributors] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading && courseStructure?.open_to_contributors !== undefined) {
            setIsOpenToContributors(courseStructure.open_to_contributors);
        }
    }, [isLoading, courseStructure]);

    useEffect(() => {
        if (!isLoading && courseStructure?.open_to_contributors !== undefined && isOpenToContributors !== undefined) {
            if (isOpenToContributors !== courseStructure.open_to_contributors) {
                dispatchCourse({ type: 'setIsNotSaved' });
                const updatedCourse = {
                    ...courseStructure,
                    open_to_contributors: isOpenToContributors,
                };
                dispatchCourse({ type: 'setCourseStructure', payload: updatedCourse });
            }
        }
    }, [isLoading, isOpenToContributors, courseStructure, dispatchCourse]);

    useEffect(() => {
        const searchUsers = async () => {
            if (debouncedSearch.trim().length === 0) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await searchOrgContent(
                    org?.slug,
                    debouncedSearch,
                    1,
                    5,
                    null,
                    access_token
                );

                if (response.success && response.data?.users) {
                    const users = response.data.users.map((user: SearchUser) => ({
                        ...user,
                        avatar_url: user.avatar_image ? getUserAvatarMediaDirectory(user.user_uuid, user.avatar_image) : ''
                    }));
                    setSearchResults(users);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error searching users:', error);
                setSearchResults([]);
            }
            setIsSearching(false);
        };

        if (org?.slug && access_token) {
            searchUsers();
        }
    }, [debouncedSearch, org?.slug, access_token]);

    const addSearchUserAsContributor = async (username: string, userUuid: string, role: ContributorRole) => {
        try {
            const response = await bulkAddContributors(courseStructure.course_uuid, [username], access_token);
            if (response.status === 200) {
                await editContributor(courseStructure.course_uuid, userUuid, role, 'ACTIVE', access_token);
                mutate(`${getAPIUrl()}courses/${courseStructure.course_uuid}/contributors`);
                toast.success(t('dashboard.courses.contributors.toasts.add_user_success', { username, role: t(`dashboard.courses.contributors.roles.${role.toLowerCase()}`) }));
            }
        } catch (error) {
            toast.error(t('dashboard.courses.contributors.toasts.add_user_error', { username }));
        }
    };

    const updateContributor = async (contributorId: string, data: { authorship?: ContributorRole; authorship_status?: ContributorStatus }) => {
        try {
            // Find the current contributor to get their current values
            const currentContributor = contributors?.find(c => c.user_id === contributorId);
            if (!currentContributor) return;

            // Don't allow editing if the user is a CREATOR
            if (currentContributor.authorship === 'CREATOR') {
                toast.error(t('dashboard.courses.contributors.toasts.cannot_modify_creator'));
                return;
            }

            // Always send both values in the request
            const updatedData = {
                authorship: data.authorship || currentContributor.authorship,
                authorship_status: data.authorship_status || currentContributor.authorship_status
            };

            const res = await editContributor(courseStructure.course_uuid, contributorId, updatedData.authorship, updatedData.authorship_status, access_token);
            if (res.status === 200 && res.data?.status === 'success') {
                toast.success(res.data.detail || t('dashboard.courses.contributors.toasts.update_success'));
                mutate(`${getAPIUrl()}courses/${courseStructure.course_uuid}/contributors`);
            } else {
                toast.error(t('dashboard.courses.contributors.toasts.update_error', { detail: res.data?.detail || t('dashboard.courses.contributors.toasts.update_failed') }));
            }
        } catch (error) {
            toast.error(t('dashboard.courses.contributors.toasts.update_failed'));
        }
    };

    const RoleDropdown = ({ contributor }: { contributor: Contributor }) => {
        if (contributor.authorship === 'CREATOR') {
            return (
                <span className="opacity-50 text-gray-700 text-sm">
                    {t(`dashboard.courses.contributors.roles.${contributor.authorship.toLowerCase()}`)}
                </span>
            );
        }

        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <span className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-gray-700 text-sm">
                        {t(`dashboard.courses.contributors.roles.${contributor.authorship.toLowerCase()}`)}
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="center"
                    className="min-w-[120px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
                    sideOffset={6}
                >
                    {['CONTRIBUTOR', 'MAINTAINER', 'REPORTER'].map((role) => (
                        <DropdownMenuItem
                            key={role}
                            onClick={() => updateContributor(contributor.user_id, { authorship: role as ContributorRole })}
                            className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                        >
                            <span className="text-gray-700 text-xs">{t(`dashboard.courses.contributors.roles.${role.toLowerCase()}`)}</span>
                            {contributor.authorship === role && <Check size={12} className="text-gray-500" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const StatusToggle = ({ contributor }: { contributor: Contributor }) => {
        const isActive = contributor.authorship_status === 'ACTIVE';
        const isCreator = contributor.authorship === 'CREATOR';

        const handleToggle = () => {
            if (isCreator) return;
            const newStatus: ContributorStatus = isActive ? 'INACTIVE' : 'ACTIVE';
            updateContributor(contributor.user_id, { authorship_status: newStatus });
        };

        return (
            <span
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 text-sm ${
                    isCreator
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ms-1 -my-0.5 transition-colors'
                }`}
            >
                <span className={`w-2.5 h-2.5 rounded ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {isActive
                    ? t('dashboard.courses.contributors.statuses.active')
                    : t('dashboard.courses.contributors.statuses.inactive')}
            </span>
        );
    };

    const SearchUserRoleDropdown = ({ user }: { user: SearchUser }) => {
        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <span className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-gray-700 text-sm">
                        {t('dashboard.courses.contributors.roles.user')}
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="center"
                    className="min-w-[120px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
                    sideOffset={6}
                >
                    {(['CONTRIBUTOR', 'MAINTAINER', 'REPORTER'] as ContributorRole[]).map((role) => (
                        <DropdownMenuItem
                            key={role}
                            onClick={() => addSearchUserAsContributor(user.username, user.user_uuid, role)}
                            className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                        >
                            <span className="text-gray-700 text-xs">{t(`dashboard.courses.contributors.roles.${role.toLowerCase()}`)}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // Creator is always pinned first; the rest keep the server order (oldest first).
    const orderContributors = (list: Contributor[] | undefined) => {
        if (!list) return [];
        const creator = list.find(c => c.authorship === 'CREATOR');
        const others = list.filter(c => c.authorship !== 'CREATOR');
        return creator ? [creator, ...others] : others;
    };

    const selectedSet = new Set<string | number>(selectedContributors);
    const handleSelectionChange = (next: Set<string | number>) => {
        setSelectedContributors(Array.from(next).map(String));
    };

    const handleBulkRemove = async () => {
        if (selectedContributors.length === 0) return;

        try {
            // Get the usernames from the selected contributors
            const selectedUsernames = contributors
                ?.filter(c => selectedContributors.includes(c.user_id))
                .map(c => c.user.username) || [];

            const response = await bulkRemoveContributors(
                courseStructure.course_uuid, 
                selectedUsernames, // Send as raw array, not stringified
                access_token
            );
            
            if (response.status === 200) {
                toast.success(t('dashboard.courses.contributors.toasts.remove_success', { count: selectedContributors.length }));
                // Refresh contributors list
                mutate(`${getAPIUrl()}courses/${courseStructure.course_uuid}/contributors`);
                // Clear selection
                setSelectedContributors([]);
            }
        } catch (error) {
            console.error('Error removing contributors:', error);
            toast.error(t('dashboard.courses.contributors.toasts.remove_failed'));
        }
    };

    const searching = searchQuery.trim().length > 0;

    const contributorColumns: Column<Contributor>[] = [
        {
            key: 'name',
            header: t('dashboard.courses.contributors.table.name'),
            sortable: true,
            value: (c) => `${c.user.first_name} ${c.user.last_name}`,
            render: (c) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                        width={30}
                        border='border-2'
                        avatar_url={c.user.avatar_image ? getUserAvatarMediaDirectory(c.user.user_uuid, c.user.avatar_image) : ''}
                        rounded="rounded-full"
                        predefined_avatar={c.user.avatar_image === '' ? 'empty' : undefined}
                    />
                    <span className="font-medium text-gray-900 truncate">{c.user.first_name} {c.user.last_name}</span>
                </div>
            ),
        },
        {
            key: 'username',
            header: t('dashboard.courses.contributors.table.username'),
            width: '170px',
            render: (c) => <span className="text-gray-500">@{c.user.username}</span>,
        },
        {
            key: 'email',
            header: t('dashboard.courses.contributors.table.email'),
            width: '240px',
            render: (c) => <span className="text-gray-500 truncate">{c.user.email}</span>,
        },
        {
            key: 'role',
            header: t('dashboard.courses.contributors.table.role'),
            width: '160px',
            render: (c) => (
                <span onClick={(e) => e.stopPropagation()}>
                    <RoleDropdown contributor={c} />
                </span>
            ),
        },
        {
            key: 'status',
            header: t('dashboard.courses.contributors.table.status'),
            width: '140px',
            render: (c) => (
                <span onClick={(e) => e.stopPropagation()}>
                    <StatusToggle contributor={c} />
                </span>
            ),
        },
        {
            key: 'added',
            header: t('dashboard.courses.contributors.table.added_on'),
            width: '150px',
            align: 'right',
            sortable: true,
            value: (c) => c.creation_date,
            render: (c) => (
                <span className="text-[13px] text-gray-400 whitespace-nowrap">{formatDate(c.creation_date)}</span>
            ),
        },
    ];

    const searchColumns: Column<SearchUser>[] = [
        {
            key: 'name',
            header: t('dashboard.courses.contributors.table.name'),
            sortable: true,
            value: (u) => `${u.first_name} ${u.last_name}`,
            render: (u) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                        width={30}
                        border='border-2'
                        avatar_url={u.avatar_url || ''}
                        rounded="rounded-full"
                        predefined_avatar={u.avatar_image ? undefined : 'empty'}
                    />
                    <span className="font-medium text-gray-900 truncate">{u.first_name} {u.last_name}</span>
                </div>
            ),
        },
        {
            key: 'username',
            header: t('dashboard.courses.contributors.table.username'),
            width: '170px',
            render: (u) => <span className="text-gray-500">@{u.username}</span>,
        },
        {
            key: 'email',
            header: t('dashboard.courses.contributors.table.email'),
            width: '240px',
            render: (u) => <span className="text-gray-500 truncate">{u.email}</span>,
        },
        {
            key: 'role',
            header: t('dashboard.courses.contributors.table.role'),
            width: '160px',
            render: (u) => {
                const existing = contributors?.find(c => c.user.username === u.username);
                return (
                    <span onClick={(e) => e.stopPropagation()}>
                        {existing ? <RoleDropdown contributor={existing} /> : <SearchUserRoleDropdown user={u} />}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: t('dashboard.courses.contributors.table.status'),
            width: '140px',
            render: (u) => {
                const existing = contributors?.find(c => c.user.username === u.username);
                return (
                    <span onClick={(e) => e.stopPropagation()}>
                        {existing ? (
                            <StatusToggle contributor={existing} />
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                                <span className="w-2.5 h-2.5 rounded bg-red-500" />
                                {t('dashboard.courses.contributors.statuses.inactive')}
                            </span>
                        )}
                    </span>
                );
            },
        },
        {
            key: 'added',
            header: t('dashboard.courses.contributors.table.added_on'),
            width: '150px',
            align: 'right',
            render: (u) => (
                <span className="text-[13px] text-gray-400 whitespace-nowrap">
                    {u.creation_date ? formatDate(u.creation_date) : '—'}
                </span>
            ),
        },
    ];

    return (
        <div>
            {courseStructure && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative w-80">
                            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('dashboard.courses.contributors.search.placeholder')}
                                className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1" />
                        <button
                            onClick={() => setIsOpenToContributors((prev: boolean | undefined) => !prev)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                            <span className={`w-2.5 h-2.5 rounded ${isOpenToContributors ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isOpenToContributors 
                                ? t('dashboard.courses.contributors.open_to_contributors.title')
                                : t('dashboard.courses.contributors.closed_to_contributors.title')}
                        </button>
                        {selectedContributors.length > 0 && (
                            <button
                                onClick={handleBulkRemove}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-red-600 border-gray-200 hover:bg-gray-50"
                            >
                                {t('dashboard.courses.contributors.actions.remove_count', { count: selectedContributors.length })}
                            </button>
                        )}
                    </div>

                    <TableCard>
                        {searching ? (
                            isSearching ? (
                                <div className="py-16 text-center text-sm text-gray-500">
                                    {t('dashboard.courses.contributors.search.searching')}
                                </div>
                            ) : searchResults.length === 0 ? (
                                <EmptyState
                                    icon={Search}
                                    title={t('dashboard.courses.contributors.search.no_results')}
                                />
                            ) : (
                                <DataTable columns={searchColumns} rows={searchResults} />
                            )
                        ) : (contributors?.length ?? 0) === 0 ? (
                            <EmptyState
                                icon={Search}
                                title={t('dashboard.courses.contributors.empty')}
                            />
                        ) : (
                            <DataTable
                                columns={contributorColumns}
                                rows={orderContributors(contributors)}
                                selectable
                                getRowId={(c) => c.user_id}
                                selectedIds={selectedSet}
                                onSelectionChange={handleSelectionChange}
                                isRowSelectable={(c) => c.authorship !== 'CREATOR'}
                            />
                        )}
                    </TableCard>
                </div>
            )}
        </div>
    );
}

export default EditCourseContributors;
