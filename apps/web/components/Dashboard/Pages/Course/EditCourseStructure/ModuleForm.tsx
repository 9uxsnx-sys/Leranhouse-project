'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useFormik } from 'formik'
import * as Form from '@radix-ui/react-form'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
  Input,
  Textarea,
} from '@components/Objects/StyledElements/Form/Form'
import { updateChapter } from '@services/courses/chapters'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCourse, getCourseMetaCacheKey } from '@components/Contexts/CourseContext'
import { getAPIUrl } from '@services/config/config'
import { mutate } from 'swr'
import { revalidateTags } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Video,
  File,
  Code,
  Puzzle,
  Layers,
  Trash2,
  BookOpen,
  Loader2,
} from 'lucide-react'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import NewActivityModal from '@components/Objects/Modals/Activities/Create/NewActivity'
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
}

const activityTypeConfig: Record<string, { label: string; color: string; Icon: any }> = {
  TYPE_VIDEO: { label: 'Video', color: 'text-blue-600 bg-blue-50', Icon: Video },
  TYPE_DOCUMENT: { label: 'Document', color: 'text-amber-600 bg-amber-50', Icon: File },
  TYPE_ASSIGNMENT: { label: 'Assignment', color: 'text-purple-600 bg-purple-50', Icon: Puzzle },
  TYPE_DYNAMIC: { label: 'Dynamic', color: 'text-green-600 bg-green-50', Icon: Code },
  TYPE_SCORM: { label: 'SCORM', color: 'text-gray-600 bg-gray-50', Icon: Layers },
}

