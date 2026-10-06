'use client'
import React, { useState, useRef } from 'react'
import { usePodcast } from '@components/Contexts/PodcastContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { updatePodcast, updatePodcastThumbnail, deletePodcastThumbnail } from '@services/podcasts/podcasts'
import { revalidateTags } from '@services/utils/ts/requests'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { Loader2, Eye, Check, SaveAllIcon, Globe, GlobeLock, UploadCloud, ImageIcon, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

interface EditPodcastGeneralProps {
  orgslug: string
}

function EditPodcastGeneral({ orgslug }: EditPodcastGeneralProps) {
  const { t } = useTranslation()
  const { podcast, refreshPodcast, setPodcast, isLoading } = usePodcast()
  const session = useLHSession() as any
  const org = useOrg() as any
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false)

  const accessToken = session?.data?.tokens?.access_token
  const isPublished = podcast?.published ?? false
  const shortUuid = podcast?.podcast_uuid?.replace('podcast_', '')
  const hasThumbnail = !!podcast?.thumbnail_image

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('podcasts.form.name_required'))
      .min(3, t('podcasts.form.name_min_length'))
      .max(100, t('podcasts.form.name_max_length')),
    description: Yup.string().max(500, t('podcasts.form.description_max_length')),
    about: Yup.string().max(2000, t('podcasts.dashboard.form.about_max_length')),
  })

  if (isLoading || !podcast) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const initialValues = {
    name: podcast.name || '',
    description: podcast.description || '',
    about: podcast.about || '',
  }

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSaving(true)
    const toastId = toast.loading(t('podcasts.dashboard.saving'))
    try {
      await updatePodcast(podcast.podcast_uuid, values, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()
      toast.success(t('podcasts.dashboard.saved'), { id: toastId })
    } catch (error) {
      console.error('Failed to save podcast:', error)
      toast.error(t('podcasts.dashboard.save_error'), { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublishStatus = async () => {
    if (isPublishing || !podcast) return
    setIsPublishing(true)

    const newPublishedStatus = !isPublished
    const toastMessage = newPublishedStatus ? 'Publishing...' : 'Unpublishing...'
    const toastId = toast.loading(toastMessage)

    try {
      await updatePodcast(
        podcast.podcast_uuid,
        { published: newPublishedStatus },
        accessToken
      )

      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()

      toast.dismiss(toastId)
      toast.success(
        newPublishedStatus ? 'Podcast published successfully' : 'Podcast unpublished successfully'
      )
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      toast.dismiss(toastId)
      toast.error('Failed to update publish status')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsThumbnailLoading(true)
    const toastId = toast.loading('Uploading thumbnail...')
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      await updatePodcastThumbnail(podcast.podcast_uuid, formData, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()
      toast.success('Thumbnail uploaded', { id: toastId })
    } catch (error) {
      console.error('Failed to upload thumbnail:', error)
      toast.error('Failed to upload thumbnail', { id: toastId })
    } finally {
      setIsThumbnailLoading(false)
      e.target.value = ''
    }
  }

  const handleDeleteThumbnail = async () => {
    setIsThumbnailLoading(true)
    const toastId = toast.loading('Removing thumbnail...')
    try {
      await deletePodcastThumbnail(podcast.podcast_uuid, accessToken)
      // Immediately clear the thumbnail in local state so UI switches instantly
      setPodcast({ ...podcast, thumbnail_image: null as any })
      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()
      toast.success('Thumbnail removed', { id: toastId })
    } catch (error) {
      console.error('Failed to delete thumbnail:', error)
      toast.error('Failed to remove thumbnail', { id: toastId })
    } finally {
      setIsThumbnailLoading(false)
    }
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, errors, touched, isValid, dirty, submitForm }) => (
        <Form>
          <div className="space-y-3">
            {/* ── ACTION ROW ── */}
            <div className="flex items-center justify-between">
              <Link
                href={getUriWithOrg(org?.slug, '') + `/podcast/${shortUuid}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} />
                <span>Preview</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={submitForm}
                  disabled={isSaving || !isValid || !dirty}
                  className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                    isSaving
                      ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                      : !dirty
                        ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                        : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : !dirty ? (
                    <Check size={14} />
                  ) : (
                    <SaveAllIcon size={14} />
                  )}
                  <span>
                    {isSaving
                      ? 'Saving...'
                      : !dirty
                        ? 'Saved'
                        : 'Save'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={togglePublishStatus}
                  disabled={isPublishing}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ${isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                      ? 'Processing...'
                      : isPublished
                        ? 'Published'
                        : 'Unpublished'}
                  </span>
                </button>
              </div>
            </div>

            {/* ── BASIC INFORMATION ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div className="grid mb-2.5">
                  <label className="font-medium leading-[35px] text-black grow text-sm">
                    {t('podcasts.modals.create.form.name_label')} *
                  </label>
                  {touched.name && errors.name && (
                    <div className="text-red-700 text-sm items-center rounded-md flex space-x-1 mb-1">
                      <span>{errors.name}</span>
                    </div>
                  )}
                  <Input
                    id="name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder={t('podcasts.modals.create.form.name_placeholder')}
                    className={fieldClassName}
                  />
                </div>

                <div className="grid mb-2.5">
                  <label className="font-medium leading-[35px] text-black grow text-sm">
                    {t('podcasts.modals.create.form.description_label')}
                  </label>
                  {touched.description && errors.description && (
                    <div className="text-red-700 text-sm items-center rounded-md flex space-x-1 mb-1">
                      <span>{errors.description}</span>
                    </div>
                  )}
                  <Input
                    id="description"
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    placeholder={t('podcasts.modals.create.form.description_placeholder')}
                    className={fieldClassName}
                  />
                </div>

                <div className="grid mb-2.5">
                  <label className="font-medium leading-[35px] text-black grow text-sm">
                    {t('podcasts.dashboard.form.about')}
                  </label>
                  {touched.about && errors.about && (
                    <div className="text-red-700 text-sm items-center rounded-md flex space-x-1 mb-1">
                      <span>{errors.about}</span>
                    </div>
                  )}
                  <Textarea
                    id="about"
                    name="about"
                    value={values.about}
                    onChange={handleChange}
                    placeholder={t('podcasts.dashboard.form.about_placeholder')}
                    className={`${fieldClassName} min-h-[200px]`}
                  />
                </div>
              </div>
            </div>

            {/* ── MEDIA ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                Media
              </h3>
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <div className="flex-shrink-0">
                  <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Podcast Cover Image</p>
                </div>
                {isThumbnailLoading ? (
                  <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleThumbnailChange}
                    />
                    {hasThumbnail ? (
                      <button
                        type="button"
                        onClick={handleDeleteThumbnail}
                        className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove cover image"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title="Upload cover image"
                      >
                        <UploadCloud size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </Form>
      )}
    </Formik>
  )
}

export default EditPodcastGeneral
