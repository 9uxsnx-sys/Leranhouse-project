'use client'
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import { Button } from "@components/ui/button"
import { IconButton } from "@components/ui/icon-button"
import { FileUpload, FileType } from "@components/ui/file-upload"
import { createNewCourse } from '@services/courses/courses'
import { getOrganizationContextInfoWithoutCredentials } from '@services/organizations/orgs'
import React, { useEffect } from 'react'
import { revalidateTags } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import toast from 'react-hot-toast'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { XMark } from "@components/Objects/Icons/MedusaIcons"
import { useTranslation } from "react-i18next"

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CreateCourseModal({ closeModal, orgslug }: any) {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const [orgId, setOrgId] = React.useState(null) as any
  const [showUnsplashPicker, setShowUnsplashPicker] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [thumbnailFile, setThumbnailFile] = React.useState<FileType | null>(null)

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required(t('courses.course_name_required'))
      .max(100, 'Must be 100 characters or less'),
    description: Yup.string()
      .required(t('courses.course_description_required'))
      .max(1000, 'Must be 1000 characters or less'),
    thumbnail: Yup.mixed().nullable()
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      thumbnail: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const toast_loading = toast.loading(t('courses.creating_course'))

      try {
        const res = await createNewCourse(
          orgId,
          {
            name: values.name,
            description: values.description
          },
          values.thumbnail,
          session.data?.tokens?.access_token
        )

        if (res.success) {
          await revalidateTags(['courses'], orgslug)
          // Refresh sidebar courses cache
          mutate((key) => typeof key === 'string' && key.includes('/courses/org_slug/'))
          toast.dismiss(toast_loading)
          toast.success(t('courses.course_created_success'))

          closeModal()
          // Redirect to the course dashboard - remove 'course_' prefix if present
          const courseId = res.data.course_uuid?.replace('course_', '') || res.data.course_uuid
          router.push(`/dash/courses/course/${courseId}/general`)
        } else {
          const errorMessage = typeof res.data?.detail === 'string'
            ? res.data.detail
            : Array.isArray(res.data?.detail)
              ? res.data.detail.map((e: any) => e.msg).join(', ')
              : t('courses.failed_to_create_course')
          toast.error(errorMessage)
        }
      } catch (error) {
        toast.error(t('courses.failed_to_create_course'))
      } finally {
        setSubmitting(false)
      }
    }
  })

  const getOrgMetadata = async () => {
    const org = await getOrganizationContextInfoWithoutCredentials(orgslug, {
      revalidate: 360,
      tags: ['organizations'],
    })
    setOrgId(org.id)
  }

  useEffect(() => {
    if (orgslug) {
      getOrgMetadata()
    }
  }, [orgslug])

  const handleFileUploaded = (files: FileType[]) => {
    if (files.length > 0) {
      formik.setFieldValue('thumbnail', files[0].file)
      setThumbnailFile(files[0])
    }
  }

  const handleRemoveThumbnail = () => {
    formik.setFieldValue('thumbnail', null)
    setThumbnailFile(null)
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      if (!formik.values.name || !formik.values.description) {
        toast.error('Please fill in all required fields')
        formik.setTouched({ name: true, description: true })
        return
      }
      formik.handleSubmit(e)
    }} className="flex flex-col h-full">
      <div className="flex-1 px-6 pt-8 pb-6 space-y-10">
        {/* Course Name */}
        <div className="space-y-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted">
            {t('courses.course_name')}
          </span>
          <Input
            name="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            type="text"
            placeholder={
              formik.touched.name && formik.errors.name
                ? formik.errors.name
                : t('courses.course_name_placeholder')
            }
            aria-invalid={!!formik.touched.name && !!formik.errors.name}
            className="hover:!bg-ui-bg-field hover:!shadow-borders-base focus-visible:!shadow-borders-base aria-[invalid=true]:placeholder:text-red-400"
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted">
            {t('collections.description')}
          </span>
          <Textarea
            name="description"
            onChange={formik.handleChange}
            value={formik.values.description}
            placeholder={
              formik.touched.description && formik.errors.description
                ? formik.errors.description
                : t('courses.course_description_placeholder')
            }
            aria-invalid={!!formik.touched.description && !!formik.errors.description}
            className="hover:!bg-ui-bg-field hover:!shadow-borders-base focus-visible:!shadow-borders-base aria-[invalid=true]:placeholder:text-red-400"
          />
        </div>

        {/* Thumbnail */}
        <div className="space-y-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted">
            {t('courses.course_thumbnail')}
          </span>
          {!thumbnailFile ? (
            <FileUpload
              label={t('courses.upload_image')}
              hint={t('courses.thumbnail_recommended')}
              multiple={false}
              formats={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
              onUploaded={handleFileUploaded}
              hasError={!!formik.errors.thumbnail && !!formik.touched.thumbnail}
              className="py-6 hover:!border-ui-border-strong focus:!border-ui-border-strong focus:!shadow-none"
            />
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-ui-border-base p-3">
              <div className="flex items-center gap-x-3">
                <div className="rounded-lg overflow-hidden">
                  <img src={thumbnailFile.url} className="h-12 w-20 object-cover" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ui-fg-base">{thumbnailFile.file.name}</span>
                  <span className="text-xs text-ui-fg-muted">{formatFileSize(thumbnailFile.file.size)}</span>
                </div>
              </div>
              <IconButton
                variant="transparent"
                size="small"
                type="button"
                onClick={handleRemoveThumbnail}
                className="text-ui-fg-muted hover:text-ui-fg-subtle"
                aria-label="Remove thumbnail"
              >
                <XMark />
              </IconButton>
            </div>
          )}
          {formik.touched.thumbnail && formik.errors.thumbnail && (
            <p className="text-xs text-red-500">{formik.errors.thumbnail}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-x-2 px-6 pt-4 pb-6">
        <Button variant="secondary" size="small" type="button" onClick={closeModal}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" size="small" type="submit" isLoading={formik.isSubmitting}>
          {t('courses.create_course_btn')}
        </Button>
      </div>
    </form>
  )
}

export default CreateCourseModal
