'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useFormik } from 'formik'
import { sendResetLink } from '@services/auth/auth'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@components/Auth/AuthLayout'
import AuthAlert from '@components/Auth/AuthAlert'
import CheckEmailState from '@components/Auth/CheckEmailState'
import {
  authFieldClass,
  authPrimaryBtnClass,
  authLabelClass,
  authFieldErrorClass,
} from '@components/Auth/authStyles'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

const validate = (values: any, t: any) => {
  const errors: any = {}

  if (!values.email) {
    errors.email = t('validation.required')
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = t('validation.invalid_email')
  }

  return errors
}

interface ForgotPasswordClientProps {
  org: any
}

function ForgotPasswordClient({ org }: ForgotPasswordClientProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [sent, setSent] = React.useState(false)

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validate: (values) => validate(values, t),
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true)
      setError('')
      const res = await sendResetLink(values.email, org?.id)
      if (res.status == 200) {
        setSent(true)
      } else {
        setError(res.data?.detail ?? t('auth.error_generic'))
      }
      setIsSubmitting(false)
    },
  })

  return (
    <AuthLayout org={org} welcomeText={t('auth.reset_your_password')}>
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.div key="form" {...fade}>
            {error && (
              <AuthAlert variant="error" className="mb-6">
                {error}
              </AuthAlert>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="forgot-email" className={authLabelClass}>
                  {t('auth.email')}
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={authFieldClass}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className={authFieldErrorClass}>{formik.errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={authPrimaryBtnClass}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? t('common.loading') : t('auth.send_reset_link')}
              </button>
            </form>

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
        ) : (
          <motion.div key="sent" {...fade}>
            <CheckEmailState
              email={formik.values.email}
              message={t('auth.sent_reset_link_to')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default ForgotPasswordClient
