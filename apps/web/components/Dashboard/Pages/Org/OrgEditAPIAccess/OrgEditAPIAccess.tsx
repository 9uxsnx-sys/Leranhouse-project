'use client'
import i18n from '@/lib/i18n'
import React, { useState } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { toast } from 'react-hot-toast'
import { getAPIUrl } from '@services/config/config'
import useSWR, { mutate } from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  SaveAllIcon,
  SlidersHorizontal,
  Search,
} from 'lucide-react'
import {
  APIToken,
  APITokenCreateRequest,
  APITokenRights,
  createAPIToken,
  updateAPIToken,
  getDefaultRights,
  getFullRights,
  getReadOnlyRights,
  regenerateAPIToken,
  revokeAPIToken,
} from '@services/api_tokens/api_tokens'
import { Input } from '@components/ui/input'
import { Textarea } from '@components/ui/textarea'
import APIDocumentation from './APIDocumentation'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import { usePlan } from '@components/Hooks/usePlan'
import { useTranslation } from 'react-i18next'

type PageView = 'list' | 'detail'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const OrgEditAPIAccess: React.FC = () => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const currentPlan = usePlan()

  const [showDoc, setShowDoc] = useState(false)
  const [currentView, setCurrentView] = useState<PageView>('list')
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [docSearchQuery, setDocSearchQuery] = useState('')

  // Form state
  const [tokenName, setTokenName] = useState('')
  const [tokenDescription, setTokenDescription] = useState('')
  const [tokenExpiry, setTokenExpiry] = useState('')
  const [tokenRights, setTokenRights] = useState<APITokenRights>(getDefaultRights())
  const [rightsPreset, setRightsPreset] = useState<'custom' | 'readonly' | 'full'>('readonly')

  // Save state
  const [isSaved, setIsSaved] = useState(true)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const isActiveSaving = isManualSaving

  // Token reveal state
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null)
  const [showTokenValue, setShowTokenValue] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Fetch tokens
  const tokensUrl = org?.id ? `${getAPIUrl()}orgs/${org.id}/api-tokens` : null
  const { data: tokens, isLoading } = useSWR<APIToken[]>(
    tokensUrl,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('dashboard.organization.api_access.never')
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedToken(true)
    toast.success(t('dashboard.organization.api_access.toasts.copied'))
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Create new token immediately with defaults
  const handleAddToken = async () => {
    if (!org?.id || !access_token) return
    setIsManualSaving(true)
    try {
      const data: APITokenCreateRequest = {
        name: t('dashboard.organization.api_access.new_token_name'),
        rights: getReadOnlyRights(),
      }
      const res = await createAPIToken(org.id, data, access_token)
      if (res.success) {
        setNewTokenValue(res.data.token)
        setShowTokenValue(true)
        setSelectedTokenId(res.data.token_uuid || 'new')
        setCurrentView('detail')
        mutate(tokensUrl)
        toast.success(t('dashboard.organization.api_access.toasts.created'))
      } else {
        toast.error(res.data?.detail || t('dashboard.organization.api_access.toasts.create_failed'))
      }
    } catch {
      toast.error(t('dashboard.organization.api_access.toasts.create_error'))
    } finally {
      setIsManualSaving(false)
    }
  }

  // Open existing token
  const openDetail = (uuid: string) => {
    const token = tokens?.find((t) => t.token_uuid === uuid)
    if (token) {
      setTokenName(token.name)
      setTokenDescription(token.description || '')
      setTokenExpiry(token.expires_at || '')
      setTokenRights(token.rights || getDefaultRights())
      setRightsPreset('custom')
    }
    setSelectedTokenId(uuid)
    setIsSaved(true)
    setNewTokenValue(null)
    setShowTokenValue(false)
    setCurrentView('detail')
  }

  const goBackToList = () => {
    setCurrentView('list')
    setSelectedTokenId(null)
    setNewTokenValue(null)
    setShowTokenValue(false)
  }

  // Save (update existing token)
  const handleSave = async () => {
    if (isActiveSaving || !org?.id || !access_token || !selectedTokenId) return
    setIsManualSaving(true)
    try {
      const data = {
        name: tokenName.trim(),
        description: tokenDescription.trim() || null,
        rights: tokenRights,
        expires_at: tokenExpiry || null,
      }
      const res = await updateAPIToken(org.id, selectedTokenId, data, access_token)
      if (res.status === 200) {
        toast.success(t('dashboard.organization.api_access.toasts.saved'))
        setIsSaved(true)
        mutate(tokensUrl)
      } else {
        toast.error(res.data?.detail || t('dashboard.organization.api_access.toasts.update_failed'))
      }
    } catch {
      toast.error(t('dashboard.organization.api_access.toasts.save_error'))
    } finally {
      setIsManualSaving(false)
    }
  }

  // Revoke
  const handleRevoke = async () => {
    if (!selectedTokenId || !org?.id || !access_token) return
    try {
      const res = await revokeAPIToken(org.id, selectedTokenId, access_token)
      if (res.success) {
        toast.success(t('dashboard.organization.api_access.toasts.revoked'))
        mutate(tokensUrl)
        goBackToList()
      } else {
        toast.error(res.data?.detail || t('dashboard.organization.api_access.toasts.revoke_failed'))
      }
    } catch {
      toast.error(t('dashboard.organization.api_access.toasts.revoke_error'))
    }
  }

  // Regenerate
  const handleRegenerate = async () => {
    if (!selectedTokenId || !org?.id || !access_token) return
    setIsManualSaving(true)
    try {
      const res = await regenerateAPIToken(org.id, selectedTokenId, access_token)
      if (res.success) {
        setNewTokenValue(res.data.token)
        setShowTokenValue(true)
        mutate(tokensUrl)
        toast.success(t('dashboard.organization.api_access.toasts.regenerated'))
      } else {
        toast.error(res.data?.detail || t('dashboard.organization.api_access.toasts.regenerate_failed'))
      }
    } catch {
      toast.error(t('dashboard.organization.api_access.toasts.regenerate_error'))
    } finally {
      setIsManualSaving(false)
    }
  }

  const handlePresetChange = (preset: 'custom' | 'readonly' | 'full') => {
    setRightsPreset(preset)
    setIsSaved(false)
    if (preset === 'readonly') {
      setTokenRights(getReadOnlyRights())
    } else if (preset === 'full') {
      setTokenRights(getFullRights())
    }
  }

  // ──────────────────────────────────────────────
  //  LIST VIEW
  // ──────────────────────────────────────────────
  const renderListView = () => (
    <div className="space-y-3">
      {/* ===== Action Row ===== */}
      <div className="flex items-center justify-between">
        {showDoc ? (
          <div className="relative w-80">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              placeholder={t('dashboard.organization.api_access.search_placeholder')}
              className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDoc(!showDoc)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {!showDoc ? (
              <>
                <Key size={14} />
                {t('dashboard.organization.api_access.tabs.api')}
              </>
            ) : (
              <>
                <ChevronRight size={14} className="rotate-90" />
                {t('dashboard.organization.api_access.tabs.doc')}
              </>
            )}
          </button>
          {!showDoc && (
            <button
              type="button"
              onClick={handleAddToken}
              disabled={isActiveSaving}
              className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border bg-black text-white border-black hover:opacity-90 cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>{t('dashboard.organization.api_access.create_token')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ===== Content ===== */}
      {!showDoc ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.api_tokens')}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : tokens && tokens.length > 0 ? (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div
                  key={token.token_uuid}
                  className="flex items-center justify-between px-5 py-5 rounded-xl bg-gray-50 shadow-borders-base cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => openDetail(token.token_uuid)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Key size={16} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{token.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
                          token.is_active
                            ? 'bg-gray-200 text-gray-600 border-transparent'
                            : 'bg-red-100 text-red-700 border-transparent'
                        }`}>
                          {token.is_active ? t('dashboard.organization.api_access.status.active') : t('dashboard.organization.api_access.status.revoked')}
                        </span>
                        <code className="text-xs bg-gray-200/60 px-1.5 py-0.5 rounded font-mono text-gray-500">
                          {token.token_prefix}...
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {token.description && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {token.description}
                          </p>
                        )}
                        <span className="text-[11px] text-gray-400">
                          {t('dashboard.organization.api_access.last_used', { date: formatDate(token.last_used_at) })}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {t('dashboard.organization.api_access.expires_at', { date: token.expires_at ? formatDate(token.expires_at) : t('dashboard.organization.api_access.never') })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Key size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('dashboard.organization.api_access.empty.title')}</p>
              <p className="text-sm">{t('dashboard.organization.api_access.empty.description')}</p>
            </div>
          )}
        </div>
      ) : (
        <APIDocumentation searchQuery={docSearchQuery} />
      )}
    </div>
  )

  // ──────────────────────────────────────────────
  //  DETAIL VIEW
  // ──────────────────────────────────────────────
  const renderDetailView = () => {
    if (!selectedTokenId) return null
    const hasRevealedToken = newTokenValue !== null

    // Token reveal view
    if (hasRevealedToken) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBackToList}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} className="rotate-180" />
              <span>{t('dashboard.organization.api_access.back_to_tokens')}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('common.sections.token_created')}
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">{t('dashboard.organization.api_access.token_reveal.title')}</p>
                  <p className="text-sm text-yellow-700">
                    {t('dashboard.organization.api_access.token_reveal.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('dashboard.organization.api_access.token_reveal.label')}
              </label>
              <div className="flex gap-2">
                <input
                  type={showTokenValue ? 'text' : 'password'}
                  value={newTokenValue}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm font-mono bg-ui-bg-field !shadow-none border border-ui-border-base rounded-lg focus:border-ui-border-strong focus-visible:!shadow-none transition-none outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowTokenValue(!showTokenValue)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                >
                  {showTokenValue ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newTokenValue!)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                >
                  {copiedToken ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Edit view
    return (
      <div className="space-y-3">
        {/* ===== Action Row ===== */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBackToList}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span>{t('dashboard.organization.api_access.back_to_tokens')}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isActiveSaving}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw size={14} />
              {t('dashboard.organization.api_access.regenerate')}
            </button>
            <button
              type="button"
              onClick={isSaved ? undefined : handleSave}
              disabled={isActiveSaving}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isActiveSaving
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
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
                {isActiveSaving ? t('common.saving') : isSaved ? t('dashboard.organization.api_access.saved') : t('common.save')}
              </span>
            </button>
          </div>
        </div>

        {/* ===== Token Details Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.token_details')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('dashboard.organization.api_access.fields.token_name')} <span className="text-red-400">*</span>
              </label>
              <Input
                className={fieldClassName}
                value={tokenName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTokenName(e.target.value); setIsSaved(false) }}
                placeholder={t('dashboard.organization.api_access.fields.token_name_placeholder')}
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('dashboard.organization.api_access.fields.description')}
              </label>
              <Textarea
                className={`${fieldClassName} min-h-[60px]`}
                value={tokenDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setTokenDescription(e.target.value); setIsSaved(false) }}
                placeholder={t('dashboard.organization.api_access.fields.description_placeholder')}
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* ===== Permissions Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.permissions')}
          </h3>
          <div className="space-y-2">
            {/* Read Only - clickable container */}
            <div
              onClick={() => handlePresetChange('readonly')}
              className={`flex items-center gap-3 px-5 py-5 rounded-xl cursor-pointer transition-colors ${
                rightsPreset === 'readonly'
                  ? 'bg-gray-100 shadow-borders-base'
                  : 'bg-gray-50 shadow-borders-base hover:bg-gray-100'
              }`}
            >
              <Eye size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{t('dashboard.organization.api_access.permissions.read_only')}</span>
            </div>

            {/* Full Access - clickable container */}
            <div
              onClick={() => handlePresetChange('full')}
              className={`flex items-center gap-3 px-5 py-5 rounded-xl cursor-pointer transition-colors ${
                rightsPreset === 'full'
                  ? 'bg-gray-100 shadow-borders-base'
                  : 'bg-gray-50 shadow-borders-base hover:bg-gray-100'
              }`}
            >
              <Key size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{t('dashboard.organization.api_access.permissions.full_access')}</span>
            </div>

            {/* Custom - expandable container */}
            <CustomPermissionContainer
              isCustom={rightsPreset === 'custom'}
              onActivate={() => handlePresetChange('custom')}
              rights={tokenRights}
              onRightsChange={(r) => { setTokenRights(r); setIsSaved(false) }}
            />
          </div>
        </div>

      </div>
    )
  }

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="pro"
      icon={Key}
      titleKey="common.plans.feature_restricted.api_access.title"
      descriptionKey="common.plans.feature_restricted.api_access.description"
    >
      {currentView === 'list' ? renderListView() : renderDetailView()}
    </PlanRestrictedFeature>
  )
}

// Custom Permission Container - expandable with checkboxes inside
const CustomPermissionContainer: React.FC<{
  isCustom: boolean
  onActivate: () => void
  rights: APITokenRights
  onRightsChange: (rights: APITokenRights) => void
}> = ({ isCustom, onActivate, rights, onRightsChange }) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleToggle = (resource: string, permission: string) => {
    const newRights = { ...rights }
    const resourceRights = { ...(newRights as any)[resource] }
    resourceRights[permission] = !resourceRights[permission]
    ;(newRights as any)[resource] = resourceRights

    // Check if any permission is now checked — activate custom if so
    const anyChecked = Object.keys(newRights).some((res) => {
      const r = (newRights as any)[res]
      return r && Object.values(r).some((v) => v === true)
    })
    if (anyChecked && !isCustom) onActivate()

    onRightsChange(newRights)
  }

  const resources = [
    { key: 'courses', label: t('dashboard.organization.api_access.permissions.resources.courses') },
    { key: 'activities', label: t('dashboard.organization.api_access.permissions.resources.activities') },
    { key: 'coursechapters', label: t('dashboard.organization.api_access.permissions.resources.chapters') },
    { key: 'collections', label: t('dashboard.organization.api_access.permissions.resources.collections') },
    { key: 'certifications', label: t('dashboard.organization.api_access.permissions.resources.certifications') },
    { key: 'usergroups', label: t('dashboard.organization.api_access.permissions.resources.user_groups') },
    { key: 'payments', label: t('dashboard.organization.api_access.permissions.resources.payments') },
    { key: 'search', label: t('dashboard.organization.api_access.permissions.resources.search') },
  ]

  const crudItems = [
    { key: 'action_create', label: t('dashboard.organization.api_access.permissions.create') },
    { key: 'action_read', label: t('dashboard.organization.api_access.permissions.read') },
    { key: 'action_update', label: t('dashboard.organization.api_access.permissions.update') },
    { key: 'action_delete', label: t('common.delete') },
  ]

  const isSearchResource = (key: string) => key === 'search'
  const isCrudDisabled = (resKey: string, permKey: string) =>
    isSearchResource(resKey) && permKey !== 'action_read'

  const anyChecked = resources.some((res) =>
    crudItems.some((item) => {
      if (isCrudDisabled(res.key, item.key)) return false
      return (rights as any)[res.key]?.[item.key] || false
    })
  )

  const selectedResourcesCount = resources.filter((res) =>
    crudItems.some((item) => {
      if (isCrudDisabled(res.key, item.key)) return false
      return (rights as any)[res.key]?.[item.key]
    })
  ).length

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100">
      {/* Header - clickable to expand/collapse */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between px-5 py-5 rounded-xl cursor-pointer transition-colors ${
          isCustom
            ? 'bg-gray-100 shadow-borders-base'
            : 'bg-gray-50 shadow-borders-base hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={16} className="text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-800">{t('dashboard.organization.api_access.permissions.custom')}</span>
          {anyChecked && (
            <span className="text-xs text-gray-400 tabular-nums">
              {t('dashboard.organization.api_access.permissions.resources_count', { count: selectedResourcesCount })}
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Expanded content */}
      <div className={`${isExpanded ? '' : 'hidden'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              {/* Header row */}
              <div className="flex items-center px-4 py-2 border-b border-gray-100">
                <div className="flex-1 text-xs font-semibold text-gray-400">{t('dashboard.organization.api_access.permissions.resource')}</div>
                <div className="flex items-center gap-4">
                  {crudItems.map((item) => (
                    <span key={item.key} className="w-8 text-center text-xs font-semibold text-gray-400">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
              {/* Resource rows */}
              {resources.map((resource) => (
                <div key={resource.key} className="flex items-center px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 text-sm font-medium text-gray-700">{resource.label}</div>
                  <div className="flex items-center gap-4">
                    {crudItems.map((item) => {
                      const disabled = isCrudDisabled(resource.key, item.key)
                      return (
                        <div key={item.key} className="w-8 flex justify-center">
                          {disabled ? (
                             <span className="text-xs text-gray-300">-</span>
                           ) : (
                             <label className="cursor-pointer">
                               <div className="relative w-4 h-4 flex-shrink-0">
                                 <input
                                   type="checkbox"
                                   checked={(rights as any)[resource.key]?.[item.key] || false}
                                   onChange={() => handleToggle(resource.key, item.key)}
                                   className="sr-only peer"
                                 />
                                 <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                                   <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                                 </div>
                               </div>
                             </label>
                           )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrgEditAPIAccess
