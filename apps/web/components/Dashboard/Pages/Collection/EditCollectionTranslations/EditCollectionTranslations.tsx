'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Download, Loader2, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { useLHSession } from '@components/Contexts/LHSessionContext'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import {
  CollectionTranslation,
  deleteCollectionTranslation,
  getCollectionTranslations,
  upsertCollectionTranslation,
} from '@services/courses/collectionTranslations'
import { revalidateTags } from '@services/utils/ts/requests'

type EditCollectionTranslationsProps = {
  collection: any
  orgslug: string
  onUpdated: () => void | Promise<void>
}

const CONTENT_FIELDS = ['name', 'description', 'about', 'learnings', 'tags', 'seo'] as const
type ContentField = (typeof CONTENT_FIELDS)[number]

// Flat column set for the export/import file — translators work in a spreadsheet,
// not in JSON. `learnings` and `seo` keep their JSON/nested shape.
const CSV_FIELDS = [
  'name',
  'description',
  'about',
  'learnings',
  'tags',
  'seo.title',
  'seo.description',
  'seo.keywords',
  'seo.canonical_url',
  'seo.og_title',
  'seo.og_description',
  'seo.og_image',
  'seo.twitter_title',
  'seo.twitter_description',
] as const

function hasValue(row: any, field: ContentField): boolean {
  if (!row) return false
  if (field === 'seo') {
    const value = row.seo
    if (!value || typeof value !== 'object') return false
    return Object.values(value).some((v) =>
      typeof v === 'string' ? v.trim().length > 0 : v === true
    )
  }
  const value = row[field]
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function csvCell(value: any): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

/** Minimal RFC 4180 reader — enough for the two-column files we produce. */
function parseCsv(text: string): Record<string, string> {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const values: Record<string, string> = {}
  rows.slice(1).forEach((entry) => {
    const key = entry[0]?.trim()
    if (key) values[key] = entry[1] ?? ''
  })
  return values
}

function EditCollectionTranslations({
  collection,
  orgslug,
  onUpdated,
}: EditCollectionTranslationsProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const collectionUuid: string | undefined = collection?.collection_uuid
  const sourceLocale = (collection?.source_locale || 'en').split('-')[0]

  const [translations, setTranslations] = useState<CollectionTranslation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyLocale, setBusyLocale] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileInputs = React.useRef<Record<string, HTMLInputElement | null>>({})

  const loadTranslations = useCallback(async () => {
    if (!collectionUuid) return
    try {
      const rows = await getCollectionTranslations(collectionUuid, access_token)
      setTranslations(rows)
    } catch {
      setTranslations([])
    } finally {
      setIsLoading(false)
    }
  }, [collectionUuid, access_token])

  useEffect(() => {
    loadTranslations()
  }, [loadTranslations])

  const fieldLabel = (field: ContentField) => {
    switch (field) {
      case 'name':
        return t('collections.collection_name')
      case 'description':
        return t('collections.description')
      case 'about':
        return t('collections.dashboard.general.about_label')
      case 'learnings':
        return t('collections.dashboard.general.learnings_title')
      case 'tags':
        return t('collections.dashboard.general.tags_label')
      default:
        return t('dashboard.courses.translations.fields.seo')
    }
  }

  const rows = useMemo(() => {
    return AVAILABLE_LANGUAGES.map((language) => {
      const isSource = language.code === sourceLocale
      const row = isSource
        ? collection
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
      return { language, row, isSource, filledCount, status }
    })
  }, [sourceLocale, collection, translations])

  const handleCopyFromSource = async (locale: string) => {
    if (!collectionUuid || busyLocale) return
    setBusyLocale(locale)
    try {
      await upsertCollectionTranslation(
        collectionUuid,
        locale,
        {
          name: collection?.name,
          description: collection?.description ?? null,
          about: collection?.about ?? null,
          learnings: collection?.learnings ?? null,
          tags: collection?.tags ?? null,
          seo: collection?.seo ?? null,
        },
        access_token
      )
      await loadTranslations()
      await revalidateTags(['collections'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.translations.copy_success'))
    } catch {
      toast.error(t('dashboard.courses.translations.action_error'))
    } finally {
      setBusyLocale(null)
    }
  }

  const handleDelete = async (locale: string) => {
    if (!collectionUuid || busyLocale) return
    setBusyLocale(locale)
    try {
      await deleteCollectionTranslation(collectionUuid, locale, access_token)
      setConfirmDelete(null)
      await loadTranslations()
      await revalidateTags(['collections'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.translations.delete_success'))
    } catch {
      toast.error(t('dashboard.courses.translations.action_error'))
    } finally {
      setBusyLocale(null)
    }
  }

  const handleExport = (locale: string, row: any) => {
    const lines = ['field,value']
    CSV_FIELDS.forEach((field) => {
      const value = field.startsWith('seo.')
        ? row?.seo?.[field.slice(4)]
        : row?.[field]
      lines.push(`${field},${csvCell(value)}`)
    })
    const safeName = String(collection?.name || 'collection')
      .replace(/[^\w\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName}.${locale}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (locale: string, file: File) => {
    if (!collectionUuid) return
    setBusyLocale(locale)
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '')
      const values = parseCsv(text)

      const existing = translations.find((item) => item.locale === locale)
      const seo: Record<string, any> = {}
      Object.entries(values).forEach(([key, value]) => {
        if (key.startsWith('seo.')) seo[key.slice(4)] = value || null
      })

      const name = values.name || existing?.name || collection?.name
      if (!name) {
        toast.error(t('dashboard.courses.translations.import_needs_name'))
        return
      }

      await upsertCollectionTranslation(
        collectionUuid,
        locale,
        {
          name,
          description: values.description ?? existing?.description ?? null,
          about: values.about ?? existing?.about ?? null,
          learnings: values.learnings ?? existing?.learnings ?? null,
          tags: values.tags ?? existing?.tags ?? null,
          seo: Object.keys(seo).length
            ? { ...(existing?.seo || {}), ...seo }
            : existing?.seo ?? null,
        },
        access_token
      )
      await loadTranslations()
      await revalidateTags(['collections'], orgslug)
      await onUpdated()
      toast.success(t('dashboard.courses.translations.import_success'))
    } catch {
      toast.error(t('dashboard.courses.translations.import_error'))
    } finally {
      setBusyLocale(null)
      const input = fileInputs.current[locale]
      if (input) input.value = ''
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
                        <button
                          type="button"
                          onClick={() => handleExport(language.code, row)}
                          title={t('dashboard.courses.translations.actions.export')}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputs.current[language.code]?.click()}
                          disabled={busyLocale === language.code}
                          title={t('dashboard.courses.translations.actions.import')}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Upload size={14} />
                        </button>
                        <input
                          ref={(element) => {
                            fileInputs.current[language.code] = element
                          }}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) handleImport(language.code, file)
                          }}
                        />
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

export default EditCollectionTranslations
