'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { createCommunity, Community } from '@services/communities/communities'
import { getOrgCourses } from '@services/courses/courses'
import { getOrgPodcasts } from '@services/podcasts/podcasts'
import { revalidateTags } from '@services/utils/ts/requests'
import { searchMatches } from '@/lib/search/normalize'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { Loader2, BookOpen, Headphones, Search } from 'lucide-react'

interface CreateCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: number
  orgSlug: string
  // Already-linked parents, so the picker can flag courses/podcasts that
  // already have a community (the API allows one per resource).
  existingCommunities?: Community[]
}

interface ResourceOption {
  uuid: string
  name: string
  description?: string | null
}

export function CreateCommunityModal({
  isOpen,
  onClose,
  orgId,
  orgSlug,
  existingCommunities = [],
}: CreateCommunityModalProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resourceType, setResourceType] = useState<'course' | 'podcast'>('course')
  const [courses, setCourses] = useState<ResourceOption[]>([])
  const [podcasts, setPodcasts] = useState<ResourceOption[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const accessToken = session?.data?.tokens?.access_token

  const linkedUuids = useMemo(
    () => new Set(existingCommunities.map((c) => c.resource_uuid).filter(Boolean) as string[]),
    [existingCommunities]
  )

  useEffect(() => {
    if (!isOpen) return
    const orgSlugValue = org?.slug || orgSlug
    if (!orgSlugValue) return

    let cancelled = false
    const fetchResources = async () => {
      setIsLoadingResources(true)
      try {
        const [courseRows, podcastRows] = await Promise.all([
          getOrgCourses(orgSlugValue, null, accessToken, true),
          getOrgPodcasts(orgSlugValue, null, accessToken, true),
        ])
        if (cancelled) return
        setCourses(
          (courseRows || []).map((course: any) => ({
            uuid: course.course_uuid,
            name: course.name,
            description: course.description,
          }))
        )
        setPodcasts(
          (podcastRows || []).map((podcast: any) => ({
            uuid: podcast.podcast_uuid,
            name: podcast.name,
            description: podcast.description,
          }))
        )
      } catch {
        // An empty picker is enough feedback here.
      } finally {
        if (!cancelled) setIsLoadingResources(false)
      }
    }
    fetchResources()
    return () => {
      cancelled = true
    }
  }, [isOpen, org?.slug, orgSlug, accessToken])

  const options = resourceType === 'course' ? courses : podcasts
  const filteredOptions = useMemo(
    () => options.filter((option) => searchMatches(option.name, searchQuery)),
    [options, searchQuery]
  )

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('dashboard.courses.communities.general.form.name_required'))
      .min(3, t('dashboard.courses.communities.general.form.name_min_length'))
      .max(100, t('dashboard.courses.communities.general.form.name_max_length')),
    description: Yup.string().max(
      500,
      t('dashboard.courses.communities.general.form.description_max_length')
    ),
    resource_uuid: Yup.string().required(
      t('dashboard.courses.communities.modals.create.form.resource_required')
    ),
  })

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const result = await createCommunity(
        orgId,
        {
          name: values.name,
          description: values.description || null,
          resource_uuid: values.resource_uuid,
          resource_type: resourceType,
        },
        accessToken
      )

      if (result) {
        await revalidateTags(['communities'], orgSlug)
        router.refresh()
        onClose()
      }
    } catch (err: any) {
      const message =
        (err?.detail && typeof err.detail === 'object' && err.detail.message) ||
        (typeof err?.detail === 'string' && err.detail) ||
        err?.message ||
        'Failed to create community.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isDialogOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      dialogTitle={t('dashboard.courses.communities.modals.create.title')}
      dialogDescription={t('dashboard.courses.communities.modals.create.description')}
      minWidth="sm"
      dialogContent={
        <Formik
          initialValues={{
            name: '',
            description: '',
            resource_uuid: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isValid, dirty, setFieldValue }) => {
            const selectResource = (uuid: string) => {
              setFieldValue('resource_uuid', uuid)
            }

            return (
              <Form className="space-y-6">
                {/* Linked resource */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.courses.communities.modals.create.form.resource_label')} *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('dashboard.courses.communities.modals.create.form.resource_hint')}
                  </p>

                  {/* Course / Podcast switch */}
                  <div className="inline-flex items-center gap-1 p-1 mb-3 rounded-lg bg-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setResourceType('course')
                        selectResource('')
                        setSearchQuery('')
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        resourceType === 'course'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BookOpen size={14} />
                      {t('dashboard.courses.communities.modals.create.form.course_tab')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResourceType('podcast')
                        selectResource('')
                        setSearchQuery('')
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        resourceType === 'podcast'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Headphones size={14} />
                      {t('dashboard.courses.communities.modals.create.form.podcast_tab')}
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search
                      size={16}
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        resourceType === 'course'
                          ? t('dashboard.courses.communities.modals.create.form.search_courses')
                          : t('dashboard.courses.communities.modals.create.form.search_podcasts')
                      }
                      className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black/20 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Options */}
                  <Field name="resource_uuid">
                    {({ field, form }: any) => (
                      <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg">
                        {isLoadingResources ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                          </div>
                        ) : filteredOptions.length === 0 ? (
                          <div className="text-center py-8 text-sm text-gray-500">
                            {resourceType === 'course'
                              ? t('dashboard.courses.communities.modals.create.form.no_courses')
                              : t('dashboard.courses.communities.modals.create.form.no_podcasts')}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredOptions.map((option) => {
                              const alreadyLinked = linkedUuids.has(option.uuid)
                              const isSelected = field.value === option.uuid
                              return (
                                <button
                                  key={option.uuid}
                                  type="button"
                                  disabled={alreadyLinked}
                                  onClick={() => form.setFieldValue('resource_uuid', option.uuid)}
                                  className={`w-full text-start px-4 py-3 transition-colors ${
                                    alreadyLinked
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-gray-50'
                                  } ${isSelected ? 'bg-gray-100 border-s-2 border-black' : ''}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                      {option.name}
                                    </p>
                                    {alreadyLinked && (
                                      <span className="shrink-0 text-[11px] text-gray-400">
                                        {t(
                                          'dashboard.courses.communities.modals.create.form.already_linked'
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {option.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                      {option.description}
                                    </p>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Field>
                  <ErrorMessage
                    name="resource_uuid"
                    component="p"
                    className="mt-1 text-sm text-red-500"
                  />
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('dashboard.courses.communities.modals.create.form.name_label')} *
                  </label>
                  <Field
                    type="text"
                    name="name"
                    id="name"
                    placeholder={t('dashboard.courses.communities.modals.create.form.name_placeholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent outline-none transition-all"
                  />
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="mt-1 text-sm text-red-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('dashboard.courses.communities.modals.create.form.description_label')}
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    id="description"
                    rows={3}
                    placeholder={t('dashboard.courses.communities.modals.create.form.description_placeholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-transparent outline-none transition-all resize-none"
                  />
                  <ErrorMessage
                    name="description"
                    component="p"
                    className="mt-1 text-sm text-red-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {t('dashboard.courses.communities.modals.create.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid || !dirty}
                    className="px-4 py-2 text-sm font-medium text-brand-fg bg-brand hover:bg-brand-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {t('dashboard.courses.communities.modals.create.submit')}
                  </button>
                </div>
              </Form>
            )
          }}
        </Formik>
      }
    />
  )
}

export default CreateCommunityModal
