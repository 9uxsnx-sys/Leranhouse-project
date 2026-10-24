'use client'
import React, { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  MoreHorizontal,
  Plus,
  SaveAllIcon,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useSWR, { mutate } from 'swr'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { PageTabs } from '@components/ui/page-tabs'
import { SectionIcon } from '@components/ui/icons'
import { SectionCard, TableCard } from '@components/Analytics/Card'
import { DataTable, type Column } from '@components/Analytics/DataTable'
import { FilterSelect } from '@components/Analytics/Filters'
import { ActionRow, ActionRowSearch, ActionRowSpacer, ActionRowActions } from '@components/ui/action-row'
import { Button } from '@components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import FormLayout, {
  FormField,
  FormLabelAndMessage,
} from '@components/Objects/StyledElements/Form/Form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { swrFetcher } from '@services/utils/ts/requests'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { getUsersLinkedToUserGroup } from '@services/usergroups/usergroups'
import {
  createAnnouncement,
  saveTemplateOverride,
  toggleEvent,
  type AnnouncementItem,
  type AnnouncementListResponse,
  type EventCatalogItem,
} from '@services/notifications'

/** Shared field styling — mirrors EditCourseGeneral so every dashboard form looks the same. */
const fieldClassName =
  'bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none'

const TABS = [
  { id: 'events', label: 'Events', icon: SectionIcon.notifications },
  { id: 'announcements', label: 'Announcements', icon: SectionIcon.announcements },
]

// ─── Page shell ──────────────────────────────────────────────────────────────

export default function NotificationsManagement({
  orgslug,
  subpage,
}: {
  orgslug: string
  subpage: string
}) {
  const active = TABS.some((t) => t.id === subpage) ? subpage : 'events'

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      {/* Row 1: Page title */}
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
          Notifications
        </h1>
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <PageTabs
          variant="pill"
          indicatorId="notification-tabs"
          active={active}
          tabs={TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            href: getUriWithOrg(orgslug, '') + `/dash/notifications/${tab.id}`,
          }))}
        />
      </div>

      {/* Row 3: Content */}
      <div className="w-full mx-auto max-w-7xl mt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <main className="max-w-7xl mx-auto">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, type: 'spring', stiffness: 80 }}
            className="space-y-8 rounded-xl"
          >
            {active === 'events' && <EventsSection />}
            {active === 'announcements' && <AnnouncementsSection />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

// ─── Events ──────────────────────────────────────────────────────────────────

function EventsSection() {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const orgId = org?.id

  const catalogUrl = orgId ? `${getAPIUrl()}notifications/events?org_id=${orgId}` : null
  const { data: catalog, isLoading } = useSWR<EventCatalogItem[]>(
    catalogUrl,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editLink, setEditLink] = useState('')
  const [isSaved, setIsSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingEvent, setTogglingEvent] = useState<string | null>(null)

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>()
    ;(catalog ?? []).forEach((event) => {
      if (event.category) seen.add(event.category)
    })
    return [
      { value: 'all', label: 'All categories' },
      ...Array.from(seen).sort().map((name) => ({ value: name, label: name })),
    ]
  }, [catalog])

  const filtered = useMemo(() => {
    let items = catalog ?? []
    if (category !== 'all') {
      items = items.filter((event) => event.category === category)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (event) =>
          event.event_type.toLowerCase().includes(q) ||
          event.description?.toLowerCase().includes(q)
      )
    }
    return items
  }, [catalog, category, searchQuery])

  const openEditor = useCallback((event: EventCatalogItem) => {
    setEditingEvent(event.event_type)
    setEditTitle(event.title_template || '')
    setEditBody(event.body_template || '')
    setEditLink(event.link_url || '')
    setIsSaved(true)
  }, [])

  const handleSaveTemplate = useCallback(async () => {
    if (!orgId || !editingEvent || isSaving) return
    setIsSaving(true)
    try {
      const res = await saveTemplateOverride(
        orgId,
        editingEvent,
        {
          title_template: editTitle || null,
          body_template: editBody || null,
          link_url: editLink || null,
        },
        accessToken
      )
      if (res.success) {
        toast.success('Template saved')
        setIsSaved(true)
        mutate(catalogUrl)
      } else {
        toast.error('Failed to save template')
      }
    } catch {
      toast.error('Error saving template')
    } finally {
      setIsSaving(false)
    }
  }, [orgId, editingEvent, editTitle, editBody, editLink, accessToken, isSaving, catalogUrl])

  const handleToggle = useCallback(
    async (eventType: string, currentlyEnabled: boolean) => {
      if (!orgId || togglingEvent) return
      setTogglingEvent(eventType)
      try {
        const res = await toggleEvent(orgId, eventType, !currentlyEnabled, accessToken)
        if (res.success) {
          toast.success(currentlyEnabled ? 'Event disabled' : 'Event enabled')
          mutate(catalogUrl)
        } else {
          toast.error('Failed to toggle event')
        }
      } catch {
        toast.error('Error toggling event')
      } finally {
        setTogglingEvent(null)
      }
    },
    [orgId, accessToken, togglingEvent, catalogUrl]
  )

  const columns: Column<EventCatalogItem>[] = useMemo(
    () => [
      {
        key: 'toggle',
        header: '',
        width: '60px',
        align: 'center',
        render: (event) => (
          <button
            type="button"
            role="switch"
            aria-checked={event.is_enabled}
            aria-label={`Toggle ${event.event_type}`}
            onClick={(e) => {
              e.stopPropagation()
              handleToggle(event.event_type, event.is_enabled)
            }}
            disabled={togglingEvent === event.event_type}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              event.is_enabled ? 'bg-black' : 'bg-gray-300'
            } ${
              togglingEvent === event.event_type
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                event.is_enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
        ),
      },
      {
        key: 'event',
        header: 'Event',
        sortable: true,
        width: '35%',
        value: (row) => row.description || row.event_type,
        render: (event) => (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-ui-fg-base">
                {event.description || event.event_type}
              </span>
              {event.is_customized && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                  Custom
                </span>
              )}
              {!event.has_audience && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
                  No audience
                </span>
              )}
            </div>
            <p className="text-xs text-ui-fg-muted font-mono mt-0.5">{event.event_type}</p>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        width: '18%',
        value: (row) => row.category || '',
        render: (event) => (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {event.category || 'Other'}
          </span>
        ),
      },
      {
        key: 'audience',
        header: 'Audience',
        width: '25%',
        render: (event) =>
          event.has_audience ? (
            <span className="text-xs text-ui-fg-muted leading-relaxed block">
              {event.audience_description}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
              No audience
            </span>
          ),
      },
      {
        key: 'actions',
        header: '',
        width: '60px',
        align: 'right',
        render: (event) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Event actions"
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[170px] rounded-lg border border-gray-200 bg-white p-1 shadow-md"
                sideOffset={6}
              >
                <DropdownMenuItem
                  onClick={() => openEditor(event)}
                  className="text-sm rounded-md px-2.5 py-1.5 cursor-pointer data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                >
                  <span className="text-gray-700 text-xs">Edit template</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleToggle, togglingEvent, openEditor]
  )

  const selectedEvent = useMemo(() => {
    if (!editingEvent || !catalog) return null
    return catalog.find((event) => event.event_type === editingEvent) || null
  }, [editingEvent, catalog])

  // ── Template editor (own view, entered from the row's actions menu) ────────
  if (editingEvent && selectedEvent) {
    return (
      <div>
        <ActionRow className="mb-3">
          <button
            type="button"
            onClick={() => setEditingEvent(null)}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} className="rtl:rotate-180" />
            <span>Back</span>
          </button>
          <ActionRowSpacer />
          <ActionRowActions>
            <button
              type="button"
              onClick={isSaved ? undefined : handleSaveTemplate}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isSaving
                  ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                  : isSaved
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaved ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>{isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </ActionRowActions>
        </ActionRow>

        <SectionCard
          title="Notification template"
          right={
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {selectedEvent.category || 'Other'}
            </span>
          }
        >
          <div className="mb-5">
            <p className="text-sm font-medium text-ui-fg-base">
              {selectedEvent.description || selectedEvent.event_type}
            </p>
            <p className="text-xs text-ui-fg-muted font-mono mt-0.5">{selectedEvent.event_type}</p>
          </div>

          <FormLayout
            onSubmit={(e) => {
              e.preventDefault()
              if (!isSaved) handleSaveTemplate()
            }}
          >
            <FormField name="title_template">
              <FormLabelAndMessage label="Title template" />
              <Input
                className={fieldClassName}
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value)
                  setIsSaved(false)
                }}
                placeholder="Notification title — use {{placeholder}} for dynamic values"
              />
            </FormField>

            <FormField name="body_template">
              <FormLabelAndMessage label="Body template" />
              <Textarea
                className={`${fieldClassName} min-h-[100px]`}
                value={editBody}
                onChange={(e) => {
                  setEditBody(e.target.value)
                  setIsSaved(false)
                }}
                placeholder="Notification body text"
              />
            </FormField>

            <FormField name="link_url">
              <FormLabelAndMessage label="Link URL (optional)" />
              <Input
                className={fieldClassName}
                value={editLink}
                onChange={(e) => {
                  setEditLink(e.target.value)
                  setIsSaved(false)
                }}
                placeholder="https://…"
              />
            </FormField>
          </FormLayout>
        </SectionCard>
      </div>
    )
  }

  return (
    <div>
      <ActionRow className="mb-3">
        <ActionRowSearch
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search events…"
          summary={
            catalog ? `${filtered.length} of ${catalog.length} events` : undefined
          }
        />
        <ActionRowSpacer />
        <FilterSelect value={category} onChange={setCategory} options={categoryOptions} />
      </ActionRow>

      {isLoading ? (
        <SectionCard>
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-ui-fg-muted" />
          </div>
        </SectionCard>
      ) : !catalog || catalog.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center py-16 px-4">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
              <SectionIcon.notifications className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-ui-fg-base mb-2">No events found</h2>
            <p className="txt-compact-small text-ui-fg-muted">
              Notification events will appear here once the catalog is loaded.
            </p>
          </div>
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center py-16 px-4">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
              <Search className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-ui-fg-base mb-2">No events match your filters</h2>
            <p className="txt-compact-small text-ui-fg-muted">Try a different search term or category.</p>
          </div>
        </SectionCard>
      ) : (
        <TableCard>
          <DataTable<EventCatalogItem>
            columns={columns}
            rows={filtered}
            initialSortKey="category"
            getRowId={(row) => row.event_type}
          />
        </TableCard>
      )}
    </div>
  )
}

// ─── Announcements ───────────────────────────────────────────────────────────

function AnnouncementsSection() {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const orgId = org?.id

  const [view, setView] = useState<'compose' | 'history'>('compose')

  // Compose
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [isSending, setIsSending] = useState(false)

  const handleSend = useCallback(async () => {
    if (!orgId || isSending) return
    if (!title && !body) {
      toast.error('Title or body is required')
      return
    }
    if (selectedGroupIds.length === 0) {
      toast.error('Select at least one user group')
      return
    }
    setIsSending(true)
    try {
      // Resolve group IDs to user IDs
      let allUserIds: number[] = []
      for (const gid of selectedGroupIds) {
        try {
          const res = await getUsersLinkedToUserGroup(gid, orgId, accessToken)
          if (res?.data) {
            allUserIds.push(...res.data.map((u: any) => u.id))
          }
        } catch {
          toast.error(`Failed to resolve user group #${gid}`)
        }
      }
      // Deduplicate
      allUserIds = [...new Set(allUserIds)]

      if (allUserIds.length === 0) {
        toast.error('No resolved recipients — check your user groups')
        setIsSending(false)
        return
      }

      const res = await createAnnouncement(
        orgId,
        {
          title,
          body,
          link_url: linkUrl || null,
          category: 'Announcement',
          recipient_user_ids: allUserIds,
        },
        accessToken
      )
      if (res.success) {
        toast.success(`Announcement sent to ${res.recipient_count} recipient(s)`)
        setTitle('')
        setBody('')
        setLinkUrl('')
        setSelectedGroupIds([])
      } else {
        toast.error('Failed to send announcement')
      }
    } catch {
      toast.error('Error sending announcement')
    } finally {
      setIsSending(false)
    }
  }, [orgId, isSending, title, body, linkUrl, selectedGroupIds, accessToken])

  // History
  const [page, setPage] = useState(1)
  const { data: history, isLoading: historyLoading } = useSWR<AnnouncementListResponse>(
    orgId && view === 'history'
      ? `${getAPIUrl()}notifications/announcements?org_id=${orgId}&page=${page}&limit=20`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )
  const announcements: AnnouncementItem[] = history?.announcements || []
  const pages = history?.pages || 1

  const hasAnyRecipients = selectedGroupIds.length > 0

  return (
    <div>
      <ActionRow className="mb-3">
        <Button
          variant="secondary"
          size="small"
          onClick={() => setView(view === 'compose' ? 'history' : 'compose')}
        >
          {view === 'compose' ? <History size={14} /> : <Plus size={14} />}
          <span>{view === 'compose' ? 'History' : 'Compose'}</span>
        </Button>

        {view === 'history' && (
          <span className="txt-compact-xsmall text-ui-fg-muted">
            {history?.total ?? 0} announcements
          </span>
        )}

        <ActionRowSpacer />

        {view === 'compose' && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleSend}
            disabled={isSending || (!title && !body) || !hasAnyRecipients}
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>{isSending ? 'Sending…' : 'Send'}</span>
          </Button>
        )}
      </ActionRow>

      {view === 'compose' ? (
        <div className="space-y-3">
          <SectionCard title="Announcement">
            <FormLayout onSubmit={(e) => e.preventDefault()}>
              <FormField name="title">
                <FormLabelAndMessage label="Title" />
                <Input
                  className={fieldClassName}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </FormField>

              <FormField name="body">
                <FormLabelAndMessage label="Body" />
                <Textarea
                  className={`${fieldClassName} min-h-[120px]`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Announcement body text"
                />
              </FormField>

              <FormField name="link_url">
                <FormLabelAndMessage label="Link URL (optional)" />
                <Input
                  className={fieldClassName}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                />
              </FormField>
            </FormLayout>
          </SectionCard>

          <RecipientsSection
            orgId={orgId}
            accessToken={accessToken}
            selectedGroupIds={selectedGroupIds}
            onSelectedGroupIdsChange={setSelectedGroupIds}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <SectionCard title="Sent announcements">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-ui-fg-muted" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center py-16 px-4">
                <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                  <History className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                  No announcements sent yet
                </h2>
                <p className="txt-compact-small text-ui-fg-muted">
                  Compose an announcement to reach your learners.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-ui-fg-base truncate block">
                          {announcement.title || '(no title)'}
                        </span>
                        {announcement.body && (
                          <p className="txt-compact-small text-ui-fg-muted mt-1 line-clamp-2">
                            {announcement.body}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-ui-fg-muted shrink-0">
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {pages > 1 && <Pagination page={page} pages={pages} onChange={setPage} />}
        </div>
      )}
    </div>
  )
}

// ─── Recipients (user groups with checkboxes) ────────────────────────────────

function RecipientsSection({
  orgId,
  accessToken,
  selectedGroupIds,
  onSelectedGroupIdsChange,
}: {
  orgId: any
  accessToken: string
  selectedGroupIds: number[]
  onSelectedGroupIdsChange: (ids: number[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: groupsData } = useSWR(
    orgId ? `${getAPIUrl()}usergroups/org/${orgId}?org_id=${orgId}` : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )
  const userGroups: any[] = groupsData || []

  const toggleGroup = (groupId: number) => {
    onSelectedGroupIdsChange(
      selectedGroupIds.includes(groupId)
        ? selectedGroupIds.filter((id) => id !== groupId)
        : [...selectedGroupIds, groupId]
    )
  }

  return (
    <SectionCard title="Recipients">
      <div
        className="bg-ui-bg-field border border-gray-100 rounded-xl overflow-hidden cursor-pointer outline-none"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Users size={16} className="text-ui-fg-muted shrink-0" />
          <span className="text-sm text-ui-fg-base flex-1">
            {selectedGroupIds.length === 0
              ? 'Select user groups'
              : `${selectedGroupIds.length} user group${selectedGroupIds.length === 1 ? '' : 's'} selected`}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-ui-fg-muted" />
          </motion.div>
        </div>

        {/* Expandable groups list */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="groups-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 max-h-72 overflow-y-auto">
                {userGroups.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ui-fg-muted">No user groups available</p>
                ) : (
                  userGroups.map((g: any) => {
                    const isSelected = selectedGroupIds.includes(g.id)
                    return (
                      <label
                        key={g.id}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-ui-bg-base-hover transition-colors ${
                          isSelected ? 'bg-ui-bg-base-hover' : ''
                        }`}
                      >
                        <div className="relative w-4 h-4 flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGroup(g.id)}
                            className="sr-only peer"
                          />
                          <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-500 peer-checked:border-gray-500 flex items-center justify-center transition-all shadow-sm">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="scale-0 peer-checked:scale-100 transition-transform duration-200"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                        <span className="flex items-center gap-2 text-sm text-ui-fg-base">
                          <Users size={14} className="text-gray-400 shrink-0" />
                          {g.name}
                        </span>
                        <span className="text-xs text-ui-fg-muted ms-auto truncate">
                          {g.user_count ?? 0} members
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionCard>
  )
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getVisiblePageNumbers(page: number, pages: number): (number | '...')[] {
  const maxVisible = 5
  if (pages <= maxVisible) {
    return Array.from({ length: pages }, (_, i) => i + 1)
  }
  if (page <= 3) {
    return [1, 2, 3, 4, '...', pages]
  }
  if (page >= pages - 2) {
    return [1, '...', pages - 3, pages - 2, pages - 1, pages]
  }
  return [1, '...', page - 1, page, page + 1, '...', pages]
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-1 pt-6 pb-8">
      <Button
        variant="transparent"
        size="small"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        <span className="hidden sm:inline ms-1">Previous</span>
      </Button>

      <div className="flex items-center gap-1 mx-2">
        {getVisiblePageNumbers(page, pages).map((item, index) =>
          item === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1 txt-compact-small text-ui-fg-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`w-7 h-7 txt-compact-small-plus rounded-md transition-colors ${
                page === item
                  ? 'bg-ui-bg-base shadow-borders-base text-ui-fg-base'
                  : 'text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-base-hover'
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <Button
        variant="transparent"
        size="small"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
      >
        <span className="hidden sm:inline me-1">Next</span>
        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
      </Button>
    </div>
  )
}
