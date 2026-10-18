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
import { BookOpen, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchMatches } from '@/lib/search/normalize'
import { useDebounce } from '@/hooks/useDebounce'
import { TableCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'

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
  const tableCourses: Course[] = showSearchResults
    ? courses.filter((c) =>
        searchMatches(c.name, debouncedSearch) || (c.description && searchMatches(c.description, debouncedSearch))
      )
    : linkedCourse ? [linkedCourse] : []

  const handleLink = async () => {
    if (selectedCourses.length === 0 || !community) return
    setIsSubmitting(true)
    try {
      await linkCommunityToCourse(community.community_uuid, selectedCourses[0], accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      toast.success(t('dashboard.courses.communities.course.toasts.link_success'))
      setSelectedCourses([])
      setSearchQuery('')
      router.refresh()
    } catch {
      toast.error(t('dashboard.courses.communities.course.toasts.link_error'))
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
      toast.success(t('dashboard.courses.communities.course.toasts.unlink_success'))
      setSelectedCourses([])
      router.refresh()
    } catch {
      toast.error(t('dashboard.courses.communities.course.toasts.unlink_error'))
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

  const columns: Column<Course>[] = [
    {
      key: 'state',
      header: '',
      width: '56px',
      render: (course) => (
        <span
          className="flex items-center justify-center w-4 h-4"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="flex items-center justify-center cursor-pointer w-4 h-4">
            <input
              type="checkbox"
              checked={selectedCourses.includes(course.course_uuid)}
              onChange={() => handleCourseSelect(course.course_uuid)}
              className="sr-only peer"
            />
            <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 text-white hidden peer-checked:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 6l3 3 5-6" />
              </svg>
            </div>
          </label>
        </span>
      ),
    },
    {
      key: 'name',
      header: t('dashboard.courses.communities.table.name'),
      width: '280px',
      sortable: true,
      value: (course) => course.name || '',
      render: (course) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-[30px] h-[30px] shrink-0 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <BookOpen size={15} />
          </span>
          <span className="font-medium text-gray-900 truncate">{course.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('dashboard.courses.communities.table.description'),
      render: (course) => (
        <span className="text-gray-500 truncate">{course.description || '—'}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.courses.communities.course.search_placeholder')}
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
            {showSearchResults ? t('common.add') : t('common.delete')}
          </button>
        )}
      </div>

      {isLoadingCourses ? (
        <TableCard>
          <div className="py-16 flex justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        </TableCard>
      ) : tableCourses.length === 0 ? (
        <TableCard>
          <EmptyState
            icon={BookOpen}
            title={
              showSearchResults
                ? t('dashboard.courses.communities.course.no_courses')
                : t('dashboard.courses.communities.course.no_course_linked')
            }
          />
        </TableCard>
      ) : (
        <TableCard>
          <DataTable
            columns={columns}
            rows={tableCourses}
            onRowClick={(course) => handleCourseSelect(course.course_uuid)}
            rowClassName={(course) =>
              selectedCourses.includes(course.course_uuid) ? 'bg-gray-50' : ''
            }
          />
        </TableCard>
      )}
    </div>
  )
}

export default CommunityEditCourse
