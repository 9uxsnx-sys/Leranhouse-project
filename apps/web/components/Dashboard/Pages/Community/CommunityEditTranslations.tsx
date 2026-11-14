'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { useLHSession } from '@components/Contexts/LHSessionContext'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import {
  CommunityTranslation,
  deleteCommunityTranslation,
  getCommunityTranslations,
  upsertCommunityTranslation,
} from '@services/communities/communityTranslations'
import { revalidateTags } from '@services/utils/ts/requests'

type CommunityEditTranslationsProps = {
  community: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

// A community only has two admin-authored fields — everything else
// (discussions, members) is user generated and is never translated.
const CONTENT_FIELDS = ['name', 'description'] as const
type ContentField = (typeof CONTENT_FIELDS)[number]

function hasValue(row: any, field: ContentField): boolean {
  if (!row) return false
  const value = row[field]
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function CommunityEditTranslations({
  community,
  orgslug,
  onUpdated,
}: CommunityEditTranslationsProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const communityUuid: string | undefined = community?.community_uuid
  const sourceLocale = (community?.source_locale || 'en').split('-')[0]

  const [translations, setTranslations] = useState<CommunityTranslation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyLocale, setBusyLocale] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadTranslations = useCallback(async () => {
    if (!communityUuid) return
    try {
      const rows = await getCommunityTranslations(communityUuid, access_token)
      setTranslations(rows)
    } catch {
      setTranslations([])
    } finally {
      setIsLoading(false)
    }
  }, [communityUuid, access_token])

  useEffect(() => {
    loadTranslations()
  }, [loadTranslations])

  const fieldLabel = (field: ContentField) =>
    field === 'name'
      ? t('dashboard.courses.communities.general.form.name_label')
      : t('dashboard.courses.communities.general.form.description_label')

  const rows = useMemo(() => {
    return AVAILABLE_LANGUAGES.map((language) => {
      const isSource = language.code === sourceLocale
      const row = isSource
        ? community
        : translations.find((item) => item.locale === language.code)
      const filledCount = row
        ? CONTENT_FIELDS.filter((field) => hasValue(row, field)).length
        : 0
      const status = isSource
        ? 'source'
        : !row
          ? 'not_started'
          : filledCount === CONTENT_FIELDS.length
            ? 'complete'
            : 'partial'
      return { language, row, isSource, status }
    })
  }, [sourceLocale, community, translations])

  const handleCopyFromSource = async (locale: string) => {
    if (!communityUuid || busyLocale) return
    setBusyLocale(locale)
    try {
      await upsertCommunityTranslation(
        communityUuid,
        locale,
        {
          name: community?.name,
          description: community?.description ?? null,
        },
        access_token
      )
      await loadTranslations()
      await revalidateTags(['communities'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.translations.copy_success'))
    } catch {
      toast.error(t('dashboard.courses.translations.action_error'))
    } finally {
      setBusyLocale(null)
    }
  }

  const handleDelete = async (locale: string) => {
    if (!communityUuid || busyLocale) return
    setBusyLocale(locale)
    try {
      await deleteCommunityTranslation(communityUuid, locale, access_token)
      setConfirmDelete(null)
      await loadTranslations()
      await revalidateTags(['communities'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.translations.delete_success'))
    } catch {
      toast.error(t('dashboard.courses.translations.action_error'))
    } finally {
      setBusyLocale(null)
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'source':
        return t('dashboard.courses.translations.status.source')
      case 'complete':
        return t('dashboard.courses.translations.status.complete')
      case 'partial':
        return t('dashboard.courses.translations.status.partial')
      default:
        return t('dashboard.courses.translations.status.not_started')
    }
  }

  const statusClass = (status: string) => {
    switch (status) {
      case 'source':
        return 'bg-gray-100 text-gray-600'
      case 'complete':
        return 'bg-teal-50 text-teal-700'
      case 'partial':
        return 'bg-amber-50 text-amber-700'
      default:
        return 'bg-gray-50 text-gray-500'
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-1">
          {t('dashboard.courses.translations.title')}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          {t('dashboard.courses.translations.subtitle')}
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            {t('dashboard.courses.settings.loading')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs uppercase tracking-wide text-gray-400">
                  <th className="text-start font-medium pb-3 pe-4">
                    {t('dashboard.courses.translations.columns.language')}
                  </th>
                  {CONTENT_FIELDS.map((field) => (
                    <th key={field} className="text-start font-medium pb-3 pe-4">
                      {fieldLabel(field)}
                    </th>
                  ))}
                  <th className="text-start font-medium pb-3 pe-4">
                    {t('dashboard.courses.translations.columns.status')}
                  </th>
                  <th className="text-end font-medium pb-3">
                    {t('dashboard.courses.translations.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ language, row, isSource, status }) => (
                  <tr key={language.code} className="border-t border-gray-100 align-middle">
                    <td className="py-3 pe-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{language.nativeName}</span>
                      <span className="text-gray-400 ms-2 uppercase text-xs">{language.code}</span>
                    </td>
                    {CONTENT_FIELDS.map((field) => (
                      <td key={field} className="py-3 pe-4">
                        {hasValue(row, field) ? (
                          <Check size={15} className="text-teal-600" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="py-3 pe-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!isSource && !row && (
                          <button
                            type="button"
                            onClick={() => handleCopyFromSource(language.code)}
                            disabled={busyLocale === language.code}
                            title={t('dashboard.courses.translations.actions.copy_from_source')}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {busyLocale === language.code ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                        {!isSource &&
                          row &&
                          (confirmDelete === language.code ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(language.code)}
                              disabled={busyLocale === language.code}
                              className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {busyLocale === language.code
                                ? t('dashboard.courses.save.saving')
                                : t('dashboard.courses.translations.actions.confirm_delete')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(language.code)}
                              onBlur={() =>
                                setConfirmDelete((current) =>
                                  current === language.code ? null : current
                                )
                              }
                              title={t('dashboard.courses.translations.actions.delete')}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityEditTranslations
