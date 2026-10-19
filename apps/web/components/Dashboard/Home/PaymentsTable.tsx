'use client'
import React from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import {
  PaymentStatusDot,
  mapOrderStatus,
  type PaymentStatus,
} from '@components/Dashboard/Pages/Payments/PaymentStatus'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getOrgOrders } from '@services/payments/orders'

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

function toPaymentRow(order: any): PaymentRow {
  const name =
    [order.user?.first_name, order.user?.last_name].filter(Boolean).join(' ') ||
    order.user?.username ||
    order.customer_name ||
    '—'

  return {
    id: order.order_uuid,
    user: { name, email: order.user?.email || order.customer_email || '' },
    course: order.resource_name || order.resource_uuid || '—',
    amount: Number(order.amount) || 0,
    currency: order.currency || 'DZD',
    status: mapOrderStatus(order.status),
    date: order.paid_at || order.creation_date || '',
  }
}

function formatDay(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/**
 * Recent payments — live orders from `GET /payments/{org_id}/orders`.
 * Pass `rows` to render a fixed list; otherwise the component fetches itself.
 * Filtering by status belongs to the Payments tab, not the home.
 */
export default function PaymentsTable({
  rows,
  title,
  limit = 10,
}: {
  rows?: PaymentRow[]
  title?: string
  limit?: number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const { data, isLoading } = useSWR(
    rows === undefined && org?.id && access_token
      ? ['/payments/recent', org.id, access_token, limit]
      : null,
    () => getOrgOrders(org.id, { page: 1, limit }, access_token),
    { revalidateOnFocus: false }
  )

  const source: PaymentRow[] = rows ?? (data?.items || []).map(toPaymentRow)
  const visible = source.slice(0, limit)

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
          {row.date ? formatDay(row.date, locale) : '—'}
        </span>
      ),
    },
  ]

  return (
    <SectionCard title={title ?? t('dashboard.home.payments.title')} bleed>
      {isLoading && !data ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          {t('common.loading')}
        </div>
      ) : visible.length ? (
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
