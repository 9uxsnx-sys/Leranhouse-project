'use client'
import { FormikErrors, useFormik } from 'formik'
import React, { useState, useEffect } from 'react'
import { Loader2, Shield } from 'lucide-react'
import Link from 'next/link'
import { checkSSOEnabled, redirectToSSOLogin } from '@services/auth/sso'
import { useRouter } from 'next/navigation'
import { useAuth } from '@components/Contexts/AuthContext'
import { getLEARNHOUSE_TOP_DOMAIN_VAL, getDeploymentMode } from '@services/config/config'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useTranslation } from 'react-i18next'
import { resendVerificationEmail } from '@services/auth/auth'
import AuthLayout from '@components/Auth/AuthLayout'
import AuthAlert, { type AuthAlertVariant } from '@components/Auth/AuthAlert'
import {
  authFieldClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
  authLabelClass,
  authMutedLinkClass,
  authFieldErrorClass,
} from '@components/Auth/authStyles'

interface LoginClientProps {
  org: any
}

const LoginClient = (props: LoginClientProps) => {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const router = useRouter();
  const session = useLHSession() as any;

  // Error state with type information
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [verificationResent, setVerificationResent] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  const handleGoogleSignIn = () => {
    // Store org context in cookies before OAuth redirect
    if (props.org?.slug) {
      const topDomain = getLEARNHOUSE_TOP_DOMAIN_VAL();
      const isSecure = window.location.protocol === 'https:';
      const secureAttr = isSecure ? '; secure' : '';
      const baseAttributes = `; path=/; SameSite=Lax${secureAttr}`;
      const domainAttr = topDomain === 'localhost' ? '' : `; domain=.${topDomain}`;
      document.cookie = `LH_oauth_orgslug=${props.org.slug}${baseAttributes}${domainAttr}`;
      document.cookie = `LH_oauth_org_id=${props.org.id}${baseAttributes}${domainAttr}`;
    }
    // Use absolute URL with current origin for custom domain support
    signIn('google', { callbackUrl: `${window.location.origin}/redirect_from_auth` });
  };

  // Check if SSO is enabled for this organization (requires enterprise plan)
  useEffect(() => {
    const checkSSO = async () => {
      // SSO is only available for enterprise plan (requires EE or SaaS/enterprise)
      const orgConfig = props.org?.config?.config
      const plan = orgConfig?.plan ?? orgConfig?.cloud?.plan
      const mode = getDeploymentMode()
      if (mode === 'oss' || (mode === 'saas' && plan !== 'enterprise')) {
        setSsoEnabled(false)
        return
      }

      if (props.org?.slug) {
        try {
          const result = await checkSSOEnabled(props.org.slug)
          setSsoEnabled(result.sso_enabled)
        } catch (error) {
          // SSO not available, silently ignore
          console.debug('SSO check failed:', error)
        }
      }
    }
    checkSSO()
  }, [props.org?.slug, props.org?.config?.config?.plan, props.org?.config?.config?.cloud?.plan]) // eslint-disable-line

  const handleSSOLogin = async () => {
    setSsoLoading(true)
    try {
      await redirectToSSOLogin(props.org.slug)
    } catch (error: any) {
      setError(error.message || t('auth.sso_error'))
      setSsoLoading(false)
    }
  }

  const validate = (values: any) => {
    const errors: FormikErrors<any> = {}

    if (!values.email) {
      errors.email = t('validation.required')
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = t('validation.invalid_email')
    }

    if (!values.password) {
      errors.password = t('validation.required')
    } else if (values.password.length < 8) {
      errors.password = t('validation.password_min_length')
    }

    return errors
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail || !props.org?.id) return
    setIsResendingVerification(true)
    try {
      const res = await resendVerificationEmail(unverifiedEmail, props.org.id)
      if (res.success) {
        setVerificationResent(true)
      } else {
        setError(res.error || t('auth.resend_verification_failed'))
      }
    } catch (err) {
      setError(t('auth.resend_verification_failed'))
    } finally {
      setIsResendingVerification(false)
    }
  }

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validate,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, {validateForm, setErrors, setSubmitting}) => {
      setIsSubmitting(true)
      setError('')
      setErrorType(null)
      setUnverifiedEmail(null)
      setVerificationResent(false)
      setShowErrorModal(false)
      setRetryAfter(null)

      const errors = await validateForm(values);
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        setSubmitting(false);
        setIsSubmitting(false);
        return;
      }

      // Use absolute URL with current origin for custom domain support
      const callbackUrl = `${window.location.origin}/redirect_from_auth`;

      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl
      });

      if (res && res.error) {
        // Try to parse the error message for error codes
        try {
          // The error from next-auth might contain our structured error
          const errorData = JSON.parse(res.error);
          if (errorData.code) {
            setErrorType(errorData.code);
            setError(errorData.message || t('auth.wrong_email_password'));
            if (errorData.code === 'EMAIL_NOT_VERIFIED') {
              setUnverifiedEmail(errorData.email || values.email);
            }
            if (errorData.retry_after) {
              setRetryAfter(errorData.retry_after);
            }
          } else {
            setError(t('auth.wrong_email_password'));
          }
        } catch {
          // If parsing fails, check for specific error strings
          if (res.error.includes('EMAIL_NOT_VERIFIED')) {
            setErrorType('EMAIL_NOT_VERIFIED');
            setError(t('auth.email_not_verified_message'));
            setUnverifiedEmail(values.email);
          } else if (res.error.includes('ACCOUNT_LOCKED')) {
            setErrorType('ACCOUNT_LOCKED');
            setError(t('auth.account_locked_message'));
          } else if (res.error.includes('RATE_LIMITED')) {
            setErrorType('RATE_LIMITED');
            setError(t('auth.rate_limited_message'));
          } else {
            setError(t('auth.wrong_email_password'));
          }
        }
        setShowErrorModal(true);
        setIsSubmitting(false);
      } else {
        // First signIn already authenticated and set cookies — just redirect
        window.location.href = callbackUrl;
      }
    },
  })

  // Map the auth error state onto a single inline alert.
  const errorAlert = (() => {
    if (!showErrorModal || (!error && !verificationResent)) return null

    let variant: AuthAlertVariant = 'error'
    let message: React.ReactNode = error
    let action: React.ReactNode

    if (verificationResent) {
      variant = 'success'
      message = `${t('auth.verification_email_resent')} — ${t('auth.check_inbox_message')}`
    } else if (errorType === 'EMAIL_NOT_VERIFIED') {
      variant = 'warning'
      message = t('auth.email_not_verified_message')
      action = (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={isResendingVerification}
          className="text-[13px] font-semibold underline disabled:opacity-50"
        >
          {isResendingVerification
            ? t('common.loading')
            : t('auth.resend_verification_email')}
        </button>
      )
    } else if (errorType === 'ACCOUNT_LOCKED') {
      variant = 'error'
      message = `${t('auth.account_locked_message')}${
        retryAfter
          ? ` · ${t('auth.try_again_in', { minutes: Math.max(1, Math.ceil(retryAfter / 60)) })}`
          : ''
      }`
    } else if (errorType === 'RATE_LIMITED') {
      variant = 'warning'
      message = `${t('auth.rate_limited_message')}${
        retryAfter
          ? ` · ${t('auth.try_again_in', { minutes: Math.max(1, Math.ceil(retryAfter / 60)) })}`
          : ''
      }`
    }

    return (
      <AuthAlert variant={variant} className="mb-6" action={action}>
        {message}
      </AuthAlert>
    )
  })()

  return (
    <AuthLayout org={props.org} welcomeText={t('auth.login_to')}>
      {errorAlert}

      <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="login-email" className={authLabelClass}>
            {t('auth.email')}
          </label>
          <input
            id="login-email"
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
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className={authLabelClass}>
              {t('auth.password')}
            </label>
            <Link href="/forgot" className={authMutedLinkClass}>
              {t('auth.forgot_password')}
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={authFieldClass}
          />
          {formik.touched.password && formik.errors.password && (
            <p className={authFieldErrorClass}>{formik.errors.password}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className={authPrimaryBtnClass}>
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? t('common.loading') : t('auth.sign_in')}
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

      {/* Social & SSO */}
      <div className="space-y-2.5">
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

        {ssoEnabled && (
          <button
            type="button"
            onClick={handleSSOLogin}
            disabled={ssoLoading}
            className={authSecondaryBtnClass}
          >
            <Shield size={16} />
            {ssoLoading ? t('common.loading') : t('auth.sign_in_with_sso')}
          </button>
        )}
      </div>

      {/* Sign up */}
      <p className="text-center text-sm text-gray-500 mt-6">
        {t('auth.no_account')}{' '}
        <Link href="/signup" className="font-semibold text-gray-900 hover:underline">
          {t('auth.sign_up')}
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginClient
