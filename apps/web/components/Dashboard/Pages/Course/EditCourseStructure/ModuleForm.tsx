'use client'
import React, { useState, useMemo } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCourse, getCourseMetaCacheKey } from '@components/Contexts/CourseContext'
import { mutate } from 'swr'
import {
  Trash2,
  BookOpen,
  Loader2,
  Search,
  ArrowUpDown,
  CheckSquare,
  MoreVertical,
  Copy,
  FileText,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import {
  createActivity,
  deleteActivity,
} from '@services/courses/activities'
import { getOrganizationContextInfoWithoutCredentials } from '@services/organizations/orgs'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type ModuleFormProps = {
  chapter: any
  chapterIndex: number
  orgslug: string
  course_uuid: string
  onBack: () => void
  onLessonClick: (activity: any) => void
}

function ModuleForm({ chapter, chapterIndex, orgslug, course_uuid, onBack, onLessonClick }: ModuleFormProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const course = useCourse() as any
  const [isDeletingActivity, setIsDeletingActivity] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isSelectMode, setIsSelectMode] = useState(false)

  const activities = chapter.activities || []
  const withUnpublishedActivities = course?.withUnpublishedActivities || false

  const filteredAndSortedActivities = useMemo(() => {
    let result = activities
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = activities.filter((a: any) =>
        (a.name || '').toLowerCase().includes(q)
      )
    }
    return [...result].sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [activities, searchQuery, sortOrder])

  const refreshCourseData = async () => {
    try {
      const key = getCourseMetaCacheKey(course_uuid, withUnpublishedActivities)
      const response = await fetch(key, {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      })
      if (response.ok) {
        const freshData = await response.json()
        await mutate(key, freshData, { revalidate: false })
      }
    } catch (e) {
      console.error('Failed to refresh course data:', e)
    }
  }

  const handleDeleteActivity = async (activity: any) => {
    if (!access_token) return
    setIsDeletingActivity(activity.activity_uuid)
    try {
      await deleteActivity(activity.activity_uuid, access_token)
      await refreshCourseData()
      toast.success('Lesson deleted')
    } catch (e) {
      toast.error('Failed to delete lesson')
    } finally {
      setIsDeletingActivity(null)
    }
  }

  const handleCreateLesson = async () => {
    if (!access_token) return
    setIsCreatingLesson(true)
    try {
      const org = await getOrganizationContextInfoWithoutCredentials(orgslug, { revalidate: 1800 })
      const activityData = {
        name: 'New Lesson',
        chapter_id: chapter.id,
        activity_type: 'TYPE_DYNAMIC',
        content: { description: '' },
      }
      const result = await createActivity(activityData, chapter.id, org.id, access_token)
      if (!result || result.detail) {
        throw new Error(result?.detail?.[0]?.msg || 'API error')
      }
      await refreshCourseData()
      toast.success('Lesson created')
    } catch (e) {
      toast.error('Failed to create lesson')
    } finally {
      setIsCreatingLesson(false)
    }
  }

  return (
    <div>
      {/* Toolbar Row */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        {/* Lesson count */}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filteredAndSortedActivities.length} {filteredAndSortedActivities.length === 1 ? 'lesson' : 'lessons'}
        </span>

        {/* Spacer pushes actions to the right */}
        <div className="flex-1" />

        {/* New Lesson Button */}
        <Button
          variant="primary"
          size="small"
          onClick={handleCreateLesson}
          disabled={isCreatingLesson}
        >
          {isCreatingLesson ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            '+'
          )}
          &nbsp;&nbsp;New
        </Button>

        {/* Select Mode Button */}
        <Button
          variant="secondary"
          size="small"
          onClick={() => setIsSelectMode(!isSelectMode)}
          className="gap-1.5"
        >
          <CheckSquare size={14} strokeWidth={2.5} />
          <span className="font-semibold">{isSelectMode ? 'Cancel' : 'Select'}</span>
        </Button>

        {/* Sort toggle button */}
        <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} aria-label="Sort lessons">
          <ArrowUpDown size={15} />
        </IconButton>
      </div>

      {/* Lesson List */}
      <div className="space-y-3">
        {filteredAndSortedActivities.map((activity: any) => {
          return (
            <div
              key={activity.activity_uuid}
              onClick={() => onLessonClick(activity)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLessonClick(activity); }}
              role="button"
              tabIndex={0}
              className="w-full text-left px-5 py-4 rounded-xl bg-white shadow-borders-base hover:border-gray-200 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.name || 'Untitled Lesson'}
                </p>
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
                <DropdownMenuContent align="end" className="w-28">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      toast.success('Duplicate feature coming soon')
                    }}
                    className="gap-2"
                  >
                    <Copy size={14} />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteActivity(activity)
                    }}
                    className="text-red-600 gap-2"
                  >
                    {isDeletingActivity === activity.activity_uuid ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {filteredAndSortedActivities.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              {searchQuery ? 'No lessons match your search' : 'No lessons in this module yet'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {searchQuery ? 'Try a different search term' : 'Click "New" to add your first lesson'}
            </p>
          </div>
        )}
      </div>
      </div>
  )
}

export default ModuleForm
