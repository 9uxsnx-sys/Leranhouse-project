'use client'

import React, { useEffect, useState } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getPaymentConfigs, updatePaymentConfig } from '@services/payments/payments'
import { Input } from '@components/ui/input'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import { Check, Loader2, SaveAll } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'

type PaymentMode = 'test' | 'live'

interface ConfigForm {
  mode: PaymentMode
  public_key: string
  secret_key: string
  webhook_secret: string
  active: boolean
}

const EMPTY_FORM: ConfigForm = {
  mode: 'test',
  public_key: '',
  secret_key: '',
  webhook_secret: '',
  active: false,
}

const fieldClassName =
  'bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none'

const Toggle = ({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <div
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors mt-0.5 ${
        checked ? 'bg-black' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </div>
    <div className="min-w-0">
      <span className="text-sm text-gray-600 select-none">{label}</span>
    </div>
  </label>
)

const PaymentsConfigurationPage: React.FC = () => {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const swrKey =
    org && access_token ? [`/payments/${org.id}/config`, access_token] : null

  const { data: config, error, isLoading } = useSWR(
    swrKey,
    ([, token]) => getPaymentConfigs(org.id, token),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM)
  const [baseline, setBaseline] = useState<ConfigForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!config) return
    const next: ConfigForm = {
      mode: config.mode === 'live' ? 'live' : 'test',
      public_key: config.public_key || '',
      secret_key: '',
      webhook_secret: '',
      active: !!config.active,
    }
    setForm(next)
    setBaseline(next)
  }, [config])

  const setField = <K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isDirty =
    form.mode !== baseline.mode ||
    form.public_key !== baseline.public_key ||
    form.secret_key !== '' ||
    form.webhook_secret !== '' ||
    form.active !== baseline.active

  const handleSave = async () => {
    if (!org || !access_token) return
    setIsSaving(true)
    try {
      const payload: any = {
        provider: 'chargily',
        mode: form.mode,
        public_key: form.public_key.trim() || null,
        active: form.active,
      }
      if (form.secret_key.trim()) payload.secret_key = form.secret_key.trim()
      if (form.webhook_secret.trim()) payload.webhook_secret = form.webhook_secret.trim()

      const updated = await updatePaymentConfig(org.id, payload, access_token)
      await mutate([`/payments/${org.id}/config`, access_token], updated, false)
      const next: ConfigForm = {
        mode: updated.mode === 'live' ? 'live' : 'test',
        public_key: updated.public_key || '',
        secret_key: '',
        webhook_secret: '',
        active: !!updated.active,
      }
      setForm(next)
      setBaseline(next)
      toast.success(t('dashboard.payments.configuration.save_success'))
    } catch (err: any) {
      toast.error(err?.detail || t('dashboard.payments.configuration.save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
        {t('dashboard.payments.configuration.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-red-500">
        {t('dashboard.payments.configuration.error_loading')}
      </div>
    )
  }

  const configured = !!config?.configured
  const statusLabel = !configured
    ? t('dashboard.payments.configuration.status_not_configured')
    : config?.active
      ? t('dashboard.payments.configuration.status_active')
      : t('dashboard.payments.configuration.status_inactive')
  const statusClass = !configured
    ? 'text-gray-500 bg-gray-100'
    : config?.active
      ? 'text-green-700 bg-green-100'
      : 'text-amber-700 bg-amber-100'

  return (
    <FormLayout onSubmit={(e: any) => e.preventDefault()}>
      <div className="space-y-3">
        {/* ── ACTION ROW ── */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${statusClass}`}
          >
            <span className="w-2.5 h-2.5 rounded bg-current opacity-70" />
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={isDirty ? handleSave : undefined}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
              isSaving
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : !isDirty
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
            }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : !isDirty ? (
              <Check size={14} />
            ) : (
              <SaveAll size={14} />
            )}
            <span>
              {isSaving
                ? t('dashboard.payments.configuration.saving')
                : !isDirty
                  ? t('dashboard.payments.configuration.saved')
                  : t('dashboard.payments.configuration.save')}
            </span>
          </button>
        </div>

        {/* ── CONFIGURATION ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('dashboard.payments.configuration.provider_title')}
          </h3>

          <div className="space-y-4">
            <FormField name="mode">
              <FormLabelAndMessage label={t('dashboard.payments.configuration.mode_label')} />
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit">
                {(['test', 'live'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setField('mode', mode)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      form.mode === mode
                        ? 'bg-white shadow-sm text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode === 'test'
                      ? t('dashboard.payments.configuration.mode_test')
                      : t('dashboard.payments.configuration.mode_live')}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField name="public_key">
              <FormLabelAndMessage
                label={t('dashboard.payments.configuration.public_key_label')}
              />
              <Input
                className={fieldClassName}
                value={form.public_key}
                onChange={(e) => setField('public_key', e.target.value)}
                placeholder="pk_…"
                autoComplete="off"
                disabled={isSaving}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="secret_key">
                <FormLabelAndMessage
                  label={t('dashboard.payments.configuration.secret_key_label')}
                />
                <Input
                  className={fieldClassName}
                  type="password"
                  value={form.secret_key}
                  onChange={(e) => setField('secret_key', e.target.value)}
                  placeholder={
                    config?.has_secret_key
                      ? t('dashboard.payments.configuration.stored_placeholder')
                      : 'sk_…'
                  }
                  autoComplete="new-password"
                  disabled={isSaving}
                />
              </FormField>

              <FormField name="webhook_secret">
                <FormLabelAndMessage
                  label={t('dashboard.payments.configuration.webhook_secret_label')}
                />
                <Input
                  className={fieldClassName}
                  type="password"
                  value={form.webhook_secret}
                  onChange={(e) => setField('webhook_secret', e.target.value)}
                  placeholder={
                    config?.has_webhook_secret
                      ? t('dashboard.payments.configuration.stored_placeholder')
                      : t('dashboard.payments.configuration.optional_placeholder')
                  }
                  autoComplete="new-password"
                  disabled={isSaving}
                />
              </FormField>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <Toggle
                checked={form.active}
                onChange={(checked) => setField('active', checked)}
                disabled={isSaving}
                label={t('dashboard.payments.configuration.enable_title')}
              />
              {form.active && !config?.has_secret_key && !form.secret_key.trim() && (
                <p className="text-xs text-amber-600 mt-2 ms-12">
                  {t('dashboard.payments.configuration.secret_required')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormLayout>
  )
}

export default PaymentsConfigurationPage
