import { useCourse, useCourseDispatch } from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getAPIUrl } from '@services/config/config'
import { bulkAddContributors, bulkRemoveContributors, editContributor } from '@services/courses/courses'
import { searchOrgContent } from '@services/search/search'
import { swrFetcher } from '@services/utils/ts/requests'
import { Check, ChevronDown, Search, ArrowUpDown } from 'lucide-react'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebounce } from '@/hooks/useDebounce'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import UserAvatar from '@components/Objects/UserAvatar'
import { IconButton } from '@/components/ui/icon-button'

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
    const [masterCheckboxChecked, setMasterCheckboxChecked] = useState(false);
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest'>('newest');

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

    useEffect(() => {
        if (contributors) {
            const nonCreatorContributors = contributors.filter(c => c.authorship !== 'CREATOR');
            setMasterCheckboxChecked(
                nonCreatorContributors.length > 0 && 
                selectedContributors.length === nonCreatorContributors.length
            );
        }
    }, [contributors, selectedContributors]);

    const addSearchUserAsContributor = async (username: string, userUuid: string, role: ContributorRole) => {
        try {
            const response = await bulkAddContributors(courseStructure.course_uuid, [username], access_token);
            if (response.status === 200) {
                await editContributor(courseStructure.course_uuid, userUuid, role, 'ACTIVE', access_token);
                mutate(`${getAPIUrl()}courses/${courseStructure.course_uuid}/contributors`);
                toast.success(`${username} added as ${t(`dashboard.courses.contributors.roles.${role.toLowerCase()}`)}`);
            }
        } catch (error) {
            toast.error(`Failed to add ${username} as contributor`);
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
                    <span className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-gray-700 inline-flex items-center gap-1 text-sm">
                        {t(`dashboard.courses.contributors.roles.${contributor.authorship.toLowerCase()}`)}
                        <ChevronDown size={14} className="text-gray-400" />
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
                        : 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 -my-0.5 transition-colors'
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
                    <span className="cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors text-gray-700 inline-flex items-center gap-1 text-sm">
                        User
                        <ChevronDown size={14} className="text-gray-400" />
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

    const sortContributors = (contributors: Contributor[] | undefined) => {
        if (!contributors) return [];
        
        // Find the creator and other contributors
        const creator = contributors.find(c => c.authorship === 'CREATOR');
        const otherContributors = contributors.filter(c => c.authorship !== 'CREATOR');
        
        // Sort the non-creator contributors based on the selected sort option
        const sortedOthers = [...otherContributors].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return `${a.user.first_name} ${a.user.last_name}`.localeCompare(`${b.user.first_name} ${b.user.last_name}`);
                case 'name-desc':
                    return `${b.user.first_name} ${b.user.last_name}`.localeCompare(`${a.user.first_name} ${a.user.last_name}`);
                case 'newest':
                    return new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime();
                case 'oldest':
                    return new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime();
                default:
                    return 0;
            }
        });
        
        // Return array with creator at the top, followed by sorted contributors
        return creator ? [creator, ...sortedOthers] : sortedOthers;
    };

    const handleContributorSelect = (userId: string) => {
        setSelectedContributors(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
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

    return (
        <div>
            {courseStructure && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative w-80">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by users..."
                                className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
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
                                Remove {selectedContributors.length}
                            </button>
                        )}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Sort contributors">
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
                            <div>
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="w-[30px]">
                                                {!searchQuery.trim() && (
                                                    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={masterCheckboxChecked}
                                                            onChange={(e) => {
                                                                setMasterCheckboxChecked(e.target.checked);
                                                                if (contributors) {
                                                                    if (e.target.checked) {
                                                                        const nonCreatorContributors = contributors
                                                                            .filter(c => c.authorship !== 'CREATOR')
                                                                            .map(c => c.user_id);
                                                                        setSelectedContributors(nonCreatorContributors);
                                                                    } else {
                                                                        setSelectedContributors([]);
                                                                    }
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
                                            <TableHead className="w-[160px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.name')}</span></TableHead>
                                            <TableHead className="w-[130px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.username')}</span></TableHead>
                                            <TableHead className="w-[180px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.email')}</span></TableHead>
                                            <TableHead className="w-[130px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.role')}</span></TableHead>
                                            <TableHead className="w-[120px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.status')}</span></TableHead>
                                            <TableHead className="w-[140px]"><span className="text-sm font-semibold tracking-wide uppercase text-gray-500">{t('dashboard.courses.contributors.table.added_on')}</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchQuery.trim() ? (
                                            isSearching ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-4">
                                                        {t('dashboard.courses.contributors.search.searching')}
                                                    </TableCell>
                                                </TableRow>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map((user) => {
                                                    const existingContributor = contributors?.find(
                                                        c => c.user.username === user.username
                                                    );
                                                    return (
                                                        <TableRow key={user.username}>
                                                            <TableCell>
                                                                <div className="w-4 h-4" />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <UserAvatar
                                                                        width={30}
                                                                        border='border-2'
                                                                        avatar_url={user.avatar_url || ''}
                                                                        rounded="rounded-full"
                                                                        predefined_avatar={user.avatar_image ? undefined : 'empty'}
                                                                    />
                                                                    <span className="font-medium truncate">{user.first_name} {user.last_name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-gray-500">
                                                                @{user.username}
                                                            </TableCell>
                                                            <TableCell className="text-gray-500">
                                                                {user.email}
                                                            </TableCell>
                                                            <TableCell>
                                                                {existingContributor ? (
                                                                    <RoleDropdown contributor={existingContributor} />
                                                                ) : (
                                                                    <SearchUserRoleDropdown user={user} />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {existingContributor ? (
                                                                    <StatusToggle contributor={existingContributor} />
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                                                                        <span className="w-2.5 h-2.5 rounded bg-red-500" />
                                                                        {t('dashboard.courses.contributors.statuses.inactive')}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-gray-500 text-sm">
                                                                {existingContributor
                                                                    ? formatDate(existingContributor.creation_date)
                                                                    : user.creation_date
                                                                        ? formatDate(user.creation_date)
                                                                        : <span className="text-gray-400">-</span>}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-4">
                                                        {t('dashboard.courses.contributors.search.no_results')}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        ) : (
                                            sortContributors(contributors)?.map((contributor) => (
                                                <TableRow 
                                                    key={`${contributor.user_id}-${contributor.id}`}
                                                    className={`${selectedContributors.includes(contributor.user_id) ? 'bg-gray-50' : ''} ${contributor.authorship !== 'CREATOR' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                                    onClick={(e) => {
                                                        if (
                                                            e.target instanceof HTMLElement && 
                                                            (e.target.closest('button') || 
                                                             e.target.closest('input[type="checkbox"]') ||
                                                             e.target.closest('[role="menuitem"]') ||
                                                             e.target.closest('[role="menu"]'))
                                                        ) {
                                                            return;
                                                        }
                                                        if (contributor.authorship !== 'CREATOR') {
                                                            handleContributorSelect(contributor.user_id);
                                                        }
                                                    }}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedContributors.includes(contributor.user_id)}
                                                                onChange={() => handleContributorSelect(contributor.user_id)}
                                                                disabled={contributor.authorship === 'CREATOR'}
                                                                className="sr-only peer disabled:opacity-50"
                                                            />
                                                            <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors peer-disabled:opacity-50">
                                                                <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                                                            </div>
                                                        </label>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <UserAvatar
                                                                width={30}
                                                                border='border-2'
                                                                avatar_url={contributor.user.avatar_image ? getUserAvatarMediaDirectory(contributor.user.user_uuid, contributor.user.avatar_image) : ''}
                                                                rounded="rounded-full"
                                                                predefined_avatar={contributor.user.avatar_image === '' ? 'empty' : undefined}
                                                            />
                                                            <span className="font-medium truncate">{contributor.user.first_name} {contributor.user.last_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        @{contributor.user.username}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        {contributor.user.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        <RoleDropdown contributor={contributor} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusToggle contributor={contributor} />
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">
                                                        {formatDate(contributor.creation_date)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditCourseContributors;
