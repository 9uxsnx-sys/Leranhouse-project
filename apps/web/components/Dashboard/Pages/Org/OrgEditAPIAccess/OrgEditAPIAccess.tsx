'use client'
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

type PageView = 'list' | 'detail'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

const OrgEditAPIAccess: React.FC = () => {
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
    if (!dateStr) return 'Never'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
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
    toast.success('Token copied to clipboard')
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Create new token immediately with defaults
  const handleAddToken = async () => {
    if (!org?.id || !access_token) return
    setIsManualSaving(true)
    try {
      const data: APITokenCreateRequest = {
        name: 'New Token',
        rights: getReadOnlyRights(),
      }
      const res = await createAPIToken(org.id, data, access_token)
      if (res.success) {
        setNewTokenValue(res.data.token)
        setShowTokenValue(true)
        setSelectedTokenId(res.data.token_uuid || 'new')
        setCurrentView('detail')
        mutate(tokensUrl)
        toast.success('API token created')
      } else {
        toast.error(res.data?.detail || 'Failed to create token')
      }
    } catch {
      toast.error('An error occurred while creating token')
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
        toast.success('Token saved')
        setIsSaved(true)
        mutate(tokensUrl)
      } else {
        toast.error(res.data?.detail || 'Failed to update token')
      }
    } catch {
      toast.error('An error occurred while saving')
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
        toast.success('Token revoked')
        mutate(tokensUrl)
        goBackToList()
      } else {
        toast.error(res.data?.detail || 'Failed to revoke token')
      }
    } catch {
      toast.error('An error occurred while revoking')
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
        toast.success('Token regenerated')
      } else {
        toast.error(res.data?.detail || 'Failed to regenerate token')
      }
    } catch {
      toast.error('An error occurred while regenerating')
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
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <Input
              placeholder="Search endpoints..."
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
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
                API
              </>
            ) : (
              <>
                <ChevronRight size={14} className="rotate-90" />
                Doc
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
              <span>Create Token</span>
            </button>
          )}
        </div>
      </div>

      {/* ===== Content ===== */}
      {!showDoc ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            API Tokens
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
                          {token.is_active ? 'Active' : 'Revoked'}
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
                          Last used: {formatDate(token.last_used_at)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Expires: {token.expires_at ? formatDate(token.expires_at) : 'Never'}
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
              <p>No API tokens yet</p>
              <p className="text-sm">Create your first token to get started</p>
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
              <span>Back to tokens</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              Token Created
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">Save your token now!</p>
                  <p className="text-sm text-yellow-700">
                    This is the only time you&apos;ll see this token. Copy it and store it securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Your API Token
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
            <span>Back to tokens</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isActiveSaving}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw size={14} />
              Regenerate
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
                {isActiveSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
        </div>

        {/* ===== Token Details Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            Token Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Token Name <span className="text-red-400">*</span>
              </label>
              <Input
                className={fieldClassName}
                value={tokenName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTokenName(e.target.value); setIsSaved(false) }}
                placeholder="e.g., CI/CD Pipeline, Mobile App"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Description
              </label>
              <Textarea
                className={`${fieldClassName} min-h-[60px]`}
                value={tokenDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setTokenDescription(e.target.value); setIsSaved(false) }}
                placeholder="What will this token be used for?"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* ===== Permissions Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            Permissions
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
              <span className="text-sm font-semibold text-gray-800">Read Only</span>
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
              <span className="text-sm font-semibold text-gray-800">Full Access</span>
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
    { key: 'courses', label: 'Courses' },
    { key: 'activities', label: 'Activities' },
    { key: 'coursechapters', label: 'Chapters' },
    { key: 'collections', label: 'Collections' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'usergroups', label: 'User Groups' },
    { key: 'payments', label: 'Payments' },
    { key: 'search', label: 'Search' },
  ]

  const crudItems = [
    { key: 'action_create', label: 'Create' },
    { key: 'action_read', label: 'Read' },
    { key: 'action_update', label: 'Update' },
    { key: 'action_delete', label: 'Delete' },
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
          <span className="text-sm font-semibold text-gray-800">Custom</span>
          {anyChecked && (
            <span className="text-xs text-gray-400 tabular-nums">
              {resources.filter((res) =>
                crudItems.some((item) => {
                  if (isCrudDisabled(res.key, item.key)) return false
                  return (rights as any)[res.key]?.[item.key]
                })
              ).length} resources
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
                <div className="flex-1 text-xs font-semibold text-gray-400">Resource</div>
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
