'use client'
import { revalidateTags } from '@services/utils/ts/requests'
import React, { useState } from 'react'
import { mutate } from 'swr'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import { createChapter, deleteChapter } from '@services/courses/chapters'
import {
  useCourse,
  getCourseMetaCacheKey,
} from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react'
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
          <p className="text-sm text-gray-500 mt-1">
            {chapters.length} {chapters.length === 1 ? 'module' : 'modules'} in this course
          </p>
        </div>
        <button
          onClick={handleAddModule}
          disabled={isCreating}
          className="px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isCreating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add Module
        </button>
      </div>

      <div className="space-y-1.5">
        {chapters.map((chapter: any, index: number) => (
          <button
            key={chapter.chapter_uuid}
            onClick={() => handleModuleClick(index)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BookOpen size={18} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {chapter.name || 'Untitled Module'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(chapter.activities?.length || 0)} lessons
                </p>
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteModule(chapter.id, index, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded hover:bg-red-50 flex-shrink-0"
              title="Delete module"
            >
              <Trash2 size={14} />
            </button>
          </button>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No modules yet</p>
            <p className="text-xs text-gray-300 mt-1">Click "Add Module" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditCourseStructure
