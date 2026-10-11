'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { verifyEmail } from '@services/auth/auth'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@components/Auth/AuthLayout'
import { authPrimaryBtnClass } from '@components/Auth/authStyles'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

type VerifyState = 'verifying' | 'success' | 'error'

interface VerifyEmailClientProps {
  org: any
}

function VerifyEmailClient({ org }: VerifyEmailClientProps) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const userUuid = searchParams.get('user') || ''
  const orgUuid = searchParams.get('org') || ''

  const [state, setState] = useState<VerifyState>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    const verify = async () => {
      if (!token || !userUuid || !orgUuid) {
        setError(t('auth.verification_missing_params'))
        setState('error')
        return
      }

      try {
        const res = await verifyEmail(token, userUuid, orgUuid)
        if (res.success) {
          setState('success')
        } else {
          setError(res.error || t('auth.verification_failed'))
          setState('error')
        }
      } catch (err) {
        setError(t('auth.verification_failed'))
        setState('error')
      }
    }

    verify()
  }, [token, userUuid, orgUuid, t])

  return (
    <AuthLayout org={org} welcomeText={t('auth.verifying_your_email')}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'verifying' && (
          <motion.div key="verifying" {...fade} className="text-center py-6">
            <Loader2 size={28} className="mx-auto animate-spin text-gray-400" />
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              {t('auth.verifying_your_email')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {t('auth.verifying_take_moment')}
            </p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div key="success" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Check size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              {t('auth.email_verified_success')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {t('auth.email_verified_message')}
            </p>

            <div className="mt-6">
              <Link href="/login" className={authPrimaryBtnClass}>
                {t('auth.continue_to_sign_in')}
              </Link>
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertTriangle size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              {t('auth.link_invalid_or_expired')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {error || t('auth.verification_trouble')}
            </p>

            <div className="mt-6">
              <Link href="/signup" className={authPrimaryBtnClass}>
                {t('auth.request_new_link')}
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:underline"
              >
                <ArrowLeft size={14} />
                {t('auth.back_to_sign_in')}
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default VerifyEmailClient
