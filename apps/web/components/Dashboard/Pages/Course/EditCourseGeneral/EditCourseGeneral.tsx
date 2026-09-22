'use client'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form';
import { useFormik } from 'formik';
import { AlertTriangle } from 'lucide-react';
import * as Form from '@radix-ui/react-form';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ThumbnailUpdate from './ThumbnailUpdate';
import { useCourseFieldSync } from '@components/Contexts/CourseContext';
import LearningItemsList from './LearningItemsList';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from 'react-i18next';
import { SafeImage } from '@components/Objects/SafeImage';
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from './CustomSelect';

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
const selectTriggerClassName = "w-full bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none data-[state=open]:!shadow-none transition-none";

function EditCourseGeneral(props: EditCourseStructureProps) {
  const { t } = useTranslation()
  const [error, setError] = useState('');

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

            <div className="space-y-8">
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
                      <Select
                        value={formik.values.meta_difficulty}
                        onValueChange={(value) => formik.setFieldValue('meta_difficulty', value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className={selectTriggerClassName}>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={formik.values.meta_has_certificate}
                        onCheckedChange={(checked) => formik.setFieldValue('meta_has_certificate', checked)}
                        disabled={isSaving}
                        className="!shadow-none focus-visible:!shadow-none"
                      />
                      <span className="text-sm text-gray-600">This course offers a certificate of completion</span>
                    </div>
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
