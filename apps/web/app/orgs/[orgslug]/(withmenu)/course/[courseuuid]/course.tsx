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
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

// ── Mock data for fields not yet available from the backend ──
// Swap these for real course data once backend/admin supports them.
const MOCK_COURSE_META = {
  requirements: [
    'No prior experience needed — this course starts from the basics.',
    'A computer with internet access to watch videos and complete exercises.',
    'Willingness to learn and experiment — curiosity is all you need!',
  ],
  instructor: {
    name: 'Dr. Sarah Chen',
    title: 'Professor of Computer Science',
    bio: '20+ years of experience teaching AI and machine learning at top universities. Passionate about making complex topics accessible to everyone.',
    avatar: '',
  },
  courseIncludes: {
    videoHours: 6,
    totalLessons: 24,
    resources: 3,
    hasCertificate: true,
  },
  difficulty: 'Beginner' as const,
  totalDuration: '6 hours',
}

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

  // Show loading state if fetching course data client-side
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
      // Try to parse as JSON (new format)
      const parsedLearnings = JSON.parse(courseData.learnings)
      if (Array.isArray(parsedLearnings)) {
        // New format: array of learning items with text and emoji
        setLearnings(parsedLearnings)
        return
      }
    } catch (e) {
      // Not valid JSON, continue to legacy format handling
    }

    // Legacy format: comma-separated string (changed from pipe-separated)
    const learningItems = courseData.learnings.split(',').map((text: string) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: text.trim(), // Trim whitespace that might be present after commas
      emoji: '📝' // Default emoji for legacy items
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
            {/* ── TWO-COLUMN LAYOUT ── */}
            <div className="flex flex-col lg:flex-row gap-10">
              {/* ═══════════════ LEFT COLUMN ═══════════════ */}
              <div className="flex-1 min-w-0 space-y-8">

                {/* ── 1. HERO IMAGE (21:9 cinematic) ── */}
                <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100 ring-1 ring-inset ring-black/5">
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

                {/* ── 2. COURSE TITLE + DESCRIPTION + STATS ── */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-ui-fg-base leading-tight">{course.name}</h1>
                    <CourseShare
                      courseName={course.name}
                      courseUrl={getUriWithOrg(orgslug, `/course/${courseuuid}`)}
                    />
                  </div>
                  <Text size="large" weight="regular" className="text-ui-fg-subtle mt-2 block">
                    {course.description || 'An in-depth course designed to take you from beginner to confident practitioner.'}
                  </Text>
                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge variant="grey" className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {MOCK_COURSE_META.courseIncludes.totalLessons} lessons
                    </Badge>
                    <Badge variant="grey" className="flex items-center gap-1">
                      <Clock size={12} />
                      {MOCK_COURSE_META.totalDuration}
                    </Badge>
                    <Badge variant="grey" className="flex items-center gap-1">
                      <BarChart3 size={12} />
                      {MOCK_COURSE_META.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* ── 3. WHAT YOU'LL LEARN ── */}
                {(() => {
                  const displayLearnings = learnings.filter((l: any) => {
                    const text = typeof l === 'string' ? l : l?.text
                    return text && text.trim() !== '' && text !== 'null'
                  })
                  if (displayLearnings.length === 0) return null
                  return (
                    <Container>
                      <Heading level="h2">{t('courses.what_you_will_learn')}</Heading>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {displayLearnings.map((learning: any) => {
                          const learningText = typeof learning === 'string' ? learning : learning.text
                          const learningId = typeof learning === 'string' ? learning : learning.id || learning.text
                          return (
                            <div key={learningId} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-indigo-500" />
                              </div>
                              <Text size="small" weight="plus">{learningText}</Text>
                            </div>
                          )
                        })}
                      </div>
                    </Container>
                  )
                })()}

                {/* ── 4. COURSE CURRICULUM ── */}
                <Container>
                  <Heading level="h2">{t('courses.course_lessons')}</Heading>
                  <div className="mt-4 divide-y divide-ui-border-base">
                    {(course.chapters ?? []).map((chapter: any, idx: number) => {
                      const isExpanded = expandedChapters[chapter.chapter_uuid] ?? (idx === 0)
                      return (
                        <div key={chapter.chapter_uuid || `chapter-${chapter.name}`}>
                          {/* Chapter header */}
                          <button
                            className="flex items-center w-full py-3 px-1 gap-3 text-left hover:bg-ui-bg-subtle -mx-1 px-3 rounded-md transition-colors"
                            onClick={() => setExpandedChapters(prev => ({
                              ...prev,
                              [chapter.chapter_uuid]: !isExpanded
                            }))}
                          >
                            <ChevronDown className={`w-4 h-4 text-ui-fg-muted transition-transform shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ui-bg-subtle text-ui-fg-muted text-xs font-semibold shrink-0 border border-ui-border-base">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <Text weight="plus" size="base" className="truncate">{chapter.name}</Text>
                              <Text size="xsmall" className="text-ui-fg-muted">
                                {chapter.activities.length} {t('activities.activities')}
                              </Text>
                            </div>
                            {chapter.is_locked && <Lock size={14} className="text-ui-fg-muted shrink-0" />}
                          </button>
                          {/* Activities list */}
                          <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="pl-12 pb-2 space-y-0.5">
                              {chapter.activities.map((activity: any) => {
                                const locked = !!activity.is_locked
                                const RowInner = (
                                  <div className="flex items-center gap-3 py-2 px-2 rounded-md transition-colors">
                                    <div className="shrink-0">
                                      {locked ? (
                                        <Lock size={14} className="text-ui-fg-muted" />
                                      ) : isActivityDone(activity) ? (
                                        <div className="relative">
                                          <Square size={16} className="stroke-[2] text-ui-fg-interactive" />
                                          <Check size={16} className="stroke-[2.5] text-ui-fg-interactive absolute top-0 left-0" />
                                        </div>
                                      ) : isActivityCurrent(activity) ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-ui-fg-interactive flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-ui-fg-interactive animate-pulse" />
                                        </div>
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-ui-border-base" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Text size="small" weight={isActivityCurrent(activity) ? 'plus' : 'regular'}
                                        className={`truncate ${locked ? 'text-ui-fg-muted' : isActivityCurrent(activity) ? 'text-ui-fg-interactive' : 'text-ui-fg-base'}`}>
                                        {activity.name}
                                      </Text>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {activity.activity_type === 'TYPE_DYNAMIC' && <StickyNote size={10} className="text-ui-fg-muted" />}
                                        {activity.activity_type === 'TYPE_VIDEO' && <Video size={10} className="text-ui-fg-muted" />}
                                        {activity.activity_type === 'TYPE_DOCUMENT' && <File size={10} className="text-ui-fg-muted" />}
                                        {activity.activity_type === 'TYPE_ASSIGNMENT' && <Backpack size={10} className="text-ui-fg-muted" />}
                                        <Text size="xsmall" className="text-ui-fg-muted">{getActivityTypeLabel(activity.activity_type)}</Text>
                                      </div>
                                    </div>
                                    {!locked && (
                                      <ArrowRight size={14} className="text-ui-fg-muted shrink-0" />
                                    )}
                                  </div>
                                )

                                if (locked) {
                                  return (
                                    <div key={activity.activity_uuid} className="cursor-not-allowed select-none opacity-60" title={t('course.activity_locked_hint', 'Sign in or join the right user group to unlock this.')}>
                                      {RowInner}
                                    </div>
                                  )
                                }

                                return (
                                  <Link
                                    key={activity.activity_uuid}
                                    href={getUriWithOrg(orgslug, '') + `/course/${courseuuid}/activity/${activity.activity_uuid.replace('activity_', '')}`}
                                    rel="noopener noreferrer"
                                    prefetch={false}
                                    className="block group hover:bg-ui-bg-subtle rounded-md transition-colors"
                                  >
                                    {RowInner}
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Container>

                {/* ── 5. REQUIREMENTS (mock — swap for real data later) ── */}
                <Container>
                  <Heading level="h2">Requirements</Heading>
                  <ul className="mt-4 space-y-2">
                    {MOCK_COURSE_META.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-ui-fg-muted mt-2.5 shrink-0" />
                        <Text size="small">{req}</Text>
                      </li>
                    ))}
                  </ul>
                </Container>

                {/* ── 6. FULL DESCRIPTION ── */}
                {course.about && (
                  <Container>
                    <Heading level="h2">About This Course</Heading>
                    <Text className="mt-4 whitespace-pre-line leading-relaxed">{course.about}</Text>
                  </Container>
                )}
              </div>

              {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
              <div className="w-full lg:w-80 xl:w-96 shrink-0">
                <div className="lg:sticky lg:top-8 space-y-4">

                  {/* ── SIDEBAR 1: Progress + Continue ── */}
                  <Container>
                    <div className="flex items-center justify-between">
                      <Text weight="plus" size="large">75% Complete</Text>
                      <Text size="small" className="text-ui-fg-muted">18/24</Text>
                    </div>
                    <div className="w-full h-1.5 bg-ui-bg-subtle rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-ui-fg-interactive rounded-full transition-all" style={{ width: '75%' }} />
                    </div>
                    <Button variant="primary" size="large" className="w-full mt-4">
                      Continue Learning
                    </Button>
                  </Container>

                  {/* ── SIDEBAR 2: Course Includes ── */}
                  <Container>
                    <Heading level="h3">This Course Includes</Heading>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{MOCK_COURSE_META.courseIncludes.videoHours} hours of video</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{MOCK_COURSE_META.courseIncludes.totalLessons} lessons</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <Download size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">{MOCK_COURSE_META.courseIncludes.resources} downloadable resources</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award size={16} className="text-ui-fg-muted shrink-0" />
                        <Text size="small">Certificate of completion</Text>
                      </div>
                    </div>
                  </Container>

                  {/* ── SIDEBAR 3: Instructor ── */}
                  <Container>
                    <Heading level="h3">Instructor</Heading>
                    <div className="mt-4 flex items-start gap-3">
                      <Avatar
                        fallback={MOCK_COURSE_META.instructor.name.split(' ').map(n => n[0]).join('')}
                        size="large"
                        variant="rounded"
                      />
                      <div className="min-w-0">
                        <Text weight="plus" size="base">{MOCK_COURSE_META.instructor.name}</Text>
                        <Text size="small" className="text-ui-fg-subtle">{MOCK_COURSE_META.instructor.title}</Text>
                        <Text size="xsmall" className="text-ui-fg-muted mt-1 leading-relaxed">{MOCK_COURSE_META.instructor.bio}</Text>
                      </div>
                    </div>
                  </Container>

                  {/* ── SIDEBAR 4: Last Updated ── */}
                  <Text size="xsmall" className="text-ui-fg-muted text-center block">
                    Last updated: {course.update_date ? new Date(course.update_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'March 2026'}
                  </Text>
                </div>
              </div>
            </div>

            {/* Community Section */}
            <div className="mt-12">
              <CourseCommunitySection courseUuid={course.course_uuid} orgslug={orgslug} />
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