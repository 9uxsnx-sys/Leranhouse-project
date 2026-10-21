'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, Eye, Loader2, SaveAllIcon } from 'lucide-react'
import toast from 'react-hot-toast'

import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCollectionTranslation } from '@components/Hooks/useCollectionTranslation'
import { getCurrentLanguageNativeName } from '@/lib/languages'
import { getUriWithOrg } from '@services/config/config'
import { updateCollection } from '@services/courses/collections'
import {
  getCollectionTranslations,
  upsertCollectionTranslation,
} from '@services/courses/collectionTranslations'
import { revalidateTags } from '@services/utils/ts/requests'

type EditCollectionSEOProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

interface SEOValues {
  title: string
  description: string
  keywords: string
  canonical_url: string
  og_title: string
  og_description: string
  og_image: string
  twitter_card: string
  twitter_title: string
  twitter_description: string
  robots_noindex: boolean
  robots_nofollow: boolean
  enable_jsonld: boolean
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validate = (values: SEOValues, t: any) => {
  const errors = {} as Partial<SEOValues>

  if (values.title && values.title.length > 70) {
    errors.title = t('dashboard.courses.seo.validation.title_max_length')
  }
  if (values.description && values.description.length > 160) {
    errors.description = t('dashboard.courses.seo.validation.description_max_length')
  }
  if (values.og_title && values.og_title.length > 70) {
    errors.og_title = t('dashboard.courses.seo.validation.og_title_max_length')
  }
  if (values.og_description && values.og_description.length > 200) {
    errors.og_description = t('dashboard.courses.seo.validation.og_description_max_length')
  }
  if (values.twitter_title && values.twitter_title.length > 70) {
    errors.twitter_title = t('dashboard.courses.seo.validation.twitter_title_max_length')
  }
  if (values.twitter_description && values.twitter_description.length > 200) {
    errors.twitter_description = t('dashboard.courses.seo.validation.twitter_description_max_length')
  }
  if (values.canonical_url && !isValidUrl(values.canonical_url)) {
    errors.canonical_url = t('dashboard.courses.seo.validation.invalid_url')
  }
  if (values.og_image && !isValidUrl(values.og_image)) {
    errors.og_image = t('dashboard.courses.seo.validation.invalid_url')
  }

  return errors
}

function EditCollectionSEO({ collection, orgslug, onUpdated }: EditCollectionSEOProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  // ── Content locale ──
  // Any locale other than the source writes the collection translation row.
  const { contentLocale, isSourceLocale, translation, setTranslation } =
    useCollectionTranslation(
      collection?.collection_uuid,
      collection?.source_locale || 'en'
    )

  // A translation row cannot exist without the general fields, so SEO stays
  // read-only until the General tab has been translated once.
  const isTranslationLocked = !isSourceLocale && !translation

  const initialValues = useMemo((): SEOValues => {
    // SEO follows the content locale: source locale reads the base row,
    // other locales read their translation row.
    const seo =
      !isSourceLocale && translation?.seo ? translation.seo : collection?.seo || {}
    return {
      title: seo.title || '',
      description: seo.description || '',
      keywords: seo.keywords || '',
      canonical_url: seo.canonical_url || '',
      og_title: seo.og_title || '',
      og_description: seo.og_description || '',
      og_image: seo.og_image || '',
      twitter_card: seo.twitter_card || 'summary_large_image',
      twitter_title: seo.twitter_title || '',
      twitter_description: seo.twitter_description || '',
      robots_noindex: seo.robots_noindex || false,
      robots_nofollow: seo.robots_nofollow || false,
      enable_jsonld: seo.enable_jsonld !== false,
    }
  }, [collection?.seo, translation, isSourceLocale])

  const [values, setValues] = useState<SEOValues>(initialValues)
  const [isSavingRequest, setIsSavingRequest] = useState(false)
  const [error, setError] = useState('')

  // Every field is disabled while a request runs or while the locale has no
  // translation yet (the base row must not be edited from a translation view).
  const isSaving = isSavingRequest || isTranslationLocked

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const isDirty = useMemo(
    () =>
      (Object.keys(values) as Array<keyof SEOValues>).some(
        (key) => values[key] !== initialValues[key]
      ),
    [values, initialValues]
  )

  const formErrors = useMemo(() => validate(values, t), [values, t])

  const setField = useCallback((key: keyof SEOValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving || isTranslationLocked) return
    if (Object.keys(formErrors).length > 0) return
    setIsSavingRequest(true)
    setError('')
    try {
      const seo = {
        title: values.title || null,
        description: values.description || null,
        keywords: values.keywords || null,
        canonical_url: values.canonical_url || null,
        og_title: values.og_title || null,
        og_description: values.og_description || null,
        og_image: values.og_image || null,
        twitter_card: values.twitter_card || null,
        twitter_title: values.twitter_title || null,
        twitter_description: values.twitter_description || null,
        robots_noindex: values.robots_noindex,
        robots_nofollow: values.robots_nofollow,
        enable_jsonld: values.enable_jsonld,
      }
      if (!isSourceLocale) {
        // Translating never touches the base row: keep the general fields of
        // the existing translation and only swap its SEO payload.
        await upsertCollectionTranslation(
          collection.collection_uuid,
          contentLocale,
          {
            name: translation?.name ?? collection?.name ?? '',
            description: translation?.description ?? null,
            about: translation?.about ?? null,
            learnings: translation?.learnings ?? null,
            tags: translation?.tags ?? null,
            seo,
          },
          accessToken
        )
        const rows = await getCollectionTranslations(
          collection.collection_uuid,
          accessToken
        )
        setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } else {
        const res = await updateCollection(collection.collection_uuid, { seo }, accessToken)
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
      setIsSavingRequest(false)
    }
  }, [
    isDirty,
    isSaving,
    isTranslationLocked,
    formErrors,
    values,
    collection?.collection_uuid,
    accessToken,
    orgslug,
    onUpdated,
    t,
    isSourceLocale,
    contentLocale,
    translation,
    setTranslation,
  ])

  const collectionId = (collection?.collection_uuid || '').replace('collection_', '')

  const Toggle = ({
    name,
    label,
    checked,
  }: {
    name: string
    label: string
    checked: boolean
  }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-black' : 'bg-gray-300'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => setField(name as keyof SEOValues, e.target.checked)}
          name={name}
          disabled={isSaving}
        />
      </div>
      <span className="text-sm text-gray-600 select-none">{label}</span>
    </label>
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
              disabled={isSavingRequest || (isDirty && Object.keys(formErrors).length > 0)}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSavingRequest
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : !isDirty || isTranslationLocked
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isSavingRequest ? (
                <Loader2 size={14} className="animate-spin" />
              ) : !isDirty || isTranslationLocked ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>
                {isSavingRequest
                  ? t('dashboard.courses.save.saving')
                  : !isDirty || isTranslationLocked
                    ? t('dashboard.courses.save.saved')
                    : t('dashboard.courses.save.save')}
              </span>
            </button>
          </div>
        </div>

        {isTranslationLocked && (
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            {t('dashboard.courses.general.locale.inherited')}
          </div>
        )}

        {/* ── BASIC SEO ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('dashboard.courses.seo.sections.basic.title')}
          </h3>
          <div className="space-y-4">
            <FormField name="title">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.title_label')}
                message={formErrors.title}
              />
              <Input
                className={fieldClassName}
                onChange={(e) => setField('title', e.target.value)}
                value={values.title}
                type="text"
                placeholder={t('dashboard.courses.seo.form.title_placeholder')}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="description">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.description_label')}
                message={formErrors.description}
              />
              <Textarea
                className={`${fieldClassName} min-h-[80px]`}
                onChange={(e) => setField('description', e.target.value)}
                value={values.description}
                placeholder={t('dashboard.courses.seo.form.description_placeholder')}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="keywords">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.keywords_label')}
                message={formErrors.keywords}
              />
              <Input
                className={fieldClassName}
                onChange={(e) => setField('keywords', e.target.value)}
                value={values.keywords}
                type="text"
                placeholder={t('dashboard.courses.seo.form.keywords_placeholder')}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="canonical_url">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.canonical_url_label')}
                message={formErrors.canonical_url}
              />
              <Input
                className={fieldClassName}
                onChange={(e) => setField('canonical_url', e.target.value)}
                value={values.canonical_url}
                type="text"
                placeholder={t('dashboard.courses.seo.form.canonical_url_placeholder')}
                disabled={isSaving}
              />
            </FormField>
          </div>
        </div>

        {/* ── OPEN GRAPH ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('dashboard.courses.seo.sections.opengraph.title')}
          </h3>
          <div className="space-y-4">
            <FormField name="og_title">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.og_title_label')}
                message={formErrors.og_title}
              />
              <Input
                className={fieldClassName}
                onChange={(e) => setField('og_title', e.target.value)}
                value={values.og_title}
                type="text"
                placeholder={t('dashboard.courses.seo.form.og_title_placeholder')}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="og_description">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.og_description_label')}
                message={formErrors.og_description}
              />
              <Textarea
                className={`${fieldClassName} min-h-[80px]`}
                onChange={(e) => setField('og_description', e.target.value)}
                value={values.og_description}
                placeholder={t('dashboard.courses.seo.form.og_description_placeholder')}
                disabled={isSaving}
              />
            </FormField>

            <FormField name="og_image">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.og_image_label')}
                message={formErrors.og_image}
              />
              <Input
                className={fieldClassName}
                onChange={(e) => setField('og_image', e.target.value)}
                value={values.og_image}
                type="text"
                placeholder={t('dashboard.courses.seo.form.og_image_placeholder')}
                disabled={isSaving}
              />
            </FormField>
          </div>
        </div>

        {/* ── TWITTER CARD ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('dashboard.courses.seo.sections.twitter.title')}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="twitter_card">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.twitter_card_label')}
                />
                <Select
                  value={values.twitter_card || undefined}
                  onValueChange={(value) => setField('twitter_card', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.courses.seo.form.select_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">
                      {t('dashboard.courses.seo.form.twitter_card_summary')}
                    </SelectItem>
                    <SelectItem value="summary_large_image">
                      {t('dashboard.courses.seo.form.twitter_card_summary_large')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField name="twitter_title">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.twitter_title_label')}
                  message={formErrors.twitter_title}
                />
                <Input
                  className={fieldClassName}
                  onChange={(e) => setField('twitter_title', e.target.value)}
                  value={values.twitter_title}
                  type="text"
                  placeholder={t('dashboard.courses.seo.form.twitter_title_placeholder')}
                  disabled={isSaving}
                />
              </FormField>
            </div>

            <FormField name="twitter_description">
              <FormLabelAndMessage
                label={t('dashboard.courses.seo.form.twitter_description_label')}
                message={formErrors.twitter_description}
              />
              <Textarea
                className={`${fieldClassName} min-h-[80px]`}
                onChange={(e) => setField('twitter_description', e.target.value)}
                value={values.twitter_description}
                placeholder={t('dashboard.courses.seo.form.twitter_description_placeholder')}
                disabled={isSaving}
              />
            </FormField>
          </div>
        </div>

        {/* ── ROBOTS & STRUCTURED DATA ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('dashboard.courses.seo.sections.robots.title')}
          </h3>
          <div className="space-y-4">
            <Toggle
              name="robots_noindex"
              label={t('dashboard.courses.seo.form.robots_noindex_label')}
              checked={values.robots_noindex}
            />
            <Toggle
              name="robots_nofollow"
              label={t('dashboard.courses.seo.form.robots_nofollow_label')}
              checked={values.robots_nofollow}
            />
            <Toggle
              name="enable_jsonld"
              label={t('dashboard.courses.seo.form.enable_jsonld_label')}
              checked={values.enable_jsonld}
            />
          </div>
        </div>
      </div>
    </FormLayout>
  )
}

export default EditCollectionSEO
