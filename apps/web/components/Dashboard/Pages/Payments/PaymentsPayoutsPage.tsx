'use client'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { DateRangeFilter } from '@components/Analytics/Filters'
import { EmptyState } from '@components/Analytics/Feedback'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getPayoutReport, updatePayoutCosts } from '@services/payments/payouts'

type CostKey = 'hosting' | 'marketing' | 'other'

type TeacherRow = {
  user_id: number
  name: string
  email: string
  courses: number
  gross: number
  share: number
  payout: number
}

const EMPTY_COSTS: Record<CostKey, number> = {
  hosting: 0,
  marketing: 0,
  other: 0,
}

export default function PaymentsPayoutsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en'
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const months = useMemo(() => {
    const now = new Date()
    const options: { value: string; label: string }[] = []
    for (let index = 0; index < 12; index += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({
        value,
        label: date.toLocaleDateString(locale, {
          month: 'short',
          year: 'numeric',
        }),
      })
    }
    return options
  }, [locale])

  const [month, setMonth] = useState(months[0]?.value || '')
  const [costs, setCosts] = useState<Record<CostKey, number>>(EMPTY_COSTS)
  const [saving, setSaving] = useState(false)

  const { data, error, mutate } = useSWR(
    org?.id && access_token && month
      ? ['/payments/payouts', org.id, month, access_token]
      : null,
    () => getPayoutReport(org.id, month, access_token),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  useEffect(() => {
    if (!data?.manual_costs) return
    setCosts({
      hosting: Number(data.manual_costs.hosting || 0),
      marketing: Number(data.manual_costs.marketing || 0),
      other: Number(data.manual_costs.other || 0),
    })
  }, [data?.manual_costs, month])

  const savedCosts = data?.manual_costs || EMPTY_COSTS
  const dirty =
    costs.hosting !== Number(savedCosts.hosting || 0) ||
    costs.marketing !== Number(savedCosts.marketing || 0) ||
    costs.other !== Number(savedCosts.other || 0)

  const currency = data?.currency || 'DZD'
  const grossRevenue = Number(data?.gross_revenue || 0)
  const gatewayFees = Number(data?.gateway_fees || 0)
  const operatingCosts = costs.hosting + costs.marketing + costs.other
  const totalCosts = operatingCosts + gatewayFees
  const netProfit = Math.max(0, grossRevenue - totalCosts)
  const teacherShare = Number(data?.teacher_share_percent || 40) / 100
  const teacherPool = Math.round(netProfit * teacherShare)
  const platformPool = netProfit - teacherPool
  const unattributed = Number(data?.unattributed_revenue || 0)

  const money = (value: number) => `${value.toLocaleString(locale)} ${currency}`

  const rows: TeacherRow[] = useMemo(
    () =>
      (data?.teachers || [])
        .map((teacher: any) => ({
          ...teacher,
          payout: Math.round(teacherPool * Number(teacher.share || 0)),
        }))
        .sort((a: TeacherRow, b: TeacherRow) => b.payout - a.payout),
    [data?.teachers, teacherPool]
  )

  const columns: Column<TeacherRow>[] = [
    {
      key: 'name',
      header: t('dashboard.payments.payouts.teacher'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
          <p className="text-[11px] text-gray-400 truncate">
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
      render: (row) => (
        <span className="tabular-nums text-gray-700">{money(row.gross)}</span>
      ),
    },
    {
      key: 'share',
      header: t('dashboard.payments.payouts.share'),
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="tabular-nums text-gray-500">
          {Math.round(row.share * 100)}%
        </span>
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
        <span className="tabular-nums font-semibold text-gray-900">
          {money(row.payout)}
        </span>
      ),
    },
  ]

  const costField = (key: CostKey) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <label className="text-sm text-gray-600">
        {t(`dashboard.payments.payouts.costs.${key}`)}
      </label>
      <div className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          value={costs[key]}
          onChange={(event) => {
            const value = Number(event.target.value.replace(/[^\d]/g, ''))
            setCosts((prev) => ({
              ...prev,
              [key]: Number.isNaN(value) ? 0 : value,
            }))
          }}
          className="w-32 text-end tabular-nums"
        />
        <span className="text-xs text-gray-400 w-8">{currency}</span>
      </div>
    </div>
  )

  const handleSave = async () => {
    if (!org?.id || !access_token || saving) return
    setSaving(true)
    try {
      await updatePayoutCosts(
        org.id,
        { month, ...costs },
        access_token
      )
      await mutate()
      toast.success(t('dashboard.courses.save.saved'))
    } catch (err: any) {
      toast.error(
        err?.detail || err?.message || t('dashboard.payments.payouts.save_error')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        <DateRangeFilter
          value={month}
          onChange={setMonth}
          options={months.map((option) => option.value)}
          labels={Object.fromEntries(
            months.map((option) => [option.value, option.label])
          )}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {t('dashboard.payments.payouts.paid_orders', {
              count: Number(data?.order_count || 0),
            })}
          </span>
          <span className="text-xs text-gray-500">
            {t('dashboard.payments.payouts.minimum', { amount: '2,000 DZD' })}
          </span>
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {t('dashboard.courses.save.save')}
          </Button>
        </div>
      </div>

      {!data ? (
        <div className="py-24 flex justify-center">
          {error ? (
            <EmptyState
              title={t('dashboard.payments.payouts.load_error')}
              description={t('dashboard.payments.payouts.load_error_description')}
            />
          ) : (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-12 gap-6">
            {/* Monthly costs */}
            <div className="col-span-12 lg:col-span-7">
              <SectionCard
                title={t('dashboard.payments.payouts.monthly_costs')}
                right={
                  <span className="text-xs text-gray-400">
                    {months.find((option) => option.value === month)?.label}
                  </span>
                }
              >
                <div className="divide-y divide-gray-100">
                  {costField('hosting')}
                  {costField('marketing')}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('dashboard.payments.payouts.costs.fees')}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {t('dashboard.payments.payouts.fees_auto')}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-gray-700">
                      {money(gatewayFees)}
                    </span>
                  </div>
                  {costField('other')}
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700">
                    {t('dashboard.payments.payouts.total_costs')}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {money(totalCosts)}
                  </span>
                </div>
              </SectionCard>
            </div>

            {/* Profit split */}
            <div className="col-span-12 lg:col-span-5">
              <SectionCard title={t('dashboard.payments.payouts.profit_split')}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {t('dashboard.payments.payouts.gross_revenue')}
                    </span>
                    <span className="tabular-nums text-gray-900">
                      {money(grossRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {t('dashboard.payments.payouts.costs_label')}
                    </span>
                    <span className="tabular-nums text-gray-900">
                      −{money(totalCosts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                    <span className="font-medium text-gray-700">
                      {t('dashboard.payments.payouts.net_profit')}
                    </span>
                    <span className="tabular-nums font-semibold text-gray-900">
                      {money(netProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-gray-500">
                      {t('dashboard.payments.payouts.teacher_pool')}
                    </span>
                    <span className="tabular-nums font-semibold text-green-600">
                      {money(teacherPool)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {t('dashboard.payments.payouts.platform_pool')}
                    </span>
                    <span className="tabular-nums text-gray-900">
                      {money(platformPool)}
                    </span>
                  </div>
                  {unattributed > 0 && (
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="text-gray-500">
                        {t('dashboard.payments.payouts.unattributed')}
                      </span>
                      <span className="tabular-nums text-gray-500">
                        {money(unattributed)}
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title={t('dashboard.payments.payouts.teacher_payouts')}
            bleed
          >
            {rows.length === 0 ? (
              <EmptyState
                title={t('dashboard.payments.payouts.no_orders_title')}
                description={t(
                  'dashboard.payments.payouts.no_orders_description'
                )}
              />
            ) : (
              <DataTable columns={columns} rows={rows} />
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
