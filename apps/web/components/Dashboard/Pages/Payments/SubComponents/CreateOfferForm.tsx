'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrg } from '@components/Contexts/OrgContext';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import { createOffer } from '@services/payments/offers';
import { getPaymentsGroups } from '@services/payments/groups';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { mutate } from 'swr';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Label } from '@components/ui/label';
import currencyCodes from 'currency-codes';
import useSWR from 'swr';
import { BookOpen, X, Plus, Layers } from 'lucide-react';
import { getOrgCourses } from '@services/courses/courses';

const getValidationSchema = (t: any) => Yup.object().shape({
  name: Yup.string().required(t('dashboard.payments.create_offer.validation_name_required')),
  description: Yup.string().required(t('dashboard.payments.create_offer.validation_description_required')),
  amount: Yup.number().min(1, t('dashboard.payments.create_offer.validation_amount_positive')).required(t('dashboard.payments.create_offer.validation_amount_required')),
  benefits: Yup.string(),
  currency: Yup.string().required(t('dashboard.payments.create_offer.validation_currency_required')),
  offer_type: Yup.string().oneOf(['one_time', 'subscription']).required(t('dashboard.payments.create_offer.validation_offer_type_required')),
  price_type: Yup.string().oneOf(['fixed_price', 'customer_choice']).required(t('dashboard.payments.create_offer.validation_price_type_required')),
});

interface OfferFormValues {
  name: string;
  description: string;
  offer_type: 'one_time' | 'subscription';
  price_type: 'fixed_price' | 'customer_choice';
  benefits: string;
  amount: number;
  currency: string;
  payments_group_id: number | '';
  resource_uuids: string[];
}

const CreateOfferForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const org = useOrg() as any;
  const session = useLHSession() as any;
  const token = session?.data?.tokens?.access_token;
  const [currencies, setCurrencies] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    const allCurrencies = currencyCodes.data.map((c) => ({
      code: c.code,
      name: `${c.code} - ${c.currency}`,
    }));
    setCurrencies(allCurrencies);
  }, []);

  // Payment Groups for the optional group picker
  const { data: groupsResult } = useSWR(
    org && token ? [`/payments/${org.id}/groups`, token] : null,
    ([, t]: any) => getPaymentsGroups(org.id, t),
    { revalidateOnFocus: false }
  );
  const groups: any[] = Array.isArray(groupsResult?.data) ? groupsResult.data : Array.isArray(groupsResult) ? groupsResult : [];

  // Courses for the direct course picker
  const { data: courses } = useSWR(
    org && token ? [`/courses/org`, org.slug, token] : null,
    ([, slug, t]: any) => getOrgCourses(slug, null, t, true),
    { revalidateOnFocus: false }
  );

  const initialValues: OfferFormValues = {
    name: '',
    description: '',
    offer_type: 'one_time',
    price_type: 'fixed_price',
    benefits: '',
    amount: 1,
    currency: 'USD',
    payments_group_id: '',
    resource_uuids: [],
  };

  const handleSubmit = async (values: OfferFormValues, { setSubmitting, resetForm }: any) => {
    try {
      const payload = {
        ...values,
        payments_group_id: values.payments_group_id !== '' ? values.payments_group_id : undefined,
      };
      const res = await createOffer(org.id, payload, token);
      if (res.success) {
        toast.success(t('dashboard.payments.create_offer.created'));
        mutate([`/payments/${org.id}/offers`, token]);
        resetForm();
        onSuccess();
      } else {
        toast.error(res.data?.detail || t('dashboard.payments.create_offer.failed_create'));
      }
    } catch (error) {
      toast.error(t('dashboard.payments.create_offer.generic_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik initialValues={initialValues} validationSchema={getValidationSchema(t)} onSubmit={handleSubmit}>
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="space-y-4">
          <div className="px-1.5 py-2 flex-col space-y-3">
            <div>
              <Label htmlFor="name">{t('dashboard.payments.create_offer.field_offer_name')}</Label>
              <Field name="name" as={Input} placeholder={t('dashboard.payments.create_offer.field_offer_name')} />
              <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <Label htmlFor="description">{t('dashboard.payments.create_offer.field_description')}</Label>
              <Field name="description" as={Textarea} placeholder={t('dashboard.payments.create_offer.placeholder_description')} />
              <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <Label htmlFor="offer_type">{t('dashboard.payments.create_offer.field_offer_type')}</Label>
              <Select
                value={values.offer_type}
                onValueChange={(value) => {
                  setFieldValue('offer_type', value);
                  if (value === 'subscription') setFieldValue('price_type', 'fixed_price');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dashboard.payments.create_offer.field_offer_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">{t('dashboard.payments.create_offer.option_one_time')}</SelectItem>
                  <SelectItem value="subscription">{t('dashboard.payments.create_offer.option_subscription')}</SelectItem>
                </SelectContent>
              </Select>
              <ErrorMessage name="offer_type" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <Label htmlFor="price_type">{t('dashboard.payments.create_offer.field_price_type')}</Label>
              <Select
                value={values.price_type}
                onValueChange={(value) => setFieldValue('price_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dashboard.payments.create_offer.field_price_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_price">{t('dashboard.payments.create_offer.option_fixed_price')}</SelectItem>
                  {values.offer_type !== 'subscription' && (
                    <SelectItem value="customer_choice">{t('dashboard.payments.create_offer.option_customer_choice')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <ErrorMessage name="price_type" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="flex space-x-2">
              <div className="grow">
                <Label htmlFor="amount">
                  {values.price_type === 'fixed_price' ? t('dashboard.payments.create_offer.field_price') : t('dashboard.payments.create_offer.field_minimum_amount')}
                </Label>
                <Field
                  name="amount"
                  as={Input}
                  type="number"
                  placeholder={values.price_type === 'fixed_price' ? t('dashboard.payments.create_offer.field_price') : t('dashboard.payments.create_offer.field_minimum_amount')}
                />
                <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div className="w-1/3">
                <Label htmlFor="currency">{t('dashboard.payments.create_offer.field_currency')}</Label>
                <Select
                  value={values.currency}
                  onValueChange={(value) => setFieldValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('dashboard.payments.create_offer.field_currency')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMessage name="currency" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="benefits">{t('dashboard.payments.create_offer.field_benefits')}</Label>
              <Field name="benefits" as={Textarea} placeholder={t('dashboard.payments.create_offer.placeholder_benefits')} />
              <ErrorMessage name="benefits" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {/* ── Access ───────────────────────────────────────────────── */}
            <div className="border rounded-md p-3 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('dashboard.payments.create_offer.access_title')}</p>
              <p className="text-xs text-gray-500">
                {t('dashboard.payments.create_offer.access_description')}
              </p>

              {/* Direct course picker */}
              <div>
                <Label className="text-xs">{t('dashboard.payments.create_offer.courses_direct')}</Label>
                {values.resource_uuids.length > 0 && (
                  <ul className="mb-1 space-y-0.5">
                    {values.resource_uuids.map((uuid) => {
                      const course = (courses ?? []).find(
                        (c: any) => `course_${c.course_uuid?.replace('course_', '')}` === uuid
                      );
                      return (
                        <li key={uuid} className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs border">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={11} className="text-indigo-500" />
                            <span>{course?.name ?? uuid}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFieldValue(
                                'resource_uuids',
                                values.resource_uuids.filter((u) => u !== uuid)
                              )
                            }
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={11} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Select
                  value=""
                  onValueChange={(courseUuid) => {
                    if (courseUuid && !values.resource_uuids.includes(courseUuid)) {
                      setFieldValue('resource_uuids', [...values.resource_uuids, courseUuid]);
                    }
                  }}
                >
                  <SelectTrigger className="text-xs h-8">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Plus size={11} />
                      <span>{t('dashboard.payments.create_offer.add_course')}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(courses ?? [])
                      .filter((c: any) => {
                        const uuid = `course_${c.course_uuid?.replace('course_', '')}`;
                        return !values.resource_uuids.includes(uuid);
                      })
                      .map((c: any) => {
                        const uuid = `course_${c.course_uuid?.replace('course_', '')}`;
                        return (
                          <SelectItem key={uuid} value={uuid}>
                            {c.name}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Group picker */}
              <div>
                <Label className="text-xs">
                  {t('dashboard.payments.create_offer.payment_group')} <span className="text-gray-400 font-normal">{t('dashboard.payments.create_offer.payment_group_optional')}</span>
                </Label>
                <Select
                  value={String(values.payments_group_id)}
                  onValueChange={(value) =>
                    setFieldValue('payments_group_id', value === 'none' ? '' : Number(value))
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={t('dashboard.payments.create_offer.link_payment_group')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('dashboard.payments.create_offer.none')}</SelectItem>
                    {groups.map((g: any) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        <div className="flex items-center gap-1.5">
                          <Layers size={11} className="text-indigo-500" />
                          {g.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  {t('dashboard.payments.create_offer.payment_group_help_prefix')}{' '}
                  <strong>{t('dashboard.payments.create_offer.payment_groups_tab')}</strong>{' '}
                  {t('dashboard.payments.create_offer.payment_group_help_suffix')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('dashboard.payments.create_offer.creating') : t('dashboard.payments.create_offer.submit')}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreateOfferForm;
