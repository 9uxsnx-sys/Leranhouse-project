'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { toast } from 'react-hot-toast'
import { Button } from '@components/ui/button'
import { getAPIUrl } from '@services/config/config'
import useSWR, { mutate } from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Badge } from '@components/ui/badge'
import {
  Globe,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Loader2,
} from 'lucide-react'
import {
  CustomDomain,
  addCustomDomain,
  verifyCustomDomain,
  deleteCustomDomain,
  getVerificationInfo,
  checkSSLStatus,
  CustomDomainVerificationInfo,
  CustomDomainSSLStatus,
} from '@services/custom_domains/custom_domains'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import { PlanLevel } from '@services/plans/plans'
import { usePlan } from '@components/Hooks/usePlan'
import { useTranslation } from 'react-i18next'

const OrgEditDomains: React.FC = () => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const currentPlan = usePlan()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null)
  const [verificationInfo, setVerificationInfo] = useState<CustomDomainVerificationInfo | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [sslStatuses, setSslStatuses] = useState<Record<string, CustomDomainSSLStatus>>({})
  const [sslLoading, setSslLoading] = useState<Record<string, boolean>>({})

  // Fetch domains
  const domainsUrl = org?.id ? `${getAPIUrl()}orgs/${org.id}/domains` : null
  const { data: domains, isLoading } = useSWR<CustomDomain[]>(
    domainsUrl,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error(t('dashboard.organization.domains.toasts.domain_required'))
      return
    }

    const loadingToast = toast.loading(t('dashboard.organization.domains.toasts.adding'))
    try {
      const response = await addCustomDomain(org.id, { domain: newDomain.trim() }, access_token)

      if (response.success) {
        mutate(domainsUrl)
        toast.success(t('dashboard.organization.domains.toasts.added'), { id: loadingToast })
        setNewDomain('')
        setIsAddDialogOpen(false)
        // Open verification dialog
        setSelectedDomain(response.data)
        await loadVerificationInfo(response.data.domain_uuid)
        setIsVerifyDialogOpen(true)
      } else {
        toast.error(response.data?.detail || t('dashboard.organization.domains.toasts.add_failed'), { id: loadingToast })
      }
    } catch (error: any) {
      toast.error(error.message || t('dashboard.organization.domains.toasts.add_failed'), { id: loadingToast })
    }
  }

  const loadVerificationInfo = async (domainUuid: string) => {
    try {
      const info = await getVerificationInfo(org.id, domainUuid, access_token)
      setVerificationInfo(info)
    } catch (error) {
      console.error('Failed to load verification info:', error)
    }
  }

  const handleVerifyDomain = async () => {
    if (!selectedDomain) return

    setIsVerifying(true)
    const loadingToast = toast.loading(t('dashboard.organization.domains.toasts.verifying'))
    try {
      const response = await verifyCustomDomain(org.id, selectedDomain.domain_uuid, access_token)

      if (response.success) {
        mutate(domainsUrl)
        toast.success(t('dashboard.organization.domains.toasts.verified'), { id: loadingToast })
        setIsVerifyDialogOpen(false)
        setSelectedDomain(null)
        setVerificationInfo(null)
      } else {
        toast.error(response.data?.detail || t('dashboard.organization.domains.toasts.verification_failed'), { id: loadingToast })
      }
    } catch (error: any) {
      toast.error(error.message || t('dashboard.organization.domains.toasts.verification_failed'), { id: loadingToast })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!selectedDomain) return

    const loadingToast = toast.loading(t('dashboard.organization.domains.toasts.deleting'))
    try {
      const response = await deleteCustomDomain(org.id, selectedDomain.domain_uuid, access_token)

      if (response.success) {
        mutate(domainsUrl)
        toast.success(t('dashboard.organization.domains.toasts.deleted'), { id: loadingToast })
        setIsDeleteDialogOpen(false)
        setSelectedDomain(null)
      } else {
        toast.error(response.data?.detail || t('dashboard.organization.domains.toasts.delete_failed'), { id: loadingToast })
      }
    } catch (error: any) {
      toast.error(error.message || t('dashboard.organization.domains.toasts.delete_failed'), { id: loadingToast })
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(t('dashboard.organization.domains.copied'))
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCheckSSL = useCallback(async (domain: CustomDomain) => {
    setSslLoading((prev) => ({ ...prev, [domain.domain_uuid]: true }))
    try {
      const result = await checkSSLStatus(org.id, domain.domain_uuid, access_token)
      setSslStatuses((prev) => ({ ...prev, [domain.domain_uuid]: result }))
    } catch {
      setSslStatuses((prev) => ({
        ...prev,
        [domain.domain_uuid]: {
          has_ssl: false,
          status: 'unknown',
          message: t('dashboard.organization.domains.ssl.check_failed'),
        },
      }))
    } finally {
      setSslLoading((prev) => ({ ...prev, [domain.domain_uuid]: false }))
    }
  }, [org?.id, access_token, t])

  // Auto-check SSL for all verified domains on load and every 30s
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!domains || !access_token || !org?.id) return

    const verifiedDomains = domains.filter((d) => d.status === 'verified')
    if (verifiedDomains.length === 0) return

    const checkAll = () => {
      verifiedDomains.forEach((domain) => handleCheckSSL(domain))
    }

    // Initial check
    checkAll()

    // Poll every 30s
    intervalRef.current = setInterval(checkAll, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [domains, access_token, org?.id, handleCheckSSL])

  const getSSLBadge = (domain: CustomDomain) => {
    if (domain.status !== 'verified') {
      return (
        <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
          <Shield size={12} className="mr-1" />
          N/A
        </Badge>
      )
    }

    const sslStatus = sslStatuses[domain.domain_uuid]
    const loading = sslLoading[domain.domain_uuid]

    if (loading && !sslStatus) {
      return (
        <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-600">
          <Loader2 size={12} className="mr-1 animate-spin" />
          {t('dashboard.organization.domains.ssl.checking')}
        </Badge>
      )
    }

    if (!sslStatus) {
      return (
        <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
          <Shield size={12} className="mr-1" />
          {t('dashboard.organization.domains.ssl.checking')}
        </Badge>
      )
    }

    switch (sslStatus.status) {
      case 'active':
        return (
          <Badge variant="outline" className="border-transparent bg-green-100 text-green-800" title={t('dashboard.organization.domains.ssl.tooltip', { issuer: sslStatus.issuer || t('common.unknown'), expires: sslStatus.expires || t('common.unknown') })}>
            <ShieldCheck size={12} className="mr-1" />
            {t('dashboard.organization.domains.ssl.active')}
          </Badge>
        )
      case 'provisioning':
        return (
          <Badge variant="outline" className="border-transparent bg-yellow-100 text-yellow-800" title={sslStatus.message}>
            <Loader2 size={12} className="mr-1 animate-spin" />
            {t('dashboard.organization.domains.ssl.provisioning')}
          </Badge>
        )
      case 'invalid':
        return (
          <Badge variant="outline" className="border-transparent bg-red-100 text-red-800" title={sslStatus.message}>
            <ShieldAlert size={12} className="mr-1" />
            {t('dashboard.organization.domains.ssl.invalid')}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-600" title={sslStatus.message}>
            <ShieldAlert size={12} className="mr-1" />
            {t('common.unknown')}
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
            <CheckCircle2 size={12} className="mr-1" />
            {t('dashboard.organization.domains.status.verified')}
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
            <Clock size={12} className="mr-1" />
            {t('dashboard.organization.domains.status.pending')}
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
            <XCircle size={12} className="mr-1" />
            {t('dashboard.organization.domains.status.failed')}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('dashboard.organization.domains.never')
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

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="standard"
      icon={Globe}
      titleKey="common.plans.feature_restricted.custom_domains.title"
      descriptionKey="common.plans.feature_restricted.custom_domains.description"
    >
      <div className="space-y-3">
        {/* ===== Action Row ===== */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border bg-black text-white border-black hover:opacity-90 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>{t('dashboard.organization.domains.add_domain')}</span>
          </button>
        </div>

        {/* ===== Main Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('common.sections.custom_domains')}
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin text-gray-400" size={24} />
            </div>
          ) : domains && domains.length > 0 ? (
              <div className="space-y-2">
                {domains.map((domain) => (
                  <div
                    key={domain.domain_uuid}
                    className="flex items-center justify-between px-5 py-5 rounded-xl bg-gray-50 shadow-borders-base"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Globe size={16} className="text-gray-400 shrink-0" />
                      <span className="font-medium truncate">{domain.domain}</span>
                      {domain.status === 'verified' && (
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {getStatusBadge(domain.status)}
                      {getSSLBadge(domain)}
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatDate(domain.creation_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {domain.status === 'pending' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={async () => {
                            setSelectedDomain(domain)
                            await loadVerificationInfo(domain.domain_uuid)
                            setIsVerifyDialogOpen(true)
                          }}
                        >
                          <RefreshCw size={12} />
                          {t('dashboard.organization.domains.verify')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                        onClick={() => {
                          setSelectedDomain(domain)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Globe size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('dashboard.organization.domains.empty.title')}</p>
              <p className="text-sm">{t('dashboard.organization.domains.empty.description')}</p>
            </div>
          )}
        </div>
      </div>

        {/* Add Domain Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{t('dashboard.organization.domains.add_dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.organization.domains.add_dialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">{t('dashboard.organization.domains.fields.domain')}</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder={t('dashboard.organization.domains.fields.domain_placeholder')}
                />
                <p className="text-xs text-gray-500">
                  {t('dashboard.organization.domains.add_dialog.hint')}
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddDomain}>{t('dashboard.organization.domains.add_domain')}</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verify Domain Dialog */}
        <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
          <DialogContent className="rounded-xl p-6" hideCloseButton>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {verificationInfo && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <AlertTriangle className="text-gray-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{t('dashboard.organization.domains.verify_dialog.dns_required_title')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('dashboard.organization.domains.verify_dialog.dns_required_description')}
                      </p>
                    </div>
                  </div>

                  {/* TXT Record */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500 text-xs">{t('dashboard.organization.domains.verify_dialog.txt_record')}</Badge>
                      <span className="text-xs text-gray-400">{t('dashboard.organization.domains.verify_dialog.for_verification')}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500">{t('dashboard.organization.domains.verify_dialog.host_name')}</label>
                        <div className="flex gap-2 mt-1.5">
                          <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border border-gray-100 break-all">
                            {verificationInfo.txt_record_host}
                          </code>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                            onClick={() => copyToClipboard(verificationInfo.txt_record_host, 'txt_host')}
                          >
                            {copiedField === 'txt_host' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">{t('dashboard.organization.domains.verify_dialog.value')}</label>
                        <div className="flex gap-2 mt-1.5">
                          <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border border-gray-100 break-all">
                            {verificationInfo.txt_record_value}
                          </code>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                            onClick={() => copyToClipboard(verificationInfo.txt_record_value, 'txt_value')}
                          >
                            {copiedField === 'txt_value' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CNAME Record */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500 text-xs">{t('dashboard.organization.domains.verify_dialog.cname_record')}</Badge>
                      <span className="text-xs text-gray-400">{t('dashboard.organization.domains.verify_dialog.for_routing')}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500">{t('dashboard.organization.domains.verify_dialog.host_name')}</label>
                        <div className="flex gap-2 mt-1.5">
                          <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border border-gray-100 break-all">
                            {verificationInfo.cname_record_host}
                          </code>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                            onClick={() => copyToClipboard(verificationInfo.cname_record_host, 'cname_host')}
                          >
                            {copiedField === 'cname_host' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500">{t('dashboard.organization.domains.verify_dialog.value_target')}</label>
                        <div className="flex gap-2 mt-1.5">
                          <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 border border-gray-100 break-all">
                            {verificationInfo.cname_record_value}
                          </code>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                            onClick={() => copyToClipboard(verificationInfo.cname_record_value, 'cname_value')}
                          >
                            {copiedField === 'cname_value' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SSL Certificate Status */}
                  {selectedDomain && selectedDomain.status === 'verified' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-transparent bg-gray-100 text-gray-500 text-xs">{t('dashboard.organization.domains.verify_dialog.ssl_certificate')}</Badge>
                          <span className="text-xs text-gray-400">{t('dashboard.organization.domains.verify_dialog.https_status')}</span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleCheckSSL(selectedDomain)}
                          disabled={sslLoading[selectedDomain.domain_uuid]}
                        >
                          {sslLoading[selectedDomain.domain_uuid] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          {t('dashboard.organization.domains.verify_dialog.check')}
                        </button>
                      </div>
                      {sslStatuses[selectedDomain.domain_uuid] ? (
                        <div className={`rounded-lg p-4 ${
                          sslStatuses[selectedDomain.domain_uuid].has_ssl
                            ? 'bg-green-50 border border-green-200'
                            : sslStatuses[selectedDomain.domain_uuid].status === 'provisioning'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            {sslStatuses[selectedDomain.domain_uuid].has_ssl ? (
                              <ShieldCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                            ) : sslStatuses[selectedDomain.domain_uuid].status === 'provisioning' ? (
                              <Loader2 size={18} className="text-yellow-600 flex-shrink-0 mt-0.5 animate-spin" />
                            ) : (
                              <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                sslStatuses[selectedDomain.domain_uuid].has_ssl
                                  ? 'text-green-800'
                                  : sslStatuses[selectedDomain.domain_uuid].status === 'provisioning'
                                  ? 'text-yellow-800'
                                  : 'text-red-800'
                              }`}>
                                {sslStatuses[selectedDomain.domain_uuid].message}
                              </p>
                              {sslStatuses[selectedDomain.domain_uuid].has_ssl && (
                                <div className="text-xs text-green-700 mt-1 space-y-0.5">
                                  {sslStatuses[selectedDomain.domain_uuid].issuer && (
                                    <p>{t('dashboard.organization.domains.ssl.issuer', { issuer: sslStatuses[selectedDomain.domain_uuid].issuer })}</p>
                                  )}
                                  {sslStatuses[selectedDomain.domain_uuid].expires && (
                                    <p>{t('dashboard.organization.domains.ssl.expires', { expires: sslStatuses[selectedDomain.domain_uuid].expires })}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 size={14} className="animate-spin" />
                          {t('dashboard.organization.domains.verify_dialog.checking_ssl')}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setIsVerifyDialogOpen(false)
                  setSelectedDomain(null)
                  setVerificationInfo(null)
                }}
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={handleVerifyDomain}
                disabled={isVerifying}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-black text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{t('dashboard.organization.domains.verify_dialog.verifying')}</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{t('dashboard.organization.domains.verify_dialog.verify_dns')}</span>
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Domain Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                {t('dashboard.organization.domains.delete_dialog.title')}
              </DialogTitle>
              <DialogDescription>
                {t('dashboard.organization.domains.delete_dialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              {selectedDomain && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <span className="font-medium">{selectedDomain.domain}</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleDeleteDomain}>
                  {t('dashboard.organization.domains.delete_dialog.confirm')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
    </PlanRestrictedFeature>
  )
}

export default OrgEditDomains
