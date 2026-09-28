'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { updateCommunity } from '@services/communities/communities'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import { Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import { Switch } from '@components/ui/switch'
import { Button } from '@components/ui/button'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const CommunityFormLabelAndMessage = (props: { label: string; message?: string }) => (
  <div className="flex items-center space-x-3">
    <span className="font-medium leading-[35px] text-black grow text-sm">{props.label}</span>
    {props.message && (
      <div className="text-red-700 text-sm items-center rounded-md flex space-x-1">
        <Info size={10} />
        <div>{props.message}</div>
      </div>
    )}
  </div>
)

const CommunityEditGeneral: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const dispatch = useCommunityDispatch()
  const community = communityState?.community
  const accessToken = session?.data?.tokens?.access_token

  const [isSubmitting, setIsSubmitting] = useState(false)

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('dashboard.courses.communities.general.form.name_required'))
      .min(3, t('dashboard.courses.communities.general.form.name_min_length'))
      .max(100, t('dashboard.courses.communities.general.form.name_max_length')),
    description: Yup.string().max(500, t('dashboard.courses.communities.general.form.description_max_length')),
    public: Yup.boolean(),
  })

  if (!community) return null

  const initialValues = {
    name: community.name,
    description: community.description || '',
    public: community.public,
  }

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSubmitting(true)
    const loadingToast = toast.loading(t('dashboard.courses.communities.general.toasts.updating'))

    try {
      const result = await updateCommunity(
        community.community_uuid,
        {
          name: values.name,
          description: values.description || null,
          public: values.public,
        },
        accessToken
      )

      if (result) {
        await revalidateTags(['communities'], org.slug)
        mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
        if (dispatch) {
          dispatch({ type: 'setCommunity', payload: { ...community, ...values } })
        }
        toast.success(t('dashboard.courses.communities.general.toasts.update_success'), { id: loadingToast })
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update community:', error)
      toast.error(t('dashboard.courses.communities.general.toasts.update_error'), { id: loadingToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, errors, touched, setFieldValue, isValid, dirty }) => (
        <Form>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.courses.communities.general.title')}
            </h2>

            <div className="space-y-4">
              <div className="grid mb-2.5">
                <CommunityFormLabelAndMessage
                  label={`${t('dashboard.courses.communities.general.form.name_label')} *`}
                  message={touched.name ? errors.name : undefined}
                />
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder={t('dashboard.courses.communities.general.form.name_placeholder')}
                  maxLength={100}
                  className={fieldClassName}
                />
              </div>

              <div className="grid mb-2.5">
                <CommunityFormLabelAndMessage
                  label={t('dashboard.courses.communities.general.form.description_label')}
                  message={touched.description ? errors.description : undefined}
                />
                <Textarea
                  id="description"
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  placeholder={t('dashboard.courses.communities.general.form.description_placeholder')}
                  className={`${fieldClassName} min-h-[120px]`}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="space-y-0.5">
                  <span className="font-medium leading-[35px] text-black text-sm">
                    {t('dashboard.courses.communities.general.form.public_label')}
                  </span>
                  <p className="text-sm text-gray-500">
                    {t('dashboard.courses.communities.general.form.public_description')}
                  </p>
                </div>
                <Switch
                  name="public"
                  checked={values.public}
                  onCheckedChange={(checked) => setFieldValue('public', checked)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid || !dirty}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save_changes')
                )}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default CommunityEditGeneral
