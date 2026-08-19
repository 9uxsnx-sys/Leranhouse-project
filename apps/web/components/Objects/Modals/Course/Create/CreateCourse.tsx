'use client'
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import { Button } from "@components/ui/button"
import { IconButton } from "@components/ui/icon-button"
import { Form } from "@components/ui/form"
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
import UnsplashImagePicker from "@components/Dashboard/Pages/Course/EditCourseGeneral/UnsplashImagePicker"
import FormTagInput from "@components/Objects/StyledElements/Form/TagInput"
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
    learnings: Yup.string(),
    tags: Yup.string(),
    visibility: Yup.boolean(),
    thumbnail: Yup.mixed().nullable()
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      learnings: '',
      visibility: true,
      tags: '',
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
            description: values.description,
            learnings: values.learnings,
            tags: values.tags,
            visibility: values.visibility
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

  const handleUnsplashSelect = async (imageUrl: string) => {
    setIsUploading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'unsplash_image.jpg', { type: 'image/jpeg' })
      formik.setFieldValue('thumbnail', file)
      setThumbnailFile({ id: 'unsplash', url: imageUrl, file })
    } catch (error) {
      toast.error('Failed to load image from Unsplash')
    }
    setIsUploading(false)
  }

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col">
      <div className="flex flex-col">
        {/* Section: General */}
        <div className="border-ui-border-base flex flex-col gap-y-4 border-b px-6 py-5">
          {/* Name */}
          <Form.Item>
            <Form.Label>{t('courses.course_name')}</Form.Label>
            <Form.Control>
              <Input
                name="name"
                onChange={formik.handleChange}
                value={formik.values.name}
                type="text"
                aria-invalid={!!formik.errors.name && !!formik.touched.name}
              />
            </Form.Control>
            <Form.ErrorMessage>{formik.touched.name && formik.errors.name}</Form.ErrorMessage>
          </Form.Item>

          {/* Description */}
          <Form.Item>
            <Form.Label optional>{t('collections.description')}</Form.Label>
            <Form.Control>
              <Textarea
                name="description"
                onChange={formik.handleChange}
                value={formik.values.description}
                aria-invalid={!!formik.errors.description && !!formik.touched.description}
              />
            </Form.Control>
            <Form.ErrorMessage>{formik.touched.description && formik.errors.description}</Form.ErrorMessage>
          </Form.Item>
        </div>

        {/* Section: Media */}
        <div className="border-ui-border-base flex flex-col gap-y-4 border-b px-6 py-5">
          {/* Thumbnail */}
          <Form.Item>
            <Form.Label optional>{t('courses.course_thumbnail')}</Form.Label>
            {!thumbnailFile ? (
              <>
                <FileUpload
                  label={t('courses.upload_image')}
                  hint={t('courses.thumbnail_recommended')}
                  multiple={false}
                  formats={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                  onUploaded={handleFileUploaded}
                  hasError={!!formik.errors.thumbnail && !!formik.touched.thumbnail}
                  className="p-6"
                />
                <Button
                  variant="transparent"
                  size="small"
                  type="button"
                  onClick={() => setShowUnsplashPicker(true)}
                  className="mt-1 text-ui-fg-muted active:text-ui-fg-subtle"
                >
                  {t('courses.choose_from_gallery')}
                </Button>
              </>
            ) : (
              <div className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2">
                <div className="flex items-center gap-x-2">
                  <div className="bg-ui-bg-base shadow-borders-base flex items-center justify-center overflow-hidden rounded-md">
                    <img src={thumbnailFile.url} className="h-10 w-[30px] object-cover" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="txt-small-plus text-ui-fg-base">{thumbnailFile.file.name}</span>
                    <span className="txt-small text-ui-fg-muted">{formatFileSize(thumbnailFile.file.size)}</span>
                  </div>
                </div>
                <IconButton
                  variant="transparent"
                  size="small"
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="text-ui-fg-muted hover:bg-ui-bg-subtle-hover active:text-ui-fg-subtle"
                  aria-label="Remove thumbnail"
                >
                  <XMark />
                </IconButton>
              </div>
            )}
            <Form.ErrorMessage>{formik.touched.thumbnail && formik.errors.thumbnail}</Form.ErrorMessage>
          </Form.Item>
        </div>

        {/* Section: Organize */}
        <div className="flex flex-col gap-y-4 px-6 py-5">
          {/* Learnings */}
          <Form.Item>
            <Form.Label optional>{t('courses.course_learnings')}</Form.Label>
            <FormTagInput
              placeholder={t('courses.enter_to_add')}
              value={formik.values.learnings}
              onChange={(value) => formik.setFieldValue('learnings', value)}
              error={formik.errors.learnings}
            />
            <Form.ErrorMessage>{formik.errors.learnings}</Form.ErrorMessage>
          </Form.Item>

          {/* Tags */}
          <Form.Item>
            <Form.Label optional>{t('courses.course_tags')}</Form.Label>
            <FormTagInput
              placeholder={t('courses.enter_to_add')}
              value={formik.values.tags}
              onChange={(value) => formik.setFieldValue('tags', value)}
              error={formik.errors.tags}
            />
            <Form.ErrorMessage>{formik.errors.tags}</Form.ErrorMessage>
          </Form.Item>

          {/* Visibility */}
          <Form.Item>
            <Form.Label>{t('courses.course_visibility')}</Form.Label>
            <Select
              value={formik.values.visibility ? 'true' : 'false'}
              onValueChange={(value) => formik.setFieldValue('visibility', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('courses.select_visibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('courses.public')}</SelectItem>
                <SelectItem value="false">{t('courses.private')}</SelectItem>
              </SelectContent>
            </Select>
            <Form.ErrorMessage>{formik.errors.visibility}</Form.ErrorMessage>
          </Form.Item>
        </div>
      </div>

      {/* Footer */}
      <div className="border-ui-border-base flex shrink-0 items-center justify-end gap-x-2 border-t p-4">
        <Button variant="secondary" size="small" type="button" onClick={closeModal}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" size="small" type="submit" isLoading={formik.isSubmitting}>
          {t('courses.create_course_btn')}
        </Button>
      </div>

      {showUnsplashPicker && (
        <UnsplashImagePicker
          onSelect={handleUnsplashSelect}
          onClose={() => setShowUnsplashPicker(false)}
        />
      )}
    </form>
  )
}

export default CreateCourseModal
