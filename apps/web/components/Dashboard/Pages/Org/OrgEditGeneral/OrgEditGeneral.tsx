'use client'
import React from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import {
  updateOrganization,
  updateOrgDefaultLanguageConfig,
} from '@services/settings/org'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import { revalidateTags } from '@services/utils/ts/requests'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { toast } from 'react-hot-toast'
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import * as Form from '@radix-ui/react-form'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Globe, Check, Loader2, SaveAllIcon } from 'lucide-react'

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .max(60, 'Organization name must be 60 characters or less'),
  description: Yup.string()
    .required('Short description is required')
    .max(100, 'Short description must be 100 characters or less'),
  about: Yup.string()
    .optional()
    .max(400, 'About text must be 400 characters or less'),
})

interface OrganizationValues {
  name: string
  description: string
  about: string
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none";

const OrgEditGeneral: React.FC = () => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any

  // Default language state
  const [defaultLanguage, setDefaultLanguage] = React.useState<string>(
    org?.config?.config?.customization?.general?.default_language ||
    org?.config?.config?.general?.default_language ||
    'en'
  )

  const [isSaved, setIsSaved] = React.useState(true)
  const [isManualSaving, setIsManualSaving] = React.useState(false)
  const isActiveSaving = isManualSaving

  const initialValues: OrganizationValues = {
    name: org?.name,
    description: org?.description || '',
    about: org?.about || '',
  }

  const updateOrg = async (values: OrganizationValues) => {
    setIsManualSaving(true)
    try {
      await updateOrganization(org.id, values, access_token)
      // Save default language
      await updateOrgDefaultLanguageConfig(org.id, defaultLanguage, access_token)
      await revalidateTags(['organizations'], org.slug)
      mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
      setIsSaved(true)
      toast.success(t('dashboard.organization.settings.update_success'))
    } catch (err) {
      toast.error(t('dashboard.organization.settings.update_error'))
    } finally {
      setIsManualSaving(false)
    }
  }

  const handleManualSave = async (values: OrganizationValues) => {
    if (isActiveSaving) return
    await updateOrg(values)
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          setTimeout(() => {
            setSubmitting(false)
            updateOrg(values)
          }, 400)
        }}
      >
        {({ isSubmitting, values, handleChange, handleSubmit, errors, touched, setFieldValue }) => {
          const handleFieldChange = (e: any) => {
            setIsSaved(false)
            handleChange(e)
          }

          return (
          <FormLayout onSubmit={handleSubmit}>
            <div className="space-y-3">
              {/* ===== Action Row ===== */}
              <div className="flex items-center justify-between">
                <div></div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={isSaved ? undefined : () => handleManualSave(values)}
                    disabled={isActiveSaving}
                    className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                      isActiveSaving
                        ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                        : isSaved
                          ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                          : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                    }`}
                  >
                    {isActiveSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isSaved ? (
                      <Check size={14} />
                    ) : (
                      <SaveAllIcon size={14} />
                    )}
                    <span>
                      {isActiveSaving
                        ? 'Saving...'
                        : isSaved
                          ? 'Saved'
                          : 'Save'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ===== Card 1: Basic Information ===== */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-visible">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                  {t('dashboard.organization.settings.title')}
                </h3>
                <div className="space-y-4">
                  <FormField name="name">
                    <FormLabelAndMessage
                      label={t('dashboard.organization.settings.name')}
                      message={touched.name ? errors.name : undefined}
                    />
                    <Form.Control asChild>
                      <Input
                        className={fieldClassName}
                        onChange={handleFieldChange}
                        value={values.name}
                        placeholder={t('dashboard.organization.settings.name_placeholder')}
                        maxLength={60}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="description">
                    <FormLabelAndMessage
                      label={t('dashboard.organization.settings.short_description')}
                      message={touched.description ? errors.description : undefined}
                    />
                    <Form.Control asChild>
                      <Input
                        className={fieldClassName}
                        onChange={handleFieldChange}
                        value={values.description}
                        placeholder={t('dashboard.organization.settings.short_description_placeholder')}
                        maxLength={100}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="about">
                    <FormLabelAndMessage
                      label={t('dashboard.organization.settings.about')}
                      message={touched.about ? errors.about : undefined}
                    />
                    <Form.Control asChild>
                      <Textarea
                        className={`${fieldClassName} min-h-[80px]`}
                        onChange={handleFieldChange}
                        value={values.about}
                        placeholder={t('dashboard.organization.settings.about_placeholder')}
                        maxLength={400}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="defaultLanguage">
                    <FormLabelAndMessage
                      label={t('dashboard.organization.settings.default_language')}
                    />
                    <LanguageSection
                      value={defaultLanguage}
                      onChange={(value) => { setDefaultLanguage(value); setIsSaved(false) }}
                      t={t}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </FormLayout>
          )
        }}
      </Formik>
    </div>
  )
}

// ===== Language Section (Expanding Container - Single Select) =====
const LanguageSection: React.FC<{
  value: string
  onChange: (value: string) => void
  t: any
}> = ({ value, onChange, t }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const currentLang = AVAILABLE_LANGUAGES.find((l) => l.code === value)

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
      {/* Header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800">
            {currentLang ? (
              <><span className="font-mono text-gray-400 mr-1.5">{currentLang.code.toUpperCase()}</span>{currentLang.nativeName}</>
            ) : (
              t('dashboard.organization.settings.default_language')
            )}
          </span>
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* Expanded content with grid animation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = value === lang.code
                return (
                  <div
                    key={lang.code}
                    onClick={() => { onChange(lang.code); setIsExpanded(false) }}
                    className={`relative flex cursor-pointer items-center rounded-md py-2 pl-3 pr-8 text-sm hover:bg-gray-100 transition-colors ${
                      isSelected ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    <span className="text-xs text-gray-700">
                      <span className="font-mono text-gray-400 mr-1.5">{lang.code.toUpperCase()}</span>
                      {lang.nativeName}
                    </span>
                    {isSelected && (
                      <span className="absolute right-2 text-gray-600">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrgEditGeneral
