'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { getUriWithOrg, getAPIUrl } from '@services/config/config'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import { swrFetcher } from '@services/utils/ts/requests'
import { useRouter } from 'next/navigation'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import {
  getCourseThumbnailMediaDirectory,
} from '@services/media/media'
import { ArrowRight, Backpack, Check, File, StickyNote, Video, Square, Image as ImageIcon, BookCopy, Lock, Clock, BookOpen, Award, Download, ChevronDown, BarChart3 } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useMediaQuery } from 'usehooks-ts'
import CourseActionsMobile from '@components/Objects/Courses/CourseActions/CourseActionsMobile'
import { Breadcrumbs } from '@components/Objects/Breadcrumbs/Breadcrumbs'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import CourseCommunitySection from '@components/Objects/Communities/CourseCommunitySection'
import CourseShare from '@components/Objects/Courses/CourseShare/CourseShare'
import CourseLearnings from '@components/Objects/Courses/CourseLearnings/CourseLearnings'
import CourseCurriculum from '@components/Objects/Courses/CourseCurriculum/CourseCurriculum'
import CourseRequirements from '@components/Objects/Courses/CourseRequirements/CourseRequirements'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

const CourseClient = (props: any) => {
  const { t } = useTranslation()
  const [learnings, setLearnings] = useState<any>([])
  const [expandedChapters, setExpandedChapters] = useState<{[key: string]: boolean}>({})
  const [activeThumbnailType, setActiveThumbnailType] = useState<'image' | 'video'>('image')
  const courseuuid = props.courseuuid
  const orgslug = props.orgslug
  const initialCourse = props.course
  const serverError = props.serverError
  const org = useOrg() as any
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;

  // Fetch course data client-side if server didn't provide it (e.g., auth failed on server)
  const { data: clientCourseData, error: courseError, isLoading: courseLoading } = useSWR(
    // Only fetch if we don't have initial course data AND we have a session token AND no server error
    !initialCourse && !serverError && access_token
      ? `${getAPIUrl()}courses/course_${courseuuid}/meta?slim=true`
      : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  );

  // Use server-provided course data, or client-fetched data as fallback
  const course = initialCourse || clientCourseData;

  const { track } = useAnalytics()

  // Track course view
  const courseId = course?.id
  const courseUuidForTracking = course?.course_uuid
  useEffect(() => {
    if (courseId && courseUuidForTracking) {
      track('course_view', {
        course_uuid: courseUuidForTracking,
      })
    }
  }, [courseId, courseUuidForTracking, track])

  // Add SWR for trail data — only fetch once session and org are ready
  const { data: trailData } = useSWR(
    access_token && org?.id ? `${getAPIUrl()}trail/org/${org.id}/trail` : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Helper to get metadata with fallback
  const meta = course?.extra_metadata || {}

  const totalLessons = course?.chapters?.reduce((sum: number, ch: any) => sum + (ch.activities?.length || 0), 0)
  const stats = {
    lessons: meta.lessons_count || totalLessons || 0,
    duration: meta.duration || '',
    difficulty: meta.difficulty || '',
  }
  const courseIncludes = {
    videoHours: meta.video_hours || 0,
    totalLessons: meta.lessons_count || totalLessons || 0,
    resources: meta.resources_count || 0,
    hasCertificate: meta.has_certificate ?? false,
  }
  const instructorData = meta.instructor?.name ? meta.instructor : null
  const requirementsList = meta.requirements ? meta.requirements.split('\n').filter((r: string) => r.trim()) : []
  if (!initialCourse && !serverError && courseLoading) {
    return <PageLoading />
  }

  // Determine the active error (server-side or client-side)
  const activeError = serverError || courseError

  // Show error if course fetch failed
  if (!course && activeError) {
    return (
      <GeneralWrapperStyled>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t('course.accessDenied', 'Unable to access this course')}
          </h2>
          <p className="text-gray-500 mb-4">
            {activeError?.status === 403
              ? t('course.noPermission', 'You do not have permission to view this course.')
              : t('course.loadError', 'This course could not be found or there was an error loading it.')}
          </p>
          <Link href={getUriWithOrg(orgslug, '/courses')} className="text-blue-600 hover:underline">
            {t('course.backToCourses', 'Back to Courses')}
          </Link>
        </div>
      </GeneralWrapperStyled>
    )
  }

  function getLearningTags(courseData: any) {
    if (!courseData?.learnings) {
      setLearnings([])
      return
    }

    try {
      // Try to parse as JSON (new format: array of objects with text/emoji)
      const parsedLearnings = JSON.parse(courseData.learnings)
      if (Array.isArray(parsedLearnings)) {
        setLearnings(parsedLearnings)
        return
      }
    } catch (e) {
      // Not valid JSON, continue to legacy format handling
    }

    // Legacy format: comma-separated string
    const learningItems = courseData.learnings.split(',').map((text: string) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: text.trim(),
      emoji: '📝'
    }))

    setLearnings(learningItems)
  }

  useEffect(() => {
    if (!course) return

    getLearningTags(course)

    // Collapse chapters by default if more than 5 activities in total
    if (course?.chapters) {
      const totalActivities = course.chapters.reduce((sum: number, chapter: any) => sum + (chapter.activities?.length || 0), 0)
      const defaultExpanded: {[key: string]: boolean} = {}
      course.chapters.forEach((chapter: any, idx: number) => {
        // Always expand the first chapter
        defaultExpanded[chapter.chapter_uuid] = idx === 0 ? true : totalActivities <= 5
      })
      setExpandedChapters(defaultExpanded)
    }
  }, [course])

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'TYPE_VIDEO':
        return t('activities.video')
      case 'TYPE_DOCUMENT':
        return t('activities.document')
      case 'TYPE_DYNAMIC':
        return t('activities.page')
      case 'TYPE_ASSIGNMENT':
        return t('activities.assignment')
      default:
        return t('activities.learning_material')
    }
  }

  const getActivityTypeBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'TYPE_VIDEO':
        return 'bg-neutral-100 text-neutral-500'
      case 'TYPE_DOCUMENT':
        return 'bg-neutral-100 text-neutral-500'
      case 'TYPE_DYNAMIC':
        return 'bg-neutral-100 text-neutral-500'
      case 'TYPE_ASSIGNMENT':
        return 'bg-neutral-100 text-neutral-500'
      default:
        return 'bg-neutral-100 text-neutral-500'
    }
  }

  const isActivityDone = (activity: any) => {
    if (!course?.course_uuid || !trailData?.runs || !Array.isArray(trailData.runs)) {
      return false
    }
    const cleanCourseUuid = course.course_uuid.replace('course_', '')
    const run = trailData.runs.find((run: any) => {
      const cleanRunCourseUuid = run.course?.course_uuid?.replace('course_', '')
      return cleanRunCourseUuid === cleanCourseUuid
    })
    if (!run || !Array.isArray(run.steps)) return false
    return !!run.steps.find((step: any) => step.activity_id == activity.id)
  }

  const isActivityCurrent = (activity: any) => {
    if (!activity?.activity_uuid) return false
    const activity_uuid = activity.activity_uuid.replace('activity_', '')
    return props.current_activity === activity_uuid
  }

  // Generate JSON-LD structured data for SEO
  const generateJsonLd = () => {
    if (!course || !org) return null
    const seo = course.seo || {}

    // Check if JSON-LD is enabled (defaults to true if not set)
    if (seo.enable_jsonld === false) return null

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: seo.title || course.name,
      description: seo.description || course.description || '',
      provider: {
        '@type': 'Organization',
        name: org.name,
        ...(org.description && { description: org.description }),
      },
      ...(course.thumbnail_image && {
        image: getCourseThumbnailMediaDirectory(
          org?.org_uuid,
          course?.course_uuid,
          course?.thumbnail_image
        ),
      }),
      ...(course.creation_date && { dateCreated: course.creation_date }),
      ...(course.update_date && { dateModified: course.update_date }),
    }

    return jsonLd
  }

  const jsonLd = generateJsonLd()

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {!course && !org ? (
        <PageLoading></PageLoading>
      ) : (
        <>
          <GeneralWrapperStyled>
            {/* ── HERO IMAGE (centered, constrained) ── */}
            <div className="relative w-full mx-auto max-w-7xl aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100 ring-1 ring-inset ring-black/5">
              {course.thumbnail_image ? (
                <img
                  src={getCourseThumbnailMediaDirectory(org?.org_uuid, course?.course_uuid, course?.thumbnail_image)}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center mx-auto">
                      <BookOpen className="w-10 h-10 text-indigo-400" />
                    </div>
                    <Text size="small" className="text-gray-400 mt-3">Course thumbnail</Text>
                  </div>
                </div>
              )}
              {course.thumbnail_type === 'both' && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 flex space-x-1 shadow-sm ring-1 ring-black/5">
                    <button onClick={() => setActiveThumbnailType('image')}
                      className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${activeThumbnailType === 'image' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                      <ImageIcon size={12} className="mr-1" />
                      {t('courses.image')}
                    </button>
                    <button onClick={() => setActiveThumbnailType('video')}
                      className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${activeThumbnailType === 'video' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                      <Video size={12} className="mr-1" />
                      {t('activities.video')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── CONTENT (below hero, same width as hero) ── */}
            <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
              {/* ── TWO-COLUMN LAYOUT (content + sidebar) ── */}
              <div className="flex flex-col lg:flex-row gap-10 justify-between">
                {/* ═══════════════ LEFT COLUMN ═══════════════ */}
                <div className="flex-1 min-w-0 max-w-3xl space-y-8">
                  {/* ── 2. COURSE TITLE + STATS + SHARE ── */}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-ui-fg-base leading-tight">{course.name}</h1>
                    {course?.description && (
                      <Text size="base" className="text-ui-fg-subtle mt-2 leading-relaxed">
                        {course.description}
                      </Text>
                    )}
                    {/* Stats row + Share */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Badge variant="grey" className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {stats.lessons} lessons
                      </Badge>
                      <Badge variant="grey" className="flex items-center gap-1">
                        <Clock size={12} />
                        {stats.duration}
                      </Badge>
                      <Badge variant="grey" className="flex items-center gap-1">
                        <BarChart3 size={12} />
                        {stats.difficulty}
                      </Badge>
                      <div className="ml-auto">
                        <CourseShare
                          courseName={course.name}
                          courseUrl={getUriWithOrg(orgslug, `/course/${courseuuid}`)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── 3. WHAT YOU'LL LEARN ── */}
                  {learnings.length > 0 && (
                    <CourseLearnings items={learnings.map((l: any) => l.text || l)} />
                  )}

                  {/* ── 4. ABOUT THIS COURSE ── */}
                  {course?.about && (
                    <div>
                      <Heading level="h1" className="!text-2xl mb-4">About This Course</Heading>
                      <div className="space-y-4">
                        {course.about.split('\n\n').filter((p: string) => p.trim()).map((paragraph: string, idx: number) => (
                          <Text key={idx} size="base" className="text-ui-fg-subtle leading-relaxed block">
                            {paragraph.trim()}
                          </Text>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 5. COURSE CURRICULUM ── */}
                  <CourseCurriculum />

                  {/* ── 5. COURSE REQUIREMENTS ── */}
                  {requirementsList.length > 0 && (
                    <CourseRequirements items={requirementsList} />
                  )}
                </div>

                {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
                <div className="w-full lg:w-72 xl:w-80 shrink-0">
                  <div className="lg:sticky lg:top-8 space-y-4">

                  {/* ── SIDEBAR 1: Progress + Continue ── */}
                  <Container>
                    <div className="flex items-center justify-between">
                      <Text weight="plus" size="large">75% Complete</Text>
                      <Text size="small" className="text-ui-fg-muted">18/24</Text>
                    </div>
                    <div className="w-full h-1.5 bg-ui-bg-subtle rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: '75%' }} />
                    </div>
                    <Link href={getUriWithOrg(orgslug, `/course/${courseuuid}/lesson-preview`)} className="block w-full mt-4">
                      <Button variant="primary" size="large" className="w-full">
                        Continue Learning
                      </Button>
                    </Link>
                  </Container>

                  {/* ── SIDEBAR 2: Course Includes ── */}
                  <Container>
                    <Heading level="h3">This Course Includes</Heading>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{courseIncludes.videoHours} hours of video</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{courseIncludes.totalLessons} lessons</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <Download size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{courseIncludes.resources} downloadable resources</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">Certificate of completion</Text>
                      </div>
                    </div>
                  </Container>

                </div>
              </div>
            </div>
            </div>

          </GeneralWrapperStyled>

          {/* Mobile Actions Box */}
          {isMobile && (
            <CourseActionsMobile courseuuid={courseuuid} orgslug={orgslug} course={course} trailData={trailData} />
          )}
        </>
      )}
    </>
  )
}

export default CourseClient