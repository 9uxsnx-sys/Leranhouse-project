'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { Check, Copy, Ticket, Trash2, Users, Loader2 } from 'lucide-react'
import React, { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import dayjs from 'dayjs'
import {
  changeSignupMechanism,
  createInviteCode,
  deleteInviteCode,
} from '@services/organizations/invites'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useTranslation } from 'react-i18next'

function CopyButton({ text, children }: { text: string; children?: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (children) {
    return (
      <div onClick={handleCopy} className="inline-flex" title="Click to copy">
        {children}
      </div>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function OrgAccess() {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token;
  const { data: invites } = useSWR(
    org ? `${getAPIUrl()}orgs/${org?.id}/invites` : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [joinMethod, setJoinMethod] = React.useState('open')
  const [isToggling, setIsToggling] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)

  async function getOrgJoinMethod() {
    if (org) {
      const config = org.config?.config
      const isV2 = config?.config_version?.startsWith('2')
      let signupMode: string

      if (isV2) {
        signupMode = config?.admin_toggles?.members?.signup_mode || 'open'
      } else {
        signupMode = config?.features?.members?.signup_mode || 'open'
      }

      setJoinMethod(signupMode === 'open' ? 'open' : 'inviteOnly')
    }
  }

  async function deleteInvite(invite: any) {
    const toastId = toast.loading(t('dashboard.users.signups.invite_codes.toasts.deleting'))
    let res = await deleteInviteCode(org.id, invite.invite_code_uuid, access_token)
    if (res.status == 200) {
      mutate(`${getAPIUrl()}orgs/${org.id}/invites`)
      toast.success(t('dashboard.users.signups.invite_codes.toasts.delete_success'), {id:toastId})
    } else {
      toast.error(t('dashboard.users.signups.invite_codes.toasts.delete_error'), {id:toastId})
    }
  }

  async function handleToggle() {
    if (isToggling) return
    setIsToggling(true)
    const newMethod = joinMethod === 'open' ? 'inviteOnly' : 'open'
    const toastId = toast.loading(t('dashboard.users.signups.invite_codes.toasts.changing_method'))
    let res = await changeSignupMechanism(org.id, newMethod, access_token)
    if (res.status == 200) {
      setJoinMethod(newMethod)
      mutate(`${getAPIUrl()}orgs/slug/${org?.slug}`)
      toast.success(t('dashboard.users.signups.invite_codes.toasts.change_success', { method: newMethod }), {id:toastId})
    } else {
      toast.error(t('dashboard.users.signups.invite_codes.toasts.change_error'), {id:toastId})
    }
    setIsToggling(false)
  }

  useEffect(() => {
    if (invites && org) {
      getOrgJoinMethod()
      setIsLoading(false)
    }
  }, [org, invites])

  async function handleGenerate() {
    if (isGenerating) return
    setIsGenerating(true)
    const toastId = toast.loading('Generating invite code...')
    try {
      const res = await createInviteCode(org.id, access_token)
      if (res.status === 200) {
        mutate(`${getAPIUrl()}orgs/${org.id}/invites`)
        toast.success('Invite code generated', { id: toastId })
      } else {
        toast.error(res.data?.detail || 'Failed to generate code', { id: toastId })
      }
    } catch {
      toast.error('Failed to generate code', { id: toastId })
    }
    setIsGenerating(false)
  }

  const inviteCount = invites?.length ?? 0
  const isInviteOnly = joinMethod === 'inviteOnly'

  return (
    <>
      {!isLoading ? (
        <div className="space-y-3">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
              <span>{isGenerating ? 'Generating...' : t('dashboard.users.signups.invite_codes.actions.generate')}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* ON/OFF Toggle (immediate) */}
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isToggling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className={`w-2.5 h-2.5 rounded ${isInviteOnly ? 'bg-green-500' : 'bg-red-500'}`} />
                )}
                {isToggling ? '...' : isInviteOnly ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Invite Codes Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
              {t('dashboard.users.signups.invite_codes.title')}
            </h3>

            {invites && invites.length > 0 ? (
              <div className="space-y-2">
                {invites?.map((invite: any) => (
                  <div
                    key={invite.invite_code_uuid}
                    className="flex items-center justify-between px-5 py-4 rounded-xl bg-gray-50 shadow-borders-base"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <CopyButton text={invite.invite_code}>
                        <code className="bg-white px-2.5 py-1 rounded text-sm font-mono text-gray-700 shrink-0 cursor-pointer hover:bg-gray-100 transition-colors">
                          {invite.invite_code}
                        </code>
                      </CopyButton>
                      <CopyButton text={getUriWithOrg(org.slug, `/signup?inviteCode=${invite.invite_code}`)}>
                        <span className="text-gray-400 text-xs truncate font-mono hover:text-gray-600 transition-colors cursor-pointer">
                          {getUriWithOrg(org.slug, `/signup?inviteCode=${invite.invite_code}`)}
                        </span>
                      </CopyButton>
                      <span className="inline-flex items-center gap-1 text-gray-400 text-xs shrink-0">
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('dashboard.users.signups.invite_codes.types.normal')}</span>
                      </span>
                      <span className="text-xs text-gray-300 shrink-0">
                        {dayjs(invite.created_at).add(1, 'year').format('DD/MM/YYYY')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <CopyButton text={invite.invite_code} />
                      <ConfirmationModal
                        confirmationButtonText={t('dashboard.users.signups.invite_codes.actions.delete_code')}
                        confirmationMessage={t('dashboard.users.signups.invite_codes.actions.delete_confirmation_message')}
                        dialogTitle={t('dashboard.users.signups.invite_codes.actions.delete_confirmation_title')}
                        dialogTrigger={
                          <button className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        }
                        functionToExecute={() => deleteInvite(invite)}
                        status="warning"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No invite codes yet</p>
                <p className="text-xs text-gray-300 mt-1">Generate codes to invite users to your organization</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">{inviteCount} / 6 invite codes used</span>
            </div>
          </div>


        </div>
      ) : (
        <PageLoading />
      )}
    </>
  )
}

export default OrgAccess
