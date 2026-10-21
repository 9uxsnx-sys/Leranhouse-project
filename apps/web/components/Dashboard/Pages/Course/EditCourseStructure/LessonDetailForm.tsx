'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useCourse } from '@components/Contexts/CourseContext'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import { getCurrentLanguageNativeName } from '@/lib/languages'
import { Eye, Globe, GlobeLock, Loader2, Check, SaveAllIcon, Copy } from 'lucide-react'
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

type LessonValues = {
  name: string
  description: string
  objectivesStr: string
  takeawaysStr: string
  resourcesStr: string
  checksStr: string
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

// Objectives are plain strings in extra_metadata but the list editor works with
// {id, text, emoji} rows.
const toObjectivesStr = (items: string[]) =>
  JSON.stringify(items.map((text: string, i: number) => ({ id: `obj_${i}`, text, emoji: '📝' })))

const readObjectives = (jsonStr: string): string[] => {
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed.map((it: any) => it?.text || '') : []
  } catch {
    return []
  }
}

const readArray = (jsonStr: string): any[] => {
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const sameList = (a: string, b: string) => a === b

const snapshotOf = (v: LessonValues, published: boolean) =>
  JSON.stringify({ ...v, published })

function LessonDetailForm({ activity, chapter, orgslug, course_uuid, onBack }: LessonDetailFormProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const course = useCourse() as any
  const access_token = session?.data?.tokens?.access_token

  // ── Content locale ──
  // Same rule as the General tab: the base activity row holds the source locale,
  // every other locale lives in extra_metadata.translations[locale].
  const contentLocale = useContentLocale()
  const sourceLocale = (course?.courseStructure?.source_locale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === sourceLocale

  const [extraMeta, setExtraMeta] = useState<Record<string, any>>(activity.extra_metadata || {})
  const extraMetaRef = useRef(extraMeta)
  const translations = extraMeta.translations || {}
  const translation = !isSourceLocale ? translations[contentLocale] || null : null

  const [published, setPublished] = useState(activity.published ?? false)
  const [isSavingLesson, setIsSavingLesson] = useState(false)

  // ── Values for a given locale ──

  // The `activity` prop is a snapshot from the course payload; after we save a
  // source-locale edit it goes stale, so keep the live source text here.
  const sourceRef = useRef({
    name: activity.name || '',
    description: activity.content?.description || '',
  })

  const valuesFor = useCallback(
    (locale: string, meta: Record<string, any>, translated: Record<string, any> | null): LessonValues => {
      const base: LessonValues = {
        name: sourceRef.current.name,
        description: sourceRef.current.description,
        objectivesStr: toObjectivesStr(meta.learning_objectives || []),
        takeawaysStr: JSON.stringify(meta.takeaways || []),
        resourcesStr: JSON.stringify(meta.resources || []),
        checksStr: JSON.stringify(meta.knowledge_checks || []),
      }
      if (!translated || locale === sourceLocale) return base
      return {
        name: translated.name ?? base.name,
        description: translated.description ?? base.description,
        objectivesStr: toObjectivesStr(translated.learning_objectives ?? meta.learning_objectives ?? []),
        takeawaysStr: JSON.stringify(translated.takeaways ?? meta.takeaways ?? []),
        resourcesStr: JSON.stringify(translated.resources ?? meta.resources ?? []),
        checksStr: JSON.stringify(translated.knowledge_checks ?? meta.knowledge_checks ?? []),
      }
    },
    [sourceLocale]
  )

  const [values, setValues] = useState<LessonValues>(() =>
    valuesFor(contentLocale, extraMeta, !isSourceLocale ? translations[contentLocale] || null : null)
  )

  const savedValuesRef = useRef<LessonValues>(values)
  const savedPublishedRef = useRef(published)
  // Latest values together with the locale they belong to. It intentionally
  // does NOT follow a locale switch, so a pending edit is always flushed into
  // the language it was typed in.
  const lastValuesRef = useRef<{ values: LessonValues; published: boolean; locale: string }>({
    values,
    published,
    locale: contentLocale,
  })

  // Seeded from the initial values so the button reads "Saved" on first paint.
  const lastSavedSnapshotRef = useRef(snapshotOf(values, published))
  const isSaved = snapshotOf(values, published) === lastSavedSnapshotRef.current

  useEffect(() => {
    lastSavedSnapshotRef.current = snapshotOf(savedValuesRef.current, savedPublishedRef.current)
    if (lastValuesRef.current.locale !== contentLocale) return
    lastValuesRef.current = { values, published, locale: contentLocale }
  }, [values, published, contentLocale])

  // ── Persist ──

  const persist = useCallback(
    async (
      locale: string,
      isSource: boolean,
      next: LessonValues,
      nextPublished: boolean,
      saved: LessonValues,
      savedPublished: boolean
    ) => {
      const nameChanged = next.name !== saved.name
      const descChanged = next.description !== saved.description
      const publishedChanged = nextPublished !== savedPublished
      const metaChanged =
        !sameList(next.objectivesStr, saved.objectivesStr) ||
        !sameList(next.takeawaysStr, saved.takeawaysStr) ||
        !sameList(next.resourcesStr, saved.resourcesStr) ||
        !sameList(next.checksStr, saved.checksStr)

      if (!nameChanged && !descChanged && !publishedChanged && !metaChanged) return

      const meta = extraMetaRef.current || {}
      const sections = {
        learning_objectives: readObjectives(next.objectivesStr),
        takeaways: readArray(next.takeawaysStr),
        resources: readArray(next.resourcesStr),
        knowledge_checks: readArray(next.checksStr),
      }

      const data: any = {}
      if (publishedChanged) data.published = nextPublished

      if (isSource) {
        if (nameChanged) data.name = next.name
        if (descChanged) data.content = { ...(activity.content || {}), description: next.description }
        if (metaChanged) data.extra_metadata = { ...meta, ...sections }
      } else if (nameChanged || descChanged || metaChanged) {
        // Translating never touches the base row — name, description and the
        // designed sections all go into the locale entry.
        data.extra_metadata = {
          ...meta,
          translations: {
            ...(meta.translations || {}),
            [locale]: {
              ...((meta.translations || {})[locale] || {}),
              name: next.name,
              description: next.description,
              ...sections,
            },
          },
        }
      }

      if (Object.keys(data).length === 0) return

      setIsSavingLesson(true)
      try {
        const updated: any = await updateActivity(data, activity.activity_uuid, access_token)
        if (updated?.extra_metadata) {
          extraMetaRef.current = updated.extra_metadata
          setExtraMeta(updated.extra_metadata)
        } else if (data.extra_metadata) {
          extraMetaRef.current = data.extra_metadata
          setExtraMeta(data.extra_metadata)
        }
        if (isSource) {
          if (nameChanged) sourceRef.current.name = next.name
          if (descChanged) sourceRef.current.description = next.description
        }
        savedValuesRef.current = next
        savedPublishedRef.current = nextPublished
        lastSavedSnapshotRef.current = snapshotOf(next, nextPublished)
      } catch (e) {
        console.error('Failed to save lesson:', e)
        toast.error(t('dashboard.courses.structure.lesson_detail.save_error'))
      } finally {
        setIsSavingLesson(false)
      }
    },
    [activity.content, activity.activity_uuid, access_token, t]
  )

  // Debounced auto-save.
  useEffect(() => {
    if (isSaved) return
    const timer = setTimeout(() => {
      persist(
        contentLocale,
        isSourceLocale,
        values,
        published,
        savedValuesRef.current,
        savedPublishedRef.current
      )
    }, 600)
    return () => clearTimeout(timer)
  }, [values, published, isSaved, contentLocale, isSourceLocale, persist])

  // Flush pending edits on unmount instead of discarding them.
  useEffect(() => {
    return () => {
      const pending = lastValuesRef.current
      persist(
        pending.locale,
        pending.locale === sourceLocale,
        pending.values,
        pending.published,
        savedValuesRef.current,
        savedPublishedRef.current
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switching the dashboard language swaps the content we edit. Flush the
  // previous locale first, then load the new one — waiting for the save keeps
  // the two locales' saved-state refs from overwriting each other.
  const previousLocaleRef = useRef(contentLocale)
  useEffect(() => {
    if (previousLocaleRef.current === contentLocale) return
    previousLocaleRef.current = contentLocale
    let cancelled = false

    ;(async () => {
      const pending = lastValuesRef.current
      if (pending.locale !== contentLocale) {
        await persist(
          pending.locale,
          pending.locale === sourceLocale,
          pending.values,
          pending.published,
          savedValuesRef.current,
          savedPublishedRef.current
        )
      }
      if (cancelled) return

      const translated = !isSourceLocale
        ? (extraMetaRef.current.translations || {})[contentLocale] || null
        : null
      const next = valuesFor(contentLocale, extraMetaRef.current, translated)
      setValues(next)
      savedValuesRef.current = next
      lastSavedSnapshotRef.current = snapshotOf(next, savedPublishedRef.current)
      lastValuesRef.current = { values: next, published: savedPublishedRef.current, locale: contentLocale }
    })()

    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, persist, valuesFor])

  // ── Actions ──

  const handleManualSave = useCallback(() => {
    if (isSavingLesson) return
    persist(
      contentLocale,
      isSourceLocale,
      values,
      published,
      savedValuesRef.current,
      savedPublishedRef.current
    )
  }, [isSavingLesson, persist, contentLocale, isSourceLocale, values, published])

  const copyFromSource = useCallback(() => {
    const meta = extraMetaRef.current || {}
    setValues({
      name: sourceRef.current.name,
      description: sourceRef.current.description,
      objectivesStr: toObjectivesStr(meta.learning_objectives || []),
      takeawaysStr: JSON.stringify(meta.takeaways || []),
      resourcesStr: JSON.stringify(meta.resources || []),
      checksStr: JSON.stringify(meta.knowledge_checks || []),
    })
  }, [])

  const update = (patch: Partial<LessonValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  return (
    <div>
      <FormLayout onSubmit={(e: React.FormEvent) => e.preventDefault()} className="space-y-3">
        {/* ── ACTION ROW ── */}
        <div className="flex items-center justify-between">
          {/* Left: Preview */}
          <Link
            href={getUriWithOrg(org?.slug, '') + `/course/${course_uuid.replace('course_', '')}/lesson-preview?activityid=${activity.activity_uuid}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            <span>{t('dashboard.courses.preview')}</span>
          </Link>

          {/* Right: Locale + Save + Publish */}
          <div className="flex items-center gap-2">
            {!isSourceLocale && (
              <button
                type="button"
                onClick={copyFromSource}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Copy size={14} />
                <span>{t('dashboard.courses.general.locale.copy_from_source')}</span>
              </button>
            )}
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600"
              title={
                isSourceLocale
                  ? t('dashboard.courses.general.locale.source')
                  : t('dashboard.courses.general.locale.translation')
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-teal-500' : 'bg-amber-400'}`} />
              <span>{getCurrentLanguageNativeName(contentLocale)}</span>
              <span className="text-gray-400">
                {isSourceLocale
                  ? t('dashboard.courses.general.locale.source')
                  : translation
                    ? t('dashboard.courses.general.locale.translation')
                    : t('dashboard.courses.general.locale.missing')}
              </span>
            </span>
            <button
              onClick={isSaved ? undefined : handleManualSave}
              disabled={isSavingLesson}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSavingLesson
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : isSaved
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isSavingLesson ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaved ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>
                {isSavingLesson
                  ? t('dashboard.courses.save.saving')
                  : isSaved
                    ? t('dashboard.courses.save.saved')
                    : t('dashboard.courses.save.save')}
              </span>
            </button>
            <button
              onClick={() => setPublished(!published)}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {published ? <Globe size={14} /> : <GlobeLock size={14} />}
              <span>
                {published ? t('dashboard.courses.published') : t('dashboard.courses.unpublished')}
              </span>
            </button>
          </div>
        </div>

        {!isSourceLocale && !translation && (
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            {t('dashboard.courses.general.locale.inherited')}
          </div>
        )}

        {/* ── BASIC INFORMATION ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{t('common.sections.overview')}</h3>
          <div className="space-y-4">
            <FormField name="name">
              <FormLabelAndMessage label={t('dashboard.courses.structure.lesson_detail.name_label')} />
              <Form.Control asChild>
                <Input
                  className={fieldClassName}
                  onChange={(e) => update({ name: e.target.value })}
                  value={values.name}
                  type="text"
                  required
                />
              </Form.Control>
            </FormField>

            <FormField name="description">
              <FormLabelAndMessage label={t('dashboard.courses.structure.lesson_detail.description_label')} />
              <Form.Control asChild>
                <Input
                  className={fieldClassName}
                  onChange={(e) => update({ description: e.target.value })}
                  value={values.description}
                  type="text"
                  placeholder={t('dashboard.courses.structure.lesson_detail.description_placeholder')}
                />
              </Form.Control>
            </FormField>
          </div>
        </div>

        {/* ── WHAT YOU'LL LEARN ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{t('common.sections.what_youll_learn')}</h3>
          <FormField name="learningObjectives">
            <Form.Control asChild>
              <LearningItemsList
                value={values.objectivesStr}
                onChange={(value) => update({ objectivesStr: value })}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── KEY TAKEAWAYS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{t('common.sections.key_takeaways')}</h3>
          <FormField name="takeaways">
            <Form.Control asChild>
              <TakeawayItemsList
                value={values.takeawaysStr}
                onChange={(value) => update({ takeawaysStr: value })}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── RESOURCES ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{t('common.sections.resources')}</h3>
          <FormField name="resources">
            <Form.Control asChild>
              <ResourceItemsList
                value={values.resourcesStr}
                onChange={(value) => update({ resourcesStr: value })}
              />
            </Form.Control>
          </FormField>
        </div>

        {/* ── KNOWLEDGE CHECKS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{t('common.sections.knowledge_checks')}</h3>
          <FormField name="knowledge_checks">
            <Form.Control asChild>
              <KnowledgeCheckItemsList
                value={values.checksStr}
                onChange={(value) => update({ checksStr: value })}
              />
            </Form.Control>
          </FormField>
        </div>
      </FormLayout>
    </div>
  )
}

export default LessonDetailForm
