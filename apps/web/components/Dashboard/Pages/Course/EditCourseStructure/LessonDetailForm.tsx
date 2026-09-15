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
import { updateActivity } from '@services/courses/activities'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCourse, getCourseMetaCacheKey } from '@components/Contexts/CourseContext'
import { mutate } from 'swr'
import { revalidateTags } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type LessonDetailFormProps = {
  activity: any
  chapter: any
  orgslug: string
  course_uuid: string
  onBack: () => void
}

function LessonDetailForm({ activity, chapter, orgslug, course_uuid, onBack }: LessonDetailFormProps) {
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const course = useCourse() as any
  const withUnpublishedActivities = course?.withUnpublishedActivities || false
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const initialMeta = activity.extra_metadata || {}

  // Formik for name + description
  const formik = useFormik({
    initialValues: {
      name: activity.name || '',
      description: activity.description || '',
    },
    onSubmit: async () => {},
    enableReinitialize: true,
  })

  // Array fields
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    initialMeta.learning_objectives || []
  )
  const [takeaways, setTakeaways] = useState<{ title: string; items: string[] }[]>(
    initialMeta.takeaways || []
  )
  const [resources, setResources] = useState<{ name: string; url: string }[]>(
    initialMeta.resources || []
  )
  const [knowledgeChecks, setKnowledgeChecks] = useState<{ question: string; answer: string }[]>(
    initialMeta.knowledge_checks || []
  )

  // Track initial values for change detection
  const initialValuesRef = useRef({
    name: activity.name || '',
    description: activity.description || '',
    learningObjectives: JSON.stringify(initialMeta.learning_objectives || []),
    takeaways: JSON.stringify(initialMeta.takeaways || []),
    resources: JSON.stringify(initialMeta.resources || []),
    knowledgeChecks: JSON.stringify(initialMeta.knowledge_checks || []),
  })

  // Auto-save with debounce
  useEffect(() => {
    const currentMeta = {
      learning_objectives: learningObjectives,
      takeaways: takeaways,
      resources: resources,
      knowledge_checks: knowledgeChecks,
    }

    const currentName = formik.values.name
    const currentDesc = formik.values.description
    const init = initialValuesRef.current

    const nameChanged = currentName !== init.name
    const descChanged = currentDesc !== init.description
    const metaChanged =
      JSON.stringify(currentMeta.learning_objectives) !== init.learningObjectives ||
      JSON.stringify(currentMeta.takeaways) !== init.takeaways ||
      JSON.stringify(currentMeta.resources) !== init.resources ||
      JSON.stringify(currentMeta.knowledge_checks) !== init.knowledgeChecks

    if (!nameChanged && !descChanged && !metaChanged) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const data: any = {}
        if (nameChanged) data.name = currentName
        if (descChanged) data.description = currentDesc
        if (metaChanged) data.extra_metadata = currentMeta

        if (Object.keys(data).length > 0) {
          await updateActivity(data, activity.activity_uuid, access_token)
          initialValuesRef.current = {
            name: currentName,
            description: currentDesc,
            learningObjectives: JSON.stringify(currentMeta.learning_objectives),
            takeaways: JSON.stringify(currentMeta.takeaways),
            resources: JSON.stringify(currentMeta.resources),
            knowledgeChecks: JSON.stringify(currentMeta.knowledge_checks),
          }
          await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
          await revalidateTags(['courses'], orgslug)
          router.refresh()
        }
      } catch (e) {
        console.error('Failed to save lesson:', e)
        toast.error('Failed to save lesson')
      } finally {
        setIsSaving(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formik.values, learningObjectives, takeaways, resources, knowledgeChecks])

  // Helpers for array fields
  const addObjective = () => setLearningObjectives([...learningObjectives, ''])
  const updateObjective = (index: number, value: string) => {
    const updated = [...learningObjectives]
    updated[index] = value
    setLearningObjectives(updated)
  }
  const removeObjective = (index: number) =>
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index))

  const addTakeaway = () => setTakeaways([...takeaways, { title: '', items: [''] }])
  const updateTakeawayTitle = (index: number, value: string) => {
    const updated = [...takeaways]
    updated[index] = { ...updated[index], title: value }
    setTakeaways(updated)
  }
  const addTakeawayItem = (tIndex: number) => {
    const updated = [...takeaways]
    updated[tIndex] = { ...updated[tIndex], items: [...updated[tIndex].items, ''] }
    setTakeaways(updated)
  }
  const updateTakeawayItem = (tIndex: number, iIndex: number, value: string) => {
    const updated = [...takeaways]
    const newItems = [...updated[tIndex].items]
    newItems[iIndex] = value
    updated[tIndex] = { ...updated[tIndex], items: newItems }
    setTakeaways(updated)
  }
  const removeTakeawayItem = (tIndex: number, iIndex: number) => {
    const updated = [...takeaways]
    updated[tIndex] = {
      ...updated[tIndex],
      items: updated[tIndex].items.filter((_, i) => i !== iIndex),
    }
    setTakeaways(updated)
  }
  const removeTakeaway = (index: number) =>
    setTakeaways(takeaways.filter((_, i) => i !== index))

  const addResource = () => setResources([...resources, { name: '', url: '' }])
  const updateResource = (index: number, field: 'name' | 'url', value: string) => {
    const updated = [...resources]
    updated[index] = { ...updated[index], [field]: value }
    setResources(updated)
  }
  const removeResource = (index: number) =>
    setResources(resources.filter((_, i) => i !== index))

  const addKnowledgeCheck = () =>
    setKnowledgeChecks([...knowledgeChecks, { question: '', answer: '' }])
  const updateKnowledgeCheck = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...knowledgeChecks]
    updated[index] = { ...updated[index], [field]: value }
    setKnowledgeChecks(updated)
  }
  const removeKnowledgeCheck = (index: number) =>
    setKnowledgeChecks(knowledgeChecks.filter((_, i) => i !== index))

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Lessons
      </button>

      <FormLayout onSubmit={formik.handleSubmit}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lesson Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing: {chapter.name || 'Untitled Module'}
            </p>
          </div>

          {/* Lesson Name */}
          <FormField name="name">
            <FormLabelAndMessage label="Lesson Name" message={formik.errors.name as string} />
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

          {/* Description */}
          <FormField name="description">
            <FormLabelAndMessage label="Description" message={formik.errors.description as string} />
            <Form.Control asChild>
              <Textarea
                style={{ backgroundColor: 'white', height: '100px', minHeight: '100px' }}
                onChange={formik.handleChange}
                value={formik.values.description}
                disabled={isSaving}
                placeholder="Brief description of what this lesson covers"
              />
            </Form.Control>
          </FormField>

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </div>
          )}

          {/* ═══ What You'll Learn ═══ */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">What You'll Learn</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Learning objectives shown as bullet points on the lesson page
                </p>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {learningObjectives.map((obj, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-400 text-lg">&bull;</span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    placeholder="e.g. Understand the lesson structure"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {learningObjectives.length === 0 && (
                <p className="text-sm text-gray-400 italic">No learning objectives added yet</p>
              )}
            </div>
          </div>

          {/* ═══ Key Takeaways ═══ */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Key Takeaways</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sections with bullet points summarizing the lesson
                </p>
              </div>
              <button
                type="button"
                onClick={addTakeaway}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} />
                Add Section
              </button>
            </div>
            <div className="space-y-4">
              {takeaways.map((section, tIndex) => (
                <div key={tIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateTakeawayTitle(tIndex, e.target.value)}
                      placeholder="Section title (e.g. Course Structure & Learning Path)"
                      className="flex-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeTakeaway(tIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {section.items.map((item, iIndex) => (
                      <div key={iIndex} className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">&bull;</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateTakeawayItem(tIndex, iIndex, e.target.value)}
                          placeholder="Takeaway item"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeTakeawayItem(tIndex, iIndex)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTakeawayItem(tIndex)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5"
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              ))}
              {takeaways.length === 0 && (
                <p className="text-sm text-gray-400 italic">No takeaways added yet</p>
              )}
            </div>
          </div>

          {/* ═══ Resources ═══ */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Downloadable files and links for this lesson
                </p>
              </div>
              <button
                type="button"
                onClick={addResource}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resource.name}
                    onChange={(e) => updateResource(index, 'name', e.target.value)}
                    placeholder="File name (e.g. Course Syllabus PDF)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  />
                  <input
                    type="text"
                    value={resource.url}
                    onChange={(e) => updateResource(index, 'url', e.target.value)}
                    placeholder="URL (e.g. https://...)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-sm text-gray-400 italic">No resources added yet</p>
              )}
            </div>
          </div>

          {/* ═══ Knowledge Checks ═══ */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Knowledge Checks</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Q&A pairs for the quick check section
                </p>
              </div>
              <button
                type="button"
                onClick={addKnowledgeCheck}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {knowledgeChecks.map((kc, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Q{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeKnowledgeCheck(index)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={kc.question}
                      onChange={(e) => updateKnowledgeCheck(index, 'question', e.target.value)}
                      placeholder="Question"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <textarea
                      value={kc.answer}
                      onChange={(e) => updateKnowledgeCheck(index, 'answer', e.target.value)}
                      placeholder="Answer"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white resize-none"
                    />
                  </div>
                </div>
              ))}
              {knowledgeChecks.length === 0 && (
                <p className="text-sm text-gray-400 italic">No knowledge checks added yet</p>
              )}
            </div>
          </div>
        </div>
      </FormLayout>
    </div>
  )
}

export default LessonDetailForm
