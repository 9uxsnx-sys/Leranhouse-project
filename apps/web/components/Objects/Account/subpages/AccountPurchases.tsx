'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'
import { getUserEnrollments, getBillingPortalSession } from '@services/payments/offers'
import {
  ShoppingBag, RefreshCcw, SquareCheck, ArrowRight,
  ExternalLink, Loader2, CalendarDays, BadgeCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface AccountPurchasesProps {
  orgId: number
  orgslug: string
}

function EnrollmentCard({ enrollment, orgslug, onManageBilling, billingLoading }: {
  enrollment: any
  orgslug: string
  onManageBilling: () => void
  billingLoading: boolean
}) {
  const { t, i18n } = useTranslation()
  const isSubscription = enrollment.offer_type === 'subscription'
  const isActive = enrollment.status === 'active'

  const formattedPrice = enrollment.amount != null
    ? new Intl.NumberFormat(i18n.language || 'en', {
        style: 'currency',
        currency: enrollment.currency ?? 'USD',
      }).format(enrollment.amount)
    : null

  const formattedDate = enrollment.creation_date
    ? new Intl.DateTimeFormat(i18n.language || 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(
        new Date(enrollment.creation_date)
      )
    : null

  return (
    <div className="bg-white rounded-xl nice-shadow overflow-hidden">
      {/* Type stripe */}
      <div className={`px-4 py-2 flex items-center justify-between ${isSubscription ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isSubscription ? 'text-indigo-700' : 'text-gray-600'}`}>
          {isSubscription ? <RefreshCcw size={11} /> : <SquareCheck size={11} />}
          {isSubscription ? t('account.subscription') : t('account.one_time_purchase')}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <BadgeCheck size={11} />
          {isActive ? t('account.active') : enrollment.status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Offer name + price */}
        <div className="flex items-start justify-between gap-3">
          <p className="font-bold text-gray-900 leading-snug">{enrollment.offer_name}</p>
          {formattedPrice && (
            <div className="shrink-0 text-end">
              <p className={`font-black text-lg ${isSubscription ? 'text-indigo-700' : 'text-gray-900'}`}>
                {formattedPrice}
              </p>
              {isSubscription && (
                <p className="text-xs text-indigo-400 leading-none">{t('account.recurring')}</p>
              )}
            </div>
          )}
        </div>

        {/* Purchase date */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays size={12} />
            <span>{t('account.purchased_on', { date: formattedDate })}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={getUriWithOrg(orgslug, `/store/offers/${enrollment.offer_id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-lg"
          >
            {t('account.view_offer')} <ArrowRight size={11} className="rtl:rotate-180" />
          </Link>
          {isSubscription && (
            <button
              onClick={onManageBilling}
              disabled={billingLoading}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors px-3 py-2 rounded-lg"
            >
              {billingLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <><ExternalLink size={11} /> {t('account.manage_subscription')}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AccountPurchases({ orgId, orgslug }: AccountPurchasesProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const [billingLoading, setBillingLoading] = useState(false)

  const { data: enrollmentsResult, isLoading, error } = useSWR(
    orgId && access_token ? [`/payments/${orgId}/enrollments/mine`, access_token] : null,
    ([, token]) => getUserEnrollments(orgId, token)
  )

  const enrollments: any[] = Array.isArray(enrollmentsResult?.data) ? enrollmentsResult.data : []

  const handleManageBilling = async () => {
    if (!access_token) return
    setBillingLoading(true)
    try {
      const return_url = `${window.location.origin}${getUriWithOrg(orgslug, '/account/purchases')}`
      const result = await getBillingPortalSession(orgId, return_url, access_token)
      const url = result?.data?.portal_url
      if (url) {
        window.location.href = url
      } else {
        toast.error(t('account.billing_portal_error'))
      }
    } catch {
      toast.error(t('account.generic_error'))
    } finally {
      setBillingLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl nice-shadow p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl nice-shadow p-8 text-center text-sm text-red-400">
        {t('account.load_purchases_error')}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl nice-shadow p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center nice-shadow">
            <ShoppingBag size={18} className="text-gray-700" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{t('account.purchases')}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {t('account.purchases_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Enrollment list */}
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl nice-shadow p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 nice-shadow">
            <ShoppingBag size={24} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-gray-600 mb-1">{t('account.no_purchases')}</h2>
          <p className="text-sm text-gray-400 max-w-xs">
            {t('account.no_purchases_description')}
          </p>
          <Link
            href={getUriWithOrg(orgslug, '/store')}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors px-4 py-2 rounded-xl"
          >
            {t('account.browse_store')} <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment: any) => (
            <EnrollmentCard
              key={enrollment.enrollment_id}
              enrollment={enrollment}
              orgslug={orgslug}
              onManageBilling={handleManageBilling}
              billingLoading={billingLoading}
            />
          ))}
          {/* Global billing portal link for one-time purchases (invoices) */}
          <div className="bg-white rounded-xl nice-shadow p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">{t('account.invoices_receipts')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('account.invoices_description')}</p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-60 transition-colors"
            >
              {billingLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={13} />}
              {t('account.open_portal')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountPurchases
