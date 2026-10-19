'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getUriWithOrg } from '@services/config/config'
import { DateRangeFilter } from '@components/Analytics/Filters'
import { TabCard } from '@components/Analytics/TabCard'
import { ChartCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import PaymentsTable from '@components/Dashboard/Home/PaymentsTable'
import { getPaymentsOverview } from '@services/payments/overview'
import type { AnalyticsCard } from '@services/analytics/tabs'

export default function PaymentsOverviewPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const [range, setRange] = useState('30d')

  const { data } = useSWR(
    org?.id && access_token ? ['/payments/overview', org.id, access_token, range] : null,
    () => getPaymentsOverview(org.id, range, access_token),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const card: AnalyticsCard | undefined = data
    ? {
        title: t('dashboard.payments.overview.revenue_title'),
        kind: 'trend',
        format: 'number',
        heading: `${Number(data.revenue || 0).toLocaleString(locale)} ${data.currency || 'DZD'}`,
        xKey: 'label',
        series: [{ key: 'revenue', name: t('dashboard.payments.overview.revenue_series') }],
        data: data.series || [],
      }
    : undefined

  return (
    <div className="space-y-6">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        <DateRangeFilter
          value={range}
          onChange={setRange}
          labels={{
            '7d': t('dashboard.home.range.7d'),
            '30d': t('dashboard.home.range.30d'),
            '90d': t('dashboard.home.range.90d'),
            '12m': t('dashboard.home.range.12m'),
          }}
        />
        <Link
          href={getUriWithOrg(org?.slug ?? '', '/store')}
          target="_blank"
          className="flex items-center gap-2 px-3 h-7 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag size={13} />
          <span>{t('dashboard.payments.overview.preview_shop')}</span>
          <ExternalLink size={11} className="text-gray-400" />
        </Link>
      </div>

      {/* Revenue hero */}
      {data && Number(data.revenue) === 0 ? (
        <ChartCard
          title={t('dashboard.payments.overview.revenue_title')}
          height={300}
        >
          <EmptyState
            className="h-full"
            title={t(
              'dashboard.payments.overview.no_revenue_title',
              'No revenue yet'
            )}
            description={t(
              'dashboard.payments.overview.no_revenue_description',
              'Paid orders in the selected range will appear here.'
            )}
          />
        </ChartCard>
      ) : (
        <TabCard card={card} chartHeight={300} />
      )}

      {/* Recent payments */}
      <PaymentsTable title={t('dashboard.payments.overview.recent_payments')} limit={10} />
    </div>
  )
}
