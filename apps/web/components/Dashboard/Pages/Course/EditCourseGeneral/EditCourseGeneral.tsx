'use client'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form';
import { useFormik } from 'formik';
import { AlertTriangle, Eye, Globe, GlobeLock, Loader2, Check, SaveAllIcon } from 'lucide-react';
import * as Form from '@radix-ui/react-form';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ThumbnailUpdate from './ThumbnailUpdate';
import {
  useCourseFieldSync,
  useCourseDispatch,
  getCourseMetaCacheKey,
  useCourse,
  useDebounceManager,
} from '@components/Contexts/CourseContext';
import LearningItemsList from './LearningItemsList';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { SafeImage } from '@components/Objects/SafeImage';
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from './CustomSelect';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import { updateCourse } from '@services/courses/courses';
import { revalidateTags } from '@services/utils/ts/requests';
import { mutate } from 'swr';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getUriWithOrg } from '@services/config/config';
import { useOrg } from '@components/Contexts/OrgContext';

type EditCourseStructureProps = {
  orgslug: string
  course_uuid?: string
}

const validate = (values: any, t: any) => {
  const errors = {} as any;

  if (!values.name) {
    errors.name = t('dashboard.courses.general.form.name_required');
  } else if (values.name.length > 100) {
    errors.name = t('dashboard.courses.general.form.name_max_length');
  }

  if (!values.description) {
    errors.description = t('dashboard.courses.general.form.description_required');
  } else if (values.description.length > 1000) {
    errors.description = t('dashboard.courses.general.form.description_max_length');
  }

  if (!values.learnings) {
    errors.learnings = t('dashboard.courses.general.form.learnings_required');
  } else {
    try {
      const learningItems = JSON.parse(values.learnings);
      if (!Array.isArray(learningItems)) {
        errors.learnings = t('dashboard.courses.general.form.learnings_invalid_format');
      } else if (learningItems.length === 0) {
        errors.learnings = t('dashboard.courses.general.form.learnings_min_items');
      } else {
        // Check if any item has empty text
        const hasEmptyText = learningItems.some(item => !item.text || item.text.trim() === '');
        if (hasEmptyText) {
          errors.learnings = t('dashboard.courses.general.form.learnings_empty_text');
        }
      }
    } catch (e) {
      errors.learnings = t('dashboard.courses.general.form.learnings_invalid_json');
    }
  }

  // Validate requirements items (optional field, but if items exist, they must have text)
  if (values.meta_requirements) {
    try {
      const reqItems = JSON.parse(values.meta_requirements);
      if (Array.isArray(reqItems)) {
        const hasEmptyText = reqItems.some(item => !item.text || item.text.trim() === '');
        if (hasEmptyText) {
          errors.meta_requirements = 'All requirement items must have text';
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  return errors;
};

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none";

function EditCourseGeneral(props: EditCourseStructureProps) {
  const { t } = useTranslation()
  const [error, setError] = useState('');
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const dispatchCourse = useCourseDispatch() as any;
  const session = useLHSession() as any;
  const org = useOrg() as any;
  const course = useCourse() as any;
  const withUnpublishedActivities = course?.withUnpublishedActivities ?? false;
  const debounceManager = useDebounceManager();

  // Use the new field sync hook
  const {
    syncChanges,
    courseStructure,
    isLoading,
    isSaving,
  } = useCourseFieldSync('editCourseGeneral');

  const previousValuesRef = useRef<any>(null);

  // Initialize learnings as a JSON array if it's not already
  const initializeLearnings = useCallback((learnings: any) => {
    if (!learnings) {
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    }

    try {
      const parsed = JSON.parse(learnings);
      if (Array.isArray(parsed)) {
        return learnings;
      }
      if (typeof learnings === 'string') {
        return JSON.stringify([{
          id: 'default-1',
          text: learnings,
          emoji: '📝'
        }]);
      }
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    } catch (e) {
      if (typeof learnings === 'string') {
        return JSON.stringify([{
          id: 'default-1',
          text: learnings,
          emoji: '📝'
        }]);
      }
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    }
  }, []);

  const initializeRequirements = useCallback((requirements: any) => {
    if (!requirements) {
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    }
    try {
      const parsed = JSON.parse(requirements);
      if (Array.isArray(parsed)) {
        return requirements;
      }
      if (typeof requirements === 'string') {
        return JSON.stringify([{
          id: 'default-1',
          text: requirements,
          emoji: '📝'
        }]);
      }
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    } catch (e) {
      if (typeof requirements === 'string') {
        return JSON.stringify([{
          id: 'default-1',
          text: requirements,
          emoji: '📝'
        }]);
      }
      return JSON.stringify([{ id: 'default-1', text: '', emoji: '📝' }]);
    }
  }, []);

  // Memoize initial values to prevent unnecessary recalculations
  const initialValues = useMemo(() => {
    const thumbnailType = courseStructure?.thumbnail_type || 'image';
    const meta = courseStructure?.extra_metadata || {};
    return {
      name: courseStructure?.name || '',
      description: courseStructure?.description || '',
      about: courseStructure?.about || '',
      learnings: initializeLearnings(courseStructure?.learnings || ''),
      public: courseStructure?.public || false,
      thumbnail_type: thumbnailType,
      // extra_metadata fields
      meta_difficulty: meta.difficulty || '',
      meta_duration: meta.duration || '',
      meta_video_hours: meta.video_hours || '',
      meta_resources_count: meta.resources_count || '',
      meta_has_certificate: meta.has_certificate || false,
      meta_requirements: initializeRequirements(meta.requirements),
      meta_instructor_name: meta.instructor?.name || '',
      meta_instructor_title: meta.instructor?.title || '',
      meta_instructor_bio: meta.instructor?.bio || '',
    };
  }, [courseStructure?.name, courseStructure?.description, courseStructure?.about,
      courseStructure?.learnings, courseStructure?.public,
      courseStructure?.thumbnail_type, courseStructure?.extra_metadata, initializeLearnings, initializeRequirements]);

  const formik = useFormik({
    initialValues,
    validate: (values) => validate(values, t),
    onSubmit: async values => {
      // The actual save is handled by SaveState component
      // This is just for form validation purposes
    },
    enableReinitialize: true,
  }) as any;

  // Sync form changes to context — compare against formik.initialValues
  // so that reinitialization from server data is never treated as a user edit
  useEffect(() => {
    if (isLoading || isSaving) return;

    // Compare current values against formik's own initialValues.
    // When enableReinitialize triggers, both update together → no false diff.
    const changes: any = {};
    Object.keys(formik.values).forEach(key => {
      if (formik.values[key] !== formik.initialValues[key]) {
        changes[key] = formik.values[key];
      }
    });

    // Build extra_metadata from prefixed meta_ fields
    const metadataFields = ['meta_difficulty', 'meta_duration', 'meta_video_hours', 'meta_resources_count', 'meta_has_certificate', 'meta_requirements', 'meta_instructor_name', 'meta_instructor_title', 'meta_instructor_bio'];
    const anyMetaChanged = metadataFields.some(f => formik.values[f] !== formik.initialValues[f]);
    if (anyMetaChanged) {
      changes.extra_metadata = {
        difficulty: formik.values.meta_difficulty,
        duration: formik.values.meta_duration,
        video_hours: formik.values.meta_video_hours,
        resources_count: formik.values.meta_resources_count,
        has_certificate: formik.values.meta_has_certificate,
        requirements: formik.values.meta_requirements,
        instructor: {
          name: formik.values.meta_instructor_name,
          title: formik.values.meta_instructor_title,
          bio: formik.values.meta_instructor_bio,
        },
      };
      // Remove the individual meta fields from top-level changes
      metadataFields.forEach(f => delete changes[f]);
    }

    const hasChanges = Object.keys(changes).length > 0;

    // Only sync when there are actual user changes AND values changed since last sync
    if (hasChanges) {
      const changesStr = JSON.stringify(changes);
      const prevStr = JSON.stringify(previousValuesRef.current);
      if (changesStr !== prevStr) {
        previousValuesRef.current = changes;
        syncChanges(changes);
      }
    } else {
      previousValuesRef.current = null;
    }
  }, [formik.values, formik.initialValues, isLoading, isSaving, syncChanges]);

  const isPublished = courseStructure?.published ?? false;
  const courseUUID = courseStructure?.course_uuid ?? ''
  const courseUUIDForUrl = courseUUID.replace('course_', '');
  const cacheKey = courseUUID
    ? getCourseMetaCacheKey(courseUUID, withUnpublishedActivities)
    : null;

  const togglePublishStatus = useCallback(async () => {
    if (isPublishing || !courseUUID) return;
    setIsPublishing(true);

    const newPublishedStatus = !isPublished;
    const toastMessage = newPublishedStatus
      ? t('dashboard.courses.publishing')
      : t('dashboard.courses.unpublishing');
    const toastId = toast.loading(toastMessage);

    const previousState = { ...courseStructure };
    dispatchCourse({
      type: 'mergePendingChanges',
      payload: { published: newPublishedStatus }
    });

    try {
      await updateCourse(
        courseUUID,
        { published: newPublishedStatus },
        session.data?.tokens?.access_token
      );

      if (cacheKey) {
        await mutate(cacheKey, { ...courseStructure, published: newPublishedStatus }, { revalidate: false });
      }

      await revalidateTags(['courses'], props.orgslug);

      toast.dismiss(toastId);
      toast.success(
        newPublishedStatus
          ? t('dashboard.courses.published_success')
          : t('dashboard.courses.unpublished_success')
      );
    } catch (error) {
      dispatchCourse({
        type: 'mergePendingChanges',
        payload: { published: previousState.published }
      });
      toast.dismiss(toastId);
      toast.error(t('dashboard.courses.publish_error'));
    } finally {
      setIsPublishing(false);
    }
  }, [
    isPublishing, isPublished, courseStructure, courseUUID, cacheKey,
    session.data?.tokens?.access_token, dispatchCourse, props.orgslug, t
  ]);

  const isSaved = course?.isSaved ?? true;
  const isActiveSaving = isSaving || isManualSaving;

  const handleManualSave = useCallback(async () => {
    if (isActiveSaving || !courseUUID) return;
    setIsManualSaving(true);

    // Cancel any pending debounced saves
    debounceManager.cancelAll();

    dispatchCourse({ type: 'setSaving', payload: true });

    try {
      await updateCourse(
        courseUUID,
        courseStructure,
        session.data?.tokens?.access_token
      );

      if (cacheKey) {
        await mutate(cacheKey, { ...courseStructure }, { revalidate: false });
      }
      await revalidateTags(['courses'], props.orgslug);

      dispatchCourse({ type: 'setIsSaved' });
      toast.success('Changes saved');
    } catch (error) {
      dispatchCourse({ type: 'setSaveError', payload: 'Failed to save' });
      toast.error('Failed to save');
    } finally {
      dispatchCourse({ type: 'setSaving', payload: false });
      setIsManualSaving(false);
    }
  }, [isActiveSaving, courseUUID, courseStructure, cacheKey, session.data?.tokens?.access_token, dispatchCourse, props.orgslug, debounceManager]);

  // useCourseFieldSync handles the unmount cleanup (flushing pending edits
  // instead of discarding them), so no local cleanup is needed here.

  if (isLoading || !courseStructure) {
    return <div>{t('dashboard.courses.settings.loading')}</div>;
  }

  return (
    <div>
      <FormLayout onSubmit={formik.handleSubmit}>
            {error && (
              <div className="flex justify-center bg-red-200 rounded-md text-red-950 space-x-2 items-center p-4 mb-6 transition-all shadow-xs">
                <AlertTriangle size={18} />
                <div className="font-bold text-sm">{error}</div>
              </div>
            )}

            <div className="space-y-3">
              {/* ── ACTION ROW ── */}
              <div className="flex items-center justify-between">
                {/* Left: Preview */}
                <Link
                  href={getUriWithOrg(org?.slug, '') + `/course/${courseUUIDForUrl}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </Link>

                {/* Right: Save + Publish */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={isSaved ? undefined : handleManualSave}
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
                  <button
                    onClick={togglePublishStatus}
                    disabled={isPublishing}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ${isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isPublishing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isPublished ? (
                      <Globe size={14} />
                    ) : (
                      <GlobeLock size={14} />
                    )}
                    <span>
                      {isPublishing
                        ? 'Processing...'
                        : isPublished
                          ? 'Published'
                          : 'Unpublished'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── BASIC INFORMATION ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Basic Information</h3>
                <div className="space-y-4">
                  <FormField name="name">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.name_label')} message={formik.errors.name} />
                    <Form.Control asChild>
                      <Input
                        className={fieldClassName}
                        onChange={formik.handleChange}
                        value={formik.values.name}
                        type="text"
                        required
                        disabled={isSaving}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="description">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.description_label')} message={formik.errors.description} />
                    <Form.Control asChild>
                      <Input
                        className={fieldClassName}
                        onChange={formik.handleChange}
                        value={formik.values.description}
                        type="text"
                        required
                        disabled={isSaving}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="about">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.about_label')} message={formik.errors.about} />
                    <Form.Control asChild>
                      <Textarea
                        className={`${fieldClassName} min-h-[200px]`}
                        onChange={formik.handleChange}
                        value={formik.values.about}
                        required
                        disabled={isSaving}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="learnings">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.learnings_label')} message={formik.touched.learnings ? formik.errors.learnings : undefined} />
                    <Form.Control asChild>
                      <LearningItemsList
                        value={formik.values.learnings}
                        onChange={(value) => {
                          formik.setFieldTouched('learnings', true, false)
                          formik.setFieldValue('learnings', value)
                        }}
                        error={formik.touched.learnings ? formik.errors.learnings : undefined}
                      />
                    </Form.Control>
                  </FormField>

                  <FormField name="meta_requirements">
                    <FormLabelAndMessage label="Requirements" message={formik.touched.meta_requirements ? formik.errors.meta_requirements : undefined} />
                    <Form.Control asChild>
                      <LearningItemsList
                        value={formik.values.meta_requirements}
                        onChange={(value) => {
                          formik.setFieldTouched('meta_requirements', true, false)
                          formik.setFieldValue('meta_requirements', value)
                        }}
                        error={formik.touched.meta_requirements ? formik.errors.meta_requirements : undefined}
                      />
                    </Form.Control>
                  </FormField>

                </div>
              </div>

              {/* ── MEDIA ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Media</h3>
                <div className="space-y-4">
                  <FormField name="thumbnail_type">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.thumbnail_type_label')} />
                    <Form.Control asChild>
                      <CustomSelect
                        value={formik.values.thumbnail_type}
                        onValueChange={(value) => {
                          if (!value) return;
                          formik.setFieldValue('thumbnail_type', value);
                        }}
                        disabled={isSaving}
                      >
                        <CustomSelectTrigger className="w-full bg-white">
                          <CustomSelectValue>
                            {formik.values.thumbnail_type === 'image' ? t('dashboard.courses.general.form.thumbnail_type_image') :
                             formik.values.thumbnail_type === 'video' ? t('dashboard.courses.general.form.thumbnail_type_video') :
                             formik.values.thumbnail_type === 'both' ? t('dashboard.courses.general.form.thumbnail_type_both') :
                             t('dashboard.courses.general.form.thumbnail_type_image')}
                          </CustomSelectValue>
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="image">{t('dashboard.courses.general.form.thumbnail_type_image')}</CustomSelectItem>
                          <CustomSelectItem value="video">{t('dashboard.courses.general.form.thumbnail_type_video')}</CustomSelectItem>
                          <CustomSelectItem value="both">{t('dashboard.courses.general.form.thumbnail_type_both')}</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    </Form.Control>
                  </FormField>

                  <FormField name="thumbnail">
                    <FormLabelAndMessage label={t('dashboard.courses.general.form.thumbnail_label')} />
                    <Form.Control asChild>
                      <ThumbnailUpdate thumbnailType={formik.values.thumbnail_type} />
                    </Form.Control>
                  </FormField>
                </div>
              </div>

              {/* ── COURSE DETAILS ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Course Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="meta_difficulty">
                      <FormLabelAndMessage label="Difficulty" />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDifficultyOpen(!difficultyOpen)}
                          disabled={isSaving}
                          className={`flex h-9 w-full items-center justify-between rounded-md px-3 py-2 text-sm ${fieldClassName} ${!formik.values.meta_difficulty ? 'text-gray-400' : ''}`}
                        >
                          <span>{formik.values.meta_difficulty || 'Select difficulty'}</span>
                          <svg className={`h-4 w-4 text-gray-400 transition-transform ${difficultyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {difficultyOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setDifficultyOpen(false)} />
                            <div className="absolute z-20 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-ui-border-base bg-white shadow-md">
                              {['Beginner', 'Intermediate', 'Advanced'].map((option) => (
                                <div
                                  key={option}
                                  className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-8 text-sm hover:bg-gray-100 ${formik.values.meta_difficulty === option ? 'bg-gray-50 font-medium' : ''}`}
                                  onClick={() => {
                                    formik.setFieldValue('meta_difficulty', option);
                                    setDifficultyOpen(false);
                                  }}
                                >
                                  {option}
                                  {formik.values.meta_difficulty === option && (
                                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </FormField>

                    <FormField name="meta_duration">
                      <FormLabelAndMessage label="Duration (e.g. '6 hours')" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={formik.handleChange}
                          value={formik.values.meta_duration}
                          type="text"
                          disabled={isSaving}
                        />
                      </Form.Control>
                    </FormField>

                    <FormField name="meta_video_hours">
                      <FormLabelAndMessage label="Video Hours" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={formik.handleChange}
                          value={formik.values.meta_video_hours}
                          type="text"
                          disabled={isSaving}
                        />
                      </Form.Control>
                    </FormField>

                    <FormField name="meta_resources_count">
                      <FormLabelAndMessage label="Number of Resources" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={formik.handleChange}
                          value={formik.values.meta_resources_count}
                          type="text"
                          disabled={isSaving}
                        />
                      </Form.Control>
                    </FormField>
                  </div>

                  <FormField name="meta_has_certificate">
                    <FormLabelAndMessage label="Offers Certificate" />
                    <label className="flex items-center gap-3 pt-1 cursor-pointer">
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formik.values.meta_has_certificate ? 'bg-black' : 'bg-gray-300'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formik.values.meta_has_certificate ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formik.values.meta_has_certificate}
                          onChange={(e) => formik.setFieldValue('meta_has_certificate', e.target.checked)}
                          disabled={isSaving}
                        />
                      </div>
                      <span className="text-sm text-gray-600 select-none">This course offers a certificate of completion</span>
                    </label>
                  </FormField>

                </div>
              </div>

              {/* ── INSTRUCTOR ── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Instructor</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="meta_instructor_name">
                      <FormLabelAndMessage label="Instructor Name" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={formik.handleChange}
                          value={formik.values.meta_instructor_name}
                          type="text"
                          disabled={isSaving}
                        />
                      </Form.Control>
                    </FormField>

                    <FormField name="meta_instructor_title">
                      <FormLabelAndMessage label="Instructor Title" />
                      <Form.Control asChild>
                        <Input
                          className={fieldClassName}
                          onChange={formik.handleChange}
                          value={formik.values.meta_instructor_title}
                          type="text"
                          disabled={isSaving}
                        />
                      </Form.Control>
                    </FormField>
                  </div>

                  <FormField name="meta_instructor_bio">
                    <FormLabelAndMessage label="Instructor Bio" />
                    <Form.Control asChild>
                      <Textarea
                        className={`${fieldClassName} min-h-[100px]`}
                        onChange={formik.handleChange}
                        value={formik.values.meta_instructor_bio}
                        disabled={isSaving}
                      />
                    </Form.Control>
                  </FormField>
                </div>
              </div>
            </div>
          </FormLayout>
        </div>
  );
}

export default EditCourseGeneral;
