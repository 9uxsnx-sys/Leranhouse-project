'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { mutate } from 'swr'
import { usePodcast } from '@components/Contexts/PodcastContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import {
  createEpisode,
  deleteEpisode,
  updateEpisode,
  uploadEpisodeAudio,
  reorderEpisodes,
  PodcastEpisode,
  formatDuration,
} from '@services/podcasts/episodes'
import { getEpisodeAudioMediaDirectory, getEpisodeThumbnailMediaDirectory } from '@services/media/media'
import { revalidateTags } from '@services/utils/ts/requests'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import {
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
  MoreVertical,
  Music,
  ArrowLeft,
  Check,
  SaveAllIcon,
  Globe,
  GlobeLock,
  Search,
  ArrowUpDown,
  CheckSquare,
  Copy,
  Play,
  Pause,
  GripVertical,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

interface EditPodcastEpisodesProps {
  orgslug: string
  podcastuuid: string
}

function EditPodcastEpisodes({ orgslug, podcastuuid }: EditPodcastEpisodesProps) {
  const { t } = useTranslation()
  const { podcast, episodes, refreshPodcast, isLoading } = usePodcast()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token

  const [selectedEpisodeUuid, setSelectedEpisodeUuid] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedEpisodeUuids, setSelectedEpisodeUuids] = useState<Set<string>>(new Set())
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false)
  const [episodeOrder, setEpisodeOrder] = useState<string[] | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const toggleEpisodeSelection = (uuid: string) => {
    setSelectedEpisodeUuids((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) {
        next.delete(uuid)
      } else {
        next.add(uuid)
      }
      return next
    })
  }

  const selectedEpisode = selectedEpisodeUuid
    ? episodes.find((e: PodcastEpisode) => e.episode_uuid === selectedEpisodeUuid) || null
    : null

  const displayEpisodes = useMemo(() => {
    let result: PodcastEpisode[]

    if (episodeOrder) {
      // Use custom drag-and-drop order
      const orderedMap = new Map(episodeOrder.map((uuid, i) => [uuid, i]))
      result = [...episodes].sort((a: PodcastEpisode, b: PodcastEpisode) => {
        const aIdx = orderedMap.get(a.episode_uuid)
        const bIdx = orderedMap.get(b.episode_uuid)
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx
        if (aIdx !== undefined) return -1
        if (bIdx !== undefined) return 1
        return 0
      })
    } else {
      result = [...episodes]
      result.sort((a: PodcastEpisode, b: PodcastEpisode) => {
        const nameA = (a.title || '').toLowerCase()
        const nameB = (b.title || '').toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((ep: PodcastEpisode) =>
        (ep.title || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [episodes, searchQuery, sortOrder, episodeOrder])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || isReordering) return

    const items = Array.from(displayEpisodes)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)

    const newOrder = items.map((ep) => ep.episode_uuid)

    // Optimistic update
    setEpisodeOrder(newOrder)

    // Persist via API
    setIsReordering(true)
    try {
      await reorderEpisodes(
        podcastuuid,
        newOrder.map((uuid, index) => ({ episode_uuid: uuid, order: index })),
        accessToken
      )
      toast.success('Episodes reordered')
    } catch {
      toast.error('Failed to reorder episodes')
      setEpisodeOrder(null) // Revert on error
    } finally {
      setIsReordering(false)
    }
  }

  const handleDeleteEpisode = async (episode: PodcastEpisode) => {
    const toastId = toast.loading(t('podcasts.dashboard.episodes.deleting'))
    try {
      await deleteEpisode(episode.episode_uuid, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()
      mutate((key) => typeof key === 'string' && key.includes('/podcasts/'), undefined, { revalidate: true })
      toast.success(t('podcasts.dashboard.episodes.deleted'), { id: toastId })
    } catch (error) {
      console.error('Failed to delete episode:', error)
      toast.error(t('podcasts.dashboard.episodes.delete_error'), { id: toastId })
    }
  }

  const handleCreateEpisode = async () => {
    if (!accessToken || isCreatingEpisode) return
    setIsCreatingEpisode(true)
    try {
      const res = await createEpisode(
        podcastuuid,
        { title: 'New Episode', description: '', published: false },
        null,
        null,
        accessToken
      )
      if (!res.success) throw new Error('Failed to create episode')
      await revalidateTags(['podcasts'], orgslug)
      await refreshPodcast()
      toast.success('Episode created')
    } catch (e) {
      toast.error('Failed to create episode')
    } finally {
      setIsCreatingEpisode(false)
    }
  }

  if (isLoading || !podcast) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      {selectedEpisode ? (
        <EpisodeDetailForm
          episode={selectedEpisode}
          orgslug={orgslug}
          podcastuuid={podcastuuid}
          accessToken={accessToken}
          orgUuid={org?.org_uuid}
          onBack={() => setSelectedEpisodeUuid(null)}
          onSuccess={refreshPodcast}
        />
      ) : (
        <>
          {/* Toolbar Row — identical to ModuleForm */}
          <div className="flex items-center gap-3 mb-5">
            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search episodes..."
                className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
              />
            </div>

            {/* Episode count */}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {displayEpisodes.length} {displayEpisodes.length === 1 ? 'episode' : 'episodes'}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* New Episode Button */}
            <Button
              variant="primary"
              size="small"
              onClick={handleCreateEpisode}
              disabled={isCreatingEpisode}
            >
              {isCreatingEpisode ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                '+'
              )}
              &nbsp;&nbsp;New
            </Button>

            {/* Select Mode Button */}
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsSelectMode(!isSelectMode)}
              className="gap-1.5"
            >
              <CheckSquare size={14} strokeWidth={2.5} />
              <span className="font-semibold">{isSelectMode ? 'Cancel' : 'Select'}</span>
            </Button>

            {/* Sort toggle button */}
            <IconButton
              size="small"
              variant="transparent"
              className="bg-white hover:bg-gray-50 shadow-borders-base"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label="Sort episodes"
            >
              <ArrowUpDown size={15} />
            </IconButton>
          </div>

          {/* Episode List — with drag-and-drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="episodes">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {displayEpisodes.map((episode: PodcastEpisode, index: number) => {
                    const isSelected = selectedEpisodeUuids.has(episode.episode_uuid)
                    return (
                      <Draggable
                        key={episode.episode_uuid}
                        draggableId={episode.episode_uuid}
                        index={index}
                        isDragDisabled={isSelectMode}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...(isSelectMode ? {} : provided.draggableProps)}
                            onClick={() => {
                              if (isSelectMode) {
                                toggleEpisodeSelection(episode.episode_uuid)
                              } else {
                                setSelectedEpisodeUuid(episode.episode_uuid)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                if (isSelectMode) {
                                  toggleEpisodeSelection(episode.episode_uuid)
                                } else {
                                  setSelectedEpisodeUuid(episode.episode_uuid)
                                }
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full text-left px-5 py-4 rounded-xl bg-white shadow-borders-base transition-colors flex items-center justify-between group ${
                              isSelectMode
                                ? isSelected
                                  ? 'ring-2 ring-blue-500/40 border-blue-200 cursor-pointer'
                                  : 'hover:border-gray-200 cursor-pointer'
                                : snapshot.isDragging
                                  ? 'shadow-xl ring-2 ring-blue-500/20 rotate-1 scale-[1.02] z-50 cursor-grab'
                                  : 'hover:border-gray-200 cursor-pointer'
                            }`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Select Mode: Show checkbox instead of drag handle */}
                              {isSelectMode ? (
                                <div
                                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-blue-500 border-blue-500 text-white'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleEpisodeSelection(episode.episode_uuid)
                                  }}
                                >
                                  {isSelected && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              ) : (
                                /* Drag Handle */
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical size={16} />
                                </div>
                              )}
                              <Music size={18} className="text-gray-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {episode.title || 'Untitled Episode'}
                              </p>
                              {episode.published ? (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-green-100 text-green-700 rounded flex-shrink-0">
                                  Published
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700 rounded flex-shrink-0">
                                  Draft
                                </span>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-28">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toast.success('Duplicate feature coming soon')
                                  }}
                                  className="gap-2"
                                >
                                  <Copy size={14} />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteEpisode(episode)
                                  }}
                                  className="text-red-600 gap-2"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}

                  {displayEpisodes.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                      <Music size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        {searchQuery ? 'No episodes match your search' : 'No episodes yet'}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {searchQuery ? 'Try a different search term' : 'Click "New" to add your first episode'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      <CreateEpisodeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        podcastuuid={podcastuuid}
        orgslug={orgslug}
        accessToken={accessToken}
        onSuccess={refreshPodcast}
      />
    </>
  )
}

