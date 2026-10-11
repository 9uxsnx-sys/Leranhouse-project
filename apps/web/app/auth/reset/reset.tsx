'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { useFormik } from 'formik'
import { resetPassword } from '@services/auth/auth'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@components/Auth/AuthLayout'
import AuthAlert from '@components/Auth/AuthAlert'
import {
  PasswordStrengthIndicator,
  validatePasswordStrength,
} from '@components/Auth/PasswordStrengthIndicator'
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

  if (!values.new_password) {
    errors.new_password = t('validation.required')
  } else {
    const passwordValidation = validatePasswordStrength(values.new_password)
    if (!passwordValidation.isValid) {
      errors.new_password = t('auth.password_requirements_not_met')
    }
  }

  if (!values.confirm_password) {
    errors.confirm_password = t('validation.required')
  }

  if (values.new_password !== values.confirm_password) {
    errors.confirm_password = t('auth.passwords_do_not_match')
  }

  return errors
}

interface ResetPasswordClientProps {
  org: any
}

function ResetPasswordClient({ org }: ResetPasswordClientProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const searchParams = useSearchParams()
  const reset_code = searchParams.get('resetCode') || ''
  const email = searchParams.get('email') || ''
  const [error, setError] = React.useState('')
  const [done, setDone] = React.useState(false)

  const formik = useFormik({
    initialValues: {
      new_password: '',
      confirm_password: '',
    },
    validate: (values) => validate(values, t),
    onSubmit: async (values) => {
      setIsSubmitting(true)
      setError('')
      const res = await resetPassword(email, values.new_password, org?.id, reset_code)
      if (res.status == 200) {
        setDone(true)
      } else {
        setError(res.data?.detail ?? t('auth.error_generic'))
      }
      setIsSubmitting(false)
    },
  })

  const mismatch =
    formik.values.confirm_password.length > 0 &&
    formik.values.new_password !== formik.values.confirm_password

  return (
    <AuthLayout org={org} welcomeText={t('auth.create_new_password')}>
      <AnimatePresence mode="wait" initial={false}>
        {!done ? (
          <motion.div key="form" {...fade}>
            {error && (
              <AuthAlert variant="error" className="mb-6">
                {error}
              </AuthAlert>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="reset-password" className={authLabelClass}>
                  {t('auth.new_password')}
                </label>
                <input
                  id="reset-password"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  value={formik.values.new_password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={authFieldClass}
                />
                <AnimatePresence initial={false}>
                  {formik.values.new_password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <PasswordStrengthIndicator password={formik.values.new_password} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {formik.touched.new_password && formik.errors.new_password && (
                  <p className={authFieldErrorClass}>{formik.errors.new_password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-confirm" className={authLabelClass}>
                  {t('auth.confirm_password')}
                </label>
                <input
                  id="reset-confirm"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={formik.values.confirm_password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={authFieldClass}
                />
                {mismatch ? (
                  <p className={authFieldErrorClass}>{t('auth.passwords_do_not_match')}</p>
                ) : (
                  formik.touched.confirm_password &&
                  formik.errors.confirm_password && (
                    <p className={authFieldErrorClass}>
                      {formik.errors.confirm_password}
                    </p>
                  )
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={authPrimaryBtnClass}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? t('common.loading') : t('auth.change_password')}
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
          <motion.div key="done" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Check size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              {t('auth.password_changed_title')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {t('auth.password_changed_message')}
            </p>

            <div className="mt-6">
              <Link href="/login" className={authPrimaryBtnClass}>
                {t('auth.go_to_sign_in')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default ResetPasswordClient
