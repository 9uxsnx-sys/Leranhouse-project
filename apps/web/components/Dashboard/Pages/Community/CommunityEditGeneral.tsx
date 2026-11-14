'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { updateCommunity } from '@services/communities/communities'
import {
  getCommunityTranslations,
  upsertCommunityTranslation,
} from '@services/communities/communityTranslations'
import { useCommunityTranslation } from '@components/Hooks/useCommunityTranslation'
import { getCurrentLanguageNativeName } from '@/lib/languages'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { Loader2, Info, Eye, Check, SaveAllIcon, Globe, GlobeLock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import Link from 'next/link'
import CommunityMediaSection from './CommunityMediaSection'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const CommunityFormLabelAndMessage = (props: { label: string; message?: string }) => (
  <div className="flex items-center space-x-3">
    <span className="font-medium leading-[35px] text-black grow text-sm">{props.label}</span>
    {props.message && (
      <div className="text-red-700 text-sm items-center rounded-md flex space-x-1">
        <Info size={10} />
        <div>{props.message}</div>
      </div>
    )}
  </div>
)

const CommunityEditGeneral: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const dispatch = useCommunityDispatch()
  const community = communityState?.community
  const accessToken = session?.data?.tokens?.access_token

  // The base row holds the source locale; other languages live in
  // community_translation and are edited from this same form.
  const { contentLocale, isSourceLocale, translation, setTranslation } =
    useCommunityTranslation(
      community?.community_uuid,
      community?.source_locale || 'en'
    )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const isPublished = community?.published ?? false

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('dashboard.courses.communities.general.form.name_required'))
      .min(3, t('dashboard.courses.communities.general.form.name_min_length'))
      .max(100, t('dashboard.courses.communities.general.form.name_max_length')),
    description: Yup.string().max(500, t('dashboard.courses.communities.general.form.description_max_length')),
  })

  if (!community) return null

  const initialValues = {
    name: (!isSourceLocale && translation?.name) || community.name,
    description:
      (!isSourceLocale && translation?.description) || community.description || '',
  }

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSubmitting(true)
    const loadingToast = toast.loading(t('dashboard.courses.communities.general.toasts.updating'))

    try {
      if (!isSourceLocale) {
        // Translating never touches the base row.
        await upsertCommunityTranslation(
          community.community_uuid,
          contentLocale,
          {
            name: values.name,
            description: values.description || null,
          },
          accessToken
        )
        const rows = await getCommunityTranslations(community.community_uuid, accessToken)
        setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } else {
        const result = await updateCommunity(
          community.community_uuid,
          {
            name: values.name,
            description: values.description || null,
          },
          accessToken
        )

        if (result) {
          if (dispatch) {
            dispatch({ type: 'setCommunity', payload: { ...community, ...values } })
          }
        }
      }

      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      toast.success(t('dashboard.courses.communities.general.toasts.update_success'), { id: loadingToast })
      router.refresh()
    } catch (error) {
      console.error('Failed to update community:', error)
      toast.error(t('dashboard.courses.communities.general.toasts.update_error'), { id: loadingToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  const communityUuid = community.community_uuid.replace('community_', '')

  const togglePublishStatus = async () => {
    if (isPublishing || !community) return
    setIsPublishing(true)

    const newPublishedStatus = !isPublished
    const toastMessage = newPublishedStatus
      ? t('dashboard.courses.publishing')
      : t('dashboard.courses.unpublishing')
    const toastId = toast.loading(toastMessage)

    const previousPublished = community.published

    // Optimistic update
    if (dispatch) {
      dispatch({ type: 'setCommunity', payload: { ...community, published: newPublishedStatus } })
    }

    try {
      await updateCommunity(
        community.community_uuid,
        { published: newPublishedStatus },
        accessToken
      )

      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)

      toast.dismiss(toastId)
      toast.success(
        newPublishedStatus
          ? t('dashboard.courses.published_success')
          : t('dashboard.courses.unpublished_success')
      )
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      // Rollback optimistic update
      if (dispatch) {
        dispatch({ type: 'setCommunity', payload: { ...community, published: previousPublished } })
      }
      toast.dismiss(toastId)
      toast.error(t('dashboard.courses.publish_error'))
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
      {({ values, handleChange, errors, touched, isValid, dirty, submitForm }) => (
        <Form>
          <div className="space-y-3">
            {/* ── ACTION ROW ── */}
            <div className="flex items-center justify-between">
              <Link
                href={getUriWithOrg(org?.slug, '') + `/community/${communityUuid}`}
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
                  <span className={`w-1.5 h-1.5 rounded-full ${!dirty ? 'bg-teal-500' : 'bg-amber-400'}`} />
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
                  onClick={submitForm}
                  disabled={isSubmitting || !isValid || !dirty}
                  className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                    isSubmitting
                      ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                      : !dirty
                        ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                        : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : !dirty ? (
                    <Check size={14} />
                  ) : (
                    <SaveAllIcon size={14} />
                  )}
                  <span>
                    {isSubmitting
                      ? t('dashboard.courses.save.saving')
                      : !dirty
                        ? t('dashboard.courses.save.saved')
                        : t('dashboard.courses.save.save')}
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
                      ? t('dashboard.courses.processing')
                      : isPublished
                        ? t('dashboard.courses.published')
                        : t('dashboard.courses.unpublished')}
                  </span>
                </button>
              </div>
            </div>

            {/* ── GENERAL INFO CARD ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                {t('dashboard.courses.communities.general.title')}
              </h2>

              <div className="space-y-4">
                <div className="grid mb-2.5">
                  <CommunityFormLabelAndMessage
                    label={`${t('dashboard.courses.communities.general.form.name_label')} *`}
                    message={touched.name ? errors.name : undefined}
                  />
                  <Input
                    id="name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder={t('dashboard.courses.communities.general.form.name_placeholder')}
                    maxLength={100}
                    className={fieldClassName}
                  />
                </div>

                <div className="grid mb-2.5">
                  <CommunityFormLabelAndMessage
                    label={t('dashboard.courses.communities.general.form.description_label')}
                    message={touched.description ? errors.description : undefined}
                  />
                  <Textarea
                    id="description"
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    placeholder={t('dashboard.courses.communities.general.form.description_placeholder')}
                    className={`${fieldClassName} min-h-[120px]`}
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            {/* ── MEDIA SECTION ── */}
            <CommunityMediaSection />
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default CommunityEditGeneral
