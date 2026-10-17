'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'
import { DateRangeFilter } from '@components/Analytics/Filters'
import { TabCard } from '@components/Analytics/TabCard'
import PaymentsTable from '@components/Dashboard/Home/PaymentsTable'
import type { AnalyticsCard } from '@services/analytics/tabs'

/**
 * UI-only revenue series. The payments backend does not exist in this build.
 * When it lands, replace `REVENUE_CARD.data` with the `payment_orders` buckets.
 */
const REVENUE_DATA = [
  { label: 'Oct 01', revenue: 4200 },
  { label: 'Oct 02', revenue: 6800 },
  { label: 'Oct 03', revenue: 5100 },
  { label: 'Oct 04', revenue: 9200 },
  { label: 'Oct 05', revenue: 7400 },
  { label: 'Oct 06', revenue: 11200 },
  { label: 'Oct 07', revenue: 8600 },
  { label: 'Oct 08', revenue: 12900 },
  { label: 'Oct 09', revenue: 10100 },
  { label: 'Oct 10', revenue: 14600 },
  { label: 'Oct 11', revenue: 11800 },
  { label: 'Oct 12', revenue: 15200 },
]

const REVENUE_CARD: AnalyticsCard = {
  title: 'Revenue',
  kind: 'trend',
  format: 'number',
  heading: '128,500 DZD',
  xKey: 'label',
  series: [{ key: 'revenue', name: 'Revenue' }],
  data: REVENUE_DATA,
}

export default function PaymentsOverviewPage() {
  const { t } = useTranslation()
  const org = useOrg() as any
  const [range, setRange] = useState('30d')

  const card: AnalyticsCard = {
    ...REVENUE_CARD,
    title: t('dashboard.payments.overview.revenue_title'),
    series: [{ key: 'revenue', name: t('dashboard.payments.overview.revenue_series') }],
  }

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
      <TabCard card={card} chartHeight={300} />

      {/* Recent payments */}
      <PaymentsTable
        title={t('dashboard.payments.overview.recent_payments')}
        limit={10}
      />
    </div>
  )
}
