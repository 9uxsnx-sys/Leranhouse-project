'use client'
import { revalidateTags } from '@services/utils/ts/requests'
import React, { useState } from 'react'
import { mutate } from 'swr'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import { createChapter, deleteChapter } from '@services/courses/chapters'
import { useRouter } from 'next/navigation'
import {
  useCourse,
  getCourseMetaCacheKey,
} from '@components/Contexts/CourseContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react'
import ModuleForm from './ModuleForm'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type EditCourseStructureProps = {
  orgslug: string
  course_uuid?: string
}

const EditCourseStructure = (props: EditCourseStructureProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;
  const course = useCourse() as any
  const courseStructure = course ? course.courseStructure : {}
  const chapters = courseStructure?.chapters || []
  const course_uuid = course ? course.courseStructure.course_uuid : ''
  const withUnpublishedActivities = course ? course.withUnpublishedActivities : false

  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null)
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
      toast.success('Module created')
      await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
      await revalidateTags(['courses'], props.orgslug)
      router.refresh()
      // The refresh will re-render with the new chapter; after refresh, select the last one
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
      await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
      await revalidateTags(['courses'], props.orgslug)
      router.refresh()
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
  }

  if (!course) return <PageLoading />

  return (
    <div className="flex h-full gap-6 mt-6" style={{ minHeight: '400px' }}>
      {/* Left Panel - Module List */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 pr-4">
        <button
          onClick={handleAddModule}
          disabled={isCreating}
          className="w-full mb-4 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isCreating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add Module
        </button>

        <div className="space-y-1">
          {chapters.map((chapter: any, index: number) => (
            <button
              key={chapter.chapter_uuid}
              onClick={() => handleModuleClick(index)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                selectedChapterIndex === index
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen size={16} className="flex-shrink-0" />
                <span className="truncate">{chapter.name || 'Untitled Module'}</span>
              </div>
              <button
                onClick={(e) => handleDeleteModule(chapter.id, index, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 flex-shrink-0"
                title="Delete module"
              >
                <Trash2 size={14} />
              </button>
            </button>
          ))}

          {chapters.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No modules yet</p>
              <p className="text-xs mt-1">Click "Add Module" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Module Form */}
      <div className="flex-1 min-w-0">
        {selectedChapter ? (
          <ModuleForm
            key={selectedChapter.chapter_uuid}
            chapter={selectedChapter}
            chapterIndex={selectedChapterIndex!}
            orgslug={props.orgslug}
            course_uuid={course_uuid}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a module to edit its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditCourseStructure
