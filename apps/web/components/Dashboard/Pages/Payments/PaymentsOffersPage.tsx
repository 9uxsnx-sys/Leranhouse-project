'use client'
import i18n from '@/lib/i18n'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import {
    BookOpen,
    Check,
    ChevronLeft,
    ChevronRight,
    Headphones,
    Layers,
    Loader2,
    Search,
} from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { ConceptIcon } from '@components/ui/icons'
import { IconButton } from '@/components/ui/icon-button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAPIUrl } from '@services/config/config'
import { updateCourse } from '@services/courses/courses'
import { updateCollection } from '@services/courses/collections'
import { updatePodcast } from '@services/podcasts/podcasts'
import { swrFetcher } from '@services/utils/ts/requests'

const ITEMS_PER_PAGE = 10

type ResourceKind = 'course' | 'podcast' | 'collection'
type AccessMode = 'public' | 'users_only' | 'paid'

const ACCESS_DOT: Record<AccessMode, string> = {
    public: 'bg-emerald-500',
    users_only: 'bg-amber-500',
    paid: 'bg-indigo-500',
}

type SortBy = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest'

interface OfferRow {
    key: string
    kind: ResourceKind
    uuid: string
    name: string
    description: string
    price_amount: number | null
    access_type: AccessMode
    published: boolean
    creation_date: string
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return '—'
    }
}

function toList(value: any): any[] {
    return Array.isArray(value) ? value : value?.data || []
}

