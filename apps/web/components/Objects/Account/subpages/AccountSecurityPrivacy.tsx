'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { updatePassword } from '@services/settings/password'
import { Formik, Form } from 'formik'
import React, { useState } from 'react'
import { AlertTriangle, Shield, Trash2 } from 'lucide-react'
import { Input } from "@components/ui/input"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
import { toast } from 'react-hot-toast'
import { signOut } from '@components/Contexts/AuthContext'
import { getUriWithoutOrg } from '@services/config/config'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const validationSchema = Yup.object().shape({
  old_password: Yup.string().required('validation.required'),
  new_password: Yup.string()
    .required('validation.required')
    .min(8, 'validation.password_min_length'),
})

function AccountSecurityPrivacy() {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token;
  const { t } = useTranslation();

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const updatePasswordUI = async (values: any) => {
    const loadingToast = toast.loading(t('user.settings.password.updating'))
    try {
      let user_id = session.data.user.id
      const response = await updatePassword(user_id, values, access_token)

      if (response.success) {
        toast.dismiss(loadingToast)

        toast.success(t('user.settings.password.password_updated'), { duration: 4000 })
        toast((t_toast: any) => (
          <div className="flex items-center gap-2">
            <span>{t('user.settings.password.relogin_message')}</span>
          </div>
        ), {
          duration: 4000,
          icon: '🔑'
        })

        await new Promise(resolve => setTimeout(resolve, 4000))
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

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') return
    toast.error('Account deletion is not yet implemented')
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('user.settings.password.title')}
        </h3>

        <Formik
          initialValues={{ old_password: '', new_password: '' }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              setSubmitting(false)
              updatePasswordUI(values)
            }, 400)
          }}
        >
          {({ isSubmitting, handleChange, errors, touched }) => (
            <Form className="w-full max-w-2xl space-y-6">
              <div>
                <Label htmlFor="old_password" className="font-medium leading-[35px] text-black text-sm">
                  {t('user.settings.password.current_password')}
                </Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  id="old_password"
                  name="old_password"
                  onChange={handleChange}
                  className={fieldClassName}
                />
                {touched.old_password && errors.old_password && (
                  <p className="text-red-500 text-sm mt-1">{t(errors.old_password as string)}</p>
                )}
              </div>

              <div>
                <Label htmlFor="new_password" className="font-medium leading-[35px] text-black text-sm">
                  {t('user.settings.password.new_password')}
                </Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  id="new_password"
                  name="new_password"
                  onChange={handleChange}
                  className={fieldClassName}
                />
                {touched.new_password && errors.new_password && (
                  <p className="text-red-500 text-sm mt-1">{t(errors.new_password as string)}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertTriangle size={16} />
                <span className="text-sm">{t('user.settings.password.logout_warning')}</span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('user.settings.password.updating') : t('user.settings.password.update_password')}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Card 2: Profile Visibility */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('user.settings.privacy.visibility')}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm">
            {t('user.settings.privacy.coming_soon')}
          </p>
        </div>
      </div>

      {/* Card 3: Delete Account */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-red-500 mb-5">
          {t('user.settings.privacy.delete_account')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {t('user.settings.privacy.delete_warning_title')}
              </p>
              <p className="text-sm text-red-600 mt-1">
                {t('user.settings.privacy.delete_warning_description')}
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} className="me-2" />
              {t('user.settings.privacy.delete_account_button')}
            </Button>
          ) : (
            <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50/50">
              <p className="text-sm text-red-700 font-medium">
                {t('user.settings.privacy.delete_confirm_message')}
              </p>
              <div>
                <Label htmlFor="deleteConfirm" className="font-medium leading-[35px] text-black text-sm">
                  {t('user.settings.privacy.type_delete')}
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={fieldClassName}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteConfirmText !== 'DELETE'}
                  onClick={handleDeleteAccount}
                >
                  <Trash2 size={16} className="me-2" />
                  {t('user.settings.privacy.confirm_delete')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                >
                  {t('user.settings.privacy.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountSecurityPrivacy
