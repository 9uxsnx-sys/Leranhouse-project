'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { updateProfile } from '@services/settings/profile'
import { Switch } from '@components/ui/switch'
import { EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PrivacySettings {
  hide_courses: boolean
  hide_podcasts: boolean
  hide_communities: boolean
}

const DEFAULT_PRIVACY: PrivacySettings = {
  hide_courses: false,
  hide_podcasts: false,
  hide_communities: false,
}

function AccountPrivacy() {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const user = session?.data?.user
  const { t } = useTranslation()

  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY)
  const [loading, setLoading] = useState<string | null>(null)

  // Load settings from session on mount
  useEffect(() => {
    if (user?.extra_metadata?.privacy) {
      setSettings({
        ...DEFAULT_PRIVACY,
        ...user.extra_metadata.privacy,
      })
    }
  }, [user])

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const newValue = !settings[key]
    const newSettings = { ...settings, [key]: newValue }
    // Optimistic update
    setSettings(newSettings)
    setLoading(key)

    try {
      const user_id = user.id
      const payload = {
        extra_metadata: {
          ...(user.extra_metadata || {}),
          privacy: newSettings,
        },
      }
      const response = await updateProfile(payload, user_id, access_token)
      if (!response.success) {
        // Revert on failure
        setSettings(settings)
        toast.error('Failed to update privacy setting')
      }
    } catch (error) {
      // Revert on error
      setSettings(settings)
      toast.error('Failed to update privacy setting')
    } finally {
      setLoading(null)
    }
  }

  const toggles: { key: keyof PrivacySettings; label: string; description: string }[] = [
    {
      key: 'hide_courses',
      label: 'Hide courses I own',
      description: 'Your created courses won\'t show up on your public profile',
    },
    {
      key: 'hide_podcasts',
      label: 'Hide podcasts I own',
      description: 'Same for podcasts',
    },
    {
      key: 'hide_communities',
      label: 'Hide communities I have',
      description: 'Groups you\'re in won\'t be listed on your profile',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('account.privacy')}
        </h3>

        <div className="divide-y divide-gray-100">
          {toggles.map((toggle) => (
            <div
              key={toggle.key}
              className="flex items-start justify-between py-4 first:pt-0 last:pb-0 gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <EyeOff size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{toggle.label}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{toggle.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[toggle.key]}
                onCheckedChange={() => toggleSetting(toggle.key)}
                disabled={loading === toggle.key}
                size="base"
                className="flex-shrink-0 mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AccountPrivacy
