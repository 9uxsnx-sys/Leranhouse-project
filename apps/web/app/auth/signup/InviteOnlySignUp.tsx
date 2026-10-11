'use client'
import { useFormik } from 'formik'
import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { Ticket } from 'lucide-react'
import { signUpWithInviteCode } from '@services/auth/auth'
import { useOrg } from '@components/Contexts/OrgContext'
import { signIn } from '@components/Contexts/AuthContext'
import { getLEARNHOUSE_TOP_DOMAIN_VAL } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import {
  PasswordStrengthIndicator,
  validatePasswordStrength,
} from '@components/Auth/PasswordStrengthIndicator'
import { Checkbox } from '@components/ui/checkbox'
import AuthAlert from '@components/Auth/AuthAlert'
import CheckEmailState from '@components/Auth/CheckEmailState'
import {
  authFieldClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
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

  if (!values.password) {
    errors.password = t('validation.required')
  } else {
    const passwordValidation = validatePasswordStrength(values.password)
    if (!passwordValidation.isValid) {
      errors.password = t('auth.password_requirements_not_met')
    }
  }

  if (!values.username) {
    errors.username = t('validation.required')
  } else if (values.username.length < 4) {
    errors.username = t('validation.username_min_length')
  }

  return errors
}

interface InviteOnlySignUpProps {
  inviteCode: string
}

function InviteOnlySignUpComponent(props: InviteOnlySignUpProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const org = useOrg() as any
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [agreed, setAgreed] = React.useState(false)

  const formik = useFormik({
    initialValues: {
      org_slug: org?.slug,
      org_id: org?.id,
      email: '',
      password: '',
      username: '',
      bio: '',
      first_name: '',
      last_name: '',
    },
    validate: (values) => validate(values, t),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setError('')
      setMessage('')
      setIsSubmitting(true)
      let res = await signUpWithInviteCode(values, props.inviteCode)
      let message = await res.json()
      if (res.status == 200) {
        setMessage(t('auth.account_created_success'))
        setIsSubmitting(false)
      } else if (
        res.status == 401 ||
        res.status == 400 ||
        res.status == 404 ||
        res.status == 409
      ) {
        setError(message.detail)
        setIsSubmitting(false)
      } else {
        setError(t('common.something_went_wrong'))
        setIsSubmitting(false)
      }
    },
  })

  const handleGoogleSignIn = () => {
    // Store org context in cookies before OAuth redirect
    if (org?.slug) {
      const topDomain = getLEARNHOUSE_TOP_DOMAIN_VAL();
      const isSecure = window.location.protocol === 'https:';
      const secureAttr = isSecure ? '; secure' : '';
      const baseAttributes = `; path=/; SameSite=Lax${secureAttr}`;
      const domainAttr = topDomain === 'localhost' ? '' : `; domain=.${topDomain}`;
      document.cookie = `LH_oauth_orgslug=${org.slug}${baseAttributes}${domainAttr}`;
      document.cookie = `LH_oauth_org_id=${org.id}${baseAttributes}${domainAttr}`;
    }
    // Use absolute URL with current origin for custom domain support
    signIn('google', { callbackUrl: `${window.location.origin}/redirect_from_auth` });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!message ? (
        <motion.div key="form" {...fade}>
          {error && (
            <AuthAlert variant="error" className="mb-6">
              {error}
            </AuthAlert>
          )}

          {/* Invite code chip */}
          <div className="flex items-center gap-2 mb-6 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <Ticket size={15} className="text-gray-400 shrink-0" />
            <span className="text-[13px] text-gray-500">{t('auth.invite_code')}</span>
            <span className="ml-auto text-[13px] font-semibold font-mono text-gray-900">
              {props.inviteCode}
            </span>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="invite-username" className={authLabelClass}>
                {t('auth.username')}
              </label>
              <input
                id="invite-username"
                name="username"
                type="text"
                autoComplete="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={authFieldClass}
              />
              {formik.touched.username && formik.errors.username && (
                <p className={authFieldErrorClass}>{formik.errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="invite-email" className={authLabelClass}>
                {t('auth.email')}
              </label>
              <input
                id="invite-email"
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

            <div className="space-y-2">
              <label htmlFor="invite-password" className={authLabelClass}>
                {t('auth.password')}
              </label>
              <input
                id="invite-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={authFieldClass}
              />
              <AnimatePresence initial={false}>
                {formik.values.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <PasswordStrengthIndicator password={formik.values.password} />
                  </motion.div>
                )}
              </AnimatePresence>
              {formik.touched.password && formik.errors.password && (
                <p className={authFieldErrorClass}>{formik.errors.password}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="invite-terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5 h-[18px] w-[18px] rounded-md border-gray-300 shadow-sm data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 data-[state=checked]:text-white focus-visible:ring-4 focus-visible:ring-gray-900/5"
              />
              <label
                htmlFor="invite-terms"
                className="text-[13px] leading-relaxed text-gray-500 cursor-pointer select-none"
              >
                {t('auth.agree_to')}{' '}
                <Link href="#" className="text-gray-700 underline">
                  {t('auth.terms')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="#" className="text-gray-700 underline">
                  {t('auth.privacy')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !agreed}
              className={authPrimaryBtnClass}
            >
              {isSubmitting
                ? t('common.loading')
                : t('auth.create_account_and_join')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">{t('common.or')}</span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className={authSecondaryBtnClass}
          >
            <img
              src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
              alt=""
              className="w-4 h-4"
            />
            {t('auth.sign_in_with_google')}
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.already_have_account')}{' '}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline">
              {t('auth.sign_in')}
            </Link>
          </p>
        </motion.div>
      ) : (
        <motion.div key="sent" {...fade}>
          <CheckEmailState
            email={formik.values.email}
            message={t('auth.sent_verification_link_to')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InviteOnlySignUpComponent
