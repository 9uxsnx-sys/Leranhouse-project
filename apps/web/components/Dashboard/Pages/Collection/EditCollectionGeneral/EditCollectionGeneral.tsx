'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, Copy, Eye, Globe, GlobeLock, Loader2, SaveAllIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import LearningItemsList from '@components/Dashboard/Pages/Course/EditCourseGeneral/LearningItemsList'
import CollectionMediaSection from './CollectionMediaSection'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-field'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCollectionTranslation } from '@components/Hooks/useCollectionTranslation'
import { getCurrentLanguageNativeName } from '@/lib/languages'
import { DIFFICULTY_OPTIONS, difficultyTranslationKey } from '@/lib/difficulty'
import { updateCollection } from '@services/courses/collections'
import {
  getCollectionTranslations,
  upsertCollectionTranslation,
} from '@services/courses/collectionTranslations'
import { getUriWithOrg } from '@services/config/config'
import { revalidateTags } from '@services/utils/ts/requests'

const fieldClassName =
  'bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none'

type EditCollectionGeneralProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

function initializeLearnings(learnings: any): string {
  if (!learnings) return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }])
  try {
    const parsed = JSON.parse(learnings)
    if (Array.isArray(parsed)) return learnings
  } catch {
    // plain text — wrap below
  }
  if (typeof learnings === 'string') {
    return JSON.stringify([{ id: 'default-1', text: learnings, emoji: '📝' }])
  }
  return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }])
}

/** Requirements arrive as JSON but older rows omit `id`, which the list needs. */
function initializeRequirements(requirements: any): string {
  if (!requirements) return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }])
  try {
    const parsed = JSON.parse(requirements)
    if (Array.isArray(parsed)) {
      return JSON.stringify(
        parsed.map((item: any, index: number) => ({
          id: `req-${index}`,
          text: typeof item === 'string' ? item : (item?.text ?? ''),
          emoji: item?.emoji || '📝',
        }))
      )
    }
  } catch {
    // plain text — wrap below
  }
  if (typeof requirements === 'string') {
    return JSON.stringify([{ id: 'default-1', text: requirements, emoji: '📝' }])
  }
  return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }])
}

/** Target audience is stored as `string[]`, the list editor works on JSON items. */
function initializeAudienceItems(items: string[] | undefined): string {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return JSON.stringify([{ id: 'default-1', text: '' }])
  }
  return JSON.stringify(items.map((text, i) => ({ id: `af-${i}`, text })))
}

