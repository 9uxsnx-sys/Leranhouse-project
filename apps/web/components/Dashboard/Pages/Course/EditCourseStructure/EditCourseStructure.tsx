'use client'
import { revalidateTags } from '@services/utils/ts/requests'
import React, { useState, useMemo } from 'react'
import { mutate } from 'swr'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import { createChapter, deleteChapter } from '@services/courses/chapters'
import {
  useCourse,
  getCourseMetaCacheKey,
} from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { Trash2, Folder, Loader2, Search, ArrowUpDown, CheckSquare, MoreVertical, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import ModuleForm from './ModuleForm'
import LessonDetailForm from './LessonDetailForm'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type EditCourseStructureProps = {
  orgslug: string
  course_uuid?: string
}

const EditCourseStructure = (props: EditCourseStructureProps) => {
  const { t } = useTranslation()
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;
  const course = useCourse() as any
  const courseStructure = course ? course.courseStructure : {}
  const chapters = courseStructure?.chapters || []
  const course_uuid = course ? course.courseStructure.course_uuid : ''
  const withUnpublishedActivities = course ? course.withUnpublishedActivities : false

  // 3-state navigation
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isSelectMode, setIsSelectMode] = useState(false)

  const filteredAndSortedChapters = useMemo(() => {
    let result = chapters
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = chapters.filter((ch: any) =>
        (ch.name || '').toLowerCase().includes(q)
      )
    }
    return [...result].sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [chapters, searchQuery, sortOrder])

  const selectedChapter = selectedChapterIndex !== null ? chapters[selectedChapterIndex] : null

  const handleAddModule = async () => {
    if (!access_token) return
    setIsCreating(true)
    try {
      const chapter_object = {
        name: 'New Module',
        description: '',
        thumbnail_image: '',
        course_id: courseStructure.id,
        org_id: courseStructure.org_id,
      }
      await createChapter(chapter_object, access_token)
      await revalidateTags(['courses'], props.orgslug)
      await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
      toast.success('Module created')
      setSelectedChapterIndex(chapters.length)
    } catch (e) {
      toast.error('Failed to create module')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteModule = async (chapterId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!access_token) return
    try {
      await deleteChapter(chapterId, access_token)
      await revalidateTags(['courses'], props.orgslug)
      await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
      if (selectedChapterIndex === index) {
        setSelectedChapterIndex(null)
      } else if (selectedChapterIndex !== null && selectedChapterIndex > index) {
        setSelectedChapterIndex(selectedChapterIndex - 1)
      }
    } catch (e) {
      toast.error('Failed to delete module')
    }
  }

  const handleModuleClick = (index: number) => {
    setSelectedChapterIndex(index)
    setSelectedActivity(null)
  }

  const handleLessonClick = (activity: any) => {
    setSelectedActivity(activity)
  }

  const handleBackToModuleList = () => {
    setSelectedChapterIndex(null)
    setSelectedActivity(null)
  }

  const handleBackToLessonList = () => {
    setSelectedActivity(null)
  }

  if (!course) return <PageLoading />

  // ── State 3: Lesson Detail Form ──
  if (selectedActivity && selectedChapter) {
    return (
      <div className="mt-6">
        <LessonDetailForm
          activity={selectedActivity}
          chapter={selectedChapter}
          orgslug={props.orgslug}
          course_uuid={course_uuid}
          onBack={handleBackToLessonList}
        />
      </div>
    )
  }

  // ── State 2: Lesson List (inside a module) ──
  if (selectedChapter) {
    return (
      <div className="mt-6">
        <ModuleForm
          key={selectedChapter.chapter_uuid}
          chapter={selectedChapter}
          chapterIndex={selectedChapterIndex!}
          orgslug={props.orgslug}
          course_uuid={course_uuid}
          onBack={handleBackToModuleList}
          onLessonClick={handleLessonClick}
        />
      </div>
    )
  }

  // ── State 1: Module List ──
  return (
    <div className="mt-6">
      {/* Toolbar Row */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        {/* Module count */}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filteredAndSortedChapters.length} {filteredAndSortedChapters.length === 1 ? 'module' : 'modules'}
        </span>

        {/* Spacer pushes actions to the right */}
        <div className="flex-1" />

        {/* Add Module Button */}
        <Button
          variant="primary"
          size="small"
          onClick={handleAddModule}
          disabled={isCreating}
          className="gap-x-1.5"
        >
          {isCreating ? (
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
        <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} aria-label="Sort modules">
          <ArrowUpDown size={15} />
        </IconButton>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {filteredAndSortedChapters.map((chapter: any, index: number) => {
          const actualIndex = chapters.indexOf(chapter)
          const lessonCount = chapter.activities?.length || 0
          const publishedCount = chapter.activities?.filter((a: any) => a.published).length || 0
          return (
            <div
              key={chapter.chapter_uuid}
              onClick={() => handleModuleClick(actualIndex)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModuleClick(actualIndex); }}
              role="button"
              tabIndex={0}
              className="w-full text-left px-5 py-4 rounded-xl bg-white shadow-borders-base hover:border-gray-200 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Folder size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chapter.name || 'Untitled Module'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                    {publishedCount > 0 && (
                      <span> &middot; {publishedCount} published</span>
                    )}
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
                      handleDeleteModule(chapter.id, actualIndex, e as any)
                    }}
                    className="text-red-600 gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}

        {filteredAndSortedChapters.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <Folder size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              {searchQuery ? 'No modules match your search' : 'No modules yet'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {searchQuery ? 'Try a different search term' : 'Click "Add Module" to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditCourseStructure
