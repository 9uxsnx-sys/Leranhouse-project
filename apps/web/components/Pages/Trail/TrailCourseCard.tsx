'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { removeCourse } from '@services/courses/activity'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { revalidateTags } from '@services/utils/ts/requests'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getUserCertificates } from '@services/courses/certifications'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mutate } from 'swr'
import { Award, ExternalLink, BookOpen, MoreVertical, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"

interface TrailCourseCardProps {
  course: any
  run: any
  orgslug: string
}

function TrailCourseCard(props: TrailCourseCardProps) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;
  const courseid = props.course.course_uuid.replace('course_', '')
  const course = props.course
  const router = useRouter()
  const course_total_steps = props.run.course_total_steps
  const course_completed_steps = props.run.steps.length
  const orgID = org?.id
  const course_progress = course_total_steps > 0
    ? Math.round((course_completed_steps / course_total_steps) * 100)
    : 0
  const isCompleted = props.run.status === 'STATUS_COMPLETED'

  const [courseCertificate, setCourseCertificate] = useState<any>(null)
  const [isLoadingCertificate, setIsLoadingCertificate] = useState(false)

  async function quitCourse(course_uuid: string) {
    let activity = await removeCourse(course_uuid, props.orgslug, access_token)
    await revalidateTags(['courses'], props.orgslug)
    router.refresh()
    mutate(`${getAPIUrl()}trail/org/${orgID}/trail`)
  }

  useEffect(() => {
    const fetchCourseCertificate = async () => {
      if (!access_token || course_progress < 100 || !org?.id) return;

      setIsLoadingCertificate(true);
      try {
        const result = await getUserCertificates(
          props.course.course_uuid,
          org.id,
          access_token
        );

        if (result.success && result.data && result.data.length > 0) {
          setCourseCertificate(result.data[0]);
        }
      } catch (error) {
        console.error('Error fetching course certificate:', error);
      } finally {
        setIsLoadingCertificate(false);
      }
    };

    fetchCourseCertificate();
  }, [access_token, course_progress, props.course.course_uuid, org?.id]);

  useEffect(() => { }, [props.course, org])

  const courseLink = getUriWithOrg(props.orgslug, '/course/' + courseid)

  return (
    <div
      className="group relative flex flex-col h-full bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{ transformOrigin: 'top center' }}
    >
      {/* Dropdown Menu */}
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md">
              <MoreVertical size={18} className="text-gray-700" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <ConfirmationModal
                confirmationMessage={t('courses.quit_course_confirm')}
                confirmationButtonText={t('courses.quit_course')}
                dialogTitle={t('courses.quit_course_title')}
                dialogTrigger={
                  <button className="w-full text-left flex items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="mr-2 h-4 w-4" /> {t('courses.quit_course')}
                  </button>
                }
                functionToExecute={() => quitCourse(course.course_uuid)}
                status="warning"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 16:9 Cover Image */}
      <Link href={courseLink} className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {props.course.thumbnail_image && org?.org_uuid ? (
          <img
            src={getCourseThumbnailMediaDirectory(
              org.org_uuid,
              props.course.course_uuid,
              props.course.thumbnail_image
            )}
            alt={course.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BookOpen size={40} strokeWidth={1.5} />
          </div>
        )}
      </Link>

      {/* Progress bar — between image and content */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all ${
            isCompleted ? 'bg-green-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${course_progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <div className="flex flex-col gap-1">
          <Link href={courseLink} className="no-underline">
            <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900 hover:text-gray-700 transition-colors">
              {course.name}
            </h3>
          </Link>
          <p className="text-[13px] font-normal leading-relaxed line-clamp-1 text-[#6B7280]">
            {course_completed_steps} of {course_total_steps} lessons completed
          </p>
        </div>

        {/* Bottom row: progress percentage + action link */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-[12px] text-gray-400">
            {course_progress}% &middot; {isCompleted ? t('common.completed') : t('courses.course_progress')}
          </span>

          {isCompleted && courseCertificate ? (
            <Link
              href={getUriWithOrg(props.orgslug, `/certificates/${courseCertificate.certificate_user.user_certification_uuid}/verify`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('certificate.verify')}
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <Link
              href={courseLink}
              className="text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
            >
              {t('courses.continue_learning')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrailCourseCard
