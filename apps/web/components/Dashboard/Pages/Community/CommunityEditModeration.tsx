'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Check,
  SaveAllIcon,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import {
  updateCommunity,
  CommunityModerationSettings,
} from '@services/communities/communities'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { Label } from '@components/ui/label'

type Settings = Required<CommunityModerationSettings>

const DEFAULT_SETTINGS: Settings = {
  block_links: false,
  min_post_length: 0,
  max_post_length: 0,
  max_comment_length: 0,
  slow_mode_seconds: 0,
  max_posts_per_day: 0,
  min_account_age_days: 0,
  require_email_verified: false,
  disable_reactions: false,
  auto_lock_days: 0,
}

function normalizeSettings(stored: CommunityModerationSettings | null | undefined): Settings {
  return {
    block_links: stored?.block_links ?? DEFAULT_SETTINGS.block_links,
    min_post_length: stored?.min_post_length ?? DEFAULT_SETTINGS.min_post_length,
    max_post_length: stored?.max_post_length ?? DEFAULT_SETTINGS.max_post_length,
    max_comment_length: stored?.max_comment_length ?? DEFAULT_SETTINGS.max_comment_length,
    slow_mode_seconds: stored?.slow_mode_seconds ?? DEFAULT_SETTINGS.slow_mode_seconds,
    max_posts_per_day: stored?.max_posts_per_day ?? DEFAULT_SETTINGS.max_posts_per_day,
    min_account_age_days: stored?.min_account_age_days ?? DEFAULT_SETTINGS.min_account_age_days,
    require_email_verified:
      stored?.require_email_verified ?? DEFAULT_SETTINGS.require_email_verified,
    disable_reactions: stored?.disable_reactions ?? DEFAULT_SETTINGS.disable_reactions,
    auto_lock_days: stored?.auto_lock_days ?? DEFAULT_SETTINGS.auto_lock_days,
  }
}

function settingsEqual(a: Settings, b: Settings) {
  return (
    a.block_links === b.block_links &&
    a.min_post_length === b.min_post_length &&
    a.max_post_length === b.max_post_length &&
    a.max_comment_length === b.max_comment_length &&
    a.slow_mode_seconds === b.slow_mode_seconds &&
    a.max_posts_per_day === b.max_posts_per_day &&
    a.min_account_age_days === b.min_account_age_days &&
    a.require_email_verified === b.require_email_verified &&
    a.disable_reactions === b.disable_reactions &&
    a.auto_lock_days === b.auto_lock_days
  )
}

type NumericKey =
  | 'min_post_length'
  | 'max_post_length'
  | 'max_comment_length'
  | 'slow_mode_seconds'
  | 'max_posts_per_day'
  | 'min_account_age_days'
  | 'auto_lock_days'

type ToggleKey = 'block_links' | 'require_email_verified' | 'disable_reactions'

const CommunityEditModeration: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const dispatch = useCommunityDispatch()
  const community = communityState?.community
  const accessToken = session?.data?.tokens?.access_token
  const inputRef = useRef<HTMLInputElement>(null)

  const [words, setWords] = useState<string[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [newWord, setNewWord] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (community) {
      setWords(community.moderation_words || [])
      setSettings(normalizeSettings(community.moderation_settings))
    }
  }, [community])

  useEffect(() => {
    if (!community) return
    const originalWords = community.moderation_words || []
    const wordsChanged =
      words.length !== originalWords.length || words.some((w, i) => w !== originalWords[i])
    const originalSettings = normalizeSettings(community.moderation_settings)
    setHasChanges(wordsChanged || !settingsEqual(settings, originalSettings))
  }, [words, settings, community])

  if (!community) return null

  const handleAddWord = () => {
    const trimmedWord = newWord.trim().toLowerCase()
    if (!trimmedWord) return
    if (words.includes(trimmedWord)) {
      setError(t('dashboard.courses.communities.moderation.word_exists_error'))
      return
    }
    setWords([...words, trimmedWord])
    setNewWord('')
    setError(null)
    inputRef.current?.focus()
  }

  const handleRemoveWord = (wordToRemove: string) => {
    setWords(words.filter((w) => w !== wordToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddWord()
    }
  }

  const setNumber = (key: NumericKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw) || 0))
    setSettings((prev) => ({ ...prev, [key]: parsed }))
  }

  const setToggle = (key: ToggleKey) => (checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)
    const loadingToast = toast.loading(t('dashboard.courses.communities.moderation.toasts.saving'))

    try {
      const payload = {
        moderation_words: words,
        moderation_settings: settings,
      }
      await updateCommunity(community.community_uuid, payload, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      if (dispatch) {
        dispatch({
          type: 'setCommunity',
          payload: { ...community, moderation_words: words, moderation_settings: settings },
        })
      }
      toast.success(t('dashboard.courses.communities.moderation.toasts.save_success'), { id: loadingToast })
      router.refresh()
    } catch (err) {
      setError(t('dashboard.courses.communities.moderation.toasts.save_error'))
      toast.error(t('dashboard.courses.communities.moderation.toasts.save_error'), { id: loadingToast })
      console.error('Failed to update moderation settings:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges}
          className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
            isSubmitting
              ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
              : !hasChanges
                ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
          }`}
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : !hasChanges ? (
            <Check size={14} />
          ) : (
            <SaveAllIcon size={14} />
          )}
          <span>
            {isSubmitting
              ? t('common.saving')
              : !hasChanges
                ? t('dashboard.courses.save.saved')
                : t('common.save')}
          </span>
        </button>
      </div>

      {/* Card: Length limits */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.courses.communities.moderation.length_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberField
            label={t('dashboard.courses.communities.moderation.min_post_length_label')}
            value={settings.min_post_length}
            onChange={setNumber('min_post_length')}
            hint={t('dashboard.courses.communities.moderation.zero_disables')}
          />
          <NumberField
            label={t('dashboard.courses.communities.moderation.max_post_length_label')}
            value={settings.max_post_length}
            onChange={setNumber('max_post_length')}
            hint={t('dashboard.courses.communities.moderation.zero_disables')}
          />
          <NumberField
            label={t('dashboard.courses.communities.moderation.max_comment_length_label')}
            value={settings.max_comment_length}
            onChange={setNumber('max_comment_length')}
            hint={t('dashboard.courses.communities.moderation.zero_disables')}
          />
        </div>
      </div>

      {/* Card: Rate limits */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.courses.communities.moderation.rate_limits_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberField
            label={t('dashboard.courses.communities.moderation.slow_mode_label')}
            value={settings.slow_mode_seconds}
            onChange={setNumber('slow_mode_seconds')}
            hint={t('dashboard.courses.communities.moderation.slow_mode_hint')}
          />
          <NumberField
            label={t('dashboard.courses.communities.moderation.max_posts_per_day_label')}
            value={settings.max_posts_per_day}
            onChange={setNumber('max_posts_per_day')}
            hint={t('dashboard.courses.communities.moderation.zero_disables')}
          />
          <NumberField
            label={t('dashboard.courses.communities.moderation.auto_lock_days_label')}
            value={settings.auto_lock_days}
            onChange={setNumber('auto_lock_days')}
            hint={t('dashboard.courses.communities.moderation.auto_lock_days_hint')}
          />
        </div>
      </div>

      {/* Card: Account requirements */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.courses.communities.moderation.account_requirements_title')}
        </h3>
        <div className="space-y-4">
          <NumberField
            label={t('dashboard.courses.communities.moderation.min_account_age_label')}
            value={settings.min_account_age_days}
            onChange={setNumber('min_account_age_days')}
            hint={t('dashboard.courses.communities.moderation.min_account_age_hint')}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.block_links ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${settings.block_links ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              <input
                type="checkbox"
                className="sr-only"
                checked={settings.block_links}
                onChange={(e) => setToggle('block_links')(e.target.checked)}
              />
            </div>
            <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.communities.moderation.block_links_label')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.require_email_verified ? 'bg-black' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${settings.require_email_verified ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              <input
                type="checkbox"
                className="sr-only"
                checked={settings.require_email_verified}
                onChange={(e) => setToggle('require_email_verified')(e.target.checked)}
              />
            </div>
            <span className="text-sm text-gray-600 select-none">{t('dashboard.courses.communities.moderation.require_email_verified_label')}</span>
          </label>
        </div>
      </div>

      {/* Card: Blocked words */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.courses.communities.moderation.blocked_words_section_title')}
        </h3>

        <div className="rounded-xl border border-gray-200 bg-ui-bg-field">
          {words.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">{t('dashboard.courses.communities.moderation.no_blocked_words')}</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {words.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500 px-4 pt-3">{error}</p>}

          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('dashboard.courses.communities.moderation.add_word_placeholder')}
              className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300"
            />
            <button
              type="button"
              onClick={handleAddWord}
              disabled={!newWord.trim()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('dashboard.courses.communities.moderation.add_button')}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint?: string
}

function NumberField({ label, value, onChange, hint }: NumberFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-1">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value || ''}
        onChange={onChange}
        placeholder={hint || '0'}
        className="bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

export default CommunityEditModeration
