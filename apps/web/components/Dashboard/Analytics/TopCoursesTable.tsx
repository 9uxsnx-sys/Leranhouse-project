'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalyticsPipe } from './useAnalyticsDashboard'

export default function TopCoursesTable({ days = '30' }: { days?: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useAnalyticsPipe('top_courses', { days })
  const rows = data?.data ?? []

  return (
    <div className="bg-white rounded-xl nice-shadow p-5 overflow-hidden min-w-0 dark:bg-dk-card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 dark:text-zinc-200">{t('analytics.overview.top_courses')}</h3>
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-300">{t('analytics.common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-300">{t('analytics.common.no_data')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-dk-line">
                <th className="pb-2">{t('analytics.common.course')}</th>
                <th className="pb-2 text-end">{t('analytics.common.views')}</th>
                <th className="pb-2 text-end">{t('analytics.common.enrollments')}</th>
                <th className="pb-2 text-end">{t('analytics.common.completions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-700 truncate max-w-[200px] dark:text-zinc-200">
                    {row.course_name || row.course_uuid}
                  </td>
                  <td className="py-2 text-end text-gray-500">{row.views}</td>
                  <td className="py-2 text-end text-gray-500">{row.enrollments}</td>
                  <td className="py-2 text-end text-gray-500">{row.completions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
