'use client'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { DateRangeFilter } from '@components/Analytics/Filters'
import { Input } from '@components/ui/input'
import { PaymentStatusDot, type PaymentStatus } from './PaymentStatus'

/** UI-only sample data — the payout ledger does not exist in this build. */
const MONTHS = [
  { value: '2026-08', label: 'Aug 2026' },
  { value: '2026-09', label: 'Sep 2026' },
  { value: '2026-10', label: 'Oct 2026' },
]

const TEACHER_GROSS = [
  { name: 'Yacine Belkacem', courses: 2, gross: 480000, status: 'paid' as PaymentStatus },
  { name: 'Sara Mansouri', courses: 1, gross: 360000, status: 'pending' as PaymentStatus },
  { name: 'Amine Khelifi', courses: 2, gross: 240000, status: 'pending' as PaymentStatus },
  { name: 'Nadia Bouzid', courses: 1, gross: 120000, status: 'paid' as PaymentStatus },
]

const GROSS_REVENUE = TEACHER_GROSS.reduce((sum, teacher) => sum + teacher.gross, 0)
const TEACHER_SHARE = 0.4

export default function PaymentsPayoutsPage() {
  const { t } = useTranslation()
  const [month, setMonth] = useState('2026-10')
  const [costs, setCosts] = useState({
    hosting: 100000,
    marketing: 150000,
    fees: 30000,
    other: 20000,
  })

  const totalCosts = costs.hosting + costs.marketing + costs.fees + costs.other
  const netProfit = Math.max(0, GROSS_REVENUE - totalCosts)
  const teacherPool = Math.round(netProfit * TEACHER_SHARE)
  const platformPool = netProfit - teacherPool

  const rows = useMemo(
    () =>
      TEACHER_GROSS.map((teacher) => {
        const share = teacher.gross / GROSS_REVENUE
        return {
          ...teacher,
          share,
          payout: Math.round(teacherPool * share),
        }
      }),
    [teacherPool]
  )

  const money = (value: number) => `${value.toLocaleString('en-US')} DZD`

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'name',
      header: t('dashboard.payments.payouts.teacher'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
          <p className="text-[11px] text-gray-400">
            {t('dashboard.payments.payouts.course_count', { count: row.courses })}
          </p>
        </div>
      ),
    },
    {
      key: 'gross',
      header: t('dashboard.payments.payouts.gross'),
      align: 'right',
      width: '160px',
      sortable: true,
      value: (row) => row.gross,
      render: (row) => <span className="tabular-nums text-gray-700">{money(row.gross)}</span>,
    },
    {
      key: 'share',
      header: t('dashboard.payments.payouts.share'),
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="tabular-nums text-gray-500">{Math.round(row.share * 100)}%</span>
      ),
    },
    {
      key: 'payout',
      header: t('dashboard.payments.payouts.payout'),
      align: 'right',
      width: '160px',
      sortable: true,
      value: (row) => row.payout,
      render: (row) => (
        <span className="tabular-nums font-semibold text-gray-900">{money(row.payout)}</span>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.payments.payouts.status'),
      width: '120px',
      render: (row) => (
        <PaymentStatusDot
          status={row.status}
          label={t(`dashboard.payments.payouts.${row.status}`)}
        />
      ),
    },
  ]

  const costField = (key: keyof typeof costs) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <label className="text-sm text-gray-600">{t(`dashboard.payments.payouts.costs.${key}`)}</label>
      <div className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          value={costs[key]}
          onChange={(e) => {
            const value = Number(e.target.value.replace(/[^\d]/g, ''))
            setCosts((prev) => ({ ...prev, [key]: Number.isNaN(value) ? 0 : value }))
          }}
          className="w-32 text-end tabular-nums"
        />
        <span className="text-xs text-gray-400 w-8">DZD</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        <DateRangeFilter value={month} onChange={setMonth} options={MONTHS.map((m) => m.value)} labels={Object.fromEntries(MONTHS.map((m) => [m.value, m.label]))} />
        <span className="text-xs text-gray-500">
          {t('dashboard.payments.payouts.minimum', { amount: '2,000 DZD' })}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Monthly costs */}
        <div className="col-span-12 lg:col-span-7">
          <SectionCard
            title={t('dashboard.payments.payouts.monthly_costs')}
            right={<span className="text-xs text-gray-400">{MONTHS.find((m) => m.value === month)?.label}</span>}
          >
            <div className="divide-y divide-gray-100">
              {costField('hosting')}
              {costField('marketing')}
              {costField('fees')}
              {costField('other')}
            </div>
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">
                {t('dashboard.payments.payouts.total_costs')}
              </span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">{money(totalCosts)}</span>
            </div>
          </SectionCard>
        </div>

        {/* Profit split */}
        <div className="col-span-12 lg:col-span-5">
          <SectionCard title={t('dashboard.payments.payouts.profit_split')}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('dashboard.payments.payouts.gross_revenue')}</span>
                <span className="tabular-nums text-gray-900">{money(GROSS_REVENUE)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('dashboard.payments.payouts.costs_label')}</span>
                <span className="tabular-nums text-gray-900">−{money(totalCosts)}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                <span className="font-medium text-gray-700">{t('dashboard.payments.payouts.net_profit')}</span>
                <span className="tabular-nums font-semibold text-gray-900">{money(netProfit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-gray-500">{t('dashboard.payments.payouts.teacher_pool')}</span>
                <span className="tabular-nums font-semibold text-green-600">{money(teacherPool)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('dashboard.payments.payouts.platform_pool')}</span>
                <span className="tabular-nums text-gray-900">{money(platformPool)}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title={t('dashboard.payments.payouts.teacher_payouts')} bleed>
        <DataTable columns={columns} rows={rows} />
      </SectionCard>
    </div>
  )
}
