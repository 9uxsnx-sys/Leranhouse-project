'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'
import { SearchInput, FilterSelect } from '@components/Analytics/Filters'
import { PaymentStatusDot, mapOrderStatus, type PaymentStatus } from './PaymentStatus'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getOrgOrders } from '@services/payments/orders'

interface TransactionRow {
  id: string
  user: { name: string; email: string }
  resource: string
  method: string
  amount: number
  currency: string
  status: PaymentStatus
  statusLabel: string
  date: string
}

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

function methodLabel(method: string | null | undefined) {
  if (method === 'edahabia') return 'EDAHABIA'
  if (method === 'cib') return 'CIB'
  if (method === 'chargily_app') return 'Chargily'
  return '—'
}

/** Maps backend order statuses onto the shared four-colour status square. */
function statusMeta(raw: string, t: any): { status: PaymentStatus; label: string } {
  const status = mapOrderStatus(raw)
  switch (raw) {
    case 'paid':
      return { status, label: t('dashboard.payments.transactions.paid') }
    case 'failed':
      return { status, label: t('dashboard.payments.transactions.failed') }
    case 'canceled':
      return { status, label: t('dashboard.payments.transactions.canceled', 'Canceled') }
    case 'expired':
      return { status, label: t('dashboard.payments.transactions.expired', 'Expired') }
    case 'refunded':
    case 'partially_refunded':
      return { status, label: t('dashboard.payments.transactions.refunded') }
    case 'processing':
      return { status, label: t('dashboard.payments.transactions.processing', 'Processing') }
    default:
      return { status, label: t('dashboard.payments.transactions.pending') }
  }
}

export default function PaymentsTransactionsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const swrKey =
    org?.id && access_token
      ? ['/payments/orders', org.id, access_token, debouncedQuery, status]
      : null

  const { data, error, isLoading } = useSWR(
    swrKey,
    () =>
      getOrgOrders(
        org.id,
        {
          search: debouncedQuery,
          status: status === 'all' ? '' : status,
          limit: 10000,
        },
        access_token
      ),
    { revalidateOnFocus: false }
  )

  const rows: TransactionRow[] = useMemo(() => {
    return (data?.items || []).map((order: any) => {
      const name =
        [order.user?.first_name, order.user?.last_name].filter(Boolean).join(' ') ||
        order.user?.username ||
        order.customer_name ||
        '—'
      const meta = statusMeta(order.status, t)

      return {
        id: order.order_uuid,
        user: { name, email: order.user?.email || order.customer_email || '' },
        resource: order.resource_name || order.resource_uuid || '—',
        method: methodLabel(order.payment_method),
        amount: Number(order.amount) || 0,
        currency: order.currency || 'DZD',
        status: meta.status,
        statusLabel: meta.label,
        date: order.paid_at || order.creation_date || '',
      }
    })
  }, [data, t])

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
      key: 'resource',
      header: t('dashboard.payments.transactions.resource', 'Resource'),
      render: (row) => <span className="text-gray-700 truncate">{row.resource}</span>,
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
      render: (row) => <PaymentStatusDot status={row.status} label={row.statusLabel} />,
    },
    {
      key: 'date',
      header: t('dashboard.payments.transactions.date'),
      align: 'right',
      width: '140px',
      render: (row) => (
        <span className="text-[13px] text-gray-400 whitespace-nowrap">
          {row.date ? formatDate(row.date, locale) : '—'}
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
            { value: 'processing', label: t('dashboard.payments.transactions.processing', 'Processing') },
            { value: 'failed', label: t('dashboard.payments.transactions.failed') },
            { value: 'canceled', label: t('dashboard.payments.transactions.canceled', 'Canceled') },
            { value: 'refunded', label: t('dashboard.payments.transactions.refunded') },
          ]}
        />
      </div>

      {error ? (
        <SectionCard>
          <p className="text-sm text-red-600">
            {t('dashboard.payments.transactions.error_loading', 'Could not load transactions.')}
          </p>
        </SectionCard>
      ) : (
        <SectionCard bleed>
          {isLoading && !data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              {t('common.loading')}
            </div>
          ) : rows.length ? (
            <DataTable columns={columns} rows={rows} />
          ) : (
            <EmptyState
              title={t('dashboard.payments.transactions.empty_title')}
              description={t('dashboard.payments.transactions.empty_description')}
              className="pb-10"
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}
