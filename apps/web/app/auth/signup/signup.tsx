'use client'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import React, { useEffect, useState } from 'react'
import { Loader2, Ticket, UserPlus } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import UserAvatar from '@components/Objects/UserAvatar'
import OpenSignUpComponent from './OpenSignup'
import InviteOnlySignUpComponent from './InviteOnlySignUp'
import { useRouter, useSearchParams } from 'next/navigation'
import { validateInviteCode } from '@services/organizations/invites'
import { joinOrg } from '@services/organizations/orgs'
import { getUriWithOrg } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@components/Auth/AuthLayout'
import AuthAlert from '@components/Auth/AuthAlert'
import {
  authFieldClass,
  authPrimaryBtnClass,
  authLabelClass,
} from '@components/Auth/authStyles'

interface SignUpClientProps {
  org: any
}

function SignUpClient(props: SignUpClientProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const [joinMethod, setJoinMethod] = React.useState('open')
  const [inviteCode, setInviteCode] = React.useState('')
  const searchParams = useSearchParams()
  const inviteCodeParam = searchParams.get('inviteCode')

  useEffect(() => {
    if (props.org.config) {
      const config = props.org?.config?.config
      const isV2 = config?.config_version?.startsWith('2')
      const signupMode = isV2
        ? config?.admin_toggles?.members?.signup_mode
        : config?.features?.members?.signup_mode
      setJoinMethod(signupMode || 'open')
    }
    if (inviteCodeParam) {
      setInviteCode(inviteCodeParam)
    }
  }, [props.org, inviteCodeParam])

  return (
    <AuthLayout org={props.org} welcomeText={t('auth.invited_to_join')}>
      {joinMethod == 'open' &&
        (session.status == 'authenticated' ? (
          <LoggedInJoinScreen inviteCode={inviteCode} org={props.org} />
        ) : (
          <OpenSignUpComponent />
        ))}
      {joinMethod == 'inviteOnly' &&
        (inviteCode ? (
          session.status == 'authenticated' ? (
            <LoggedInJoinScreen inviteCode={inviteCode} org={props.org} />
          ) : (
            <InviteOnlySignUpComponent inviteCode={inviteCode} />
          )
        ) : (
          <NoTokenScreen org={props.org} />
        ))}
    </AuthLayout>
  )
}

interface JoinScreenProps {
  inviteCode: string
  org: any
}

const LoggedInJoinScreen = ({ inviteCode, org }: JoinScreenProps) => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const contextOrg = useOrg() as any
  const activeOrg = contextOrg || org
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const router = useRouter()

  const join = async () => {
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setShowMessage(false)

    const res = await joinOrg(
      { org_id: activeOrg.id, user_id: session?.data?.user?.user_uuid, invite_code: inviteCode },
      null,
      session.data?.tokens?.access_token
    )

    if (res.success) {
      setSuccess(typeof res.data === 'string' ? res.data : t('auth.join_organization_success'))
      setShowMessage(true)
      // Refresh session so the new org membership appears in session.data.roles
      await session.update?.(true)
      setTimeout(() => {
        router.push(getUriWithOrg(activeOrg.slug, '/'))
      }, 2000)
    } else {
      const detail = res.data?.detail
      let errorMsg = t('common.something_went_wrong')
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail[0]?.msg || t('common.something_went_wrong')
      }
      setError(errorMsg)
      setShowMessage(true)
    }
    setIsSubmitting(false)
  }

  return (
    <div>
      {showMessage && (error || success) && (
        <AuthAlert
          variant={error ? 'error' : 'success'}
          className="mb-6"
        >
          {error || success}
        </AuthAlert>
      )}

      <div className="flex flex-col items-center gap-6">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <UserAvatar rounded="rounded-xl" border="border-2" width={48} />
          <div className="text-start">
            <p className="font-medium text-gray-900">
              {session.data?.user?.first_name} {session.data?.user?.last_name}
            </p>
            <p className="text-sm text-gray-500">@{session.data?.user?.username}</p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="w-full text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">{t('auth.joining')}</p>
          <p className="font-semibold text-gray-900 text-lg">{activeOrg?.name}</p>
        </div>

        {/* Join Button or Verification Warning */}
        {session.data?.user?.email_verified === false ? (
          <AuthAlert variant="warning" className="w-full">
            <p className="font-semibold">{t('auth.email_verification_required')}</p>
            <p className="mt-0.5">{t('auth.email_verification_required_join')}</p>
          </AuthAlert>
        ) : (
          <button
            type="button"
            onClick={join}
            disabled={isSubmitting}
            className={authPrimaryBtnClass}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                {t('auth.join_organization')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

interface NoTokenScreenProps {
  org: any
}

const NoTokenScreen = ({ org }: NoTokenScreenProps) => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const contextOrg = useOrg() as any
  const activeOrg = contextOrg || org
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMessage, setShowMessage] = useState(false)

  const validateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setShowMessage(false)

    const res = await validateInviteCode(activeOrg?.id, inviteCode, session?.data?.tokens?.access_token)

    if (res.success) {
      setSuccess(t('auth.invite_code_valid'))
      setShowMessage(true)
      setTimeout(() => {
        router.push(`/signup?inviteCode=${inviteCode}`)
      }, 1500)
    } else {
      setError(t('auth.invite_code_invalid'))
      setShowMessage(true)
    }
    setIsSubmitting(false)
  }

  return (
    <div>
      {showMessage && (error || success) && (
        <AuthAlert variant={error ? 'error' : 'success'} className="mb-6">
          {error || success}
        </AuthAlert>
      )}

      <p className="text-sm text-gray-500 mb-6">
        {t('auth.invite_required_desc', { org: activeOrg?.name })}
      </p>

      <form onSubmit={validateCode} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="invite-code" className={authLabelClass}>
            {t('auth.invite_code')}
          </label>
          <input
            id="invite-code"
            name="invite_code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={t('auth.enter_invite_code')}
            className={authFieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !inviteCode}
          className={authPrimaryBtnClass}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Ticket size={18} />
              {t('auth.validate_invite')}
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default SignUpClient