function ModuleForm({ chapter, chapterIndex, orgslug, course_uuid }: ModuleFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const course = useCourse() as any
  const [isSaving, setIsSaving] = useState(false)
  const [newActivityModal, setNewActivityModal] = useState(false)
  const [selectedView, setSelectedView] = useState('home')
  const [isDeletingActivity, setIsDeletingActivity] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const prevValuesRef = useRef({ name: chapter.name || '', description: chapter.description || '' })

  const activities = chapter.activities || []
  const withUnpublishedActivities = course?.withUnpublishedActivities || false

  const formik = useFormik({
    initialValues: {
      name: chapter.name || '',
      description: chapter.description || '',
    },
    onSubmit: async () => {},
    enableReinitialize: true,
  })

  // Auto-save on change with debounce
  useEffect(() => {
    const currentValues = { name: formik.values.name, description: formik.values.description }
    const initialVals = { name: formik.initialValues.name, description: formik.initialValues.description }

    // Skip if nothing changed
    if (currentValues.name === initialVals.name && currentValues.description === initialVals.description) {
      return
    }

    // Skip if same as previous save
    if (currentValues.name === prevValuesRef.current.name && currentValues.description === prevValuesRef.current.description) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const changes: any = {}
        if (currentValues.name !== initialVals.name) changes.name = currentValues.name
        if (currentValues.description !== initialVals.description) changes.description = currentValues.description

        if (Object.keys(changes).length > 0) {
          await updateChapter(chapter.id, changes, access_token)
          prevValuesRef.current = currentValues
          await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
          await revalidateTags(['courses'], orgslug)
          router.refresh()
        }
      } catch (e) {
        console.error('Failed to save module:', e)
        toast.error('Failed to save module')
      } finally {
        setIsSaving(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formik.values, formik.initialValues])

  const handleDeleteActivity = async (activity: any) => {
    if (!access_token) return
    setIsDeletingActivity(activity.activity_uuid)
    try {
      await deleteActivity(activity.activity_uuid, access_token)
      await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
      await revalidateTags(['courses'], orgslug)
      router.refresh()
      toast.success('Lesson deleted')
    } catch (e) {
      toast.error('Failed to delete lesson')
    } finally {
      setIsDeletingActivity(null)
    }
  }

  // Submit new activity
  const submitActivity = async (activity: any) => {
    if (!access_token) return
    const toastLoading = toast.loading('Creating lesson...')
    try {
      const org = await getOrganizationContextInfoWithoutCredentials(orgslug, { revalidate: 1800 })
      await createActivity(activity, chapter.id, org.id, access_token)
      mutate(`${getAPIUrl()}courses/${course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`)
      mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))
      toast.dismiss(toastLoading)
      toast.success('Lesson created')
      setNewActivityModal(false)
      await revalidateTags(['courses'], orgslug)
      router.refresh()
    } catch (e) {
      toast.dismiss(toastLoading)
      toast.error('Failed to create lesson')
    }
  }

  const submitFileActivity = async (file: any, type: any, activity: any, chapterId: string) => {
    if (!access_token) return
    toast.loading('Uploading...')
    try {
      const { createFileActivity } = await import('@services/courses/activities')
      await createFileActivity(file, type, activity, chapterId, access_token)
      mutate(`${getAPIUrl()}courses/${course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`)
      mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))
      setNewActivityModal(false)
      toast.dismiss()
      toast.success('Lesson created')
      await revalidateTags(['courses'], orgslug)
      router.refresh()
    } catch (e) {
      toast.dismiss()
      toast.error('Upload failed')
    }
  }

  const submitExternalVideo = async (external_video_data: any, activity: any, chapterId: string) => {
    if (!access_token) return
    const toastLoading = toast.loading('Creating...')
    try {
      const { createExternalVideoActivity } = await import('@services/courses/activities')
      await createExternalVideoActivity(external_video_data, activity, chapterId, access_token)
      mutate(`${getAPIUrl()}courses/${course_uuid}/meta?with_unpublished_activities=${withUnpublishedActivities}`)
      mutate((key: string) => typeof key === 'string' && key.includes('/courses/org_slug/'))
      setNewActivityModal(false)
      toast.dismiss(toastLoading)
      toast.success('Lesson created')
      await revalidateTags(['courses'], orgslug)
      router.refresh()
    } catch (e) {
      toast.dismiss(toastLoading)
      toast.error('Failed to create lesson')
    }
  }

  const getTypeConfig = (type: string) => {
    return activityTypeConfig[type] || { label: type, color: 'text-gray-600 bg-gray-50', Icon: BookOpen }
  }

  return (
    <div>
      <FormLayout onSubmit={formik.handleSubmit}>
        <div className="space-y-6">
          {/* Module Name */}
          <FormField name="name">
            <FormLabelAndMessage
              label="Module Name"
              message={formik.errors.name as string}
            />
            <Form.Control asChild>
              <Input
                style={{ backgroundColor: 'white' }}
                onChange={formik.handleChange}
                value={formik.values.name}
                type="text"
                required
                disabled={isSaving}
              />
            </Form.Control>
          </FormField>

          {/* Module Description */}
          <FormField name="description">
            <FormLabelAndMessage label="Module Description" message={formik.errors.description as string} />
            <Form.Control asChild>
              <Textarea
                style={{ backgroundColor: 'white', height: '120px', minHeight: '120px' }}
                onChange={formik.handleChange}
                value={formik.values.description}
                disabled={isSaving}
                placeholder="Optional description for this module"
              />
            </Form.Control>
          </FormField>

          {/* Save indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </div>
          )}

          {/* ── Lessons Section ── */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activities.length} {activities.length === 1 ? 'lesson' : 'lessons'} in this module
                </p>
              </div>
              <button
                onClick={() => setNewActivityModal(true)}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                Add Lesson
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No lessons in this module yet</p>
                <p className="text-xs text-gray-300 mt-1">Click "Add Lesson" to add your first lesson</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity: any) => {
                  const typeInfo = getTypeConfig(activity.activity_type)
                  const TypeIcon = typeInfo.Icon
                  return (
                    <div
                      key={activity.activity_uuid}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className={`p-1.5 rounded-md ${typeInfo.color}`}>
                        <TypeIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.name || 'Untitled Lesson'}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(activity)}
                        disabled={isDeletingActivity === activity.activity_uuid}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete lesson"
                      >
                        {isDeletingActivity === activity.activity_uuid ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </FormLayout>

      {/* New Activity Modal */}
      <Modal
        isDialogOpen={newActivityModal}
        onOpenChange={setNewActivityModal}
        minHeight="no-min"
        minWidth="md"
        addDefCloseButton={false}
        noPadding
        dialogContent={
          <NewActivityModal
            closeModal={() => setNewActivityModal(false)}
            submitFileActivity={submitFileActivity}
            submitExternalVideo={submitExternalVideo}
            submitActivity={submitActivity}
            chapterId={chapter.id}
            course={course?.courseStructure || {}}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
          />
        }
        dialogTitle={selectedView !== 'home' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedView('home')}
              className="flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 256 256">
                <polyline points="160 208 80 128 160 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
              </svg>
            </button>
            <span>New Lesson</span>
          </div>
        ) : (
          'New Lesson'
        )}
        dialogDescription={selectedView === 'home' ? 'Choose the type of lesson you want to create' : undefined}
      />
    </div>
  )
}

export default ModuleForm
