'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { getUriWithOrg } from '@services/config/config'
import { deleteCourseFromBackend, cloneCourse } from '@services/courses/courses'
import { exportCourse, downloadBlob, ExportStatus } from '@services/courses/transfer'
import { exportToast } from '@components/Objects/StyledElements/Toast/ExportToast'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { mutate } from 'swr'
import { CheckSquare, Square } from 'lucide-react'
import {
  EllipsisHorizontal,
  PencilSquare,
  CogSixTooth,
  SquareTwoStack,
  ArrowDownTray,
  Trash,
} from '@components/Objects/Icons/MedusaIcons'
import { IconButton } from '@components/ui/icon-button'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import Link from 'next/link'
import React from 'react'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { useTranslation } from 'react-i18next'

type Course = {
  course_uuid: string
  name: string
  description: string
  thumbnail_image: string
  org_id: string | number
  update_date: string
  public?: boolean
  published?: boolean
  authors?: Array<{
    user: {
      id: string
      user_uuid: string
      avatar_image: string
      first_name: string
      last_name: string
      username: string
    }
    authorship: 'CREATOR' | 'CONTRIBUTOR' | 'MAINTAINER' | 'REPORTER'
    authorship_status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  }>
}

type PropsType = {
  course: Course
  orgslug: string
  customLink?: string
  isDashboard?: boolean
  isSelected?: boolean
  onToggleSelect?: (courseUuid: string) => void
}

export const removeCoursePrefix = (course_uuid: string) => course_uuid.replace('course_', '')

function CourseThumbnail({ course, orgslug, customLink, isDashboard = false, isSelected = false, onToggleSelect }: PropsType) {
  const org = useOrg() as any
  const session = useLHSession() as any

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSelect?.(course.course_uuid)
  }

  const deleteCourse = async () => {
    const toastId = toast.loading(t('courses.deleting_course'))
    try {
      await deleteCourseFromBackend(course.course_uuid, session.data?.tokens?.access_token)
      // Revalidate all courses SWR caches
      mutate((key) => typeof key === 'string' && key.includes('/courses/'), undefined, { revalidate: true })
      toast.success(t('courses.course_deleted_success'))
    } catch (error) {
      toast.error(t('courses.course_deleted_error'))
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleCloneCourse = async () => {
    const toastId = toast.loading(t('courses.cloning_course'))
    try {
      const result = await cloneCourse(course.course_uuid, session.data?.tokens?.access_token)
      if (result.success) {
        // Revalidate all courses SWR caches
        mutate((key) => typeof key === 'string' && key.includes('/courses/'), undefined, { revalidate: true })
        toast.success(t('courses.course_cloned_success'))
      } else {
        toast.error(result.HTTPmessage || t('courses.course_cloned_error'))
      }
    } catch (error) {
      toast.error(t('courses.course_cloned_error'))
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleExportCourse = async () => {
    const toastId = exportToast.start('single', course.name)

    try {
      const blob = await exportCourse(
        course.course_uuid,
        session.data?.tokens?.access_token,
        (progress, status) => {
          exportToast.update(toastId, status as ExportStatus, progress, course.name, undefined, 'single')
        }
      )
      const timestamp = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `${course.name.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.zip`)
      exportToast.complete(toastId, course.name, undefined, 'single')
    } catch (error: any) {
      exportToast.error(toastId, error.message || t('courses.course_exported_error'), course.name, undefined, 'single')
    }
  }

  const thumbnailImage = course.thumbnail_image
    ? getCourseThumbnailMediaDirectory(org?.org_uuid, course.course_uuid, course.thumbnail_image)
    : '/empty_thumbnail.png'

  const courseLink = customLink ? customLink : getUriWithOrg(orgslug, `/course/${removeCoursePrefix(course.course_uuid)}`)

  return (
    <div className={`group relative bg-ui-bg-base rounded-lg shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-shadow overflow-hidden ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}`}>
      {/* Selection checkbox - visible on hover or when selected (dashboard only) */}
      {isDashboard && onToggleSelect && (
        <div className={`absolute top-2 left-2 z-20 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <IconButton
            variant="transparent"
            size="small"
            onClick={handleSelectClick}
            aria-label={isSelected ? 'Deselect course' : 'Select course'}
            className="bg-white/90 backdrop-blur-sm"
          >
            {isSelected ? <CheckSquare className="h-4 w-4 text-black" /> : <Square className="h-4 w-4 text-gray-500" />}
          </IconButton>
        </div>
      )}

      {/* 16:9 Image */}
      <Link prefetch={false} href={courseLink} className="block relative aspect-video overflow-hidden bg-ui-bg-component">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={thumbnailImage}
          alt={course.name}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-300" />
      </Link>

      {/* Content */}
      <div className="p-3 flex flex-col gap-y-2">
        {/* Title */}
        <Link prefetch={false} href={courseLink} className="hover:opacity-80 transition-opacity">
          <h3 className="text-ui-fg-base font-semibold text-sm leading-tight line-clamp-1">
            {course.name}
          </h3>
        </Link>

        {/* Description */}
        {course.description && (
          <p className="text-ui-fg-subtle text-xs leading-relaxed line-clamp-3">
            {course.description}
          </p>
        )}
      </div>
    </div>
  )
}

const AdminEditOptions = ({ course, orgSlug, deleteCourse, cloneCourse, exportCourse, isDashboard = false }: {
  course: Course
  orgSlug: string
  deleteCourse: () => Promise<void>
  cloneCourse: () => Promise<void>
  exportCourse: () => Promise<void>
  isDashboard?: boolean
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <AuthenticatedClientElement
      action="update"
      ressourceType="courses"
      checkMethod="roles"
      orgId={course.org_id}
    >
      <div className={`absolute top-2 right-2 z-20 transition-opacity ${
        isDashboard && !isOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
      }`}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="transparent"
              size="small"
              aria-label="Course actions"
              className="bg-white/90 backdrop-blur-sm"
            >
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link prefetch={false} href={getUriWithOrg(orgSlug, `/dash/courses/course/${removeCoursePrefix(course.course_uuid)}/content`)}>
                <PencilSquare /> {t('courses.edit_content')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link prefetch={false} href={getUriWithOrg(orgSlug, `/dash/courses/course/${removeCoursePrefix(course.course_uuid)}/general`)}>
                <CogSixTooth /> {t('common.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ConfirmationModal
                confirmationButtonText={t('courses.clone_course')}
                confirmationMessage={t('courses.clone_course_confirm')}
                dialogTitle={t('courses.clone_course_title', { name: course.name })}
                dialogTrigger={
                  <button className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    <SquareTwoStack /> {t('courses.clone_course')}
                  </button>
                }
                functionToExecute={cloneCourse}
                status="info"
              />
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button
                onClick={exportCourse}
                className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowDownTray /> {t('courses.export_course')}
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ConfirmationModal
                confirmationButtonText={t('courses.delete_course')}
                confirmationMessage={t('courses.delete_course_confirm')}
                dialogTitle={t('courses.delete_course_title', { name: course.name })}
                dialogTrigger={
                  <button className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Trash /> {t('courses.delete_course')}
                  </button>
                }
                functionToExecute={deleteCourse}
                status="warning"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </AuthenticatedClientElement>
  )
}

export default CourseThumbnail
