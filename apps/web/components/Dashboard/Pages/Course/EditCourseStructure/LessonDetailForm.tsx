'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useFormik } from 'formik'
import * as Form from '@radix-ui/react-form'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import { Input } from '@/components/ui/input'
import LearningItemsList from '../EditCourseGeneral/LearningItemsList'
import TakeawayItemsList from '../EditCourseGeneral/TakeawayItemsList'
import ResourceItemsList from '../EditCourseGeneral/ResourceItemsList'
import KnowledgeCheckItemsList from '../EditCourseGeneral/KnowledgeCheckItemsList'
import { updateActivity } from '@services/courses/activities'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { ArrowLeft, Eye, Globe, GlobeLock, Loader2, Check, SaveAllIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { useOrg } from '@components/Contexts/OrgContext'

type LessonDetailFormProps = {
  activity: any
  chapter: any
  orgslug: string
  course_uuid: string
  onBack: () => void
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

function LessonDetailForm({ activity, chapter, orgslug, course_uuid, onBack }: LessonDetailFormProps) {
  const session = useLHSession() as any
  const org = useOrg() as any
  const access_token = session?.data?.tokens?.access_token
  const [published, setPublished] = useState(activity.published ?? false)
  const [isSavingLesson, setIsSavingLesson] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedSnapshotRef = useRef('')

  const initialMeta = activity.extra_metadata || {}

  // Formik for name + description
  const formik = useFormik({
    initialValues: {
      name: activity.name || '',
      description: activity.content?.description || '',
    },
    onSubmit: async () => {},
    enableReinitialize: true,
  })

  // Array fields
  const [learningObjectivesStr, setLearningObjectivesStr] = useState(() => {
    const objs: string[] = initialMeta.learning_objectives || []
    return JSON.stringify(
      objs.map((text: string, i: number) => ({
        id: `obj_${i}`,
        text,
        emoji: '📝',
      }))
    )
  })
  const [takeawaysStr, setTakeawaysStr] = useState(() =>
    JSON.stringify(initialMeta.takeaways || [])
  )
  const [resourcesStr, setResourcesStr] = useState(() =>
    JSON.stringify(initialMeta.resources || [])
  )
  const [knowledgeChecksStr, setKnowledgeChecksStr] = useState(() =>
    JSON.stringify(initialMeta.knowledge_checks || [])
  )

  // Track initial values for change detection
  const initialValuesRef = useRef({
    name: activity.name || '',
    description: activity.content?.description || '',
    published: activity.published ?? false,
    learningObjectivesStr: (() => {
      const objs: string[] = initialMeta.learning_objectives || []
      return JSON.stringify(objs.map((text: string, i: number) => ({ id: `obj_${i}`, text, emoji: '📝' })))
    })(),
    takeawaysStr: JSON.stringify(initialMeta.takeaways || []),
    resourcesStr: JSON.stringify(initialMeta.resources || []),
    knowledgeChecksStr: JSON.stringify(initialMeta.knowledge_checks || []),
  })

  // Ref to track latest values for flush-on-unmount
  const latestValuesRef = useRef({ name: '', description: '', published: false, meta: {} as any })

  // Helper to convert LearningItemsList items to string array
  const parseItemsList = (jsonStr: string): string[] => {
    try {
      const items = JSON.parse(jsonStr)
      if (Array.isArray(items)) return items.map((it: any) => it.text || '')
    } catch {}
    return []
  }

  // Auto-save with debounce
  useEffect(() => {
    const learningObjectivesArr = parseItemsList(learningObjectivesStr)
    let takeawaysArr = []
    try { takeawaysArr = JSON.parse(takeawaysStr); if (!Array.isArray(takeawaysArr)) takeawaysArr = [] } catch { takeawaysArr = [] }
    let resourcesArr = []
    try { resourcesArr = JSON.parse(resourcesStr); if (!Array.isArray(resourcesArr)) resourcesArr = [] } catch { resourcesArr = [] }
    let knowledgeChecksArr = []
    try { knowledgeChecksArr = JSON.parse(knowledgeChecksStr); if (!Array.isArray(knowledgeChecksArr)) knowledgeChecksArr = [] } catch { knowledgeChecksArr = [] }
    const currentMeta = {
      learning_objectives: learningObjectivesArr,
      takeaways: takeawaysArr,
      resources: resourcesArr,
      knowledge_checks: knowledgeChecksArr,
    }

    const currentName = formik.values.name
    const currentDesc = formik.values.description
    const currentPublished = published
    const init = initialValuesRef.current

    const nameChanged = currentName !== init.name
    const descChanged = currentDesc !== init.description
    const publishedChanged = currentPublished !== init.published
    const metaChanged =
      learningObjectivesStr !== init.learningObjectivesStr ||
      takeawaysStr !== init.takeawaysStr ||
      resourcesStr !== init.resourcesStr ||
      knowledgeChecksStr !== init.knowledgeChecksStr

    if (!nameChanged && !descChanged && !publishedChanged && !metaChanged) return

    latestValuesRef.current = { name: currentName, description: currentDesc, published: currentPublished, meta: currentMeta }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSavingLesson(true)
      try {
        const data: any = {}
        if (nameChanged) data.name = currentName
        if (descChanged) data.content = { ...(activity.content || {}), description: currentDesc }
        if (publishedChanged) data.published = currentPublished
        if (metaChanged) data.extra_metadata = currentMeta

        if (Object.keys(data).length > 0) {
          await updateActivity(data, activity.activity_uuid, access_token)
          const snapshot = JSON.stringify({
            name: currentName,
            description: currentDesc,
            published: currentPublished,
            learningObjectivesStr,
            takeawaysStr,
            resourcesStr,
            knowledgeChecksStr,
          })
          lastSavedSnapshotRef.current = snapshot
          initialValuesRef.current = {
            name: currentName,
            description: currentDesc,
            published: currentPublished,
            learningObjectivesStr,
            takeawaysStr,
            resourcesStr,
            knowledgeChecksStr,
          }
        }
      } catch (e) {
        console.error('Failed to save lesson:', e)
        toast.error('Failed to save lesson')
      } finally {
        setIsSavingLesson(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        const pending = latestValuesRef.current
        const initVals = initialValuesRef.current
        const data: any = {}
        if (pending.name !== initVals.name) data.name = pending.name
        if (pending.description !== initVals.description) data.content = { ...(activity.content || {}), description: pending.description }
        if (pending.published !== initVals.published) data.published = pending.published
        const metaChanged =
          learningObjectivesStr !== initVals.learningObjectivesStr ||
          takeawaysStr !== initVals.takeawaysStr ||
          resourcesStr !== initVals.resourcesStr ||
          knowledgeChecksStr !== initVals.knowledgeChecksStr
        if (metaChanged) data.extra_metadata = pending.meta
        if (Object.keys(data).length > 0) {
          updateActivity(data, activity.activity_uuid, access_token).catch(console.error)
        }
      }
    }
  }, [formik.values, learningObjectivesStr, takeawaysStr, resourcesStr, knowledgeChecksStr, published])

  // Compute save status for the indicator
  const currentSnapshot = JSON.stringify({
    name: formik.values.name,
    description: formik.values.description,
    published,
    learningObjectivesStr,
    takeawaysStr,
    resourcesStr,
    knowledgeChecksStr,
  })
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshotRef.current

  // Initialize snapshot on mount
  useEffect(() => {
    lastSavedSnapshotRef.current = currentSnapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Manual save: flush debounce and save immediately
  const handleManualSave = useCallback(() => {
    if (isSavingLesson) return

    // Clear pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Read latest values
    const learningObjectivesArr = parseItemsList(learningObjectivesStr)
    let takeawaysArr = []
    try { takeawaysArr = JSON.parse(takeawaysStr); if (!Array.isArray(takeawaysArr)) takeawaysArr = [] } catch { takeawaysArr = [] }
    let resourcesArr = []
    try { resourcesArr = JSON.parse(resourcesStr); if (!Array.isArray(resourcesArr)) resourcesArr = [] } catch { resourcesArr = [] }
    let knowledgeChecksArr = []
    try { knowledgeChecksArr = JSON.parse(knowledgeChecksStr); if (!Array.isArray(knowledgeChecksArr)) knowledgeChecksArr = [] } catch { knowledgeChecksArr = [] }
    const currentMeta = {
      learning_objectives: learningObjectivesArr,
      takeaways: takeawaysArr,
      resources: resourcesArr,
      knowledge_checks: knowledgeChecksArr,
    }

    const currentName = formik.values.name
    const currentDesc = formik.values.description
    const currentPublished = published
    const init = initialValuesRef.current

    const nameChanged = currentName !== init.name
    const descChanged = currentDesc !== init.description
    const publishedChanged = currentPublished !== init.published
    const metaChanged =
      learningObjectivesStr !== init.learningObjectivesStr ||
      takeawaysStr !== init.takeawaysStr ||
      resourcesStr !== init.resourcesStr ||
      knowledgeChecksStr !== init.knowledgeChecksStr

    if (!nameChanged && !descChanged && !publishedChanged && !metaChanged) return

    setIsSavingLesson(true)

    ;(async () => {
      try {
        const data: any = {}
        if (nameChanged) data.name = currentName
        if (descChanged) data.content = { ...(activity.content || {}), description: currentDesc }
        if (publishedChanged) data.published = currentPublished
        if (metaChanged) data.extra_metadata = currentMeta

        if (Object.keys(data).length > 0) {
          await updateActivity(data, activity.activity_uuid, access_token)
          const snapshot = JSON.stringify({
            name: currentName,
            description: currentDesc,
            published: currentPublished,
            learningObjectivesStr,
            takeawaysStr,
            resourcesStr,
            knowledgeChecksStr,
          })
          lastSavedSnapshotRef.current = snapshot
          initialValuesRef.current = {
            name: currentName,
            description: currentDesc,
            published: currentPublished,
            learningObjectivesStr,
            takeawaysStr,
            resourcesStr,
            knowledgeChecksStr,
          }
        }
      } catch (e) {
        console.error('Failed to save lesson:', e)
        toast.error('Failed to save lesson')
      } finally {
        setIsSavingLesson(false)
      }
    })()
  }, [formik.values.name, formik.values.description, published, learningObjectivesStr, takeawaysStr, resourcesStr, knowledgeChecksStr, activity, access_token, isSavingLesson])

  return (
    <div>
      <FormLayout onSubmit={formik.handleSubmit} className="space-y-3">
        {/* ── ACTION ROW ── */}
        <div className="flex items-center justify-between">
          {/* Left: Preview */}
          <Link
            href={getUriWithOrg(org?.slug, '') + `/course/${course_uuid.replace('course_', '')}/lesson-preview?activityid=${activity.activity_uuid}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            <span>Preview</span>
          </Link>

          {/* Right: Save + Publish */}
          <div className="flex items-center gap-2">
            <button
              onClick={hasUnsavedChanges ? handleManualSave : undefined}
              disabled={isSavingLesson}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSavingLesson
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : hasUnsavedChanges
                    ? 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                    : 'bg-white text-gray-600 border-gray-200 cursor-default'
              }`}
            >
              {isSavingLesson ? (
                <Loader2 size={14} className="animate-spin" />
              ) : hasUnsavedChanges ? (
                <SaveAllIcon size={14} />
              ) : (
                <Check size={14} />
              )}
              <span>
                {isSavingLesson
                  ? 'Saving...'
                  : hasUnsavedChanges
                    ? 'Save'
                    : 'Saved'}
              </span>
            </button>
            <button
              onClick={() => setPublished(!published)}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {published ? (
                <Globe size={14} />
              ) : (
                <GlobeLock size={14} />
              )}
              <span>
                {published ? 'Published' : 'Unpublished'}
              </span>
            </button>
          </div>
        </div>

        {/* ── BASIC INFORMATION ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Basic Information</h3>
          <div className="space-y-4">
            <FormField name="name">
              <FormLabelAndMessage label="Lesson Name" message={formik.errors.name as string} />
              <Form.Control asChild>
                <Input
                  className={fieldClassName}
                  onChange={formik.handleChange}
                  value={formik.values.name}
                  type="text"
                  required
                />
              </Form.Control>
            </FormField>

            <FormField name="description">
              <FormLabelAndMessage label="Description" message={formik.errors.description as string} />
              <Form.Control asChild>
                <Input
                  className={fieldClassName}
                  onChange={formik.handleChange}
                  value={formik.values.description}
                  type="text"
                  placeholder="Brief description of what this lesson covers"
                />
              </Form.Control>
            </FormField>
          </div>
        </div>

        {/* ── WHAT YOU'LL LEARN ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">What You&apos;ll Learn</h3>
          <FormField name="learningObjectives">
            <Form.Control asChild>
              <LearningItemsList
                value={learningObjectivesStr}
                onChange={(value) => setLearningObjectivesStr(value)}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── KEY TAKEAWAYS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Key Takeaways</h3>
          <FormField name="takeaways">
            <Form.Control asChild>
              <TakeawayItemsList
                value={takeawaysStr}
                onChange={(value) => setTakeawaysStr(value)}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── RESOURCES ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Resources</h3>
          <FormField name="resources">
            <Form.Control asChild>
              <ResourceItemsList
                value={resourcesStr}
                onChange={(value) => setResourcesStr(value)}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── KNOWLEDGE CHECKS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Knowledge Checks</h3>
          <FormField name="knowledge_checks">
            <Form.Control asChild>
              <KnowledgeCheckItemsList
                value={knowledgeChecksStr}
                onChange={(value) => setKnowledgeChecksStr(value)}
              />
            </Form.Control>
          </FormField>
        </div>
      </FormLayout>
    </div>
  )
}

export default LessonDetailForm
