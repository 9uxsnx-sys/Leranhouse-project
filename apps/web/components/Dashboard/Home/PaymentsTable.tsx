'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { PaymentStatusDot, type PaymentStatus } from '@components/Dashboard/Pages/Payments/PaymentStatus'

export type { PaymentStatus }

export interface PaymentRow {
  id: string
  user: { name: string; email: string }
  course: string
  amount: number
  currency: string
  status: PaymentStatus
  date: string
}

/**
 * UI-only sample rows. The payments backend does not exist in this build.
 * When it lands, drop the constant and pass the API result as `rows`:
 *   GET /payments/org/{org_id}/orders?limit=10
 */
const SAMPLE_ROWS: PaymentRow[] = [
  { id: '1', user: { name: 'Yacine Belkacem', email: 'yacine.b@example.dz' }, course: 'Algebra Basics', amount: 1500, currency: 'DZD', status: 'paid', date: '2026-10-12T10:42:00Z' },
  { id: '2', user: { name: 'Sara Mansouri', email: 'sara.m@example.dz' }, course: 'Design 101', amount: 2000, currency: 'DZD', status: 'failed', date: '2026-10-12T09:18:00Z' },
  { id: '3', user: { name: 'Amine Khelifi', email: 'amine.k@example.dz' }, course: 'Algebra Basics', amount: 1500, currency: 'DZD', status: 'paid', date: '2026-10-11T18:05:00Z' },
  { id: '4', user: { name: 'Nadia Bouzid', email: 'nadia.b@example.dz' }, course: 'Python for Beginners', amount: 2500, currency: 'DZD', status: 'pending', date: '2026-10-11T16:30:00Z' },
  { id: '5', user: { name: 'Karim Haddad', email: 'karim.h@example.dz' }, course: 'Design 101', amount: 2000, currency: 'DZD', status: 'paid', date: '2026-10-11T14:12:00Z' },
  { id: '6', user: { name: 'Lina Ait Ali', email: 'lina.a@example.dz' }, course: 'Marketing Fundamentals', amount: 1800, currency: 'DZD', status: 'failed', date: '2026-10-10T20:44:00Z' },
  { id: '7', user: { name: 'Omar Cherif', email: 'omar.c@example.dz' }, course: 'Python for Beginners', amount: 2500, currency: 'DZD', status: 'paid', date: '2026-10-10T11:02:00Z' },
  { id: '8', user: { name: 'Meriem Saadi', email: 'meriem.s@example.dz' }, course: 'Algebra Basics', amount: 1500, currency: 'DZD', status: 'refunded', date: '2026-10-09T17:26:00Z' },
  { id: '9', user: { name: 'Bilal Zerrouki', email: 'bilal.z@example.dz' }, course: 'Marketing Fundamentals', amount: 1800, currency: 'DZD', status: 'paid', date: '2026-10-09T09:50:00Z' },
  { id: '10', user: { name: 'Imane Rahmani', email: 'imane.r@example.dz' }, course: 'Design 101', amount: 2000, currency: 'DZD', status: 'pending', date: '2026-10-08T15:33:00Z' },
]

function formatDay(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/**
 * Recent payments — UI only. Clean cells, no pills or badges.
 * Filtering by status belongs to the Payments tab, not the home.
 */
export default function PaymentsTable({
  rows = SAMPLE_ROWS,
  title,
  limit = 10,
}: {
  rows?: PaymentRow[]
  title?: string
  limit?: number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'

  const visible = rows.slice(0, limit)

  const columns: Column<PaymentRow>[] = [
    {
      key: 'user',
      header: t('dashboard.home.payments.learner'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{row.user.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: t('dashboard.home.payments.course'),
      render: (row) => <span className="text-gray-700 truncate">{row.course}</span>,
    },
    {
      key: 'amount',
      header: t('dashboard.home.payments.amount'),
      align: 'right',
      width: '140px',
      sortable: true,
      value: (row) => row.amount,
      render: (row) => (
        <span className="tabular-nums text-gray-900">
          {row.amount.toLocaleString(locale)}{' '}
          <span className="text-gray-400">{row.currency}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.home.payments.status'),
      width: '110px',
      render: (row) => (
        <PaymentStatusDot status={row.status} label={t(`dashboard.home.payments.${row.status}`)} />
      ),
    },
    {
      key: 'date',
      header: t('dashboard.home.payments.date'),
      align: 'right',
      width: '120px',
      sortable: true,
      value: (row) => row.date,
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDay(row.date, locale)}
        </span>
      ),
    },
  ]

  return (
    <SectionCard title={title ?? t('dashboard.home.payments.title')} bleed>
      {visible.length ? (
        <DataTable columns={columns} rows={visible} />
      ) : (
        <EmptyState
          title={t('dashboard.home.payments.empty_title')}
          description={t('dashboard.home.payments.empty_description')}
          className="pb-10"
        />
      )}
    </SectionCard>
  )
}
