'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { updatePassword } from '@services/settings/password'
import { updateProfile } from '@services/settings/profile'
import { deleteUser } from '@services/users/users'
import { Formik, Form } from 'formik'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { signOut } from '@components/Contexts/AuthContext'
import { getUriWithoutOrg } from '@services/config/config'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import {
  PasswordStrengthIndicator,
} from '@components/Auth/PasswordStrengthIndicator'
import {
  authFieldClass,
  authLabelClass,
  authFieldErrorClass,
  authPrimaryBtnClass,
} from '@components/Auth/authStyles'

const passwordSchema = Yup.object().shape({
  old_password: Yup.string().required('validation.required'),
  new_password: Yup.string()
    .required('validation.required')
    .min(8, 'validation.password_min_length'),
})

const emailSchema = Yup.object().shape({
  new_email: Yup.string()
    .email('validation.invalid_email')
    .required('validation.required'),
})

function maskEmail(email: string): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.charAt(0) + '***'
  return `${maskedLocal}@${domain}`
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-black/20 backdrop-blur-sm">
      {/* Invisible click-outside catcher */}
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6 z-modal-content">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function AccountSecurity() {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const { t } = useTranslation()
  const currentEmail = session?.data?.user?.email || ''
  const [modalType, setModalType] = useState<'email' | 'password' | 'delete' | null>(null)

  const closeModal = () => setModalType(null)

  const changeEmail = async (values: any) => {
    const loadingToast = toast.loading(t('user.settings.email.updating'))
    try {
      const user_id = session.data.user.id
      await updateProfile({ email: values.new_email }, user_id, access_token)
      toast.dismiss(loadingToast)
      toast.success(t('user.settings.email.email_updated'), { duration: 4000 })
      toast(
        (t_toast: any) => (
          <div className="flex items-center gap-2">
            <span>{t('user.settings.email.relogin_message', { email: values.new_email })}</span>
          </div>
        ),
        { duration: 4000, icon: '📧' }
      )
      await new Promise((resolve) => setTimeout(resolve, 4000))
      signOut({ redirect: true, callbackUrl: getUriWithoutOrg('/') })
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || 'Failed to update email'
      toast.error(errorMessage, { id: loadingToast })
    }
  }

  const changePassword = async (values: any) => {
    const loadingToast = toast.loading(t('user.settings.password.updating'))
    try {
      const user_id = session.data.user.id
      const response = await updatePassword(user_id, values, access_token)
      if (response.success) {
        toast.dismiss(loadingToast)
        toast.success(t('user.settings.password.password_updated'), { duration: 4000 })
        toast(
          (t_toast: any) => (
            <div className="flex items-center gap-2">
              <span>{t('user.settings.password.relogin_message')}</span>
            </div>
          ),
          { duration: 4000, icon: '🔑' }
        )
        await new Promise((resolve) => setTimeout(resolve, 4000))
        signOut({ redirect: true, callbackUrl: getUriWithoutOrg('/') })
      } else {
        toast.error(response.data.detail || 'Failed to update password', { id: loadingToast })
      }
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update password. Please try again.'
      toast.error(errorMessage, { id: loadingToast })
      console.error('Password update error:', error)
    }
  }

  const deleteAccount = async () => {
    const loadingToast = toast.loading('Deleting account...')
    try {
      const user_id = session.data.user.id
      const response = await deleteUser(user_id, access_token)
      if (response.success) {
        toast.dismiss(loadingToast)
        toast.success('Account deleted', { duration: 4000 })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        signOut({ redirect: true, callbackUrl: getUriWithoutOrg('/') })
      } else {
        toast.error(response.data.detail || 'Failed to delete account', { id: loadingToast })
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || 'Failed to delete account'
      toast.error(errorMessage, { id: loadingToast })
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Single Card: Security */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('account.security')}
          </h3>

          <div className="divide-y divide-gray-100">
            {/* ─── Email Row ─── */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {t('user.settings.email.title')}
                </span>
                <span className="text-sm text-gray-400 mt-0.5">{maskEmail(currentEmail)}</span>
              </div>
              <button
                type="button"
                onClick={() => setModalType('email')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline"
              >
                Change
              </button>
            </div>

            {/* ─── Password Row ─── */}
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {t('user.settings.password.title')}
                </span>
                <span className="text-sm text-gray-400 mt-0.5">********</span>
              </div>
              <button
                type="button"
                onClick={() => setModalType('password')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* ─── Delete Account Card ─── */}
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">
                {t('user.settings.privacy.delete_warning_description')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setModalType('delete')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              {t('user.settings.privacy.delete_account')}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Email Change Modal ─── */}
      <Modal open={modalType === 'email'} onClose={closeModal} title={t('user.settings.email.title')}>
        <Formik
          initialValues={{ new_email: '' }}
          validationSchema={emailSchema}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              setSubmitting(false)
              changeEmail(values)
            }, 400)
          }}
        >
          {({ isSubmitting, handleChange, errors, touched }) => (
            <Form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="modal-current-email" className={authLabelClass}>
                  {t('user.settings.email.current_email')}
                </label>
                <input
                  id="modal-current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className={authFieldClass + ' opacity-60 cursor-not-allowed'}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="modal-new_email" className={authLabelClass}>
                  {t('user.settings.email.new_email')}
                </label>
                <input
                  id="modal-new_email"
                  name="new_email"
                  type="email"
                  autoComplete="email"
                  onChange={handleChange}
                  placeholder={t('user.settings.email.new_email_placeholder')}
                  className={authFieldClass}
                />
                {touched.new_email && errors.new_email && (
                  <p className={authFieldErrorClass}>{t(errors.new_email as string)}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{t('user.settings.email.logout_warning')}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={authPrimaryBtnClass + ' w-full'}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? t('user.settings.email.updating') : t('user.settings.email.change_email')}
              </button>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* ─── Password Change Modal ─── */}
      <Modal open={modalType === 'password'} onClose={closeModal} title={t('user.settings.password.title')}>
        <Formik
          initialValues={{ old_password: '', new_password: '' }}
          validationSchema={passwordSchema}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              setSubmitting(false)
              changePassword(values)
            }, 400)
          }}
        >
          {({ isSubmitting, handleChange, values, errors, touched }) => (
            <Form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="modal-old_password" className={authLabelClass}>
                  {t('user.settings.password.current_password')}
                </label>
                <input
                  id="modal-old_password"
                  name="old_password"
                  type="password"
                  autoComplete="current-password"
                  onChange={handleChange}
                  className={authFieldClass}
                />
                {touched.old_password && errors.old_password && (
                  <p className={authFieldErrorClass}>{t(errors.old_password as string)}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="modal-new_password" className={authLabelClass}>
                  {t('user.settings.password.new_password')}
                </label>
                <input
                  id="modal-new_password"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  onChange={handleChange}
                  className={authFieldClass}
                />
                {touched.new_password && errors.new_password && (
                  <p className={authFieldErrorClass}>{t(errors.new_password as string)}</p>
                )}

                {/* Password strength indicator with animation — same as login signup */}
                <AnimatePresence initial={false}>
                  {values.new_password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <PasswordStrengthIndicator password={values.new_password} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{t('user.settings.password.logout_warning')}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={authPrimaryBtnClass + ' w-full'}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? t('user.settings.password.updating') : t('user.settings.password.update_password')}
              </button>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* ─── Delete Account Modal ─── */}
      <Modal open={modalType === 'delete'} onClose={closeModal} title={t('user.settings.privacy.delete_account')}>
        <DeleteConfirmModalContent
          onConfirm={deleteAccount}
          onCancel={closeModal}
          t={t}
        />
      </Modal>
    </>
  )
}

function DeleteConfirmModalContent({ onConfirm, onCancel, t }: { onConfirm: () => void; onCancel: () => void; t: (key: string) => string }) {
  const [typedText, setTypedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const isConfirmed = typedText === 'DELETE'

  const handleConfirm = async () => {
    if (!isConfirmed) return
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-red-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-800">
            {t('user.settings.privacy.delete_warning_title')}
          </p>
          <p className="text-sm text-red-600">
            {t('user.settings.privacy.delete_warning_description')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className={authLabelClass}>
          {t('user.settings.privacy.delete_confirm_message')}
        </label>
        <input
          type="text"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder={t('user.settings.privacy.type_delete')}
          className={authFieldClass}
          autoComplete="off"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          {t('user.settings.privacy.cancel')}
        </button>
        <button
          type="button"
          disabled={!isConfirmed || isDeleting}
          onClick={handleConfirm}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          {isDeleting && <Loader2 size={16} className="animate-spin" />}
          {isDeleting ? 'Deleting...' : t('user.settings.privacy.confirm_delete')}
        </button>
      </div>
    </div>
  )
}

export default AccountSecurity
