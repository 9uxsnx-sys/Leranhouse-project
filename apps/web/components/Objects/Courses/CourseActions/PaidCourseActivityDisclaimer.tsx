'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getUriWithOrg } from '@services/config/config'
import { createResourceCheckout } from '@services/payments/checkout'
import { useTranslation } from 'react-i18next'

interface PaidCourseActivityProps {
  course: any
}

/**
 * Shown in place of a lesson body when the viewer is not entitled to a paid
 * course. The resource itself is public (product page), only the body is
 * locked, so the fix is to send the learner to the real Chargily checkout.
 */
function PaidCourseActivityDisclaimer({ course }: PaidCourseActivityProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const [isLoading, setIsLoading] = useState(false)

  const price = typeof course?.price_amount === 'number' ? course.price_amount : null
  const currency = course?.price_currency || 'DZD'
  const formattedPrice =
    price !== null
      ? new Intl.NumberFormat(i18n.language || 'en', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(price)
      : null

  const handleGetAccess = async () => {
    if (!access_token) {
      router.push(getUriWithOrg(org?.slug ?? '', '/login'))
      return
    }
    if (!org?.id || !course?.course_uuid) return

    setIsLoading(true)
    try {
      const checkout = await createResourceCheckout(
        org.id,
        { resource_uuid: course.course_uuid, resource_type: 'course' },
        access_token
      )
      if (checkout?.checkout_url) {
        window.location.href = checkout.checkout_url
        return
      }
      throw new Error('Missing checkout URL')
    } catch (err: any) {
      toast.error(err?.detail || t('course.get_access_failed', 'Could not start this course'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
        <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-amber-800 font-semibold text-sm">{t('payments.paid_content')}</h3>
          <p className="text-amber-700 text-sm mt-0.5">{t('payments.paid_content_description')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl nice-shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <Lock size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{course?.name}</p>
            {formattedPrice && (
              <p className="text-sm text-gray-500">{formattedPrice}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleGetAccess}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <ShoppingBag size={15} />
              {t('store.get_access')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default PaidCourseActivityDisclaimer
