'use client'

import React, { useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──

interface Lesson {
  title: string
  duration: string
  completed?: boolean
}

interface Module {
  title: string
  description: string
  lessons: Lesson[]
}

interface CourseCurriculumProps {
  modules?: Module[]
}

// ── Default mock data ──

const DEFAULT_MODULES: Module[] = [
  {
    title: 'Module 1: Foundations of UI Design',
    description:
      'Explore the core principles that make interfaces intuitive and beautiful. You will learn about visual hierarchy, color theory, typography, and how to establish a strong design foundation.',
    lessons: [
      { title: 'What is UI Design?', duration: '10 min', completed: true },
      { title: 'Visual Hierarchy & Layout', duration: '15 min', completed: true },
      { title: 'Color Theory Essentials', duration: '12 min', completed: false },
      { title: 'Typography Fundamentals', duration: '14 min', completed: false },
    ],
  },
  {
    title: 'Module 2: Design Systems & Components',
    description:
      'Learn how to build and maintain scalable design systems. This module covers component architecture, design tokens, and creating reusable UI patterns that ensure consistency across products.',
    lessons: [
      { title: 'Introduction to Design Systems', duration: '12 min', completed: false },
      { title: 'Design Tokens & Variables', duration: '18 min', completed: false },
      { title: 'Building Component Libraries', duration: '20 min', completed: false },
      { title: 'Documentation & Handoff', duration: '10 min', completed: false },
    ],
  },
  {
    title: 'Module 3: Prototyping & Interaction',
    description:
      'Master prototyping techniques using Figma and other modern tools. You will learn to create interactive prototypes that communicate design intent clearly to stakeholders and developers.',
    lessons: [
      { title: 'Wireframing Basics', duration: '8 min', completed: false },
      { title: 'Interactive Prototypes in Figma', duration: '16 min', completed: false },
      { title: 'Micro-interactions & Motion', duration: '14 min', completed: false },
      { title: 'User Testing Your Prototypes', duration: '12 min', completed: false },
    ],
  },
  {
    title: 'Module 4: Real-World Projects',
    description:
      'Apply everything you have learned in a capstone project. Build a complete product interface from scratch, from research and wireframes to polished high-fidelity screens.',
    lessons: [
      { title: 'Project Brief & Research', duration: '10 min', completed: false },
      { title: 'Sketches & Wireframes', duration: '15 min', completed: false },
      { title: 'High-Fidelity Mockups', duration: '25 min', completed: false },
      { title: 'Final Presentation', duration: '10 min', completed: false },
    ],
  },
  {
    title: 'Module 5: Final Quiz',
    description:
      'Put your knowledge to the test with a comprehensive quiz covering all modules. Each quiz section will challenge your understanding of UI design principles, design systems, and prototyping.',
    lessons: [
      { title: 'UI Design Fundamentals Quiz', duration: '15 min', completed: false },
      { title: 'Design Systems & Components Quiz', duration: '12 min', completed: false },
      { title: 'Prototyping & Interaction Quiz', duration: '10 min', completed: false },
    ],
  },
]

// ── Sub-components ──

function ModuleCard({
  module,
  index,
  isOpen,
  onToggle,
}: {
  module: Module
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const lessonCount = module.lessons.length

  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* ── Header (always visible, clickable) ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-black/[0.02]"
      >
        <Text weight="plus" size="base" className="text-ui-fg-base truncate">
          {module.title}
        </Text>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 ml-2 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* ── Expanded content ── */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
          {/* Description */}
          {module.description && (
            <div className="mb-5">
              <Text size="base" className="text-ui-fg-subtle leading-relaxed">
                {module.description}
              </Text>
            </div>
          )}

          {/* Module info */}
          <div className="flex items-center gap-2 mb-4">
            <Text size="small" className="text-ui-fg-muted">
              {lessonCount} lessons
            </Text>
            <span className="text-ui-fg-muted text-[10px]">&middot;</span>
            <Text size="small" className="text-ui-fg-muted">
              {module.lessons.reduce((acc, l) => acc + parseInt(l.duration), 0)} min
            </Text>
          </div>

          {/* Lessons */}
          <div className="space-y-2">
            {module.lessons.map((lesson, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5"
              >
                <Text size="base" className="text-ui-fg-base">
                  {idx + 1}. {lesson.title}
                </Text>
                <Text size="small" className="text-ui-fg-muted shrink-0 ml-3">
                  {lesson.duration}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

// ── Main component ──

export default function CourseCurriculum({ modules = DEFAULT_MODULES }: CourseCurriculumProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const totalDuration = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((sum, l) => sum + parseInt(l.duration), 0),
    0
  )

  return (
    <div>
      {/* Section header */}
      <div className="mb-5">
        <Heading level="h1" className="!text-2xl">Course Curriculum</Heading>
      </div>

      {/* Description */}
      <div className="mb-7">
        <Text size="base" className="text-ui-fg-subtle leading-relaxed">
          This course covers everything from the fundamentals of UI design to building real-world projects. Each module is designed to build on the previous one, giving you a structured learning path from beginner to confident designer.
        </Text>
      </div>

      {/* Modules */}
      <div className="space-y-2.5">
        {modules.map((module, idx) => (
          <ModuleCard
            key={idx}
            module={module}
            index={idx}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  )
}
