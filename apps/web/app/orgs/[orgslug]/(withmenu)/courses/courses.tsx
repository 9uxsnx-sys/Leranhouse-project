'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, BookCopy, ChevronLeft, ChevronRight, Users, Info } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { searchMatchesAny } from '@/lib/search/normalize'
import { getUserGroups, getUserGroupResources } from '@services/usergroups/usergroups'
import { usePlan } from '@components/Hooks/usePlan'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'

// Medusa components
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const removeCoursePrefix = (course_uuid: string) => course_uuid.replace('course_', '')

interface CourseProps {
  orgslug: string
  courses: any
  org_id: string | number
}

function Courses(props: CourseProps) {
  const { t } = useTranslation()
  const orgslug = props.orgslug
  const allCourses = props.courses
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const currentPlan = usePlan()

  // Usergroup filter — only shown on personal/family plans
  const usergroupsAvailable = currentPlan === 'personal' || currentPlan === 'family'
  const [usergroups, setUsergroups] = useState<any[]>([])
  const [selectedUsergroupId, setSelectedUsergroupId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lh_course_usergroup_filter') || ''
    }
    return ''
  })
  const [usergroupResourceUuids, setUsergroupResourceUuids] = useState<Set<string> | null>(null)
  const [showUsergroupInfo, setShowUsergroupInfo] = useState(false)

  // Fetch usergroups
  useEffect(() => {
    if (!usergroupsAvailable || !access_token || !props.org_id) return
    getUserGroups(props.org_id, access_token)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || []
        setUsergroups(list)
        if (selectedUsergroupId && !list.some((ug: any) => String(ug.id) === selectedUsergroupId)) {
          setSelectedUsergroupId('')
          localStorage.removeItem('lh_course_usergroup_filter')
        }
      })
      .catch(() => setUsergroups([]))
  }, [usergroupsAvailable, access_token, props.org_id])

  // Fetch resource UUIDs for selected usergroup
  useEffect(() => {
    if (!selectedUsergroupId || !access_token || !props.org_id) {
      setUsergroupResourceUuids(null)
      return
    }
    getUserGroupResources(selectedUsergroupId, props.org_id, access_token)
      .then((res: any) => {
        const uuids = Array.isArray(res) ? res : res?.data || []
        setUsergroupResourceUuids(new Set(uuids))
      })
      .catch(() => setUsergroupResourceUuids(null))
  }, [selectedUsergroupId, access_token, props.org_id])

  const handleUsergroupChange = (value: string) => {
    setSelectedUsergroupId(value)
    if (value) {
      localStorage.setItem('lh_course_usergroup_filter', value)
    } else {
      localStorage.removeItem('lh_course_usergroup_filter')
    }
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter courses based on search and usergroup
  const filteredCourses = useMemo(() => {
    let courses = allCourses

    // Usergroup filter
    if (usergroupResourceUuids) {
      courses = courses.filter((course: any) => usergroupResourceUuids.has(course.course_uuid))
    }

    // Search filter
    if (searchQuery.trim()) {
      courses = courses.filter((course: any) =>
        searchMatchesAny([course.name, course.description, course.tags], searchQuery)
      )
    }

    return courses
  }, [allCourses, searchQuery, usergroupResourceUuids])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedUsergroupId])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCourses, currentPage, itemsPerPage])

  // Pagination handlers
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

  return (
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      {/* Page title */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('courses.courses')}
      </h1>

      {/* Search + Filter toolbar (only if courses exist) */}
      {allCourses.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          {/* Search + results count group (left side) */}
          <div className="flex items-center gap-3">
            {/* Search — custom search bar with icon */}
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('courses.search_courses')}
                className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {/* Search results count — next to search bar */}
            {searchQuery && (
              <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                {t('courses.search_results', { count: filteredCourses.length, query: searchQuery })}
              </span>
            )}
          </div>

          {/* Spacer pushes filter to the right */}
          <div className="flex-1" />

          {/* Filter — Medusa IconButton + DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label={t('courses.filter_courses')}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-28">
              <DropdownMenuItem>All Courses</DropdownMenuItem>
              <DropdownMenuItem>Easy</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Hard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Usergroup filter — personal/family plans only */}
          {usergroupsAvailable && usergroups.length > 0 && (
            <div className="relative flex items-center gap-1.5">
              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ui-fg-muted w-3.5 h-3.5 pointer-events-none" />
                <select
                  value={selectedUsergroupId}
                  onChange={(e) => handleUsergroupChange(e.target.value)}
                  className="h-7 pl-7 pr-7 txt-compact-small bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base rounded-md appearance-none cursor-pointer min-w-[140px] outline-none focus-visible:shadow-borders-interactive-with-active"
                >
                  <option value="">{t('courses.usergroup_filter.all_courses')}</option>
                  {usergroups.map((ug: any) => (
                    <option key={ug.id} value={String(ug.id)}>
                      {ug.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowUsergroupInfo(!showUsergroupInfo)}
                className="flex items-center justify-center h-6 w-6 text-ui-fg-muted hover:text-ui-fg-base transition-colors rounded-md hover:bg-ui-bg-base-hover"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showUsergroupInfo && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-ui-bg-component shadow-elevation-flyout rounded-lg p-3">
                  <p className="txt-compact-xsmall-plus text-ui-fg-subtle mb-1">{t('courses.usergroup_filter.info_title')}</p>
                  <p className="txt-compact-xsmall text-ui-fg-muted leading-relaxed">{t('courses.usergroup_filter.info_description')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid area — fills remaining space, equal-height rows */}
      <div className="flex-1 flex flex-col">
        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1" style={{ gridAutoRows: '1fr' }}>
          {paginatedCourses.map((course: any) => {
            const imageUrl = course.thumbnail_image
              ? getCourseThumbnailMediaDirectory(org?.org_uuid, course.course_uuid, course.thumbnail_image)
              : ''
            return (
              <CourseCard
                key={course.course_uuid}
                id={removeCoursePrefix(course.course_uuid)}
                title={course.name}
                description={course.description || ''}
                image={imageUrl}
                lessons={0}
                duration="N/A"
                difficulty="All levels"
              />
            )
          })}

          {/* Empty state — search with no results */}
          {filteredCourses.length === 0 && searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                {t('courses.no_search_results')}
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                {t('courses.try_different_search')}
              </p>
            </div>
          )}

          {/* Empty state — no courses at all */}
          {allCourses.length === 0 && !searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
                {t('courses.no_courses')}
              </h1>
              <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
                {t('courses.no_courses_available')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination — always at same position */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-6 pb-0">
          <Button
            variant="transparent"
            size="small"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
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

          <Button
            variant="transparent"
            size="small"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default Courses
