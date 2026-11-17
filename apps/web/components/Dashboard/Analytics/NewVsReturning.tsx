'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalyticsPipe } from './useAnalyticsDashboard'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useChartTheme } from '@components/Analytics/chartTheme'

export default function NewVsReturning({ days = '30' }: { days?: string }) {
  const { t } = useTranslation()
  const chart = useChartTheme()
  const { data, isLoading } = useAnalyticsPipe('new_vs_returning', { days })
  const rows = data?.data ?? []

  const chartRows = rows.map((r: any) => ({
    date: r.date?.slice(5),
    new_users: r.new_users,
    returning_users: r.returning_users,
  }))

  return (
    <div className="bg-white rounded-xl nice-shadow p-5 min-h-[300px] overflow-hidden min-w-0 dark:bg-dk-card">
      <h3 className="text-sm font-semibold text-gray-700 mb-1 dark:text-zinc-200">{t('analytics.advanced_widgets.new_vs_returning.title')}</h3>
      <p className="text-xs text-gray-400 mb-4">{t('analytics.advanced_widgets.new_vs_returning.description')}</p>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-gray-300">{t('analytics.common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-300">{t('analytics.common.no_data')}</div>
      ) : (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartRows} stackOffset="none">
              <defs>
                <linearGradient id="newUsersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={chart.primary} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="retUsersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.categorical[1]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={chart.categorical[1]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="new_users"
                name={t('analytics.advanced_widgets.new_vs_returning.new')}
                stroke={chart.primary}
                strokeWidth={2}
                fill="url(#newUsersGrad)"
                stackId="1"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="returning_users"
                name={t('analytics.advanced_widgets.new_vs_returning.returning')}
                stroke={chart.categorical[1]}
                strokeWidth={2}
                fill="url(#retUsersGrad)"
                stackId="1"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
