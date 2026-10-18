'use client'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { SearchInput, FilterSelect } from '@components/Analytics/Filters'
import { PaymentStatusDot, type PaymentStatus } from './PaymentStatus'

type PaymentMethod = 'EDAHABIA' | 'CIB'

interface TransactionRow {
  id: string
  user: { name: string; email: string }
  course: string
  method: PaymentMethod
  amount: number
  currency: string
  status: PaymentStatus
  date: string
}

/**
 * UI-only sample rows — the payments backend does not exist in this build.
 * When it lands, feed this table from `GET /payments/org/{org_id}/orders`.
 */
const SAMPLE_ROWS: TransactionRow[] = [
  { id: 'ORD-1042', user: { name: 'Yacine Belkacem', email: 'yacine.b@example.dz' }, course: 'Algebra Basics', method: 'CIB', amount: 1500, currency: 'DZD', status: 'paid', date: '2026-10-12T10:42:00Z' },
  { id: 'ORD-1041', user: { name: 'Sara Mansouri', email: 'sara.m@example.dz' }, course: 'Design 101', method: 'EDAHABIA', amount: 2000, currency: 'DZD', status: 'failed', date: '2026-10-12T09:18:00Z' },
  { id: 'ORD-1040', user: { name: 'Amine Khelifi', email: 'amine.k@example.dz' }, course: 'Algebra Basics', method: 'CIB', amount: 1500, currency: 'DZD', status: 'paid', date: '2026-10-11T18:05:00Z' },
  { id: 'ORD-1039', user: { name: 'Nadia Bouzid', email: 'nadia.b@example.dz' }, course: 'Python for Beginners', method: 'EDAHABIA', amount: 2500, currency: 'DZD', status: 'pending', date: '2026-10-11T16:30:00Z' },
  { id: 'ORD-1038', user: { name: 'Karim Haddad', email: 'karim.h@example.dz' }, course: 'Design 101', method: 'CIB', amount: 2000, currency: 'DZD', status: 'paid', date: '2026-10-11T14:12:00Z' },
  { id: 'ORD-1037', user: { name: 'Lina Ait Ali', email: 'lina.a@example.dz' }, course: 'Marketing Fundamentals', method: 'EDAHABIA', amount: 1800, currency: 'DZD', status: 'failed', date: '2026-10-10T20:44:00Z' },
  { id: 'ORD-1036', user: { name: 'Omar Cherif', email: 'omar.c@example.dz' }, course: 'Python for Beginners', method: 'CIB', amount: 2500, currency: 'DZD', status: 'paid', date: '2026-10-10T11:02:00Z' },
  { id: 'ORD-1035', user: { name: 'Meriem Saadi', email: 'meriem.s@example.dz' }, course: 'Algebra Basics', method: 'EDAHABIA', amount: 1500, currency: 'DZD', status: 'refunded', date: '2026-10-09T17:26:00Z' },
  { id: 'ORD-1034', user: { name: 'Bilal Zerrouki', email: 'bilal.z@example.dz' }, course: 'Marketing Fundamentals', method: 'CIB', amount: 1800, currency: 'DZD', status: 'paid', date: '2026-10-09T09:50:00Z' },
  { id: 'ORD-1033', user: { name: 'Imane Rahmani', email: 'imane.r@example.dz' }, course: 'Design 101', method: 'EDAHABIA', amount: 2000, currency: 'DZD', status: 'pending', date: '2026-10-08T15:33:00Z' },
  { id: 'ORD-1032', user: { name: 'Sofiane Benaissa', email: 'sofiane.b@example.dz' }, course: 'Python for Beginners', method: 'CIB', amount: 2500, currency: 'DZD', status: 'paid', date: '2026-10-08T11:15:00Z' },
  { id: 'ORD-1031', user: { name: 'Amina Larbi', email: 'amina.l@example.dz' }, course: 'Algebra Basics', method: 'EDAHABIA', amount: 1500, currency: 'DZD', status: 'failed', date: '2026-10-07T19:41:00Z' },
  { id: 'ORD-1030', user: { name: 'Riad Meziane', email: 'riad.m@example.dz' }, course: 'Design 101', method: 'CIB', amount: 2000, currency: 'DZD', status: 'paid', date: '2026-10-07T13:07:00Z' },
  { id: 'ORD-1029', user: { name: 'Hiba Cherifi', email: 'hiba.c@example.dz' }, course: 'Marketing Fundamentals', method: 'EDAHABIA', amount: 1800, currency: 'DZD', status: 'refunded', date: '2026-10-06T10:24:00Z' },
]

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PaymentsTransactionsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SAMPLE_ROWS.filter((row) => {
      const matchesStatus = status === 'all' || row.status === status
      const matchesQuery =
        !q ||
        row.user.name.toLowerCase().includes(q) ||
        row.user.email.toLowerCase().includes(q) ||
        row.course.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [query, status])

  const columns: Column<TransactionRow>[] = [
    {
      key: 'user',
      header: t('dashboard.payments.transactions.learner'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{row.user.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: t('dashboard.payments.transactions.course'),
      render: (row) => <span className="text-gray-700 truncate">{row.course}</span>,
    },
    {
      key: 'method',
      header: t('dashboard.payments.transactions.method'),
      width: '120px',
      render: (row) => <span className="text-gray-600">{row.method}</span>,
    },
    {
      key: 'amount',
      header: t('dashboard.payments.transactions.amount'),
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
      header: t('dashboard.payments.transactions.status'),
      width: '120px',
      render: (row) => (
        <PaymentStatusDot
          status={row.status}
          label={t(`dashboard.payments.transactions.${row.status}`)}
        />
      ),
    },
    {
      key: 'date',
      header: t('dashboard.payments.transactions.date'),
      align: 'right',
      width: '140px',
      sortable: true,
      value: (row) => row.date,
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {formatDate(row.date, locale)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('dashboard.payments.transactions.search_placeholder')}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('dashboard.payments.transactions.all_statuses') },
            { value: 'paid', label: t('dashboard.payments.transactions.paid') },
            { value: 'pending', label: t('dashboard.payments.transactions.pending') },
            { value: 'failed', label: t('dashboard.payments.transactions.failed') },
            { value: 'refunded', label: t('dashboard.payments.transactions.refunded') },
          ]}
        />
      </div>

      <SectionCard bleed>
        {rows.length ? (
          <DataTable columns={columns} rows={rows} />
        ) : (
          <EmptyState
            title={t('dashboard.payments.transactions.empty_title')}
            description={t('dashboard.payments.transactions.empty_description')}
            className="pb-10"
          />
        )}
      </SectionCard>
    </div>
  )
}
