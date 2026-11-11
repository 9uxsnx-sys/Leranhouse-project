'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Form from '@radix-ui/react-form'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import { Input } from '@/components/ui/input'
import { updateChapter } from '@services/courses/chapters'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCourse } from '@components/Contexts/CourseContext'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import { getCurrentLanguageNativeName } from '@/lib/languages'
import { ArrowLeft, Loader2, Check, SaveAllIcon, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

type ModuleDetailFormProps = {
  chapter: any
  orgslug: string
  course_uuid: string
  onBack: () => void
}

type ModuleValues = {
  name: string
  description: string
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const snapshotOf = (v: ModuleValues) =>
  JSON.stringify(v)

function ModuleDetailForm({ chapter, orgslug, course_uuid, onBack }: ModuleDetailFormProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const course = useCourse() as any
  const access_token = session?.data?.tokens?.access_token

  // ── Content locale ──
  // Same rule as LessonDetailForm: the base chapter row holds the source locale,
  // every other locale lives in extra_metadata.translations[locale].
  const contentLocale = useContentLocale()
  const sourceLocale = (course?.courseStructure?.source_locale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === sourceLocale

  const [extraMeta, setExtraMeta] = useState<Record<string, any>>(chapter.extra_metadata || {})
  const extraMetaRef = useRef(extraMeta)
  const translations = extraMeta.translations || {}
  const translation = !isSourceLocale ? translations[contentLocale] || null : null

  const [isSaving, setIsSaving] = useState(false)

  // ── Values for a given locale ──

  // The `chapter` prop is a snapshot from the course payload; after we save a
  // source-locale edit it goes stale, so keep the live source text here.
  const sourceRef = useRef({
    name: chapter.name || '',
    description: chapter.description || '',
  })

  const valuesFor = useCallback(
    (locale: string, meta: Record<string, any>, translated: Record<string, any> | null): ModuleValues => {
      const base: ModuleValues = {
        name: sourceRef.current.name,
        description: sourceRef.current.description,
      }
      if (!translated || locale === sourceLocale) return base
      return {
        name: translated.name ?? base.name,
        description: translated.description ?? base.description,
      }
    },
    [sourceLocale]
  )

  const [values, setValues] = useState<ModuleValues>(() =>
    valuesFor(contentLocale, extraMeta, !isSourceLocale ? translations[contentLocale] || null : null)
  )

  const savedValuesRef = useRef<ModuleValues>(values)
  // Latest values together with the locale they belong to. It intentionally
  // does NOT follow a locale switch, so a pending edit is always flushed into
  // the language it was typed in.
  const lastValuesRef = useRef<{ values: ModuleValues; locale: string }>({
    values,
    locale: contentLocale,
  })

  // Seeded from the initial values so the button reads "Saved" on first paint.
  const lastSavedSnapshotRef = useRef(snapshotOf(values))
  const isSaved = snapshotOf(values) === lastSavedSnapshotRef.current

  useEffect(() => {
    lastSavedSnapshotRef.current = snapshotOf(savedValuesRef.current)
    if (lastValuesRef.current.locale !== contentLocale) return
    lastValuesRef.current = { values, locale: contentLocale }
  }, [values, contentLocale])

  // ── Persist ──

  const persist = useCallback(
    async (
      locale: string,
      isSource: boolean,
      next: ModuleValues,
      saved: ModuleValues
    ) => {
      const nameChanged = next.name !== saved.name
      const descChanged = next.description !== saved.description

      if (!nameChanged && !descChanged) return

      const meta = extraMetaRef.current || {}
      const data: any = {}

      if (isSource) {
        if (nameChanged) data.name = next.name
        if (descChanged) data.description = next.description
      } else if (nameChanged || descChanged) {
        // Translating never touches the base row — name and description
        // go into the locale entry.
        data.extra_metadata = {
          ...meta,
          translations: {
            ...(meta.translations || {}),
            [locale]: {
              ...((meta.translations || {})[locale] || {}),
              name: next.name,
              description: next.description,
            },
          },
        }
      }

      if (Object.keys(data).length === 0) return

      setIsSaving(true)
      try {
        const updated: any = await updateChapter(chapter.id, data, access_token)
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
        lastSavedSnapshotRef.current = snapshotOf(next)
      } catch (e) {
        console.error('Failed to save module:', e)
        toast.error(t('dashboard.courses.structure.module_detail.save_error'))
      } finally {
        setIsSaving(false)
      }
    },
    [chapter.id, access_token, t]
  )

  // Debounced auto-save.
  useEffect(() => {
    if (isSaved) return
    const timer = setTimeout(() => {
      persist(
        contentLocale,
        isSourceLocale,
        values,
        savedValuesRef.current
      )
    }, 600)
    return () => clearTimeout(timer)
  }, [values, isSaved, contentLocale, isSourceLocale, persist])

  // Flush pending edits on unmount instead of discarding them.
  useEffect(() => {
    return () => {
      const pending = lastValuesRef.current
      persist(
        pending.locale,
        pending.locale === sourceLocale,
        pending.values,
        savedValuesRef.current
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switching the dashboard language swaps the content we edit. Flush the
  // previous locale first, then load the new one.
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
          savedValuesRef.current
        )
      }
      if (cancelled) return

      const translated = !isSourceLocale
        ? (extraMetaRef.current.translations || {})[contentLocale] || null
        : null
      const next = valuesFor(contentLocale, extraMetaRef.current, translated)
      setValues(next)
      savedValuesRef.current = next
      lastSavedSnapshotRef.current = snapshotOf(next)
      lastValuesRef.current = { values: next, locale: contentLocale }
    })()

    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, persist, valuesFor])

  // ── Actions ──

  const handleManualSave = useCallback(() => {
    if (isSaving) return
    persist(
      contentLocale,
      isSourceLocale,
      values,
      savedValuesRef.current
    )
  }, [isSaving, persist, contentLocale, isSourceLocale, values])

  const copyFromSource = useCallback(() => {
    setValues({
      name: sourceRef.current.name,
      description: sourceRef.current.description,
    })
  }, [])

  const update = (patch: Partial<ModuleValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  return (
    <div>
      <FormLayout onSubmit={(e: React.FormEvent) => e.preventDefault()} className="space-y-3">
        {/* ── ACTION ROW ── */}
        <div className="flex items-center justify-between">
          {/* Left: Back */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{t('common.back')}</span>
          </button>

          {/* Right: Locale + Save */}
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
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSaving
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : isSaved
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaved ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>
                {isSaving
                  ? t('dashboard.courses.save.saving')
                  : isSaved
                    ? t('dashboard.courses.save.saved')
                    : t('dashboard.courses.save.save')}
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
              <FormLabelAndMessage label={t('dashboard.courses.structure.module_detail.name_label')} />
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
              <FormLabelAndMessage label={t('dashboard.courses.structure.module_detail.description_label')} />
              <Form.Control asChild>
                <Input
                  className={fieldClassName}
                  onChange={(e) => update({ description: e.target.value })}
                  value={values.description}
                  type="text"
                  placeholder={t('dashboard.courses.structure.module_detail.description_placeholder')}
                />
              </Form.Control>
            </FormField>
          </div>
        </div>
      </FormLayout>
    </div>
  )
}

export default ModuleDetailForm
