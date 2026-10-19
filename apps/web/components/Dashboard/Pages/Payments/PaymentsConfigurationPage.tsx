'use client'

import React, { useEffect, useState } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getPaymentConfigs, updatePaymentConfig } from '@services/payments/payments'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Switch } from '@components/ui/switch'
import { Check, CreditCard, Loader2, SaveAll, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
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

const PaymentsConfigurationPage: React.FC = () => {
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
      toast.success('Payment configuration saved')
    } catch (err: any) {
      toast.error(err?.detail || 'Failed to save payment configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
        Loading payment configuration…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-red-500">
        Error loading payment configuration
      </div>
    )
  }

  const configured = !!config?.configured
  const statusLabel = !configured
    ? 'Not configured'
    : config?.active
      ? 'Active'
      : 'Inactive'
  const statusClass = !configured
    ? 'text-gray-500 bg-gray-100'
    : config?.active
      ? 'text-green-700 bg-green-100'
      : 'text-amber-700 bg-amber-100'

  return (
    <div className="space-y-3">
      {/* ===== Action Row ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
            <span className="w-2.5 h-2.5 rounded bg-current opacity-70" />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isDirty && !isSaving ? handleSave : undefined}
            disabled={isSaving || !isDirty}
            className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
              isSaving
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : isDirty
                  ? 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
                  : 'bg-white text-gray-600 border-gray-200 cursor-default'
            }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isDirty ? (
              <SaveAll size={14} />
            ) : (
              <Check size={14} />
            )}
            <span>{isSaving ? 'Saving' : isDirty ? 'Save' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* ===== Card 1: Chargily credentials ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
              Chargily Pay v2
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Accept EDAHABIA and CIB payments in Algerian Dinar.
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg shrink-0">
            <CreditCard size={20} className="text-gray-700" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label size="small" weight="plus">Mode</Label>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
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
                  {mode === 'test' ? 'Test' : 'Live'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Test uses the Chargily sandbox; live takes real payments.
            </p>
          </div>

          <div className="space-y-2">
            <Label size="small" weight="plus" htmlFor="chargily-public-key">
              Public key
            </Label>
            <Input
              id="chargily-public-key"
              value={form.public_key}
              onChange={(e) => setField('public_key', e.target.value)}
              placeholder="pk_…"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label size="small" weight="plus" htmlFor="chargily-secret-key">
                Secret key
              </Label>
              <Input
                id="chargily-secret-key"
                type="password"
                value={form.secret_key}
                onChange={(e) => setField('secret_key', e.target.value)}
                placeholder={config?.has_secret_key ? '•••••••• (stored)' : 'sk_…'}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400">
                Write-only. Stored encrypted and never returned by the API.
              </p>
            </div>

            <div className="space-y-2">
              <Label size="small" weight="plus" htmlFor="chargily-webhook-secret">
                Webhook secret
              </Label>
              <Input
                id="chargily-webhook-secret"
                type="password"
                value={form.webhook_secret}
                onChange={(e) => setField('webhook_secret', e.target.value)}
                placeholder={config?.has_webhook_secret ? '•••••••• (stored)' : 'Optional'}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400">
                Defaults to the secret key when left empty.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Card 2: Enable payments ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
              Enable payments
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Paid resources can only be purchased while this is on.
            </p>
          </div>
          <Switch
            checked={form.active}
            onCheckedChange={(checked) => setField('active', checked)}
          />
        </div>
        {form.active && !config?.has_secret_key && !form.secret_key.trim() && (
          <p className="text-xs text-amber-600 mt-3">
            Add a secret key before enabling payments.
          </p>
        )}
      </div>

      {/* ===== Security note ===== */}
      <div className="flex items-start gap-2 px-1 text-xs text-gray-400">
        <ShieldCheck size={14} className="shrink-0 mt-0.5" />
        <span>
          Credentials are stored per organization. Secret keys are encrypted at
          rest and only used server-side when talking to Chargily.
        </span>
      </div>
    </div>
  )
}

export default PaymentsConfigurationPage
