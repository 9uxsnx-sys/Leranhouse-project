'use client'

import { useEffect, useRef, useState, use, lazy, Suspense } from 'react'
import { getAPIUrl } from '@services/config/config'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { markActivityAsComplete } from '@services/courses/activity'
import { swrFetcher } from '@services/utils/ts/requests'
import useSWR from 'swr'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import toast from 'react-hot-toast'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  FileText,
  ClipboardCheck,
  Download,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Share2,
  BookOpen,
  Video,
  FileQuestion,
  Check,
} from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

// ── Lazy-loaded activity components ──

const VideoActivity = lazy(() => import('@components/Objects/Activities/Video/Video'))
const DocumentPdfActivity = lazy(() => import('@components/Objects/Activities/DocumentPdf/DocumentPdf'))
const AssignmentStudentActivity = lazy(() => import('@components/Objects/Activities/Assignment/AssignmentStudentActivity'))
const ScormActivity = lazy(() => import('../../../../../../../ee/components/Activities/ScormActivity'))
const MarkdownActivity = lazy(() => import('@components/Objects/Activities/Markdown/MarkdownActivity'))
const EmbedActivity = lazy(() => import('@components/Objects/Activities/Embed/EmbedActivity'))
const DynamicCanva = lazy(() => import('@components/Objects/Activities/DynamicCanva/DynamicCanva'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative w-6 h-6">
      <div className="absolute top-0 start-0 w-full h-full border-2 border-gray-100 rounded-full"></div>
      <div className="absolute top-0 start-0 w-full h-full border-2 border-gray-400 rounded-full animate-spin border-t-transparent"></div>
    </div>
  </div>
)

// ── Mock data ──

const MOCK_CHAPTERS = [
  {
    chapter_uuid: 'ch_1',
    name: 'Getting Started with UI Design',
    activities: [
      { id: 'act_1', name: 'Welcome to the Course', type: 'TYPE_VIDEO', completed: true },
      { id: 'act_2', name: 'Design Principles Overview', type: 'TYPE_DYNAMIC', completed: false },
      { id: 'act_3', name: 'Tools & Setup Guide', type: 'TYPE_DOCUMENT', completed: false },
    ],
  },
  {
    chapter_uuid: 'ch_2',
    name: 'Typography & Color Theory',
    activities: [
      { id: 'act_4', name: 'Understanding Typography', type: 'TYPE_VIDEO', completed: false },
      { id: 'act_5', name: 'Color Psychology', type: 'TYPE_DYNAMIC', completed: false },
      { id: 'act_6', name: 'Building a Color Palette', type: 'TYPE_ASSIGNMENT', completed: false },
    ],
  },
  {
    chapter_uuid: 'ch_3',
    name: 'Layout & Composition',
    activities: [
      { id: 'act_7', name: 'Grid Systems', type: 'TYPE_VIDEO', completed: false },
      { id: 'act_8', name: 'Visual Hierarchy', type: 'TYPE_DYNAMIC', completed: false },
      { id: 'act_9', name: 'Responsive Design Patterns', type: 'TYPE_VIDEO', completed: false },
      { id: 'act_10', name: 'Module 3 Quiz', type: 'TYPE_SCORM', completed: false },
    ],
  },
  {
    chapter_uuid: 'ch_4',
    name: 'Components & Design Systems',
    activities: [
      { id: 'act_11', name: 'Introduction to Components', type: 'TYPE_VIDEO', completed: false },
      { id: 'act_12', name: 'Building a Button System', type: 'TYPE_ASSIGNMENT', completed: false },
      { id: 'act_13', name: 'Design Tokens & Variables', type: 'TYPE_DOCUMENT', completed: false },
      { id: 'act_14', name: 'Creating a Component Library', type: 'TYPE_DYNAMIC', completed: false },
      { id: 'act_15', name: 'Module 4 Quiz', type: 'TYPE_SCORM', completed: false },
    ],
  },
  {
    chapter_uuid: 'ch_5',
    name: 'Prototyping & Interaction Design',
    activities: [
      { id: 'act_16', name: 'Smart Animate & Transitions', type: 'TYPE_VIDEO', completed: false },
      { id: 'act_17', name: 'Micro-interactions & Feedback', type: 'TYPE_DYNAMIC', completed: false },
      { id: 'act_18', name: 'User Flow Prototyping', type: 'TYPE_ASSIGNMENT', completed: false },
      { id: 'act_19', name: 'Module 5 Quiz', type: 'TYPE_SCORM', completed: false },
    ],
  },
  {
    chapter_uuid: 'ch_6',
    name: 'Capstone Project',
    activities: [
      { id: 'act_20', name: 'Project Brief & Requirements', type: 'TYPE_DOCUMENT', completed: false },
      { id: 'act_21', name: 'Wireframing & Low-Fidelity', type: 'TYPE_ASSIGNMENT', completed: false },
      { id: 'act_22', name: 'High-Fidelity Mockups', type: 'TYPE_ASSIGNMENT', completed: false },
      { id: 'act_23', name: 'Final Presentation & Handoff', type: 'TYPE_VIDEO', completed: false },
    ],
  },
]

const MOCK_SECTIONS = [
  { id: 'what-youll-learn', labelKey: 'lesson.preview.what_youll_learn' },
  { id: 'lesson-content', labelKey: 'lesson.preview.lesson_video' },
  { id: 'summary', labelKey: 'lesson.preview.key_takeaways' },
  { id: 'resources', labelKey: 'lesson.preview.resources' },
  { id: 'knowledge-check', labelKey: 'lesson.preview.quick_check' },
  { id: 'whats-next', labelKey: 'lesson.preview.up_next' },
]

// ── Activity Type Icon ──

function ActivityIcon({ type, completed }: { type: string; completed?: boolean }) {
  if (completed) return <Check className="w-4 h-4 text-green-600 shrink-0" />
  switch (type) {
    case 'TYPE_VIDEO': return <Video className="w-4 h-4 text-ui-fg-muted shrink-0" />
    case 'TYPE_DYNAMIC': return <FileText className="w-4 h-4 text-ui-fg-muted shrink-0" />
    case 'TYPE_DOCUMENT': return <FileText className="w-4 h-4 text-ui-fg-muted shrink-0" />
    case 'TYPE_ASSIGNMENT': return <ClipboardCheck className="w-4 h-4 text-ui-fg-muted shrink-0" />
    default: return <Circle className="w-4 h-4 text-ui-fg-muted shrink-0" />
  }
}

// ── Course Outline Sidebar (accordion) ──

function CourseOutlineSidebar({ currentActivityId, chapters, onNavigate }: { currentActivityId: string; chapters: any[]; onNavigate?: (activityId: string) => void }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  // Helper to clean activity UUID prefix
  const cleanId = (id: string) => id?.replace('activity_', '').replace('act_', '')

  // Locate the current activity within the chapters
  let currentActivityName = ''
  let currentModuleIndex = 0
  let currentLessonInModule = 0
  let totalLessonsInModule = 0

  for (let mi = 0; mi < chapters.length; mi++) {
    const ch = chapters[mi]
    const actIdx = ch.activities.findIndex(
      (a: any) => cleanId(a.activity_uuid || a.id) === cleanId(currentActivityId)
    )
    if (actIdx !== -1) {
      currentActivityName = ch.activities[actIdx].name
      currentModuleIndex = mi
      currentLessonInModule = actIdx + 1
      totalLessonsInModule = ch.activities.length
      break
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-start transition-colors hover:bg-black/[0.02]"
      >
        <div className="min-w-0 flex-1 pe-2">
          <Text weight="plus" size="large" className="text-ui-fg-base truncate block">
            {currentActivityName || t('lesson.preview.course_outline')}
          </Text>
          <Text size="small" className="text-ui-fg-muted block mt-0.5">
            {chapters.length > 0
              ? t('lesson.preview.module_lesson', { module: currentModuleIndex + 1, lesson: currentLessonInModule, total: totalLessonsInModule })
              : t('lesson.preview.no_modules_loaded')}
          </Text>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 space-y-4">
            {chapters.length === 0 && (
              <Text size="small" className="text-ui-fg-subtle italic">{t('lesson.preview.no_modules_available')}</Text>
            )}
            {chapters.map((chapter: any, mi: number) => (
              <div key={chapter.chapter_uuid}>
                <Text size="small" className="text-ui-fg-muted font-medium mb-1.5 block">
                  {chapter.name}
                </Text>
                <div className="space-y-0.5">
                  {chapter.activities.map((act: any) => {
                    const actId = cleanId(act.activity_uuid || act.id)
                    const isCurrent = actId === cleanId(currentActivityId)
                    const actType = act.activity_type || act.type
                    return (
                      <div
                        key={act.activity_uuid || act.id}
                        onClick={() => onNavigate?.(actId)}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-ui-bg-subtle"
                      >
                        {isCurrent ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : actType === 'TYPE_SCORM' ? (
                          <FileQuestion className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" />
                        )}
                        <span
                          className={cn(
                            'truncate text-xs',
                            isCurrent ? 'text-ui-fg-base font-medium' : 'text-ui-fg-subtle'
                          )}
                        >
                          {act.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── On This Page Sidebar (inline tip style) ──

function OnThisPageSidebar({ activeSection, sections = MOCK_SECTIONS }: { activeSection: string; sections?: { id: string; labelKey: string }[] }) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorTop, setIndicatorTop] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const activeBtn = containerRef.current.querySelector(`[data-section="${activeSection}"]`) as HTMLElement | null
    if (activeBtn) {
      setIndicatorTop(activeBtn.offsetTop + activeBtn.offsetHeight / 2 - 8)
    }
  }, [activeSection])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <div ref={containerRef} className="relative space-y-0.5">
        <span
          className="absolute start-0 w-[3px] h-4 bg-ui-fg-base rounded-full pointer-events-none transition-all duration-300 ease-in-out"
          style={{ top: indicatorTop }}
        />
        {sections.map((section) => (
          <button
            key={section.id}
            data-section={section.id}
            onClick={() => scrollTo(section.id)}
            className="group relative w-full text-start py-1 text-[14px] transition-colors"
          >
            <span className={cn(
              'inline-block ps-4 transition-colors',
              activeSection === section.id
                ? 'text-ui-fg-base font-medium'
                : 'text-ui-fg-subtle group-hover:text-ui-fg-base'
            )}>
              {t(section.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Knowledge Check Card (accordion, same style as curriculum modules) ──

function KnowledgeCheckCard({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 text-start transition-colors"
      >
        <Text weight="plus" size="base" className="text-ui-fg-base truncate pe-2">
          {question}
        </Text>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-3">
            <Text size="base" className="text-ui-fg-subtle leading-relaxed">
              {answer}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Activity Content Renderer ──

function renderActivityContent(activity: any, courseuuid: string, t: (key: string) => string) {
  const activityType = activity.activity_type
  const subType = activity.activity_sub_type

  switch (activityType) {
    case 'TYPE_DYNAMIC':
      if (subType === 'SUBTYPE_DYNAMIC_MARKDOWN') {
        return <MarkdownActivity activity={activity} />
      }
      if (subType === 'SUBTYPE_DYNAMIC_EMBED') {
        return <EmbedActivity activity={activity} />
      }
      // Rich-text lessons store a TipTap doc in activity.content — same renderer
      // the learner activity page uses. Falling back to MarkdownActivity here
      // showed "No markdown URL configured" for every rich-text lesson.
      return <DynamicCanva content={activity.content} activity={activity} />
    case 'TYPE_VIDEO':
      return <VideoActivity course={{ course_uuid: courseuuid }} activity={activity} />
    case 'TYPE_DOCUMENT':
      return <DocumentPdfActivity course={{ course_uuid: courseuuid }} activity={activity} />
    case 'TYPE_ASSIGNMENT':
      return <AssignmentStudentActivity />
    case 'TYPE_SCORM':
      return <ScormActivity course={{ course_uuid: courseuuid }} activity={activity} />
    default:
      return (
        <div className="aspect-video bg-white rounded-xl flex items-center justify-center border border-gray-200">
          <div className="text-center">
            <Play className="w-12 h-12 text-ui-fg-muted mx-auto mb-2" />
            <Text size="small" className="text-ui-fg-muted">{t('lesson.preview.unsupported_activity')}</Text>
          </div>
        </div>
      )
  }
}

// ── Lesson Preview Content ──

function LessonPreviewContent({ courseuuid, activityid, orgslug }: { courseuuid: string; activityid: string; orgslug: string }) {
  const { t, i18n } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  // Follow the platform language switcher, like the course page does.
  const locale = (i18n.language || 'en').split('-')[0]

  // Fetch course data directly (not through CourseProvider) so we control
  // loading / error states instead of showing a blank white page.
  // Use with_unpublished_activities=false (default) since this is a
  // student-facing page — only published activities should show up.
  // NOTE: the API expects the course UUID with a "course_" prefix.
  const courseUuidWithPrefix = `course_${courseuuid}`
  const apiUrl = `${getAPIUrl()}courses/${courseUuidWithPrefix}/meta?with_unpublished_activities=false&slim=true&locale=${locale}`
  // Use a stable key — only depend on session being ready, not on the token
  // value itself, so SWR doesn't re-fetch every time the token changes.
  // IMPORTANT: check that `session` is not null (context not yet initialized)
  // otherwise SWR fires a fetch with no auth token, gets a 401, and caches
  // that error permanently because the key doesn't change later.
  const swrKey = session && session?.status !== 'loading' ? apiUrl : null
  const { data: courseData, error, isLoading } = useSWR(
    swrKey,
    url => swrFetcher(url, access_token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  )

  const chapters = courseData?.chapters || []

  // Log errors to console for debugging (doesn't affect hook order)
  if (error) {
    const errStatus = (error as any)?.status
    const errDetail = (error as any)?.detail || error.message
    console.error('[LessonPreview] Failed to fetch course meta:', { status: errStatus, detail: errDetail, courseuuid })
  }

  // Helper to clean activity UUID prefix
  const cleanId = (id: string) => id?.replace('activity_', '').replace('act_', '')

  // Flatten all activities
  const allActivities = chapters.flatMap((ch: any) =>
    (ch.activities || []).map((act: any) => ({
      ...act,
      activity_uuid: act.activity_uuid || act.id,
      chapterName: ch.name,
    }))
  )

  // Use local state for the active activity ID so we NEVER trigger a full
  // page navigation when switching between lessons. Initialized from the URL
  // query param, but updated locally via setActiveActivityId.
  const [activeActivityId, setActiveActivityId] = useState(() => activityid)

  const currentIndex = allActivities.findIndex(
    (act: any) => cleanId(act.activity_uuid) === cleanId(activeActivityId)
  )

  const currentActivity = currentIndex >= 0 ? allActivities[currentIndex] : null
  // The outline comes from the slim tree (no content), so the active lesson is
  // fetched in full — otherwise rich-text lessons render with empty content.
  const { data: fullActivity } = useSWR(
    currentActivity
      ? `${getAPIUrl()}activities/${currentActivity.activity_uuid}?locale=${locale}`
      : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  )
  const renderedActivity = fullActivity || currentActivity

  // Structured lesson fields are optional. Lesson bodies authored in the rich
  // editor already contain their own sections, so empty blocks are hidden
  // instead of rendering "No … set for this lesson" placeholders.
  const objectives = renderedActivity?.extra_metadata?.learning_objectives || []
  const takeaways = renderedActivity?.extra_metadata?.takeaways || []
  const resources = renderedActivity?.extra_metadata?.resources || []
  const knowledgeChecks = renderedActivity?.extra_metadata?.knowledge_checks || []
  const visibleSections = MOCK_SECTIONS.filter((section) => {
    if (section.id === 'what-youll-learn') return objectives.length > 0
    if (section.id === 'summary') return takeaways.length > 0
    if (section.id === 'resources') return resources.length > 0
    if (section.id === 'knowledge-check') return knowledgeChecks.length > 0
    return true
  })
  const prevActivity = currentIndex > 0 ? allActivities[currentIndex - 1] : null
  const nextActivity = currentIndex < allActivities.length - 1 ? allActivities[currentIndex + 1] : null

  const navigateTo = (act: any) => {
    if (!act) return
    setActiveActivityId(cleanId(act.activity_uuid))
  }

  // Auto-redirect to first real activity if current activityid doesn't match any
  useEffect(() => {
    if (chapters.length > 0 && !currentActivity && allActivities.length > 0) {
      const firstAct = allActivities[0]
      if (firstAct) {
        setActiveActivityId(cleanId(firstAct.activity_uuid))
      }
    }
  }, [chapters, currentActivity, allActivities])

  const handleMarkComplete = async () => {
    if (!currentActivity || !access_token) return
    try {
      await markActivityAsComplete(orgslug, courseuuid, currentActivity.activity_uuid, access_token)
      if (nextActivity) {
        navigateTo(nextActivity)
      }
    } catch (e) {
      console.error('Failed to mark activity as complete:', e)
      toast.error(t('lesson.preview.mark_complete_error'))
    }
  }

  const [activeSection, setActiveSection] = useState('what-youll-learn')

  useEffect(() => {
    const sectionIds = MOCK_SECTIONS.map(s => s.id)
    const SENTINEL_ID = 'page-end-sentinel'

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId = ''
        let minDist = Infinity
        let sentinelVisible = false

        for (const entry of entries) {
          if (entry.target.id === SENTINEL_ID) {
            if (entry.isIntersecting) sentinelVisible = true
            continue
          }

          if (entry.isIntersecting) {
            const dist = Math.abs(entry.boundingClientRect.top)
            if (dist < minDist) {
              minDist = dist
              bestId = entry.target.id
            }
          }
        }

        if (sentinelVisible) {
          setActiveSection(sectionIds[sectionIds.length - 1])
        } else if (bestId) {
          setActiveSection(bestId)
        }
      },
      { rootMargin: '-80px 0px -20% 0px' }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    const sentinel = document.getElementById(SENTINEL_ID)
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [])

  // ── Loading / Error states (placed after all hooks so hook order is stable) ──
  if (isLoading) {
    return (
      <GeneralWrapperStyled>
        <PageLoading />
      </GeneralWrapperStyled>
    )
  }

  if (error) {
    const errStatus = (error as any)?.status
    const errDetail = (error as any)?.detail || error.message

    if (errStatus === 403 || errStatus === 404) {
      return (
        <GeneralWrapperStyled>
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Text size="large" className="text-ui-fg-muted">{t('lesson.preview.course_not_found')}</Text>
            <Text size="small" className="text-ui-fg-subtle">{t('lesson.preview.course_not_found_description')}</Text>
            <Button variant="primary" size="small" onClick={() => window.location.reload()}>
              {t('lesson.preview.refresh_page')}
            </Button>
          </div>
        </GeneralWrapperStyled>
      )
    }

    return (
      <GeneralWrapperStyled>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Text size="large" className="text-ui-fg-muted">{t('lesson.preview.failed_to_load')}</Text>
          <Text size="small" className="text-ui-fg-subtle">
            {errDetail ? `${errDetail}` : t('lesson.preview.check_connection')}
          </Text>
          <Button variant="primary" size="small" onClick={() => window.location.reload()}>
            {t('lesson.preview.refresh_page')}
          </Button>
        </div>
      </GeneralWrapperStyled>
    )
  }

  return (
    <GeneralWrapperStyled>
      {/* ── PAGE TITLE ── */}
      <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight max-w-7xl mx-auto mt-4">
        {renderedActivity?.name || t('lesson.preview.title')}
      </h1>

      {/* ── CONTENT (two-column layout) ── */}
      <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-12">

            {/* What You'll Learn */}
            {objectives.length > 0 && (
              <section id="what-youll-learn" className="scroll-mt-24">
                <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
                  <div className="flex flex-col gap-0.5">
                    <Heading level="h2">{t('lesson.preview.what_youll_learn')}</Heading>
                    <Text size="base" className="text-ui-fg-muted">{t('lesson.preview.what_youll_learn_lead')}</Text>
                  </div>
                  <ul className="mt-3 space-y-2 ps-3">
                    {objectives.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ui-fg-muted shrink-0">&bull;</span>
                        <Text size="base" className="text-[16px]">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Lesson Content */}
            <section id="lesson-content" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5 ms-1">
                {renderedActivity?.activity_type === 'TYPE_VIDEO' ? t('lesson.preview.lesson_video') : t('lesson.preview.lesson_content')}
              </Heading>
              {renderedActivity ? (
                <Suspense fallback={<LoadingFallback />}>
                  {renderActivityContent(renderedActivity, courseuuid, t)}
                </Suspense>
              ) : (
                <div className="aspect-video bg-white rounded-xl flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-ui-fg-muted mx-auto mb-2" />
                    <Text size="small" className="text-ui-fg-muted">{t('lesson.preview.no_activity_content')}</Text>
                  </div>
                </div>
              )}
            </section>

            {/* Key Takeaways */}
            {takeaways.length > 0 && (
              <section id="summary" className="scroll-mt-24">
                <Heading level="h1" className="!text-2xl mb-5 ms-1">{t('lesson.preview.key_takeaways')}</Heading>
                <ul className="space-y-4">
                  {takeaways.map((takeaway: { title: string; items: string[] }, idx: number) => (
                    <li key={idx}>
                      <div className="flex items-start gap-2">
                        <span className="text-ui-fg-muted shrink-0 mt-0.5">&bull;</span>
                        <Text size="base" className="text-black text-[17px]">{takeaway.title}</Text>
                      </div>
                      {takeaway.items && takeaway.items.length > 0 && (
                        <ul className="ms-6 mt-2 space-y-1.5">
                          {takeaway.items.map((item: string, iidx: number) => (
                            <li key={iidx} className="flex items-start gap-2">
                              <span className="text-ui-fg-muted shrink-0">&bull;</span>
                              <Text size="base" className="text-black text-[17px]">{item}</Text>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Downloadable Resources */}
            {resources.length > 0 && (
              <section id="resources" className="scroll-mt-24">
                <Heading level="h1" className="!text-2xl mb-5">{t('lesson.preview.resources')}</Heading>
                <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
                  <div className="flex flex-col gap-0.5">
                    <Heading level="h2">{t('lesson.preview.whats_included')}</Heading>
                    <Text size="base" className="text-ui-fg-muted">{t('lesson.preview.resources_lead')}</Text>
                  </div>
                  <ul className="mt-3 space-y-3 ps-3">
                    {resources.map((resource: { name: string; url: string }, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-ui-fg-muted shrink-0">&bull;</span>
                        <Text size="base" className="text-[16px] flex-1">{resource.name}</Text>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-muted hover:text-ui-fg-base shrink-0 mt-0.5"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Knowledge Check */}
            {knowledgeChecks.length > 0 && (
              <section id="knowledge-check" className="scroll-mt-24">
                <Heading level="h1" className="!text-2xl mb-5">{t('lesson.preview.quick_check')}</Heading>
                <div className="space-y-2.5">
                  {knowledgeChecks.map((item: { question: string; answer: string }, i: number) => (
                    <KnowledgeCheckCard key={i} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </section>
            )}

            {/* What's Next */}
            <section id="whats-next" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">{t('lesson.preview.up_next')}</Heading>
              {nextActivity ? (
                <div
                  className="border border-ui-bg-subtle rounded-lg p-5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                  onClick={() => navigateTo(nextActivity)}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-ui-fg-muted mt-0.5 shrink-0" />
                    <div>
                      <Text className="font-medium text-ui-fg-base mb-1">
                        {nextActivity.name}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {nextActivity.description || t('lesson.preview.continue_hint', { module: nextActivity.chapterName || t('lesson.preview.this_module') })}
                      </Text>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-ui-bg-subtle rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-ui-fg-muted mt-0.5 shrink-0" />
                    <div>
                      <Text className="font-medium text-ui-fg-base mb-1">
                        {t('lesson.preview.course_complete')}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {t('lesson.preview.course_complete_description')}
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 scroll-mt-24">
              <Button
                variant="ghost"
                size="small"
                className="gap-1.5"
                onClick={() => navigateTo(prevActivity)}
                disabled={!prevActivity}
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('lesson.preview.previous')}
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleMarkComplete}
                disabled={!currentActivity || !access_token}
              >
                {t('lesson.preview.mark_complete')}
              </Button>
              <Button
                variant="ghost"
                size="small"
                className="gap-1.5"
                onClick={() => navigateTo(nextActivity)}
                disabled={!nextActivity}
              >
                {t('lesson.preview.next')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>

            {/* bottom sentinel for IntersectionObserver — tells the
                "On This Page" sidebar to highlight the last section
                when the user has scrolled to the bottom */}
            <div id="page-end-sentinel" className="h-1" />
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <CourseOutlineSidebar currentActivityId={activeActivityId} chapters={chapters} onNavigate={(id) => setActiveActivityId(id)} />
              <OnThisPageSidebar activeSection={activeSection} sections={visibleSections} />
            </div>
          </div>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}

// ── Main Page ──

export default function LessonPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgslug: string; courseuuid: string }>
  searchParams: Promise<{ activityid?: string }>
}) {
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const courseuuid = resolvedParams.courseuuid
  const activityid = resolvedSearchParams.activityid || 'act_1'

  return (
    <LessonPreviewContent courseuuid={courseuuid} activityid={activityid} orgslug={resolvedParams.orgslug} />
  )
}