/** Pull the texts out of a `LearningItemsList` value, dropping blank rows. */
function listTexts(value: string): string[] {
  try {
    return (JSON.parse(value) as Array<{ text?: string }>)
      .map((item) => (item?.text ?? '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function EditCollectionGeneral({ collection, orgslug, onUpdated }: EditCollectionGeneralProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token

  // ── Content locale ──
  // Same rule as the course editor: the base collection row holds the source
  // locale, every other locale lives in collection_translation.
  const { contentLocale, isSourceLocale, translation, setTranslation } =
    useCollectionTranslation(
      collection?.collection_uuid,
      collection?.source_locale || 'en'
    )

  const initialValues = useMemo(() => {
    const localized = !isSourceLocale && translation ? translation : null
    const meta = collection?.extra_metadata || {}
    // Display-text metadata is translated; counts and flags stay on the base row.
    const localizedMeta = (!isSourceLocale && translation?.extra_metadata) || null
    return {
      name: localized?.name ?? collection?.name ?? '',
      description: localized?.description ?? collection?.description ?? '',
      about: localized?.about ?? collection?.about ?? '',
      learnings: initializeLearnings(localized?.learnings ?? collection?.learnings),
      tags: localized?.tags ?? collection?.tags ?? '',
      meta_difficulty: localizedMeta?.difficulty ?? meta.difficulty ?? '',
      meta_duration: localizedMeta?.duration ?? meta.duration ?? '',
      meta_has_certificate: meta.has_certificate ?? false,
      meta_requirements: initializeRequirements(localizedMeta?.requirements ?? meta.requirements),
      meta_audience_for: initializeAudienceItems(
        localizedMeta?.target_audience?.for ?? meta.target_audience?.for
      ),
      meta_audience_not_for: initializeAudienceItems(
        localizedMeta?.target_audience?.not_for ?? meta.target_audience?.not_for
      ),
    }
  }, [
    collection?.name,
    collection?.description,
    collection?.about,
    collection?.learnings,
    collection?.tags,
    collection?.extra_metadata,
    translation,
    isSourceLocale,
  ])

  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const isPublished = collection?.published ?? false
  const collectionId = (collection?.collection_uuid || '').replace('collection_', '')

  const META_FIELDS = [
    'meta_difficulty',
    'meta_duration',
    'meta_has_certificate',
    'meta_requirements',
    'meta_audience_for',
    'meta_audience_not_for',
  ] as const

  // Display-text keys go to the translation row; a source-locale save also
  // carries the flags and merges over the stored object so the counts that this
  // form does not expose (lessons_count, video_hours, resources_count) survive.
  const buildExtraMetadata = useCallback(() => {
    const requirements = values.meta_requirements
    const audienceFor = listTexts(values.meta_audience_for)
    const audienceNotFor = listTexts(values.meta_audience_not_for)

    if (!isSourceLocale) {
      return {
        ...(translation?.extra_metadata || {}),
        difficulty: values.meta_difficulty,
        duration: values.meta_duration,
        requirements,
        target_audience: { for: audienceFor, not_for: audienceNotFor },
      }
    }

    const stored = collection?.extra_metadata || {}
    return {
      ...stored,
      difficulty: values.meta_difficulty,
      duration: values.meta_duration,
      has_certificate: values.meta_has_certificate,
      requirements,
      target_audience: {
        ...(stored.target_audience || {}),
        for: audienceFor,
        not_for: audienceNotFor,
      },
    }
  }, [
    values,
    isSourceLocale,
    translation?.extra_metadata,
    collection?.extra_metadata,
  ])

  const changes = useMemo(() => {
    const diff: Record<string, any> = {}
    const contentFields = ['name', 'description', 'about', 'learnings', 'tags'] as const
    contentFields.forEach((key) => {
      if (values[key] !== initialValues[key]) diff[key] = values[key]
    })

    const metaChanged = META_FIELDS.some((field) => values[field] !== initialValues[field])
    if (metaChanged) diff.extra_metadata = buildExtraMetadata()

    return diff
  }, [values, initialValues, buildExtraMetadata])

  const isDirty = Object.keys(changes).length > 0

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      if (!isSourceLocale) {
        // Translating never touches the base row.
        await upsertCollectionTranslation(
          collection.collection_uuid,
          contentLocale,
          {
            name: values.name,
            description: values.description,
            about: values.about,
            learnings: values.learnings,
            tags: values.tags,
            seo: translation?.seo ?? null,
            extra_metadata: buildExtraMetadata(),
          },
          accessToken
        )
        const rows = await getCollectionTranslations(collection.collection_uuid, accessToken)
        setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } else {
        const res = await updateCollection(collection.collection_uuid, changes, accessToken)
        if (res.success === false) {
          setError(res.data?.detail || res.HTTPmessage || t('collections.dashboard.save_error'))
          toast.error(res.data?.detail || t('collections.dashboard.save_error'))
          return
        }
      }
      await revalidateTags(['collections'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.save.success'))
    } catch (err: any) {
      setError(err?.message || t('collections.dashboard.save_error'))
      toast.error(err?.message || t('collections.dashboard.save_error'))
    } finally {
      setIsSaving(false)
    }
  }, [
    isDirty,
    isSaving,
    changes,
    collection?.collection_uuid,
    accessToken,
    orgslug,
    onUpdated,
    t,
    isSourceLocale,
    contentLocale,
    values,
    translation,
    setTranslation,
    buildExtraMetadata,
  ])

  const copyFromSource = useCallback(() => {
    const meta = collection?.extra_metadata || {}
    setValues({
      name: collection?.name || '',
      description: collection?.description || '',
      about: collection?.about || '',
      learnings: initializeLearnings(collection?.learnings),
      tags: collection?.tags || '',
      meta_difficulty: meta.difficulty ?? '',
      meta_duration: meta.duration ?? '',
      meta_has_certificate: meta.has_certificate ?? false,
      meta_requirements: initializeRequirements(meta.requirements),
      meta_audience_for: initializeAudienceItems(meta.target_audience?.for),
      meta_audience_not_for: initializeAudienceItems(meta.target_audience?.not_for),
    })
  }, [collection?.name, collection?.description, collection?.about, collection?.learnings, collection?.tags, collection?.extra_metadata])

  const togglePublish = useCallback(async () => {
    if (isPublishing) return
    setIsPublishing(true)
    const next = !isPublished
    const toastId = toast.loading(
      next ? t('dashboard.courses.publishing') : t('dashboard.courses.unpublishing')
    )
    try {
      const res = await updateCollection(
        collection.collection_uuid,
        { published: next },
        accessToken
      )
      if (res.success === false) {
        toast.error(res.data?.detail || t('dashboard.courses.publish_error'), { id: toastId })
        return
      }
      await revalidateTags(['collections'], orgslug)
      await onUpdated()
      toast.success(
        next ? t('dashboard.courses.published_success') : t('dashboard.courses.unpublished_success'),
        { id: toastId }
      )
    } catch (err: any) {
      toast.error(err?.message || t('dashboard.courses.publish_error'), { id: toastId })
    } finally {
      setIsPublishing(false)
    }
  }, [isPublishing, isPublished, collection?.collection_uuid, accessToken, orgslug, onUpdated, t])

  const handleMediaUpdated = useCallback(
    async (fields: Record<string, any>) => {
      await onUpdated()
      void fields
    },
    [onUpdated]
  )

  return (
    <FormLayout onSubmit={(e: any) => e.preventDefault()}>
      {error && (
        <div className="flex justify-center bg-red-200 rounded-md text-red-950 space-x-2 items-center p-4 mb-6 transition-all shadow-xs">
          <AlertTriangle size={18} />
          <div className="font-bold text-sm">{error}</div>
        </div>
      )}

      <div className="space-y-3">
        {/* ── ACTION ROW ── */}
        <div className="flex items-center justify-between">
          <Link
            href={getUriWithOrg(orgslug, '') + `/collection/${collectionId}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            <span>{t('dashboard.courses.preview')}</span>
          </Link>

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
              <span className={`w-1.5 h-1.5 rounded-full ${!isDirty ? 'bg-teal-500' : 'bg-amber-400'}`} />
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
              type="button"
              onClick={isDirty ? handleSave : undefined}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSaving
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : !isDirty
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : !isDirty ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>
                {isSaving
                  ? t('dashboard.courses.save.saving')
                  : !isDirty
                    ? t('dashboard.courses.save.saved')
                    : t('dashboard.courses.save.save')}
              </span>
            </button>

            <button
              type="button"
              onClick={togglePublish}
              disabled={isPublishing}
              className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ${
                isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isPublishing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isPublished ? (
                <Globe size={14} />
              ) : (
                <GlobeLock size={14} />
              )}
              <span>
                {isPublishing
                  ? t('dashboard.courses.processing')
                  : isPublished
                    ? t('dashboard.courses.published')
                    : t('dashboard.courses.unpublished')}
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
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.overview')}
          </h3>
          <div className="space-y-4">
            <FormField name="name">
              <FormLabelAndMessage label={t('collections.collection_name')} />
              <Input
                className={fieldClassName}
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                type="text"
                maxLength={100}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="description">
              <FormLabelAndMessage label={t('collections.description')} />
              <Input
                className={fieldClassName}
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
                type="text"
                maxLength={1000}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="about">
              <FormLabelAndMessage label={t('collections.dashboard.general.about_label')} />
              <Textarea
                className={`${fieldClassName} min-h-[200px]`}
                value={values.about}
                onChange={(e) => setValues({ ...values, about: e.target.value })}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="meta_requirements">
              <FormLabelAndMessage label={t('dashboard.courses.general.form.requirements_label')} />
              <LearningItemsList
                value={values.meta_requirements}
                onChange={(value: string) => setValues({ ...values, meta_requirements: value })}
              />
            </FormField>

            <FormField name="meta_audience_for">
              <FormLabelAndMessage label={t('dashboard.courses.general.details.audience_for_label')} />
              <LearningItemsList
                value={values.meta_audience_for}
                onChange={(value: string) => setValues({ ...values, meta_audience_for: value })}
              />
            </FormField>

            <FormField name="meta_audience_not_for">
              <FormLabelAndMessage label={t('dashboard.courses.general.details.audience_not_for_label')} />
              <LearningItemsList
                value={values.meta_audience_not_for}
                onChange={(value: string) => setValues({ ...values, meta_audience_not_for: value })}
              />
            </FormField>
          </div>
        </div>

        {/* ── LEARNINGS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('collections.dashboard.general.learnings_title')}
          </h3>
          <FormField name="learnings">
            <LearningItemsList
              value={values.learnings}
              onChange={(value: string) => setValues({ ...values, learnings: value })}
            />
          </FormField>
        </div>

        {/* ── MEDIA (shared across locales) ── */}
        <CollectionMediaSection collection={collection} onUpdated={handleMediaUpdated} />

        {/* ── DETAILS (difficulty and duration are translatable, the certificate flag is shared) ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.details')}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="meta_difficulty">
                <FormLabelAndMessage label={t('dashboard.courses.general.details.difficulty_label')} />
                {isSourceLocale ? (
                  <Select
                    value={values.meta_difficulty || undefined}
                    onValueChange={(value) => setValues({ ...values, meta_difficulty: value })}
                    disabled={isSaving}
                  >
                    <SelectTrigger className={fieldClassName}>
                      <SelectValue placeholder={t('dashboard.courses.general.details.difficulty_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option) => {
                        const key = difficultyTranslationKey(option)
                        return (
                          <SelectItem key={option} value={option}>
                            {key ? t(key) : option}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  // Free text in a translation: the label itself is content.
                  <Input
                    className={fieldClassName}
                    onChange={(e) => setValues({ ...values, meta_difficulty: e.target.value })}
                    value={values.meta_difficulty}
                    type="text"
                    placeholder={t('dashboard.courses.general.details.difficulty_placeholder')}
                    disabled={isSaving}
                  />
                )}
              </FormField>

              <FormField name="meta_duration">
                <FormLabelAndMessage label={t('dashboard.courses.general.details.duration_label')} />
                <Input
                  className={fieldClassName}
                  onChange={(e) => setValues({ ...values, meta_duration: e.target.value })}
                  value={values.meta_duration}
                  type="text"
                  disabled={isSaving}
                />
              </FormField>
            </div>

            <FormField name="meta_has_certificate">
              <FormLabelAndMessage label={t('dashboard.courses.general.details.offers_certificate_label')} />
              <label className="flex items-center gap-3 pt-1 cursor-pointer">
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${values.meta_has_certificate ? 'bg-black' : 'bg-gray-300'} ${isSaving || !isSourceLocale ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${values.meta_has_certificate ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={values.meta_has_certificate}
                    onChange={(e) => setValues({ ...values, meta_has_certificate: e.target.checked })}
                    disabled={isSaving || !isSourceLocale}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.general.details.offers_certificate_description')}</span>
              </label>
            </FormField>

            {!isSourceLocale && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                {t('dashboard.courses.general.locale.shared_fields')}
              </p>
            )}
          </div>
        </div>

        {/* ── TAGS ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('collections.dashboard.general.tags_title')}
          </h3>
          <FormField name="tags">
            <FormLabelAndMessage label={t('collections.dashboard.general.tags_label')} />
            <Input
              className={fieldClassName}
              value={values.tags}
              onChange={(e) => setValues({ ...values, tags: e.target.value })}
              type="text"
              placeholder={t('collections.dashboard.general.tags_placeholder')}
              disabled={isSaving}
            />
          </FormField>
        </div>
      </div>
    </FormLayout>
  )
}

export default EditCollectionGeneral
