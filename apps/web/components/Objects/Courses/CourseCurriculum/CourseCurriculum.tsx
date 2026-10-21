'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getUriWithOrg } from '@services/config/config'

// ── Types ──

interface Lesson {
  id: number
  uuid: string
  name: string
  duration?: number
}

interface Module {
  id: number
  name: string
  description?: string
  lessons: Lesson[]
}

interface CourseCurriculumProps {
  chapters?: any[]
  orgslug?: string
  courseuuid?: string
}

function cleanUuid(uuid?: string, prefix?: string) {
  if (!uuid) return ''
  return prefix ? uuid.replace(prefix, '') : uuid
}

function toModule(chapter: any): Module {
  return {
    id: chapter.id,
    name: chapter.name || '',
    description: chapter.description || '',
    lessons: (chapter.activities || []).map((activity: any) => ({
      id: activity.id,
      uuid: clearActivityUuid(activity.activity_uuid),
      name: activity.name || '',
      duration:
        typeof activity.extra_metadata?.duration === 'number'
          ? activity.extra_metadata.duration
          : typeof activity.details?.duration === 'number'
            ? activity.details.duration
            : undefined,
    })),
  }
}

function clearActivityUuid(uuid?: string) {
  return cleanUuid(uuid, 'activity_')
}

// ── Sub-components ──

function ModuleCard({
  module,
  index,
  isOpen,
  onToggle,
  orgslug,
  courseuuid,
}: {
  module: Module
  index: number
  isOpen: boolean
  onToggle: () => void
  orgslug: string
  courseuuid: string
}) {
  const { t } = useTranslation()
  const lessonCount = module.lessons.length
  const totalMinutes = module.lessons.reduce(
    (acc, lesson) => acc + (lesson.duration || 0),
    0
  )

  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* ── Header (always visible, clickable) ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 text-start transition-colors hover:bg-black/[0.02]"
      >
        <span className="flex flex-col min-w-0">
          <span className="text-[11px] uppercase tracking-wide text-ui-fg-muted">
            {t('course.page.curriculum_module', { number: index + 1 })}
          </span>
          <Text weight="plus" size="base" className="text-ui-fg-base truncate">
            {module.name}
          </Text>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 ms-2 transition-transform duration-200',
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
              {t('course.page.lessons', { count: lessonCount })}
            </Text>
            {totalMinutes > 0 && (
              <>
                <span className="text-ui-fg-muted text-[10px]">&middot;</span>
                <Text size="small" className="text-ui-fg-muted">
                  {totalMinutes} min
                </Text>
              </>
            )}
          </div>

          {/* Lessons */}
          <div className="space-y-2">
            {module.lessons.map((lesson, idx) => (
              <Link
                key={lesson.id ?? idx}
                href={getUriWithOrg(
                  orgslug,
                  `/course/${courseuuid}/activity/${lesson.uuid}`
                )}
                prefetch={false}
                className="flex items-center justify-between py-1.5 gap-3 rounded-md hover:bg-black/[0.02] transition-colors"
              >
                <Text size="base" className="text-ui-fg-base truncate">
                  {idx + 1}. {lesson.name}
                </Text>
                {lesson.duration ? (
                  <Text size="small" className="text-ui-fg-muted shrink-0 ms-3">
                    {lesson.duration} min
                  </Text>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

// ── Main component ──

export default function CourseCurriculum({
  chapters = [],
  orgslug = '',
  courseuuid = '',
}: CourseCurriculumProps) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const modules = chapters.map(toModule)
  if (modules.length === 0) return null

  return (
    <div>
      {/* Section header */}
      <div className="mb-5">
        <Heading level="h1" className="!text-2xl">{t('course.page.curriculum_title')}</Heading>
      </div>

      {/* Description */}
      <div className="mb-7">
        <Text size="base" className="text-ui-fg-subtle leading-relaxed">
          {t('course.page.curriculum_description')}
        </Text>
      </div>

      {/* Modules */}
      <div className="space-y-2.5">
        {modules.map((module, idx) => (
          <ModuleCard
            key={module.id ?? idx}
            module={module}
            index={idx}
            orgslug={orgslug}
            courseuuid={courseuuid}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  )
}
