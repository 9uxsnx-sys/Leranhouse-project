'use client'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form';
import { useFormik } from 'formik';
import { AlertTriangle, Loader2, Check, SaveAllIcon } from 'lucide-react';
import * as Form from '@radix-ui/react-form';
import React, { useEffect, useRef, useMemo } from 'react';
import { useCourseFieldSync } from '@components/Contexts/CourseContext';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { useTranslation } from 'react-i18next';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import { useCourseTranslation } from '@components/Hooks/useCourseTranslation';
import {
  getCourseTranslations,
  upsertCourseTranslation,
} from '@services/courses/translations';
import { getCurrentLanguageNativeName } from '@/lib/languages';
import { revalidateTags } from '@services/utils/ts/requests';
import toast from 'react-hot-toast';

type EditCourseSEOProps = {
  orgslug: string
  course_uuid?: string
}

interface SEOValues {
  title: string
  description: string
  keywords: string
  canonical_url: string
  og_title: string
  og_description: string
  og_image: string
  twitter_card: string
  twitter_title: string
  twitter_description: string
  robots_noindex: boolean
  robots_nofollow: boolean
  enable_jsonld: boolean
}

const validate = (values: SEOValues, t: any) => {
  const errors = {} as Partial<SEOValues>;

  if (values.title && values.title.length > 70) {
    errors.title = t('dashboard.courses.seo.validation.title_max_length');
  }

  if (values.description && values.description.length > 160) {
    errors.description = t('dashboard.courses.seo.validation.description_max_length');
  }

  if (values.og_title && values.og_title.length > 70) {
    errors.og_title = t('dashboard.courses.seo.validation.og_title_max_length');
  }

  if (values.og_description && values.og_description.length > 200) {
    errors.og_description = t('dashboard.courses.seo.validation.og_description_max_length');
  }

  if (values.twitter_title && values.twitter_title.length > 70) {
    errors.twitter_title = t('dashboard.courses.seo.validation.twitter_title_max_length');
  }

  if (values.twitter_description && values.twitter_description.length > 200) {
    errors.twitter_description = t('dashboard.courses.seo.validation.twitter_description_max_length');
  }

  if (values.canonical_url && !isValidUrl(values.canonical_url)) {
    errors.canonical_url = t('dashboard.courses.seo.validation.invalid_url');
  }

  if (values.og_image && !isValidUrl(values.og_image)) {
    errors.og_image = t('dashboard.courses.seo.validation.invalid_url');
  }

  return errors;
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Shape expected by the API — empty strings are stored as null so the resolver
// can fall back to the course fields.
const toSeoData = (values: SEOValues) => ({
  title: values.title || null,
  description: values.description || null,
  keywords: values.keywords || null,
  canonical_url: values.canonical_url || null,
  og_title: values.og_title || null,
  og_description: values.og_description || null,
  og_image: values.og_image || null,
  twitter_card: values.twitter_card || null,
  twitter_title: values.twitter_title || null,
  twitter_description: values.twitter_description || null,
  robots_noindex: values.robots_noindex,
  robots_nofollow: values.robots_nofollow,
  enable_jsonld: values.enable_jsonld,
});

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none";

function EditCourseSEO(props: EditCourseSEOProps) {
  const { t } = useTranslation()
  const [error, setError] = React.useState('');
  const session = useLHSession() as any;

  const {
    syncChanges,
    courseStructure,
    isLoading,
    isSaving,
  } = useCourseFieldSync('editCourseSEO');

  // ── Content locale ──
  // Editing in any locale other than the source writes the translation row
  // instead of the shared course structure.
  const {
    contentLocale,
    isSourceLocale,
    translation,
    setTranslation,
  } = useCourseTranslation(courseStructure?.course_uuid, courseStructure?.source_locale || 'en')
  const [isSavingTranslation, setIsSavingTranslation] = React.useState(false)

  const hasInitializedRef = useRef(false);
  const previousValuesRef = useRef<SEOValues | null>(null);

  const initialValues = useMemo((): SEOValues => {
    const seo = (!isSourceLocale && translation?.seo) ? translation.seo : (courseStructure?.seo || {});
    return {
      title: seo.title || '',
      description: seo.description || '',
      keywords: seo.keywords || '',
      canonical_url: seo.canonical_url || '',
      og_title: seo.og_title || '',
      og_description: seo.og_description || '',
      og_image: seo.og_image || '',
      twitter_card: seo.twitter_card || 'summary_large_image',
      twitter_title: seo.twitter_title || '',
      twitter_description: seo.twitter_description || '',
      robots_noindex: seo.robots_noindex || false,
      robots_nofollow: seo.robots_nofollow || false,
      enable_jsonld: seo.enable_jsonld !== false,
    };
  }, [courseStructure?.seo, translation, isSourceLocale]);

  const formik = useFormik({
    initialValues,
    validate: (values) => validate(values, t),
    onSubmit: async () => {},
    enableReinitialize: true,
  });

  useEffect(() => {
    // Translation edits are saved through the translations endpoint.
    if (!isSourceLocale) return;
    if (isLoading || isSaving) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousValuesRef.current = formik.values;
      return;
    }

    const prevValues = previousValuesRef.current;
    if (!prevValues) {
      previousValuesRef.current = formik.values;
      return;
    }

    const hasChanges = Object.keys(formik.values).some(
      key => formik.values[key as keyof SEOValues] !== prevValues[key as keyof SEOValues]
    );

    if (hasChanges) {
      syncChanges({ seo: toSeoData(formik.values) });
      previousValuesRef.current = { ...formik.values };
    }
  }, [formik.values, isLoading, isSaving, syncChanges, isSourceLocale]);

  // A translation row cannot exist without the general fields, so SEO stays
  // read-only until the General tab has been translated once.
  const isTranslationLocked = !isSourceLocale && !translation
  const isDisabled = isSaving || isTranslationLocked

  const hasTranslationChanges =
    !isSourceLocale &&
    Object.keys(formik.values).some(
      key => formik.values[key as keyof SEOValues] !== formik.initialValues[key as keyof SEOValues]
    )
  const isSaved = !hasTranslationChanges

  const handleSaveTranslation = async () => {
    if (!courseStructure?.course_uuid || !translation || isSavingTranslation) return
    setIsSavingTranslation(true)
    try {
      await upsertCourseTranslation(
        courseStructure.course_uuid,
        contentLocale,
        {
          name: translation.name,
          description: translation.description,
          about: translation.about,
          learnings: translation.learnings,
          tags: translation.tags,
          seo: toSeoData(formik.values),
        },
        session?.data?.tokens?.access_token
      )
      const rows = await getCourseTranslations(courseStructure.course_uuid, session?.data?.tokens?.access_token)
      setTranslation(rows.find(row => row.locale === contentLocale) || null)
      // SEO feeds the learner <head>, which is server-rendered from a tagged cache.
      await revalidateTags(['courses'], props.orgslug)
      toast.success(t('dashboard.courses.save.success'))
    } catch (err) {
      toast.error(t('dashboard.courses.save.error'))
    } finally {
      setIsSavingTranslation(false)
    }
  }

  if (isLoading || !courseStructure) {
    return <div>{t('dashboard.courses.settings.loading')}</div>;
  }

  return (
    <div>
      <FormLayout onSubmit={formik.handleSubmit}>
        <div className="space-y-3">
          {error && (
            <div className="flex justify-center bg-red-200 rounded-md text-red-950 space-x-2 items-center p-4 mb-6 transition-all shadow-xs">
              <AlertTriangle size={18} />
              <div className="font-bold text-sm">{error}</div>
            </div>
          )}

          {/* Action row — translations are saved explicitly, the source locale autosaves */}
          {!isSourceLocale && (
            <div className="flex items-center justify-end gap-2">
              <span
                className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600"
                title={t('dashboard.courses.general.locale.translation')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-teal-500' : 'bg-amber-400'}`} />
                <span>{getCurrentLanguageNativeName(contentLocale)}</span>
                <span className="text-gray-400">
                  {translation
                    ? t('dashboard.courses.general.locale.translation')
                    : t('dashboard.courses.general.locale.missing')}
                </span>
              </span>
              <button
                type="button"
                onClick={handleSaveTranslation}
                disabled={isSaved || isSavingTranslation || isTranslationLocked}
                className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                  isSavingTranslation
                    ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                    : isSaved
                      ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                      : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                }`}
              >
                {isSavingTranslation ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isSaved ? (
                  <Check size={14} />
                ) : (
                  <SaveAllIcon size={14} />
                )}
                <span>
                  {isSavingTranslation
                    ? t('dashboard.courses.save.saving')
                    : isSaved
                      ? t('dashboard.courses.save.saved')
                      : t('dashboard.courses.save.save')}
                </span>
              </button>
            </div>
          )}

          {isTranslationLocked && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              {t('dashboard.courses.seo.locale.needs_translation')}
            </div>
          )}

          {/* Basic SEO */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.courses.seo.sections.basic.title')}
            </h3>
            <div className="space-y-4">
              <FormField name="title">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.title_label')}
                  message={formik.errors.title}
                />
                <Form.Control asChild>
                  <Input
                    className={fieldClassName}
                    onChange={formik.handleChange}
                    value={formik.values.title}
                    type="text"
                    placeholder={t('dashboard.courses.seo.form.title_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>

              <FormField name="description">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.description_label')}
                  message={formik.errors.description}
                />
                <Form.Control asChild>
                  <Textarea
                    className={`${fieldClassName} min-h-[80px]`}
                    onChange={formik.handleChange}
                    value={formik.values.description}
                    placeholder={t('dashboard.courses.seo.form.description_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>

              <FormField name="keywords">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.keywords_label')}
                  message={formik.errors.keywords}
                />
                <Form.Control asChild>
                  <Input
                    className={fieldClassName}
                    onChange={formik.handleChange}
                    value={formik.values.keywords}
                    type="text"
                    placeholder={t('dashboard.courses.seo.form.keywords_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>

              <FormField name="canonical_url">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.canonical_url_label')}
                  message={formik.errors.canonical_url}
                />
                <Form.Control asChild>
                  <Input
                    className={fieldClassName}
                    onChange={formik.handleChange}
                    value={formik.values.canonical_url}
                    type="text"
                    placeholder={t('dashboard.courses.seo.form.canonical_url_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.courses.seo.sections.opengraph.title')}
            </h3>
            <div className="space-y-4">
              <FormField name="og_title">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.og_title_label')}
                  message={formik.errors.og_title}
                />
                <Form.Control asChild>
                  <Input
                    className={fieldClassName}
                    onChange={formik.handleChange}
                    value={formik.values.og_title}
                    type="text"
                    placeholder={t('dashboard.courses.seo.form.og_title_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>

              <FormField name="og_description">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.og_description_label')}
                  message={formik.errors.og_description}
                />
                <Form.Control asChild>
                  <Textarea
                    className={`${fieldClassName} min-h-[80px]`}
                    onChange={formik.handleChange}
                    value={formik.values.og_description}
                    placeholder={t('dashboard.courses.seo.form.og_description_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>

              <FormField name="og_image">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.og_image_label')}
                  message={formik.errors.og_image}
                />
                <Form.Control asChild>
                  <Input
                    className={fieldClassName}
                    onChange={formik.handleChange}
                    value={formik.values.og_image}
                    type="text"
                    placeholder={t('dashboard.courses.seo.form.og_image_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.courses.seo.sections.twitter.title')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField name="twitter_card">
                  <FormLabelAndMessage
                    label={t('dashboard.courses.seo.form.twitter_card_label')}
                  />
                  <Select
                    value={formik.values.twitter_card || undefined}
                    onValueChange={(value) => formik.setFieldValue('twitter_card', value)}
                    disabled={isDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('dashboard.courses.seo.form.select_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">{t('dashboard.courses.seo.form.twitter_card_summary')}</SelectItem>
                      <SelectItem value="summary_large_image">{t('dashboard.courses.seo.form.twitter_card_summary_large')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField name="twitter_title">
                  <FormLabelAndMessage
                    label={t('dashboard.courses.seo.form.twitter_title_label')}
                    message={formik.errors.twitter_title}
                  />
                  <Form.Control asChild>
                    <Input
                      className={fieldClassName}
                      onChange={formik.handleChange}
                      value={formik.values.twitter_title}
                      type="text"
                      placeholder={t('dashboard.courses.seo.form.twitter_title_placeholder')}
                      disabled={isDisabled}
                    />
                  </Form.Control>
                </FormField>
              </div>

              <FormField name="twitter_description">
                <FormLabelAndMessage
                  label={t('dashboard.courses.seo.form.twitter_description_label')}
                  message={formik.errors.twitter_description}
                />
                <Form.Control asChild>
                  <Textarea
                    className={`${fieldClassName} min-h-[80px]`}
                    onChange={formik.handleChange}
                    value={formik.values.twitter_description}
                    placeholder={t('dashboard.courses.seo.form.twitter_description_placeholder')}
                    disabled={isDisabled}
                  />
                </Form.Control>
              </FormField>
            </div>
          </div>

          {/* Robots & Structured Data */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.courses.seo.sections.robots.title')}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formik.values.robots_noindex ? 'bg-black' : 'bg-gray-300'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formik.values.robots_noindex ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formik.values.robots_noindex}
                    onChange={formik.handleChange}
                    name="robots_noindex"
                    id="robots_noindex"
                    disabled={isDisabled}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.seo.form.robots_noindex_label')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formik.values.robots_nofollow ? 'bg-black' : 'bg-gray-300'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formik.values.robots_nofollow ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formik.values.robots_nofollow}
                    onChange={formik.handleChange}
                    name="robots_nofollow"
                    id="robots_nofollow"
                    disabled={isDisabled}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.seo.form.robots_nofollow_label')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formik.values.enable_jsonld ? 'bg-black' : 'bg-gray-300'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formik.values.enable_jsonld ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formik.values.enable_jsonld}
                    onChange={formik.handleChange}
                    name="enable_jsonld"
                    id="enable_jsonld"
                    disabled={isDisabled}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.seo.form.enable_jsonld_label')}</span>
              </label>
            </div>
          </div>
        </div>
      </FormLayout>
    </div>
  );
}

export default EditCourseSEO;
