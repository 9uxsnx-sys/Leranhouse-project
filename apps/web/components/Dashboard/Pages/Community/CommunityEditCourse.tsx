'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { linkCommunityToCourse, unlinkCommunityFromCourse } from '@services/communities/communities'
import { getOrgCourses } from '@services/courses/courses'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
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

interface Course {
  id: number
  course_uuid: string
  name: string
  description: string
  creation_date?: string
}

const CommunityEditCourse: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const dispatch = useCommunityDispatch()
  const community = communityState?.community
  const accessToken = session?.data?.tokens?.access_token

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest'>('newest')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!org?.slug) return
      setIsLoadingCourses(true)
      try {
        const result = await getOrgCourses(org.slug, null, accessToken)
        setCourses(result || [])
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [org?.slug, accessToken])

  if (!community) return null

  const linkedCourse = courses.find((c) => c.id === community.course_id)

  // Determine which courses to show in the table
  const showSearchResults = searchQuery.trim().length > 0
  let tableCourses: Course[] = []
  if (showSearchResults) {
    tableCourses = courses.filter((c) =>
      searchMatches(c.name, debouncedSearch) || (c.description && searchMatches(c.description, debouncedSearch))
    )
    const sorted = [...tableCourses].sort((a, b) => {
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
    tableCourses = sorted
  } else {
    tableCourses = linkedCourse ? [linkedCourse] : []
  }

  const handleLink = async () => {
    if (selectedCourses.length === 0 || !community) return
    setIsSubmitting(true)
    try {
      await linkCommunityToCourse(community.community_uuid, selectedCourses[0], accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      toast.success('Course linked successfully')
      setSelectedCourses([])
      setSearchQuery('')
      router.refresh()
    } catch {
      toast.error('Failed to link course')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    if (!community) return
    setIsSubmitting(true)
    try {
      await unlinkCommunityFromCourse(community.community_uuid, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      toast.success('Course unlinked successfully')
      setSelectedCourses([])
      router.refresh()
    } catch {
      toast.error('Failed to unlink course')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseSelect = (courseUuid: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseUuid)) {
        return prev.filter((id) => id !== courseUuid)
      }
      return [courseUuid]
    })
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
            placeholder="Search courses..."
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <div className="flex-1" />
        {selectedCourses.length > 0 && (
          <button
            onClick={showSearchResults ? handleLink : handleUnlink}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 ${
              showSearchResults ? 'text-gray-600' : 'text-red-600'
            }`}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {showSearchResults ? 'Add' : 'Delete'}
          </button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <IconButton
              size="small"
              variant="transparent"
              className="bg-white hover:bg-gray-50 shadow-borders-base"
              aria-label="Sort courses"
            >
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
                  {!showSearchResults && tableCourses.length > 0 && (
                    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                      <input
                        type="checkbox"
                        checked={selectedCourses.length === tableCourses.length && tableCourses.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses(tableCourses.map((c) => c.course_uuid))
                          } else {
                            setSelectedCourses([])
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
              {isLoadingCourses ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 size={18} className="animate-spin text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !showSearchResults && tableCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-8">
                    No course linked
                  </TableCell>
                </TableRow>
              ) : showSearchResults && tableCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-8">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                tableCourses.map((course) => (
                  <TableRow
                    key={course.course_uuid}
                    className={`${selectedCourses.includes(course.course_uuid) ? 'bg-gray-50' : ''} cursor-pointer hover:bg-gray-50`}
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
                      handleCourseSelect(course.course_uuid)
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center justify-center cursor-pointer w-4 h-4">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.course_uuid)}
                          onChange={() => handleCourseSelect(course.course_uuid)}
                          className="sr-only peer"
                        />
                        <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                          <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                        </div>
                      </label>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 pl-2 truncate">{course.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm truncate">
                      {course.description || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default CommunityEditCourse