export default function PaymentsOffersPage() {
    const { t } = useTranslation()
    const org = useOrg() as any
    const session = useLHSession() as any
    const access_token = session?.data?.tokens?.access_token

    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [drafts, setDrafts] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [justSaved, setJustSaved] = useState(false)

    const [kindFilter, setKindFilter] = useState<'' | ResourceKind>('')
    const [accessFilter, setAccessFilter] = useState<'' | AccessMode>('')
    const [priceFilter, setPriceFilter] = useState<'' | 'none' | 'set' | 'free'>('')
    const [statusFilter, setStatusFilter] = useState<'' | 'published' | 'draft'>('')
    const [sortBy, setSortBy] = useState<SortBy>('name-asc')

    const coursesKey =
        org?.slug && access_token
            ? `${getAPIUrl()}courses/org_slug/${org.slug}/page/1/limit/500?include_unpublished=true`
            : null
    const podcastsKey =
        org?.slug && access_token
            ? `${getAPIUrl()}podcasts/org_slug/${org.slug}/page/1/limit/100?include_unpublished=true`
            : null
    const collectionsKey =
        org?.id && access_token
            ? `${getAPIUrl()}collections/org/${org.id}/page/1/limit/100`
            : null

    const {
        data: coursesData,
        error: coursesError,
        isValidating: coursesValidating,
        mutate: mutateCourses,
    } = useSWR(coursesKey, (url: string) => swrFetcher(url, access_token), {
        revalidateOnFocus: false,
    })
    const {
        data: podcastsData,
        error: podcastsError,
        isValidating: podcastsValidating,
        mutate: mutatePodcasts,
    } = useSWR(podcastsKey, (url: string) => swrFetcher(url, access_token), {
        revalidateOnFocus: false,
    })
    const {
        data: collectionsData,
        error: collectionsError,
        isValidating: collectionsValidating,
        mutate: mutateCollections,
    } = useSWR(collectionsKey, (url: string) => swrFetcher(url, access_token), {
        revalidateOnFocus: false,
    })

    const resources = useMemo<OfferRow[]>(() => {
        const courses: OfferRow[] = toList(coursesData).map((course: any) => ({
            key: `course:${course.course_uuid}`,
            kind: 'course',
            uuid: course.course_uuid,
            name: course.name || '—',
            description: course.description || '',
            price_amount: typeof course.price_amount === 'number' ? course.price_amount : null,
            access_type: (course.access_type ||
                (course.public ? 'public' : 'users_only')) as AccessMode,
            published: Boolean(course.published),
            creation_date: course.creation_date || '',
        }))

        const podcasts: OfferRow[] = toList(podcastsData).map((podcast: any) => ({
            key: `podcast:${podcast.podcast_uuid}`,
            kind: 'podcast',
            uuid: podcast.podcast_uuid,
            name: podcast.name || '—',
            description: podcast.description || '',
            price_amount: typeof podcast.price_amount === 'number' ? podcast.price_amount : null,
            access_type: (podcast.access_type ||
                (podcast.public ? 'public' : 'users_only')) as AccessMode,
            published: Boolean(podcast.published),
            creation_date: podcast.creation_date || '',
        }))

        const collections: OfferRow[] = toList(collectionsData).map((collection: any) => ({
            key: `collection:${collection.collection_uuid}`,
            kind: 'collection',
            uuid: collection.collection_uuid,
            name: collection.name || '—',
            description: collection.description || '',
            price_amount:
                typeof collection.price_amount === 'number' ? collection.price_amount : null,
            access_type: (collection.access_type ||
                (collection.public ? 'public' : 'users_only')) as AccessMode,
            published: Boolean(collection.published),
            creation_date: collection.creation_date || '',
        }))

        return [...courses, ...podcasts, ...collections]
    }, [coursesData, podcastsData, collectionsData])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        const result = resources.filter((row) => {
            if (query && !`${row.name} ${row.description}`.toLowerCase().includes(query)) {
                return false
            }
            if (kindFilter && row.kind !== kindFilter) return false
            if (accessFilter && row.access_type !== accessFilter) return false
            if (statusFilter === 'published' && !row.published) return false
            if (statusFilter === 'draft' && row.published) return false
            if (priceFilter === 'none' && row.price_amount !== null) return false
            if (priceFilter === 'free' && row.price_amount !== 0) return false
            if (priceFilter === 'set' && row.price_amount === null) return false
            if (priceFilter === 'set' && row.price_amount === 0) return false
            return true
        })

        result.sort((a, b) => {
            switch (sortBy) {
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                case 'price-asc':
                    return (a.price_amount ?? -1) - (b.price_amount ?? -1)
                case 'price-desc':
                    return (b.price_amount ?? -1) - (a.price_amount ?? -1)
                case 'newest':
                    return (
                        new Date(b.creation_date).getTime() -
                        new Date(a.creation_date).getTime()
                    )
                case 'name-asc':
                default:
                    return a.name.localeCompare(b.name)
            }
        })

        return result
    }, [resources, search, kindFilter, accessFilter, statusFilter, priceFilter, sortBy])

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
    const currentPage = Math.min(page, totalPages)
    const paged = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const isInitialLoading =
        (!coursesData && coursesValidating) ||
        (!podcastsData && podcastsValidating) ||
        (!collectionsData && collectionsValidating)
    const loadError = coursesError || podcastsError || collectionsError

    useEffect(() => {
        setPage(1)
    }, [search, kindFilter, accessFilter, priceFilter, statusFilter, sortBy])

    const priceValue = useCallback(
        (row: OfferRow) => {
            const draft = drafts[row.key]
            if (draft !== undefined) return draft
            return row.price_amount === null ? '' : String(row.price_amount)
        },
        [drafts]
    )

    const handlePriceChange = useCallback((key: string, raw: string) => {
        const digits = raw.replace(/[^\d]/g, '').slice(0, 9)
        setDrafts((prev) => ({ ...prev, [key]: digits }))
        setJustSaved(false)
    }, [])

    const dirtyRows = useMemo(
        () =>
            resources.filter((row) => {
                const draft = drafts[row.key]
                if (draft === undefined) return false
                const next = draft === '' ? null : Number(draft)
                return next !== row.price_amount
            }),
        [resources, drafts]
    )

    const savePrices = useCallback(async () => {
        if (!dirtyRows.length || saving || !access_token) return
        setSaving(true)
        setJustSaved(false)

        let failed = 0
        for (const row of dirtyRows) {
            const draft = drafts[row.key]
            const amount = draft === '' ? null : Number(draft)
            try {
                if (row.kind === 'course') {
                    await updateCourse(row.uuid, { price_amount: amount }, access_token)
                } else if (row.kind === 'collection') {
                    // updateCollection returns metadata instead of throwing, so a
                    // rejected update would otherwise be reported as saved.
                    const res = await updateCollection(
                        row.uuid,
                        { price_amount: amount },
                        access_token
                    )
                    if (res?.success === false) failed += 1
                } else {
                    await updatePodcast(row.uuid, { price_amount: amount }, access_token)
                }
            } catch {
                failed += 1
            }
        }

        setDrafts({})
        await Promise.all([mutateCourses(), mutatePodcasts(), mutateCollections()])
        setSaving(false)

        if (failed === 0) {
            setJustSaved(true)
            window.setTimeout(() => setJustSaved(false), 2000)
            toast.success(
                t('dashboard.payments.offers.saved_toast', { count: dirtyRows.length })
            )
        } else {
            toast.error(t('dashboard.payments.offers.save_partial'))
        }
    }, [
        dirtyRows,
        drafts,
        saving,
        access_token,
        mutateCourses,
        mutatePodcasts,
        mutateCollections,
        t,
    ])

    const hasActiveFilters = Boolean(
        kindFilter || accessFilter || priceFilter || statusFilter
    )

    const clearFilters = () => {
        setKindFilter('')
        setAccessFilter('')
        setPriceFilter('')
        setStatusFilter('')
    }

    const accessLabel = (row: OfferRow) =>
        t(
            row.access_type === 'public'
                ? 'dashboard.payments.offers.access_public'
                : row.access_type === 'paid'
                  ? 'dashboard.payments.offers.access_paid'
                  : 'dashboard.payments.offers.access_users_only'
        )

    const columns: Column<OfferRow>[] = [
        {
            key: 'name',
            header: t('dashboard.payments.offers.table.resource'),
            render: (row) => (
                <div className="flex items-center gap-2.5 min-w-0">
                    {row.kind === 'course' ? (
                        <BookOpen size={16} className="shrink-0 text-gray-400" />
                    ) : row.kind === 'collection' ? (
                        <Layers size={16} className="shrink-0 text-gray-400" />
                    ) : (
                        <Headphones size={16} className="shrink-0 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900 truncate">{row.name}</span>
                    {!row.published && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                            {t('dashboard.payments.offers.draft')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            header: t('dashboard.payments.offers.table.type'),
            width: '130px',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded bg-gray-300" />
                    {row.kind === 'course'
                        ? t('dashboard.payments.offers.type_course')
                        : row.kind === 'collection'
                          ? t('dashboard.payments.offers.type_collection')
                          : t('dashboard.payments.offers.type_podcast')}
                </span>
            ),
        },
        {
            key: 'access',
            header: t('dashboard.payments.offers.table.access'),
            width: '130px',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded ${ACCESS_DOT[row.access_type]}`} />
                    {accessLabel(row)}
                </span>
            ),
        },
        {
            key: 'price',
            header: t('dashboard.payments.offers.table.price'),
            width: '180px',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <input
                        value={priceValue(row)}
                        onChange={(e) => handlePriceChange(row.key, e.target.value)}
                        placeholder="—"
                        inputMode="numeric"
                        aria-label={t('dashboard.payments.offers.table.price')}
                        className="w-24 bg-transparent text-end text-sm text-gray-900 placeholder:text-gray-300 outline-none rounded-md px-1.5 py-0.5 tabular-nums transition-colors hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-200"
                    />
                    <span className="text-[11px] font-medium text-gray-400">DZD</span>
                </div>
            ),
        },
        {
            key: 'added',
            header: t('dashboard.payments.offers.table.added'),
            width: '140px',
            align: 'right',
            render: (row) => (
                <span className="text-[13px] text-gray-400 whitespace-nowrap">
                    {formatDate(row.creation_date)}
                </span>
            ),
        },
    ]

    const pagination = (
        <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
                {t('dashboard.users.active_users.pagination.showing', {
                    start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    end: Math.min(currentPage * ITEMS_PER_PAGE, total),
                    total,
                })}
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600 font-medium min-w-[64px] text-center">
                    {t('dashboard.users.active_users.pagination.page', {
                        current: currentPage,
                        total: totalPages,
                    })}
                </span>
                <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    )

    return (
        <div>
            {/* ── TOOLBAR ── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative w-80">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('dashboard.payments.offers.search_placeholder')}
                        className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                    />
                </div>

                <div className="flex-1" />

                <button
                    onClick={savePrices}
                    disabled={dirtyRows.length === 0 || saving}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        justSaved ? 'text-emerald-600' : 'text-gray-600'
                    }`}
                >
                    {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : justSaved ? (
                        <Check size={14} />
                    ) : null}
                    {saving
                        ? t('dashboard.payments.offers.saving')
                        : justSaved
                          ? t('dashboard.payments.offers.saved')
                          : t('dashboard.payments.offers.save')}
                </button>

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <IconButton
                            size="small"
                            variant="transparent"
                            className="bg-white hover:bg-gray-50 shadow-borders-base relative"
                            aria-label={t('dashboard.payments.offers.filter')}
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
                        {/* Type */}
                        <MenuSectionLabel
                            label={t('dashboard.payments.offers.filters.type')}
                        />
                        {[
                            { value: '', label: t('dashboard.payments.offers.filters.all_types') },
                            { value: 'course', label: t('dashboard.payments.offers.type_course') },
                            { value: 'podcast', label: t('dashboard.payments.offers.type_podcast') },
                            { value: 'collection', label: t('dashboard.payments.offers.type_collection') },
                        ].map((option) => (
                            <FilterItem
                                key={`type-${option.value}`}
                                label={option.label}
                                active={kindFilter === option.value}
                                onClick={() => setKindFilter(option.value as any)}
                            />
                        ))}

                        <DropdownMenuSeparator />

                        {/* Access */}
                        <MenuSectionLabel
                            label={t('dashboard.payments.offers.filters.access')}
                        />
                        {[
                            { value: '', label: t('dashboard.payments.offers.filters.all_access') },
                            { value: 'public', label: t('dashboard.payments.offers.access_public') },
                            { value: 'users_only', label: t('dashboard.payments.offers.access_users_only') },
                            { value: 'paid', label: t('dashboard.payments.offers.access_paid') },
                        ].map((option) => (
                            <FilterItem
                                key={`access-${option.value}`}
                                label={option.label}
                                active={accessFilter === option.value}
                                onClick={() => setAccessFilter(option.value as any)}
                            />
                        ))}

                        <DropdownMenuSeparator />

                        {/* Price */}
                        <MenuSectionLabel
                            label={t('dashboard.payments.offers.filters.price')}
                        />
                        {[
                            { value: '', label: t('dashboard.payments.offers.filters.any_price') },
                            { value: 'none', label: t('dashboard.payments.offers.filters.needs_price') },
                            { value: 'set', label: t('dashboard.payments.offers.filters.has_price') },
                            { value: 'free', label: t('dashboard.payments.offers.filters.free') },
                        ].map((option) => (
                            <FilterItem
                                key={`price-${option.value}`}
                                label={option.label}
                                active={priceFilter === option.value}
                                onClick={() => setPriceFilter(option.value as any)}
                            />
                        ))}

                        <DropdownMenuSeparator />

                        {/* Status */}
                        <MenuSectionLabel
                            label={t('dashboard.payments.offers.filters.status')}
                        />
                        {[
                            { value: '', label: t('dashboard.payments.offers.filters.all_statuses') },
                            { value: 'published', label: t('dashboard.payments.offers.filters.published') },
                            { value: 'draft', label: t('dashboard.payments.offers.filters.draft') },
                        ].map((option) => (
                            <FilterItem
                                key={`status-${option.value}`}
                                label={option.label}
                                active={statusFilter === option.value}
                                onClick={() => setStatusFilter(option.value as any)}
                            />
                        ))}

                        <DropdownMenuSeparator />

                        {/* Sort */}
                        <MenuSectionLabel
                            label={t('dashboard.payments.offers.filters.sort')}
                        />
                        {[
                            { value: 'name-asc', label: t('dashboard.payments.offers.filters.sort_name_asc') },
                            { value: 'name-desc', label: t('dashboard.payments.offers.filters.sort_name_desc') },
                            { value: 'price-asc', label: t('dashboard.payments.offers.filters.sort_price_asc') },
                            { value: 'price-desc', label: t('dashboard.payments.offers.filters.sort_price_desc') },
                            { value: 'newest', label: t('dashboard.payments.offers.filters.sort_newest') },
                        ].map((option) => (
                            <FilterItem
                                key={`sort-${option.value}`}
                                label={option.label}
                                active={sortBy === option.value}
                                onClick={() => setSortBy(option.value as SortBy)}
                            />
                        ))}

                        {hasActiveFilters && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={clearFilters}
                                    className="text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                                >
                                    <span className="text-xs font-medium text-red-600">
                                        {t('dashboard.payments.offers.filters.clear')}
                                    </span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* ── TABLE ── */}
            {loadError ? (
                <TableCard>
                    <EmptyState
                        icon={BookOpen}
                        title={t('dashboard.payments.offers.load_error')}
                    />
                </TableCard>
            ) : isInitialLoading ? (
                <TableCard>
                    <div className="py-16 flex justify-center">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                </TableCard>
            ) : resources.length === 0 ? (
                <TableCard>
                    <EmptyState
                        icon={BookOpen}
                        title={t('dashboard.payments.offers.no_resources')}
                    />
                </TableCard>
            ) : filtered.length === 0 ? (
                <TableCard>
                    <EmptyState
                        icon={Search}
                        title={t('dashboard.payments.offers.no_results')}
                    />
                </TableCard>
            ) : (
                <TableCard footer={total > ITEMS_PER_PAGE ? pagination : undefined}>
                    <DataTable columns={columns} rows={paged} />
                </TableCard>
            )}
        </div>
    )
}

function MenuSectionLabel({ label }: { label: string }) {
    return (
        <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {label}
        </div>
    )
}

function FilterItem({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <DropdownMenuItem
            onClick={onClick}
            className="justify-between text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
        >
            <span className="text-gray-700 text-xs">{label}</span>
            {active && <Check size={12} className="text-gray-500" />}
        </DropdownMenuItem>
    )
}
