'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, Eye, Globe, GlobeLock, Loader2, SaveAllIcon } from 'lucide-react'
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
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { updateCollection } from '@services/courses/collections'
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

function EditCollectionGeneral({ collection, orgslug, onUpdated }: EditCollectionGeneralProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token

  const initialValues = useMemo(
    () => ({
      name: collection?.name || '',
      description: collection?.description || '',
      about: collection?.about || '',
      learnings: initializeLearnings(collection?.learnings),
      tags: collection?.tags || '',
    }),
    [collection?.name, collection?.description, collection?.about, collection?.learnings, collection?.tags]
  )

  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const isPublished = collection?.published ?? false
  const collectionId = (collection?.collection_uuid || '').replace('collection_', '')

  const changes = useMemo(() => {
    const diff: Record<string, any> = {}
    ;(Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
      if (values[key] !== initialValues[key]) diff[key] = values[key]
    })
    return diff
  }, [values, initialValues])

  const isDirty = Object.keys(changes).length > 0

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      const res = await updateCollection(collection.collection_uuid, changes, accessToken)
      if (res.success === false) {
        setError(res.data?.detail || res.HTTPmessage || t('collections.dashboard.save_error'))
        toast.error(res.data?.detail || t('collections.dashboard.save_error'))
        return
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
  }, [isDirty, isSaving, changes, collection?.collection_uuid, accessToken, orgslug, onUpdated, t])

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

        {/* ── MEDIA ── */}
        <CollectionMediaSection collection={collection} onUpdated={handleMediaUpdated} />

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