function EpisodeDetailForm({
  episode,
  orgslug,
  podcastuuid,
  accessToken,
  orgUuid,
  onBack,
  onSuccess,
}: {
  episode: PodcastEpisode
  orgslug: string
  podcastuuid: string
  accessToken: string
  orgUuid: string
  onBack: () => void
  onSuccess: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(episode.title)
  const [description, setDescription] = useState(episode.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isAudioUploading, setIsAudioUploading] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setTitle(episode.title)
    setDescription(episode.description || '')
    setDirty(false)
  }, [episode.episode_uuid, episode.title, episode.description])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setDirty(true)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    setDirty(true)
  }

  const isPublished = episode.published

  const handleSave = async () => {
    if (!title.trim() || isSaving) return
    setIsSaving(true)
    const toastId = toast.loading(t('podcasts.dashboard.episodes.updating'))
    try {
      await updateEpisode(episode.episode_uuid, { title, description }, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await onSuccess()
      toast.success(t('podcasts.dashboard.episodes.updated'), { id: toastId })
      setDirty(false)
    } catch (error) {
      console.error('Failed to update episode:', error)
      toast.error(t('podcasts.dashboard.episodes.update_error'), { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublishStatus = async () => {
    if (isPublishing) return
    setIsPublishing(true)
    const toastId = toast.loading(isPublished ? 'Unpublishing...' : 'Publishing...')
    try {
      await updateEpisode(episode.episode_uuid, { published: !isPublished }, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await onSuccess()
      toast.dismiss(toastId)
      toast.success(isPublished ? 'Episode unpublished' : 'Episode published')
    } catch (error) {
      console.error('Failed to update episode publish status:', error)
      toast.dismiss(toastId)
      toast.error('Failed to update episode')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAudioUploading(true)
    const toastId = toast.loading('Uploading audio...')
    try {
      const formData = new FormData()
      formData.append('audio', file)
      await uploadEpisodeAudio(episode.episode_uuid, formData, accessToken)
      await revalidateTags(['podcasts'], orgslug)
      await onSuccess()
      toast.success('Audio uploaded', { id: toastId })
    } catch (error) {
      console.error('Failed to upload audio:', error)
      toast.error('Failed to upload audio', { id: toastId })
    } finally {
      setIsAudioUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const currentAudioUrl = episode.audio_file
    ? getEpisodeAudioMediaDirectory(orgUuid, podcastuuid, episode.episode_uuid, episode.audio_file)
    : null

  return (
    <div className="space-y-3">
      {/* Action Row */}
      <div className="flex items-center justify-between">
        <Link
          href={getUriWithOrg(orgslug, '') + `/podcast/${podcastuuid}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Eye size={14} />
          <span>Preview</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !dirty}
            className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
              isSaving
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : !dirty
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
            }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : !dirty ? (
              <Check size={14} />
            ) : (
              <SaveAllIcon size={14} />
            )}
            <span>
              {isSaving ? 'Saving...' : !dirty ? 'Saved' : 'Save'}
            </span>
          </button>
          <button
            type="button"
            onClick={togglePublishStatus}
            disabled={isPublishing}
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ${isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isPublishing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPublished ? (
              <Globe size={14} />
            ) : (
              <GlobeLock size={14} />
            )}
            <span>
              {isPublishing ? 'Processing...' : isPublished ? 'Published' : 'Unpublished'}
            </span>
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="font-medium leading-[35px] text-black text-sm">
              {t('podcasts.dashboard.episodes.title_label')} *
            </label>
            <Input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder={t('podcasts.dashboard.episodes.title_placeholder')}
              className={fieldClassName}
            />
          </div>
          <div>
            <label className="font-medium leading-[35px] text-black text-sm">
              {t('podcasts.dashboard.episodes.description_label')}
            </label>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder={t('podcasts.dashboard.episodes.description_placeholder')}
              rows={3}
              className={`${fieldClassName} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          Media
        </h3>
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <Music size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700">Episode Audio</p>
            {currentAudioUrl && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {episode.audio_file} &middot; {formatDuration(episode.duration_seconds)}
              </p>
            )}
          </div>
          {isAudioUploading ? (
            <Loader2 size={18} className="animate-spin text-gray-400" />
          ) : (
            <>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                id={`audio-upload-${episode.episode_uuid}`}
              />
              <label
                htmlFor={`audio-upload-${episode.episode_uuid}`}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={currentAudioUrl ? 'Replace audio' : 'Upload audio'}
              >
                <UploadCloud size={18} />
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateEpisodeModal({
  isOpen,
  onClose,
  podcastuuid,
  orgslug,
  accessToken,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  podcastuuid: string
  orgslug: string
  accessToken: string
  onSuccess: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    const toastId = toast.loading(t('podcasts.dashboard.episodes.creating'))
    try {
      const res = await createEpisode(
        podcastuuid,
        { title, description, published: false },
        audioFile,
        null,
        accessToken
      )

      if (!res.success) {
        const errorMessage = typeof res.data?.detail === 'string'
          ? res.data.detail
          : Array.isArray(res.data?.detail)
            ? res.data.detail.map((e: any) => e.msg).join(', ')
            : t('podcasts.dashboard.episodes.create_error')
        throw new Error(errorMessage)
      }

      await revalidateTags(['podcasts'], orgslug)
      await onSuccess()
      mutate((key) => typeof key === 'string' && key.includes('/podcasts/'), undefined, { revalidate: true })
      toast.success(t('podcasts.dashboard.episodes.created'), { id: toastId })
      handleClose()
    } catch (error: any) {
      console.error('Failed to create episode:', error)
      toast.error(error.message || t('podcasts.dashboard.episodes.create_error'), { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setAudioFile(null)
    onClose()
  }

  return (
    <Modal
      isDialogOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      dialogTitle={t('podcasts.dashboard.episodes.new_episode')}
      dialogDescription={t('podcasts.dashboard.episodes.new_episode_description')}
      minWidth="md"
      dialogContent={
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('podcasts.dashboard.episodes.title_label')} *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('podcasts.dashboard.episodes.title_placeholder')}
              className={fieldClassName}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('podcasts.dashboard.episodes.description_label')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('podcasts.dashboard.episodes.description_placeholder')}
              rows={3}
              className={`${fieldClassName} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('podcasts.dashboard.episodes.audio_label')}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
            >
              {audioFile ? (
                <span className="text-sm text-gray-700">{audioFile.name}</span>
              ) : (
                <span className="text-sm text-gray-500 flex items-center">
                  <Upload size={16} className="mr-2" />
                  {t('podcasts.dashboard.episodes.upload_audio')}
                </span>
              )}
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {t('podcasts.dashboard.episodes.audio_hint')}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('podcasts.modals.create.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-black text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {t('podcasts.dashboard.episodes.create')}
            </button>
          </div>
        </form>
      }
    />
  )
}

export default EditPodcastEpisodes
