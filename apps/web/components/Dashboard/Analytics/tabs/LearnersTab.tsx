'use client'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react'
import { SectionCard } from '@components/Analytics/Card'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab, useLearnerDetail } from '@services/analytics/tabs'
import { useTranslation } from 'react-i18next'

function initials(name: string) {
  return String(name || '')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Label/value row used across the learner-details card. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  )
}

/** The details dialog — loads its own payload so the table stays a single request. */
function LearnerDetailDialog({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { t } = useTranslation()
  const { data, isLoading } = useLearnerDetail(userId)
  const user = data?.user
  const courses = data?.courses ?? []

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-[340px] max-h-[85vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <div className="flex justify-end pt-3 pr-3">
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Avatar + identity */}
          <div className="flex flex-col items-center px-6 pb-4">
            <span className="w-[52px] h-[52px] rounded-full bg-gray-100 text-gray-500 text-base font-semibold flex items-center justify-center">
              {initials(user?.name ?? '')}
            </span>
            <span className="mt-3 text-base font-semibold text-gray-800">{user?.name ?? '—'}</span>
            <span className="text-xs text-gray-400">@{user?.username ?? '—'}</span>
            <span className="text-sm text-gray-500 mt-0.5">{user?.email ?? ''}</span>
          </div>

          {/* Info rows */}
          <div className="px-6 pb-4 space-y-3">
            <Row label={t('analytics.learners_tab.role')}>{user?.role ?? '—'}</Row>
            <Row label={t('analytics.learners_tab.status')}>
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${user?.verified ? 'bg-green-500' : 'bg-amber-500'}`} />
                {user?.verified ? t('analytics.learners_tab.verified') : t('analytics.learners_tab.unverified')}
              </span>
            </Row>
            <Row label={t('analytics.learners_tab.joined')}>{formatDate(user?.joined ?? null)}</Row>
            <Row label={t('analytics.learners_tab.last_active')}>{formatDate(user?.last_active ?? null)}</Row>
          </div>

          {/* Course completion per course */}
          <div className="px-6 pb-6 space-y-2.5">
            <span className="text-xs text-gray-400 block">{t('analytics.learners_tab.courses')}</span>
            {isLoading && <span className="text-sm text-gray-400">{t('analytics.common.loading')}</span>}
            {!isLoading && courses.length === 0 && (
              <span className="text-sm text-gray-400">{t('analytics.learners_tab.no_course_enrollments')}</span>
            )}
            {courses.map((course) => (
              <div key={course.name} className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-700 truncate">{course.name}</span>
                <span className="text-sm text-gray-400 tabular-nums shrink-0">{course.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Learners — "what is this specific user doing?"
 * The table is the dashboard Users/Contributors table (search + pagination live
 * in the action row / footer); the row action opens a learner-details card using
 * the same pattern as the Users tab window.
 */
export function LearnersTab({ range = '30d', query = '' }: { range?: string; query?: string }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  // A new search always starts from the first page.
  useEffect(() => setPage(1), [query])

  const { data, isLoading } = useAnalyticsTab('learners', range, 'all', { q: query, page })
  const card = data?.cards?.learners_table
  const rows = card?.rows ?? []
  const total = card?.total ?? 0
  const pageSize = card?.pageSize ?? 50
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      {!isLoading && rows.length === 0 ? (
        <SectionCard bleed>
          <p className="py-10 text-center text-sm text-gray-400">{t('analytics.learners_tab.no_results')}</p>
        </SectionCard>
      ) : (
        <TabCard
          card={card}
          loading={isLoading}
          className="lg:col-span-12"
          actionsColumn={(row) => (
            <button
              type="button"
              onClick={() => setDetailUserId(row.id)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              title={t('analytics.learners_tab.view_details')}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        />
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between px-6 py-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="text-xs text-gray-500 font-medium">
            {t('analytics.learners_tab.showing', {
              from: (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, total),
              total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 font-medium min-w-[80px] text-center bg-white px-3 py-2 rounded-lg border border-gray-200">
              {t('analytics.learners_tab.page_of', { page, total: lastPage })}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {detailUserId != null && (
        <LearnerDetailDialog userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  )
}
