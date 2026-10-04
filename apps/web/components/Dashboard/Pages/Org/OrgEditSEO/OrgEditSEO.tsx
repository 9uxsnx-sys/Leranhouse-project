'use client'
import React, { useRef, useState } from 'react'
import { Formik } from 'formik'
import {
  updateOrgSeoConfig,
  uploadOrganizationOgImage,
  SeoOrgConfig,
} from '@services/settings/org'
import { revalidateTags } from '@services/utils/ts/requests'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { toast } from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import { getOrgOgImageMediaDirectory } from '@services/media/media'
import { Copy, ExternalLink, Check, Loader2, SaveAllIcon, Trash2, UploadCloud, ImageIcon } from 'lucide-react'
import { getCanonicalUrl } from '@/lib/seo/utils'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import * as Form from '@radix-ui/react-form'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const OrgEditSEO: React.FC = () => {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const ogImageInputRef = useRef<HTMLInputElement>(null)
  const [ogImageFile, setOgImageFile] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(true)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const isActiveSaving = isManualSaving

  const seoConfig = org?.config?.config?.customization?.seo || org?.config?.config?.seo || {}

  const initialValues: SeoOrgConfig = {
    default_meta_title_suffix: seoConfig.default_meta_title_suffix || '',
    default_meta_description: seoConfig.default_meta_description || '',
    default_og_image: seoConfig.default_og_image || '',
    google_site_verification: seoConfig.google_site_verification || '',
    twitter_handle: seoConfig.twitter_handle || '',
    noindex_communities: seoConfig.noindex_communities || false,
  }

  const sitemapUrl = getCanonicalUrl(org?.slug, '/sitemap.xml')
  const robotsUrl = getCanonicalUrl(org?.slug, '/robots.txt')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleOgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOgImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setIsSaved(false)
    }
  }

  const clearOgImage = () => {
    setOgImageFile(null)
    setOgImagePreview(null)
    if (ogImageInputRef.current) {
      ogImageInputRef.current.value = ''
    }
    setIsSaved(false)
  }

  const saveSeoConfig = async (values: SeoOrgConfig) => {
    setIsManualSaving(true)
    try {
      // Upload OG image if a new one was selected
      if (ogImageFile) {
        const uploadResult = await uploadOrganizationOgImage(
          org.id,
          ogImageFile,
          access_token
        )
        values.default_og_image = uploadResult.filename
      }

      await updateOrgSeoConfig(org.id, values, access_token)
      await revalidateTags(['organizations'], org.slug)
      mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
      setOgImageFile(null)
      setIsSaved(true)
      toast.success('SEO settings saved successfully')
    } catch (err) {
      toast.error('Failed to save SEO settings')
    } finally {
      setIsManualSaving(false)
    }
  }

  const existingOgImageUrl =
    seoConfig.default_og_image
      ? getOrgOgImageMediaDirectory(org?.org_uuid, seoConfig.default_og_image)
      : null

  const handleManualSave = async (values: SeoOrgConfig) => {
    if (isActiveSaving) return
    await saveSeoConfig(values)
  }

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={(values, { setSubmitting }) => {
          setTimeout(() => {
            setSubmitting(false)
            saveSeoConfig(values)
          }, 400)
        }}
      >
        {({ isSubmitting, values, handleChange, setFieldValue, handleSubmit }) => {
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

                {/* ===== Card 1: Quick Links ===== */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                    Quick Links
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700 shrink-0">Sitemap:</span>
                        <a
                          href={sitemapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {sitemapUrl}
                        </a>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sitemapUrl)}
                          className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <a href={sitemapUrl} target="_blank" rel="noopener noreferrer">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-700 shrink-0">Robots.txt:</span>
                        <a
                          href={robotsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {robotsUrl}
                        </a>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(robotsUrl)}
                          className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <a href={robotsUrl} target="_blank" rel="noopener noreferrer">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== Card 2: Default Meta Tags ===== */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                    Default Meta Tags
                  </h3>
                  <div className="space-y-4">
                    <FormField name="default_meta_title_suffix">
                      <FormLabelAndMessage label="Title Suffix" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={handleFieldChange}
                          value={values.default_meta_title_suffix}
                          placeholder=" | My Academy"
                        />
                      </Form.Control>
                    </FormField>
                    <FormField name="default_meta_description">
                      <FormLabelAndMessage label="Default Description" />
                      <Form.Control asChild>
                        <Textarea
                          className={`${fieldClassName} min-h-[80px]`}
                          onChange={handleFieldChange}
                          value={values.default_meta_description}
                          placeholder="A brief description of your organization for search engines"
                        />
                      </Form.Control>
                    </FormField>
                  </div>
                </div>

                {/* ===== Card 3: Social & Open Graph ===== */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                    Social & Open Graph
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Default OG Image</label>
                      <p className="text-xs text-gray-500 mb-2 mt-0">
                        Default sharing image for social media (1200x630 recommended)
                      </p>
                      <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-ui-bg-field">
                        <div className="flex-shrink-0">
                          <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            {existingOgImageUrl || ogImagePreview ? 'OG Image set' : 'No OG Image set'}
                          </p>
                        </div>
                        <input
                          ref={ogImageInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={handleOgImageChange}
                          className="hidden"
                        />
                        {existingOgImageUrl || ogImagePreview ? (
                          <button
                            type="button"
                            onClick={clearOgImage}
                            className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove OG image"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => ogImageInputRef.current?.click()}
                            className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Upload OG image"
                          >
                            <UploadCloud size={18} />
                          </button>
                        )}
                      </div>
                      {(ogImagePreview || existingOgImageUrl) && (
                        <div className="mt-3 max-w-[480px]">
                          <img
                            src={ogImagePreview || existingOgImageUrl || ''}
                            alt="OG Image Preview"
                            className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                    <FormField name="twitter_handle">
                      <FormLabelAndMessage label="Twitter Handle" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={handleFieldChange}
                          value={values.twitter_handle}
                          placeholder="@yourhandle"
                        />
                      </Form.Control>
                    </FormField>
                  </div>
                </div>

                {/* ===== Card 4: Search Engine Verification ===== */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                    Search Engine Verification
                  </h3>
                  <div className="space-y-4">
                    <FormField name="google_site_verification">
                      <FormLabelAndMessage label="Google Search Console" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={handleFieldChange}
                          value={values.google_site_verification}
                          placeholder="Google verification code"
                        />
                      </Form.Control>
                    </FormField>
                  </div>
                </div>

                {/* ===== Card 5: Indexing Controls ===== */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                    Indexing Controls
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          values.noindex_communities ? 'bg-black' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            values.noindex_communities
                              ? 'translate-x-[18px]'
                              : 'translate-x-[2px]'
                          }`}
                        />
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={values.noindex_communities}
                          onChange={(e) => {
                            setFieldValue('noindex_communities', e.target.checked)
                            setIsSaved(false)
                          }}
                          name="noindex_communities"
                          id="noindex_communities"
                        />
                      </div>
                      <span className="text-sm text-gray-600 select-none">Hide Communities</span>
                    </label>
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

export default OrgEditSEO
