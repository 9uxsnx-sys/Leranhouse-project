'use client'
import React, { useState } from 'react'
import { usePodcast } from '@components/Contexts/PodcastContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { updatePodcast } from '@services/podcasts/podcasts'
import { revalidateTags } from '@services/utils/ts/requests'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { Loader2, Eye, Check, SaveAllIcon, Globe, GlobeLock, UploadCloud, ImageIcon, Trash2, Plus, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import PodcastMediaSection from './PodcastMediaSection'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

interface EditPodcastGeneralProps {
  orgslug: string
}

function EditPodcastGeneral({ orgslug }: EditPodcastGeneralProps) {
  const { t } = useTranslation()
  const { podcast, refreshPodcast, setPodcast, isLoading } = usePodcast()
  const session = useLHSession() as any
  const org = useOrg() as any
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [expandedHosts, setExpandedHosts] = useState<Record<number, boolean>>({})

  const accessToken = session?.data?.tokens?.access_token
  const isPublished = podcast?.published ?? false
  const shortUuid = podcast?.podcast_uuid?.replace('podcast_', '')

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

  const meta = podcast.extra_metadata || {}
  const initialValues = {
    name: podcast.name || '',
    description: podcast.description || '',
    about: podcast.about || '',
    meta_total_duration: meta.total_duration?.toString() || '',
    meta_hosts: meta.hosts?.length > 0
      ? meta.hosts.map((h: any) => ({ name: h.name || '', title: h.title || '', avatar: h.avatar || '' }))
      : [],
  }

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSaving(true)
    const toastId = toast.loading(t('podcasts.dashboard.saving'))
    try {
      const { meta_total_duration, meta_hosts, ...rest } = values
      const extra_metadata: Record<string, any> = {}
      if (meta_total_duration) extra_metadata.total_duration = parseInt(meta_total_duration, 10)
      if (meta_hosts && meta_hosts.length > 0) {
        extra_metadata.hosts = meta_hosts.filter((h: any) => h.name.trim())
      }

      await updatePodcast(
        podcast.podcast_uuid,
        { ...rest, extra_metadata: Object.keys(extra_metadata).length > 0 ? extra_metadata : null },
        accessToken
      )
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

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, errors, touched, isValid, dirty, submitForm, setFieldValue }) => (
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

            {/* ── PODCAST DETAILS ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                Podcast Details
              </h3>
              <div className="space-y-4">
                {/* Total Duration */}
                <div className="grid mb-2.5">
                  <label className="font-medium leading-[35px] text-black grow text-sm">
                    Total Duration (minutes)
                  </label>
                  <Input
                    id="meta_total_duration"
                    name="meta_total_duration"
                    type="number"
                    min="0"
                    value={values.meta_total_duration}
                    onChange={handleChange}
                    placeholder="e.g. 45"
                    className={fieldClassName}
                  />
                </div>

                {/* Hosts */}
                <div>
                  <label className="font-medium leading-[35px] text-black grow text-sm block">
                    Hosts
                  </label>
                  <div className="space-y-3">
                    {values.meta_hosts.map((host: any, index: number) => {
                      const isOpen = expandedHosts[index] ?? true
                      return (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100"
                        >
                          {/* Header - clickable to expand/collapse */}
                          <button
                            type="button"
                            onClick={() => setExpandedHosts(prev => ({ ...prev, [index]: !isOpen }))}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-semibold text-gray-800">Host {index + 1}</span>
                              {!isOpen && host.name && (
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{host.name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {values.meta_hosts.length > 1 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const updated = values.meta_hosts.filter((_: any, i: number) => i !== index)
                                    setFieldValue('meta_hosts', updated)
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-0.5 inline-flex"
                                >
                                  <X size={14} />
                                </span>
                              )}
                              <ChevronRight
                                size={16}
                                className={`text-gray-400 transition-transform duration-200 ${
                                  isOpen ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </button>

                          {/* Expanded content */}
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-3">
                                {/* Name */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                                  <Input
                                    name={`meta_hosts.${index}.name`}
                                    value={host.name}
                                    onChange={(e) => {
                                      const updated = [...values.meta_hosts]
                                      updated[index] = { ...updated[index], name: e.target.value }
                                      setFieldValue('meta_hosts', updated)
                                    }}
                                    placeholder="e.g. John Doe"
                                    className={`${fieldClassName} bg-white`}
                                  />
                                </div>
                                {/* Title */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
                                  <Input
                                    name={`meta_hosts.${index}.title`}
                                    value={host.title}
                                    onChange={(e) => {
                                      const updated = [...values.meta_hosts]
                                      updated[index] = { ...updated[index], title: e.target.value }
                                      setFieldValue('meta_hosts', updated)
                                    }}
                                    placeholder="e.g. Host &amp; Producer"
                                    className={`${fieldClassName} bg-white`}
                                  />
                                </div>
                                {/* Photo - media section style row */}
                                <div>
                                  <label className="text-xs font-medium text-gray-500 mb-1 block">Photo</label>
                                  {host.avatar ? (
                                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={host.avatar} alt={host.name || 'Host avatar'} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Photo uploaded</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...values.meta_hosts]
                                          updated[index] = { ...updated[index], avatar: '' }
                                          setFieldValue('meta_hosts', updated)
                                        }}
                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Remove photo"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = '.jpg,.jpeg,.png,.webp'
                                        input.onchange = (e: any) => {
                                          const file = e.target?.files?.[0]
                                          if (!file) return
                                          const reader = new FileReader()
                                          reader.onload = (event: any) => {
                                            const dataUrl = event.target?.result as string
                                            const updated = [...values.meta_hosts]
                                            updated[index] = { ...updated[index], avatar: dataUrl }
                                            setFieldValue('meta_hosts', updated)
                                          }
                                          reader.readAsDataURL(file)
                                        }
                                        input.click()
                                      }}
                                    >
                                      <div className="flex-shrink-0">
                                        <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                                      </div>
                                      <UploadCloud size={18} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setFieldValue('meta_hosts', [...values.meta_hosts, { name: '', title: '', avatar: '' }])
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <Plus size={16} />
                      Add Host
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <PodcastMediaSection />

          </div>
        </Form>
      )}
    </Formik>
  )
}

export default EditPodcastGeneral
