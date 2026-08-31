'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getUriWithOrg } from '@services/config/config'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
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
  { id: 'what-youll-learn', label: "What You'll Learn" },
  { id: 'lesson-content', label: 'Lesson Video' },
  { id: 'summary', label: 'Key Takeaways' },
  { id: 'resources', label: 'Resources' },
  { id: 'knowledge-check', label: 'Quick Check' },
  { id: 'whats-next', label: "Up Next" },
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

function CourseOutlineSidebar({ currentActivityId }: { currentActivityId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  // Locate the current activity within the chapters
  let currentActivityName = ''
  let currentModuleIndex = 0
  let currentLessonInModule = 0
  let totalLessonsInModule = 0

  for (let mi = 0; mi < MOCK_CHAPTERS.length; mi++) {
    const ch = MOCK_CHAPTERS[mi]
    const actIdx = ch.activities.findIndex((a) => a.id === currentActivityId)
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
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-black/[0.02]"
      >
        <div className="min-w-0 flex-1 pr-2">
          <Text weight="plus" size="large" className="text-ui-fg-base truncate block">
            {currentActivityName}
          </Text>
          <Text size="small" className="text-ui-fg-muted block mt-0.5">
            Module {currentModuleIndex + 1} &middot; Lesson {currentLessonInModule} of {totalLessonsInModule}
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
            {MOCK_CHAPTERS.map((chapter, mi) => (
              <div key={chapter.chapter_uuid}>
                <Text size="small" className="text-ui-fg-muted font-medium mb-1.5 block">
                  {chapter.name}
                </Text>
                <div className="space-y-0.5">
                  {chapter.activities.map((act) => {
                    const isCurrent = act.id === currentActivityId
                    return (
                      <div
                        key={act.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-ui-bg-subtle"
                      >
                        {isCurrent ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : act.type === 'TYPE_SCORM' ? (
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

function OnThisPageSidebar({ activeSection }: { activeSection: string }) {
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
          className="absolute left-0 w-[3px] h-4 bg-ui-fg-base rounded-full pointer-events-none transition-all duration-300 ease-in-out"
          style={{ top: indicatorTop }}
        />
        {MOCK_SECTIONS.map((section) => (
          <button
            key={section.id}
            data-section={section.id}
            onClick={() => scrollTo(section.id)}
            className="group relative w-full text-left py-1 text-[14px] transition-colors"
          >
            <span className={cn(
              'inline-block pl-4 transition-colors',
              activeSection === section.id
                ? 'text-ui-fg-base font-medium'
                : 'text-ui-fg-subtle group-hover:text-ui-fg-base'
            )}>
              {section.label}
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
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-black/[0.02]"
      >
        <Text weight="plus" size="base" className="text-ui-fg-base truncate pr-2">
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
          <div className="px-5 pb-5">
            <Text size="base" className="text-ui-fg-subtle leading-relaxed">
              {answer}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──

export default function LessonPreviewPage() {
  const [activeSection, setActiveSection] = useState('what-youll-learn')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    MOCK_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <GeneralWrapperStyled>
      {/* ── PAGE TITLE ── */}
      <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight max-w-7xl mx-auto mt-4">
        Welcome to the Course
      </h1>

      {/* ── CONTENT (two-column layout) ── */}
      <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-12">

            {/* What You'll Learn */}
            <section id="what-youll-learn" className="scroll-mt-24">
              <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
                <div className="flex flex-col gap-0.5">
                  <Heading level="h2">What you&apos;ll learn</Heading>
                  <Text size="base" className="text-ui-fg-muted">By the end of this lesson, you&apos;ll be able to</Text>
                </div>
                <ul className="mt-3 space-y-2 pl-3">
                    {[
                      'Understand the lesson structure and learning path',
                    'Set up your design tools and workspace for this module',
                    'Identify key concepts and terminology used in this lesson',
                    'Apply the techniques demonstrated in the video to your own work',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-[16px]">{item}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Lesson Content (video) */}
            <section id="lesson-content" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5 ml-1">Main Lesson Video</Heading>
              <div className="aspect-video bg-white rounded-xl flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <Play className="w-12 h-12 text-ui-fg-muted mx-auto mb-2" />
                  <Text size="small" className="text-ui-fg-muted">Video placeholder</Text>
                </div>
              </div>
            </section>

            {/* Lesson Summary */}
            <section id="summary" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5 ml-1">Key Takeaways</Heading>
              <ul className="space-y-4">
                <li>
                  <div className="flex items-start gap-2">
                    <span className="text-ui-fg-muted shrink-0 mt-0.5">&bull;</span>
                    <Text size="base" className="text-black text-[17px]">Course Structure &amp; Learning Path</Text>
                  </div>
                  <ul className="ml-6 mt-2 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Six progressive modules building from fundamentals to advanced prototyping</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Each module follows a consistent video → exercise → resources → quiz rhythm</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Capstone project runs alongside with a deliverable due at the end of each module</Text>
                    </li>
                  </ul>
                </li>
                <li>
                  <div className="flex items-start gap-2">
                    <span className="text-ui-fg-muted shrink-0 mt-0.5">&bull;</span>
                    <Text size="base" className="text-black text-[17px]">Design Tools &amp; Environment Setup</Text>
                  </div>
                  <ul className="ml-6 mt-2 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Figma is the primary design tool with auto-layout and component-based architecture</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Notion for documenting design decisions and GitHub for version-controlling assets</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Standard 1440px artboard with a 12-column grid and 24px gutters as the baseline template</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Starter files and design system skeletons provided so you never start from scratch</Text>
                    </li>
                  </ul>
                </li>
                <li>
                  <div className="flex items-start gap-2">
                    <span className="text-ui-fg-muted shrink-0 mt-0.5">&bull;</span>
                    <Text size="base" className="text-black text-[17px]">Core Design Principles Introduced</Text>
                  </div>
                  <ul className="ml-6 mt-2 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Visual hierarchy directs user attention through size, color, contrast, and spacing</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Balance and alignment create order — symmetrical for formal, asymmetrical for modern</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Typography pairings and cohesive color palettes establish brand personality and tone</Text>
                    </li>
                  </ul>
                </li>
                <li>
                  <div className="flex items-start gap-2">
                    <span className="text-ui-fg-muted shrink-0 mt-0.5">&bull;</span>
                    <Text size="base" className="text-black text-[17px]">Getting Help &amp; Staying on Track</Text>
                  </div>
                  <ul className="ml-6 mt-2 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Community discussion board for sharing work, asking questions, and giving feedback</Text>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-black text-[17px]">Weekly live Q&amp;A sessions with instructors for personalized guidance and portfolio reviews</Text>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            {/* Downloadable Resources */}
            <section id="resources" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">Resources</Heading>
              <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] px-5 py-5">
                <div className="flex flex-col gap-0.5">
                  <Heading level="h2">What&apos;s included</Heading>
                  <Text size="base" className="text-ui-fg-muted">Downloadable files and resources for this lesson</Text>
                </div>
                <ul className="mt-3 space-y-3 pl-3">
                  {[
                    'Complete course syllabus with module breakdown and milestones',
                    'Step-by-step tools setup checklist for the entire course',
                    'Figma starter file with grid system and design tokens',
                  ].map((name, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-ui-fg-muted shrink-0">&bull;</span>
                      <Text size="base" className="text-[16px] flex-1">{name}</Text>
                      <button className="text-ui-fg-muted hover:text-ui-fg-base shrink-0 mt-0.5">
                        <Download className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Knowledge Check */}
            <section id="knowledge-check" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">Quick Check</Heading>
              <div className="space-y-2.5">
                {[
                  {
                    q: 'What is the primary purpose of visual hierarchy in UI design?',
                    a: 'Visual hierarchy guides the user\'s attention to the most important elements on the page first. By using size, color, contrast, and spacing strategically, designers can create a clear path for the eye to follow, making interfaces easier to scan and understand without overwhelming the user.',
                  },
                  {
                    q: 'Why is color theory important in digital design?',
                    a: 'Color theory helps designers create cohesive and accessible interfaces. Understanding color relationships — complementary, analogous, and triadic schemes — allows designers to evoke specific emotions, establish brand identity, and ensure sufficient contrast for readability and accessibility compliance (WCAG).',
                  },
                  {
                    q: 'How does typography affect user experience?',
                    a: 'Typography directly impacts readability, hierarchy, and brand perception. Choosing the right typeface, establishing a clear type scale, and maintaining consistent line heights and spacing ensures that content is legible across devices. Good typography also sets the tone of the product — whether professional, playful, or minimalist.',
                  },
                ].map((item, i) => (
                  <KnowledgeCheckCard key={i} question={item.q} answer={item.a} />
                ))}
              </div>
            </section>

            {/* What's Next */}
            <section id="whats-next" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">Up Next</Heading>
              <div className="border border-ui-bg-subtle rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-ui-fg-muted mt-0.5 shrink-0" />
                  <div>
                    <Text className="font-medium text-ui-fg-base mb-1">
                      Design Principles Overview
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      In the next lesson, we will explore the core principles of visual design,
                      including hierarchy, balance, contrast, and typography fundamentals.
                    </Text>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 scroll-mt-24">
              <Button variant="ghost" size="small" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="primary" size="small">
                Mark as Complete
              </Button>
              <Button variant="ghost" size="small" className="gap-1.5">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <CourseOutlineSidebar currentActivityId="act_1" />
              <OnThisPageSidebar activeSection={activeSection} />
            </div>
          </div>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}
