import {
  FormField,
  FormLabelAndMessage,
  Input,
  Textarea,
} from '@components/Objects/StyledElements/Form/Form';
import { useFormik } from 'formik';
import { AlertTriangle, Award, Settings } from 'lucide-react';
import CertificatePreview from './CertificatePreview';
import * as Form from '@radix-ui/react-form';
import React, { useEffect, useState, useRef } from 'react';
import { useCourseFieldSync, useCourse } from '@components/Contexts/CourseContext';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import { useOrg } from '@components/Contexts/OrgContext';
import { 
  createCertification, 
  deleteCertification 
} from '@services/courses/certifications';
import SimpleDropdown from "../EditCourseSEO/SimpleDropdown";
import useSWR from 'swr';
import { getAPIUrl } from '@services/config/config';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type EditCourseCertificationProps = {
  orgslug: string
  course_uuid?: string
}

const validate = (values: any, t: any) => {
  const errors = {} as any;

  if (values.enable_certification && !values.certification_name) {
    errors.certification_name = t('dashboard.courses.certification.form.certification_name_required');
  } else if (values.certification_name && values.certification_name.length > 100) {
    errors.certification_name = t('dashboard.courses.certification.form.certification_name_max_length');
  }

  if (values.enable_certification && !values.certification_description) {
    errors.certification_description = t('dashboard.courses.certification.form.certification_description_required');
  } else if (values.certification_description && values.certification_description.length > 500) {
    errors.certification_description = t('dashboard.courses.certification.form.certification_description_max_length');
  }

  return errors;
};

