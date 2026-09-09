'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import TrailCourseCard from '@components/Pages/Trail/TrailCourseCard'
import UserCertificates from '@components/Pages/Trail/UserCertificates'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import React, { useEffect, useState, useMemo } from 'react'
import useSWR from 'swr'
import { removeCourse } from '@services/courses/activity'
import { revalidateTags } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { BookOpen, Signpost, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

function Trail(params: any) {
  const { t } = useTranslation()
  let orgslug = params.orgslug
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token;
  const org = useOrg() as any
  const orgID = org?.id
  const router = useRouter()
  const [isQuittingAll, setIsQuittingAll] = useState(false)
  const [quittingProgress, setQuittingProgress] = useState(0)

  // Check if courses feature is enabled
  const isCoursesEnabled = org?.config?.config?.resolved_features?.courses?.enabled ?? org?.config?.config?.features?.courses?.enabled !== false

  // Only fetch trail data if courses feature is enabled
  const { data: trail, error: error, mutate } = useSWR(
    isCoursesEnabled && orgID ? `${getAPIUrl()}trail/org/${orgID}/trail` : null,
    (url) => swrFetcher(url, access_token)
  )

  const handleQuitAllCourses = async () => {
    if (!trail?.runs?.length || isQuittingAll) return;

    setIsQuittingAll(true)
    const totalCourses = trail.runs.length;

    try {
      for (let i = 0; i < trail.runs.length; i++) {
        const run = trail.runs[i];
        await removeCourse(run.course.course_uuid, orgslug, access_token);
        setQuittingProgress(Math.round(((i + 1) / totalCourses) * 100));
      }

      await revalidateTags(['courses'], orgslug);
      router.refresh();
      await mutate();
    } catch (error) {
      console.error('Error quitting courses:', error);
    } finally {
      setIsQuittingAll(false)
      setQuittingProgress(0)
    }
  }

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Filter + sort courses
  const filteredRuns = useMemo(() => {
    if (!trail?.runs) return []

    let runs = [...trail.runs]

    // Search
    if (searchQuery.trim()) {
      runs = runs.filter((run: any) =>
        run.course.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus === 'in-progress') {
      runs = runs.filter((run: any) => run.status === 'STATUS_IN_PROGRESS')
    } else if (filterStatus === 'completed') {
      runs = runs.filter((run: any) => run.status === 'STATUS_COMPLETED')
    }

    // Sort by creation date
    runs.sort((a: any, b: any) => {
      const dateA = new Date(a.creation_date).getTime()
      const dateB = new Date(b.creation_date).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return runs
  }, [trail, searchQuery, filterStatus, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage)
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRuns.slice(start, start + itemsPerPage)
  }, [filteredRuns, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, sortOrder])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getVisiblePageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  useEffect(() => { }, [trail, org])

  return (
    <FeatureDisabledView
      featureName="courses"
      orgslug={orgslug}
      icon={Signpost}
      context="public"
    >
      <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
        {/* Page title + Quit All button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-semibold text-ui-fg-base">
            {t('courses.progress')}
          </h1>
          {trail?.runs?.length > 0 && (
            <ConfirmationModal
              confirmationButtonText={isQuittingAll ? t('courses.quitting_courses', { progress: quittingProgress }) : t('courses.quit_all_courses')}
              confirmationMessage={t('courses.quit_all_courses_confirm')}
              dialogTitle={t('courses.quit_all_courses_title')}
              dialogTrigger={
                <button
                  disabled={isQuittingAll}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isQuittingAll
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                >
                  {isQuittingAll
                    ? t('courses.quitting_courses', { progress: quittingProgress })
                    : t('courses.quit_all_courses')
                  }
                </button>
              }
              functionToExecute={handleQuitAllCourses}
              status="warning"
            />
          )}
        </div>

        {/* Search + Filter toolbar */}
        {trail?.runs?.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              {searchQuery && (
                <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                  {filteredRuns.length} result{filteredRuns.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 focus-visible:ring-0 shadow-borders-base" aria-label="Filter">
                  <SlidersHorizontal size={15} />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white min-w-0 w-32">
                <DropdownMenuItem onSelect={() => setFilterStatus('all')}>
                  {filterStatus === 'all' && <span className="text-indigo-600 mr-1.5">✓</span>}All
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setFilterStatus('in-progress')}>
                  {filterStatus === 'in-progress' && <span className="text-indigo-600 mr-1.5">✓</span>}In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setFilterStatus('completed')}>
                  {filterStatus === 'completed' && <span className="text-indigo-600 mr-1.5">✓</span>}Completed
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortOrder('newest')}>
                  {sortOrder === 'newest' && <span className="text-indigo-600 mr-1.5">✓</span>}Newest
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortOrder('oldest')}>
                  {sortOrder === 'oldest' && <span className="text-indigo-600 mr-1.5">✓</span>}Oldest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Grid area */}
        <div className="flex-1 flex flex-col">
          {!trail ? (
            <PageLoading />
          ) : filteredRuns.length === 0 && !searchQuery && filterStatus === 'all' ? (
            <div className="col-span-full flex flex-col justify-center items-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
              <div className="p-4 bg-white rounded-full nice-shadow mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold text-gray-600 mb-2">
                {t('user.no_courses_in_progress')}
              </h1>
              <p className="text-md text-gray-400 mb-6 text-center max-w-xs">
                {t('user.start_course_to_see_progress')}
              </p>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <BookOpen className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                No results found
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                Try a different search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedRuns.map((run: any) => (
                <TrailCourseCard
                  key={run.course.course_uuid}
                  run={run}
                  course={run.course}
                  orgslug={orgslug}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-6 pb-0">
            <Button variant="transparent" size="small" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {getVisiblePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 txt-compact-small text-ui-fg-muted">...</span>
                  ) : (
                    <button
                      onClick={() => goToPage(page as number)}
                      className={`w-7 h-7 txt-compact-small-plus rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-ui-bg-base shadow-borders-base text-ui-fg-base'
                          : 'text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-base-hover'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <Button variant="transparent" size="small" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <UserCertificates orgslug={orgslug} />
    </FeatureDisabledView>
  )
}

export default Trail
