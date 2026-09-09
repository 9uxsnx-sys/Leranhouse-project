'use client'

import React, { useState, useMemo } from 'react'
import { Search, BookOpen, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Mock data
const mockAllCourses = [
  { id: 'course-1', name: 'Introduction to Web Development', progress: 40, steps: 4, totalSteps: 10, status: 'in-progress', purchasedAt: '2024-01-15' },
  { id: 'course-2', name: 'Advanced React Patterns', progress: 20, steps: 2, totalSteps: 10, status: 'in-progress', purchasedAt: '2024-03-20' },
  { id: 'course-3', name: 'UI/UX Design Fundamentals', progress: 60, steps: 6, totalSteps: 10, status: 'in-progress', purchasedAt: '2024-06-10' },
  { id: 'course-4', name: 'JavaScript Basics', progress: 100, steps: 10, totalSteps: 10, status: 'completed', purchasedAt: '2023-09-05' },
  { id: 'course-5', name: 'HTML & CSS Essentials', progress: 100, steps: 8, totalSteps: 8, status: 'completed', purchasedAt: '2023-11-12' },
  { id: 'course-6', name: 'Python for Data Science', progress: 75, steps: 9, totalSteps: 12, status: 'in-progress', purchasedAt: '2024-08-01' },
  { id: 'course-7', name: 'Node.js Backend Development', progress: 10, steps: 1, totalSteps: 10, status: 'in-progress', purchasedAt: '2024-09-15' },
  { id: 'course-8', name: 'React Native Mobile Apps', progress: 0, steps: 0, totalSteps: 8, status: 'in-progress', purchasedAt: '2024-10-01' },
  { id: 'course-9', name: 'Machine Learning Fundamentals', progress: 100, steps: 10, totalSteps: 10, status: 'completed', purchasedAt: '2023-07-20' },
]

function ProgressCourseCard({ course }: { course: any }) {
  return (
    <Link
      href="#"
      className="flex flex-col h-full bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{ transformOrigin: 'top center' }}
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
      </div>

      {/* Progress bar — between image and content */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all ${
            course.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${course.progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
            {course.name}
          </h3>
          <p className="text-[13px] font-normal leading-relaxed line-clamp-3 text-[#6B7280]">
            {course.steps} of {course.totalSteps} lessons completed
          </p>
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5">
          {course.progress}% &middot; {course.status === 'completed' ? 'Completed' : 'In Progress'}
        </p>
      </div>
    </Link>
  )
}

export default function ProgressDesignPreview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Filter + sort courses
  const filteredCourses = useMemo(() => {
    let courses = mockAllCourses
    if (searchQuery.trim()) {
      courses = courses.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (filterStatus === 'in-progress') {
      courses = courses.filter((c) => c.status === 'in-progress')
    } else if (filterStatus === 'completed') {
      courses = courses.filter((c) => c.status === 'completed')
    }
    // Sort by purchase date
    courses = [...courses].sort((a, b) => {
      const dateA = new Date(a.purchasedAt).getTime()
      const dateB = new Date(b.purchasedAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    return courses
  }, [searchQuery, filterStatus, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCourses.slice(start, start + itemsPerPage)
  }, [filteredCourses, currentPage])

  React.useEffect(() => {
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

  return (
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto auto auto' }}>
      {/* Page title */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        Progress
      </h1>

      {/* Search + Filter toolbar */}
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
              {filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''} for "{searchQuery}"
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

      {/* Grid area */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCourses.map((course) => (
            <ProgressCourseCard key={course.id} course={course} />
          ))}

          {/* Empty state */}
          {filteredCourses.length === 0 && (
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
          )}
        </div>
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
  )
}