function EditCourseCertification(props: EditCourseCertificationProps) {
  const { t } = useTranslation()
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const course = useCourse() as any;
  const session = useLHSession() as any;
  const org = useOrg() as any;
  const access_token = session?.data?.tokens?.access_token;

  const {
    syncChanges,
    courseStructure,
    isLoading,
    isSaving,
  } = useCourseFieldSync('editCourseCertification');

  const previousValuesRef = useRef<any>(null);
  const hasInitializedRef = useRef(false);

  const { data: certifications, error: certificationsError, mutate: mutateCertifications } = useSWR(
    courseStructure?.course_uuid && access_token && org?.id ?
    `certifications/course/${courseStructure.course_uuid}?org_id=${org.id}` : null,
    async () => {
      if (!courseStructure?.course_uuid || !access_token || !org?.id) return null;
      const result = await fetch(
        `${getAPIUrl()}certifications/course/${courseStructure.course_uuid}?org_id=${org.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          credentials: 'include',
        }
      );
      const response = await result.json();
      
      if (result.status === 200) {
        return {
          success: true,
          data: response,
          status: result.status,
          HTTPmessage: result.statusText,
        };
      } else {
        return {
          success: false,
          data: response,
          status: result.status,
          HTTPmessage: result.statusText,
        };
      }
    },
    { revalidateOnFocus: false }
  );

  const existingCertification = certifications?.data?.[0];
  const hasExistingCertification = !!existingCertification;

  const getInitialValues = () => {
    const getInstructorName = () => {
      if (courseStructure?.authors && courseStructure.authors.length > 0) {
        const author = courseStructure.authors[0];
        const firstName = author.first_name || '';
        const lastName = author.last_name || '';
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
      }
      return '';
    };

    const config = existingCertification?.config || {};
    
    return {
      enable_certification: hasExistingCertification,
      certification_name: config.certification_name || courseStructure?.name || '',
      certification_description: config.certification_description || courseStructure?.description || '',
      certification_type: config.certification_type || 'completion',
      certificate_pattern: config.certificate_pattern || 'professional',
      certificate_instructor: config.certificate_instructor || getInstructorName(),
    };
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    validate: (values) => validate(values, t),
    onSubmit: async values => {},
    enableReinitialize: true,
  }) as any;

  const handleCertificationToggle = async (enabled: boolean) => {
    if (enabled && !hasExistingCertification) {
      setIsCreating(true);
      try {
        const config = {
          certification_name: formik.values.certification_name || courseStructure?.name || '',
          certification_description: formik.values.certification_description || courseStructure?.description || '',
          certification_type: formik.values.certification_type || 'completion',
          certificate_pattern: formik.values.certificate_pattern || 'professional',
          certificate_instructor: formik.values.certificate_instructor || '',
        };

        const result = await createCertification(
          courseStructure.id,
          config,
          org.id,
          access_token
        );

        if (result) {
          toast.success(t('dashboard.courses.certification.toasts.create_success'));
          mutateCertifications();
          formik.setFieldValue('enable_certification', true);
        } else {
          throw new Error('Failed to create certification');
        }
      } catch (e) {
        setError(t('dashboard.courses.certification.errors.create_failed'));
        toast.error(t('dashboard.courses.certification.toasts.create_error'));
        formik.setFieldValue('enable_certification', false);
      } finally {
        setIsCreating(false);
      }
    } else if (!enabled && hasExistingCertification) {
      try {
        const result = await deleteCertification(
          existingCertification.certification_uuid,
          org.id,
          access_token
        );

        if (result) {
          toast.success(t('dashboard.courses.certification.toasts.remove_success'));
          mutateCertifications();
          formik.setFieldValue('enable_certification', false);
        } else {
          throw new Error('Failed to delete certification');
        }
      } catch (e) {
        setError(t('dashboard.courses.certification.errors.remove_failed'));
        toast.error(t('dashboard.courses.certification.toasts.remove_error'));
        formik.setFieldValue('enable_certification', true);
      }
    } else {
      formik.setFieldValue('enable_certification', enabled);
    }
  };

  useEffect(() => {
    if (certifications && !isLoading) {
      const newValues = getInitialValues();
      formik.resetForm({ values: newValues });
    }
  }, [certifications, isLoading]);

  useEffect(() => {
    if (isLoading || isSaving || !hasExistingCertification) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousValuesRef.current = formik.values;
      return;
    }

    const formikValues = formik.values as any;
    const prevValues = previousValuesRef.current;

    if (!prevValues) {
      previousValuesRef.current = formikValues;
      return;
    }

    const hasChanges = Object.keys(formikValues).some(
      key => formikValues[key] !== prevValues[key]
    );

    if (hasChanges) {
      const certificationData = {
        _certificationData: {
          certification_uuid: existingCertification.certification_uuid,
          config: {
            certification_name: formikValues.certification_name,
            certification_description: formikValues.certification_description,
            certification_type: formikValues.certification_type,
            certificate_pattern: formikValues.certificate_pattern,
            certificate_instructor: formikValues.certificate_instructor,
          }
        }
      };

      syncChanges(certificationData, true);
      previousValuesRef.current = { ...formikValues };
    }
  }, [formik.values, isLoading, isSaving, hasExistingCertification, existingCertification, syncChanges]);

  if (isLoading || !courseStructure || (courseStructure.course_uuid && access_token && certifications === undefined)) {
    return <div>{t('dashboard.courses.settings.loading')}</div>;
  }

  if (certificationsError) {
    return <div>{t('dashboard.courses.certification.errors.loading')}</div>;
  }

  const certificationTypeOptions = [
    { value: 'completion', label: t('dashboard.courses.certification.types.completion') },
    { value: 'achievement', label: t('dashboard.courses.certification.types.achievement') },
    { value: 'assessment', label: t('dashboard.courses.certification.types.assessment') },
    { value: 'participation', label: t('dashboard.courses.certification.types.participation') },
    { value: 'mastery', label: t('dashboard.courses.certification.types.mastery') },
    { value: 'professional', label: t('dashboard.courses.certification.types.professional') },
    { value: 'continuing', label: t('dashboard.courses.certification.types.continuing') },
    { value: 'workshop', label: t('dashboard.courses.certification.types.workshop') },
    { value: 'specialization', label: t('dashboard.courses.certification.types.specialization') },
  ];

  return (
    <div>
      {courseStructure && (
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold tracking-wide uppercase text-gray-500">
              {t('dashboard.courses.certification.title')}
            </span>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formik.values.enable_certification}
                  onChange={(e) => handleCertificationToggle(e.target.checked)}
                  disabled={isCreating}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
              {isCreating && (
                <div className="animate-spin">
                  <Settings size={16} />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex justify-center bg-red-200 rounded-md text-red-950 space-x-2 items-center p-4 mb-6 transition-all shadow-xs">
              <AlertTriangle size={18} />
              <div className="font-bold text-sm">{error}</div>
            </div>
          )}

          {/* Enabled State with existing certification */}
          {formik.values.enable_certification && hasExistingCertification && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-3 space-y-3">
                <Form.Root>
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5 block">
                      {t('dashboard.courses.certification.sections.basic_info.title')}
                    </span>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField name="certification_name">
                        <FormLabelAndMessage 
                          label={t('dashboard.courses.certification.form.certification_name_label')} 
                          message={formik.errors.certification_name} 
                        />
                        <Form.Control asChild>
                          <Input
                            className="bg-ui-bg-field"
                            onChange={formik.handleChange}
                            value={formik.values.certification_name}
                            type="text"
                            placeholder={t('dashboard.courses.certification.form.certification_name_placeholder')}
                            required
                          />
                        </Form.Control>
                      </FormField>

                      <FormField name="certification_type">
                        <FormLabelAndMessage label={t('dashboard.courses.certification.form.certification_type_label')} />
                        <SimpleDropdown
                          value={formik.values.certification_type}
                          onValueChange={(value) => {
                            if (!value) return;
                            formik.setFieldValue('certification_type', value);
                          }}
                          options={certificationTypeOptions}
                          disabled={isSaving}
                        />
                      </FormField>
                    </div>

                    <div className="mt-6">
                      <FormField name="certification_description">
                        <FormLabelAndMessage 
                          label={t('dashboard.courses.certification.form.certification_description_label')} 
                          message={formik.errors.certification_description} 
                        />
                        <Form.Control asChild>
                          <Textarea
                            className="bg-ui-bg-field"
                            style={{ height: '120px', minHeight: '120px' }}
                            onChange={formik.handleChange}
                            value={formik.values.certification_description}
                            placeholder={t('dashboard.courses.certification.form.certification_description_placeholder')}
                            required
                          />
                        </Form.Control>
                      </FormField>
                    </div>
                  </div>

                  {/* Certificate Design Card */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <span className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5 block">
                      {t('dashboard.courses.certification.sections.certificate_design.title')}
                    </span>

                    <FormField name="certificate_pattern">
                      <FormLabelAndMessage label={t('dashboard.courses.certification.form.certificate_pattern_label')} />
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {['royal', 'tech', 'nature', 'geometric', 'vintage', 'waves', 'minimal', 'professional', 'academic', 'modern'].map((patternValue) => (
                          <div
                            key={patternValue}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formik.values.certificate_pattern === patternValue
                                ? 'border-black bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => formik.setFieldValue('certificate_pattern', patternValue)}
                          >
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">{t(`dashboard.courses.certification.patterns.${patternValue}.name`)}</div>
                              <div className="text-xs text-gray-500 mt-1">{t(`dashboard.courses.certification.patterns.${patternValue}.description`)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </FormField>

                    <div className="mt-6">
                      <FormField name="certificate_instructor">
                        <FormLabelAndMessage label={t('dashboard.courses.certification.form.certificate_instructor_label')} />
                        <Form.Control asChild>
                          <Input
                            className="bg-ui-bg-field"
                            onChange={formik.handleChange}
                            value={formik.values.certificate_instructor}
                            type="text"
                            placeholder={t('dashboard.courses.certification.form.certificate_instructor_placeholder')}
                          />
                        </Form.Control>
                      </FormField>
                    </div>
                  </div>
                </Form.Root>
              </div>

              {/* Preview Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-6 min-h-[320px]">
                  <span className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5 block">
                    {t('dashboard.courses.certification.sections.preview.title')}
                  </span>
                  
                  <CertificatePreview
                    certificationName={formik.values.certification_name}
                    certificationDescription={formik.values.certification_description}
                    certificationType={formik.values.certification_type}
                    certificatePattern={formik.values.certificate_pattern}
                    certificateInstructor={formik.values.certificate_instructor}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Disabled State */}
          {!formik.values.enable_certification && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-700 mb-2">{t('dashboard.courses.certification.states.disabled.title')}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('dashboard.courses.certification.states.disabled.message')}
              </p>
              <button
                type="button"
                onClick={() => handleCertificationToggle(true)}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Award size={16} />
                {isCreating ? t('dashboard.courses.certification.states.disabled.creating') : t('dashboard.courses.certification.states.disabled.button')}
              </button>
            </div>
          )}

          {/* Creating State */}
          {formik.values.enable_certification && !hasExistingCertification && isCreating && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="animate-spin mx-auto mb-4">
                <Settings className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-2">{t('dashboard.courses.certification.states.creating.title')}</h3>
              <p className="text-sm text-gray-500">
                {t('dashboard.courses.certification.states.creating.message')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EditCourseCertification; 
