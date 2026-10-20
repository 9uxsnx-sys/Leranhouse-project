'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Lock,
  Users,
  FloppyDisk,
  X,
  Plus,
  TextT,
  ShieldCheck,
  Image,
  UploadSimple,
  CircleNotch,
} from '@phosphor-icons/react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import useSWR, { mutate } from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  updatePlayground,
  updatePlaygroundThumbnail,
  addUserGroupToPlayground,
  removeUserGroupFromPlayground,
  Playground,
  PlaygroundAccessType,
} from '@services/playgrounds/playgrounds'
import { getPlaygroundThumbnailMediaDirectory } from '@services/media/media'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import UnsplashImagePicker from '@components/Dashboard/Pages/Course/EditCourseGeneral/UnsplashImagePicker'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

type Tab = 'general' | 'access' | 'thumbnail'

interface PlaygroundOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playground: Playground
  orgslug: string
  onUpdated: (updated: Playground) => void
}

export default function PlaygroundOptionsModal({
  open,
  onOpenChange,
  playground,
  orgslug,
  onUpdated,
}: PlaygroundOptionsModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: t('playground.options.tabs.general'), icon: <TextT size={14} weight="bold" /> },
    { id: 'access', label: t('playground.options.tabs.access'), icon: <ShieldCheck size={14} weight="bold" /> },
    { id: 'thumbnail', label: t('playground.options.tabs.thumbnail'), icon: <Image size={14} weight="bold" /> },
  ]

  return (
    <Modal
      isDialogOpen={open}
      onOpenChange={onOpenChange}
      minWidth="lg"
      minHeight="lg"
      noPadding
      dialogContent={
        <div className="flex h-full min-h-[680px]">
          {/* Sidebar */}
          <div className="w-44 flex-shrink-0 border-r border-gray-100 bg-gray-50/60 flex flex-col py-4 px-3 gap-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
              {t('playground.options.sidebar_label')}
            </p>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-white nice-shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <GeneralTab playground={playground} onUpdated={onUpdated} />
            )}
            {activeTab === 'access' && (
              <AccessTab
                playground={playground}
                orgslug={orgslug}
                orgId={playground.org_id}
                onUpdated={onUpdated}
              />
            )}
            {activeTab === 'thumbnail' && (
              <ThumbnailTab playground={playground} onUpdated={onUpdated} />
            )}
          </div>
        </div>
      }
    />
  )
}

/* ── General Tab ── */
function GeneralTab({
  playground,
  onUpdated,
}: {
  playground: Playground
  onUpdated: (p: Playground) => void
}) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const [name, setName] = useState(playground.name)
  const [description, setDescription] = useState(playground.description || '')
  const [isSaving, setIsSaving] = useState(false)

  // Sync when playground prop changes
  useEffect(() => {
    setName(playground.name)
    setDescription(playground.description || '')
  }, [playground.name, playground.description])

  const hasChanges =
    name !== playground.name || description !== (playground.description || '')

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      const updated = await updatePlayground(
        playground.playground_uuid,
        { name: name.trim(), description: description.trim() || undefined },
        access_token
      )
      onUpdated(updated)
      toast.success(t('playground.options.general.saved'))
    } catch {
      toast.error(t('playground.options.general.save_failed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-0.5">{t('playground.options.general.title')}</h2>
        <p className="text-xs text-gray-400">{t('playground.options.general.description')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('playground.options.general.name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder={t('playground.options.general.name_placeholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('playground.options.general.description_label')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            placeholder={t('playground.options.general.description_placeholder')}
          />
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-black nice-shadow transition-all disabled:opacity-50"
          >
            <FloppyDisk size={14} weight="bold" />
            {isSaving ? t('playground.options.saving') : t('playground.options.save_changes')}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Access Tab ── */
function AccessTab({
  playground,
  orgslug,
  orgId,
  onUpdated,
}: {
  playground: Playground
  orgslug: string
  orgId: number
  onUpdated: (p: Playground) => void
}) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const [accessType, setAccessType] = useState<PlaygroundAccessType>(playground.access_type)
  const [isSaving, setIsSaving] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)

  // Correct endpoint: GET /playgrounds/{uuid}/usergroups
  const ugKey =
    accessType === 'restricted'
      ? `${getAPIUrl()}playgrounds/${playground.playground_uuid}/usergroups`
      : null
  const { data: usergroups } = useSWR(ugKey, (url) => swrFetcher(url, access_token))

  const handleSetAccess = async (type: PlaygroundAccessType) => {
    if (type === accessType || isSaving) return
    setIsSaving(true)
    const previous = accessType
    setAccessType(type)
    try {
      const updated = await updatePlayground(
        playground.playground_uuid,
        { access_type: type },
        access_token
      )
      onUpdated(updated)
      toast.success(t('playground.options.access.updated'))
    } catch {
      setAccessType(previous)
      toast.error(t('playground.options.access.update_failed'))
    } finally {
      setIsSaving(false)
    }
  }

  // Uses dedicated playground endpoint: DELETE /playgrounds/{uuid}/usergroups/{ug_uuid}
  const removeUserGroup = async (usergroupUuid: string) => {
    try {
      await removeUserGroupFromPlayground(playground.playground_uuid, usergroupUuid, access_token)
      toast.success(t('playground.options.access.removed'))
      if (ugKey) mutate(ugKey)
    } catch {
      toast.error(t('playground.options.access.remove_failed'))
    }
  }

  const ACCESS_OPTIONS: {
    type: PlaygroundAccessType
    icon: React.ReactNode
    label: string
    description: string
  }[] = [
    {
      type: 'public',
      icon: <Globe size={22} weight="duotone" className="text-green-500" />,
      label: t('playground.options.access.public'),
      description: t('playground.options.access.public_description'),
    },
    {
      type: 'authenticated',
      icon: <Users size={22} weight="duotone" className="text-sky-500" />,
      label: t('playground.options.access.members'),
      description: t('playground.options.access.members_description'),
    },
    {
      type: 'restricted',
      icon: <Lock size={22} weight="duotone" className="text-amber-500" />,
      label: t('playground.options.access.restricted'),
      description: t('playground.options.access.restricted_description'),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-0.5">{t('playground.options.access.title')}</h2>
        <p className="text-xs text-gray-400">{t('playground.options.access.description')}</p>
      </div>

      {/* Access type cards */}
      <div className={`space-y-2 ${isSaving ? 'opacity-60 pointer-events-none' : ''}`}>
        {ACCESS_OPTIONS.map((opt) => {
          const active = accessType === opt.type
          return (
            <button
              key={opt.type}
              onClick={() => handleSetAccess(opt.type)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                active
                  ? 'border-sky-500 bg-sky-50/50'
                  : 'border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white'
              }`}
            >
              <div className="flex-shrink-0">{opt.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${active ? 'text-sky-700' : 'text-gray-700'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              </div>
              {active && (
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* User groups — only for restricted */}
      {accessType === 'restricted' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">{t('playground.options.access.user_groups')}</p>
              <p className="text-xs text-gray-400">{t('playground.options.access.user_groups_description')}</p>
            </div>
            <Modal
              isDialogOpen={linkModalOpen}
              onOpenChange={setLinkModalOpen}
              minWidth="no-min"
              minHeight="no-min"
              dialogTitle={t('playground.options.access.link_title')}
              dialogDescription={t('playground.options.access.link_description')}
              dialogContent={
                <LinkUserGroupForm
                  playgroundUuid={playground.playground_uuid}
                  orgId={orgId}
                  orgslug={orgslug}
                  accessToken={access_token}
                  ugKey={ugKey}
                  onDone={() => setLinkModalOpen(false)}
                />
              }
              dialogTrigger={
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-black nice-shadow transition-all">
                  <Plus size={12} weight="bold" />
                  {t('playground.options.access.add_group')}
                </button>
              }
            />
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {!usergroups || usergroups.length === 0 ? (
              <div className="py-8 text-center">
                <Lock size={20} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">{t('playground.options.access.no_groups')}</p>
                <Link
                  href={getUriWithOrg(orgslug, '/dash/users/settings/usergroups')}
                  target="_blank"
                  className="text-xs text-sky-600 hover:underline mt-1 inline-block"
                >
                  {t('playground.options.access.manage_groups')}
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{t('playground.options.access.group')}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {usergroups.map((ug: any) => (
                    <tr key={ug.usergroup_uuid} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-800">{ug.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeUserGroup(ug.usergroup_uuid)}
                          className="flex items-center gap-1 ml-auto h-7 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all"
                        >
                          <X size={11} weight="bold" />
                          {t('playground.options.access.remove')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Thumbnail Tab ── */
const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const

function ThumbnailTab({
  playground,
  onUpdated,
}: {
  playground: Playground
  onUpdated: (p: Playground) => void
}) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showUnsplash, setShowUnsplash] = useState(false)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const thumbnailUrl =
    localPreview ||
    (playground.thumbnail_image && playground.org_uuid
      ? getPlaygroundThumbnailMediaDirectory(
          playground.org_uuid,
          playground.playground_uuid,
          playground.thumbnail_image
        )
      : null)

  const doUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const updated = await updatePlaygroundThumbnail(playground.playground_uuid, file, access_token)
      onUpdated(updated)
      setLocalPreview(null)
      toast.success(t('playground.options.thumbnail.updated'))
    } catch {
      toast.error(t('playground.options.thumbnail.upload_failed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!VALID_IMAGE_MIME_TYPES.includes(file.type as any)) {
      toast.error(t('playground.options.thumbnail.invalid_type'))
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('playground.options.thumbnail.too_large'))
      e.target.value = ''
      return
    }
    setLocalPreview(URL.createObjectURL(file))
    await doUpload(file)
  }

  const handleUnsplashSelect = async (imageUrl: string) => {
    try {
      const url = new URL(imageUrl)
      if (!['https:', 'http:'].includes(url.protocol)) {
        toast.error(t('playground.options.thumbnail.invalid_url'))
        return
      }
      setIsUploading(true)
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) {
        toast.error(t('playground.options.thumbnail.not_image'))
        setIsUploading(false)
        return
      }
      const file = new File([blob], `unsplash_${Date.now()}.jpg`, { type: blob.type })
      setLocalPreview(URL.createObjectURL(file))
      await doUpload(file)
    } catch {
      toast.error(t('playground.options.thumbnail.unsplash_failed'))
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-0.5">{t('playground.options.thumbnail.title')}</h2>
        <p className="text-xs text-gray-400">{t('playground.options.thumbnail.description')}</p>
      </div>

      {/* Preview */}
      <div className="rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50 flex items-center justify-center">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={t('playground.options.thumbnail.alt')}
            className={`w-full h-full object-cover ${isUploading ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Image size={36} weight="duotone" />
            <span className="text-xs">{t('playground.options.thumbnail.none')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUploading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CircleNotch size={14} weight="bold" className="animate-spin text-sky-500" />
          {t('playground.options.thumbnail.uploading')}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all nice-shadow"
          >
            <UploadSimple size={14} weight="bold" />
            {t('playground.options.thumbnail.upload')}
          </button>
          <button
            onClick={() => setShowUnsplash(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all nice-shadow"
          >
            <Image size={14} weight="bold" />
            {t('playground.options.thumbnail.unsplash')}
          </button>
        </div>
      )}
      <p className="text-xs text-gray-400">{t('playground.options.thumbnail.hint')}</p>

      {showUnsplash && (
        <UnsplashImagePicker
          onSelect={handleUnsplashSelect}
          onClose={() => setShowUnsplash(false)}
        />
      )}
    </div>
  )
}

/* ── Link user group form ── */
function LinkUserGroupForm({
  playgroundUuid,
  orgId,
  orgslug,
  accessToken,
  ugKey,
  onDone,
}: {
  playgroundUuid: string
  orgId: number
  orgslug: string
  accessToken: string
  ugKey: string | null
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { data: allGroups } = useSWR(
    `${getAPIUrl()}usergroups/org/${orgId}?org_id=${orgId}`,
    (url) => swrFetcher(url, accessToken)
  )
  // Store usergroup_uuid (string) — needed by the playground endpoint
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    if (allGroups?.length > 0) setSelected(allGroups[0].usergroup_uuid)
  }, [allGroups])

  const handleLink = async () => {
    if (!selected) return
    try {
      // Correct endpoint: POST /playgrounds/{uuid}/usergroups/{ug_uuid}
      await addUserGroupToPlayground(playgroundUuid, selected, accessToken)
      toast.success(t('playground.options.access.linked'))
      if (ugKey) mutate(ugKey)
      onDone()
    } catch {
      toast.error(t('playground.options.access.link_failed'))
    }
  }

  if (!allGroups) {
    return <div className="py-4 text-center text-sm text-gray-400">{t('playground.loading')}</div>
  }

  if (allGroups.length === 0) {
    return (
      <div className="py-6 text-center space-y-2">
        <p className="text-sm text-gray-500">{t('playground.options.access.no_groups_available')}</p>
        <Link
          href={getUriWithOrg(orgslug, '/dash/users/settings/usergroups')}
          target="_blank"
          className="text-sm text-sky-600 hover:underline"
        >
          {t('playground.options.access.create_group')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {allGroups.map((g: any) => (
          <option key={g.usergroup_uuid} value={g.usergroup_uuid}>{g.name}</option>
        ))}
      </select>
      <div className="flex justify-end">
        <button
          onClick={handleLink}
          disabled={!selected}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-black nice-shadow transition-all disabled:opacity-50"
        >
          <Plus size={14} weight="bold" />
          {t('playground.options.access.link_button')}
        </button>
      </div>
    </div>
  )
}
