'use client'
import React, { useState } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  Zap,
  Plus,
  Check,
  ChevronRight,
  Loader2,
  SaveAllIcon,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAPIUrl } from '@services/config/config'
import useSWR, { mutate } from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  getWebhookEndpoints,
  getWebhookEvents,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  WebhookEndpoint,
  WebhookCreateRequest,
  WebhookUpdateRequest,
} from '@services/webhooks/webhooks'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import { usePlan } from '@components/Hooks/usePlan'

type PageView = 'list' | 'detail'

interface EventCategory {
  label: string
  events: { id: string; description: string }[]
}

// Transform the raw events object into grouped categories
function groupEventsByCategory(events: Record<string, any>): EventCategory[] {
  const categoryMap: Record<string, { id: string; description: string }[]> = {}
  for (const [eventName, eventData] of Object.entries(events)) {
    const category = eventData.category || 'Other'
    if (!categoryMap[category]) {
      categoryMap[category] = []
    }
    categoryMap[category].push({
      id: eventName,
      description: eventData.description,
    })
  }
  return Object.entries(categoryMap).map(([label, events]) => ({
    label,
    events,
  }))
}

const OrgEditAutomations: React.FC = () => {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const currentPlan = usePlan()

  const [currentView, setCurrentView] = useState<PageView>('list')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)

  // Edit form state
  const [editUrl, setEditUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEvents, setEditEvents] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  // Save state
  const [isSaved, setIsSaved] = useState(true)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const isActiveSaving = isManualSaving

  // Fetch endpoints
  const endpointsUrl = org?.id ? `${getAPIUrl()}orgs/${org.id}/webhooks` : null
  const { data: endpoints, isLoading: endpointsLoading } = useSWR<WebhookEndpoint[]>(
    endpointsUrl,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  // Fetch events
  const eventsUrl = org?.id ? `${getAPIUrl()}orgs/${org.id}/webhooks/events` : null
  const { data: rawEvents } = useSWR<Record<string, any>>(
    eventsUrl,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const eventCategories = rawEvents ? groupEventsByCategory(rawEvents) : []

  const selectedEndpoint = selectedEndpointId && endpoints
    ? endpoints.find((e) => e.webhook_uuid === selectedEndpointId)
    : null

  // Create new endpoint and go to detail page
  const handleAddEndpoint = () => {
    setSelectedEndpointId('new')
    setEditUrl('')
    setEditDescription('')
    setEditEvents([])
    setIsActive(true)
    setIsSaved(true)
    setCurrentView('detail')
  }

  // Click on an existing endpoint → go to detail page
  const openDetail = (uuid: string) => {
    const endpoint = endpoints?.find((e) => e.webhook_uuid === uuid)
    if (endpoint) {
      setEditUrl(endpoint.url)
      setEditDescription(endpoint.description || '')
      setEditEvents([...endpoint.events])
      setIsActive(endpoint.is_active)
    }
    setSelectedEndpointId(uuid)
    setIsSaved(true)
    setCurrentView('detail')
  }

  // Back to list
  const goBackToList = () => {
    setCurrentView('list')
    setSelectedEndpointId(null)
  }

  // Save (create or update)
  const handleSave = async () => {
    if (isActiveSaving || !org?.id || !access_token) return
    setIsManualSaving(true)

    try {
      if (selectedEndpointId === 'new') {
        // Create
        const data: WebhookCreateRequest = {
          url: editUrl,
          description: editDescription || null,
          events: editEvents,
        }
        const res = await createWebhookEndpoint(org.id, data, access_token)
        if (res.status === 200 || res.status === 201) {
          toast.success('Endpoint created')
          mutate(endpointsUrl)
          goBackToList()
        } else {
          toast.error(res.data?.detail || 'Failed to create endpoint')
        }
      } else if (selectedEndpointId) {
        // Update
        const data: WebhookUpdateRequest = {
          url: editUrl,
          description: editDescription || null,
          events: editEvents,
          is_active: isActive,
        }
        const res = await updateWebhookEndpoint(org.id, selectedEndpointId, data, access_token)
        if (res.status === 200) {
          toast.success('Endpoint saved')
          setIsSaved(true)
          mutate(endpointsUrl)
        } else {
          toast.error(res.data?.detail || 'Failed to update endpoint')
        }
      }
    } catch {
      toast.error('An error occurred while saving')
    } finally {
      setIsManualSaving(false)
    }
  }

  // Delete
  const handleDelete = async (uuid: string) => {
    if (!org?.id || !access_token) return
    try {
      const res = await deleteWebhookEndpoint(org.id, uuid, access_token)
      if (res.status === 200) {
        toast.success('Endpoint deleted')
        mutate(endpointsUrl)
        goBackToList()
      } else {
        toast.error(res.data?.detail || 'Failed to delete endpoint')
      }
    } catch {
      toast.error('An error occurred while deleting')
    }
  }

  const toggleEvent = (eventId: string) => {
    setIsSaved(false)
    if (editEvents.includes(eventId)) {
      setEditEvents(editEvents.filter((e) => e !== eventId))
    } else {
      setEditEvents([...editEvents, eventId])
    }
  }

  const toggleCategory = (categoryEvents: { id: string }[]) => {
    setIsSaved(false)
    const categoryEventIds = categoryEvents.map((e) => e.id)
    const allSelected = categoryEventIds.every((id) => editEvents.includes(id))
    if (allSelected) {
      setEditEvents(editEvents.filter((e) => !categoryEventIds.includes(e)))
    } else {
      const newEvents = new Set([...editEvents, ...categoryEventIds])
      setEditEvents([...newEvents])
    }
  }

  // ──────────────────────────────────────────────
  //  LIST VIEW
  // ──────────────────────────────────────────────
  const ListView = () => (
    <div className="space-y-3">
      {/* ===== Action Row ===== */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAddEndpoint}
          className="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border bg-black text-white border-black hover:opacity-90 cursor-pointer transition-colors"
        >
          <Plus size={14} />
          <span>Add Endpoint</span>
        </button>
      </div>

      {/* ===== Main Card ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          Webhook Endpoints
        </h2>

        {endpointsLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : endpoints && endpoints.length > 0 ? (
          <div className="space-y-2">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.webhook_uuid}
                onClick={() => openDetail(endpoint.webhook_uuid)}
                className="flex items-center justify-between px-5 py-5 rounded-xl bg-gray-50 shadow-borders-base cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Zap size={16} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {endpoint.url || '(New endpoint)'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border bg-gray-100 text-gray-500 border-transparent">
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-500 truncate">
                        {endpoint.description || 'No description'}
                      </p>
                      {endpoint.events.length > 0 && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {endpoint.events.length} event{endpoint.events.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Zap size={48} className="mx-auto mb-4 opacity-50" />
            <p>No webhook endpoints yet</p>
            <p className="text-sm">Create your first endpoint to start receiving events</p>
          </div>
        )}
      </div>
    </div>
  )

  // ──────────────────────────────────────────────
  //  DETAIL VIEW
  // ──────────────────────────────────────────────
  const DetailView = () => {
    if (!selectedEndpointId) return null
    const isNew = selectedEndpointId === 'new'

    return (
      <div className="space-y-3">
        {/* ===== Action Row ===== */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBackToList}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            {/* Active/Inactive Toggle (only for existing endpoints) */}
            {!isNew && (
              <button
                type="button"
                onClick={() => { setIsActive(!isActive); setIsSaved(false) }}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {isActive ? 'Active' : 'Inactive'}
              </button>
            )}
            {/* Save Button */}
            <button
              type="button"
              onClick={isSaved ? undefined : handleSave}
              disabled={isActiveSaving}
              className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
                isActiveSaving
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : isSaved
                    ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                    : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
              }`}
            >
              {isActiveSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaved ? (
                <Check size={14} />
              ) : (
                <SaveAllIcon size={14} />
              )}
              <span>
                {isActiveSaving
                  ? 'Saving...'
                  : isSaved
                    ? 'Saved'
                    : 'Save'}
              </span>
            </button>
          </div>
        </div>

        {/* ===== Endpoint Details Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
            Endpoint Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Endpoint URL
              </label>
              <input
                type="url"
                value={editUrl}
                onChange={(e) => { setEditUrl(e.target.value); setIsSaved(false) }}
                placeholder="https://hooks.make.com/..."
                className="w-full px-3 py-2 text-sm bg-ui-bg-field !shadow-none border border-ui-border-base rounded-lg focus:border-ui-border-strong focus-visible:!shadow-none transition-none outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => { setEditDescription(e.target.value); setIsSaved(false) }}
                placeholder="What is this endpoint for?"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-ui-bg-field !shadow-none border border-ui-border-base rounded-lg focus:border-ui-border-strong focus-visible:!shadow-none transition-none outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* ===== Events Card ===== */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
            Events
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Select which events should trigger this webhook
          </p>
          <div className="space-y-2">
            {eventCategories.map((category) => {
              const categoryEventIds = category.events.map((e) => e.id)
              const allSelected = categoryEventIds.every((id) => editEvents.includes(id))
              const selectedCount = categoryEventIds.filter((id) => editEvents.includes(id)).length
              const [isExpanded, setIsExpanded] = React.useState(false)

              return (
                <div key={category.label} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {/* Header - clickable to expand/collapse */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">{category.label}</span>
                    <div className="flex items-center gap-2">
                      {!isExpanded && selectedCount > 0 && (
                        <span className="text-xs text-gray-400 tabular-nums">{selectedCount}/{categoryEventIds.length}</span>
                      )}
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded content */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      {/* Info row: counter + select all */}
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs text-gray-400 tabular-nums">
                          {selectedCount} of {categoryEventIds.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.events)}
                          className="text-xs text-gray-800 hover:text-gray-600 font-medium transition-colors"
                        >
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>

                      {/* Checkboxes */}
                      <div className="px-4 pb-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {category.events.map((event) => (
                            <label key={event.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                              <div className="relative w-4 h-4 flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={editEvents.includes(event.id)}
                                  onChange={() => toggleEvent(event.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors">
                                  <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
                                </div>
                              </div>
                              <span className="text-sm text-gray-700">
                                {event.description}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ===== Delete (only for existing endpoints) ===== */}
        {!isNew && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => selectedEndpointId && handleDelete(selectedEndpointId)}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="pro"
      icon={Zap}
      titleKey="common.plans.feature_restricted.webhooks.title"
      descriptionKey="common.plans.feature_restricted.webhooks.description"
    >
      {currentView === 'list' ? <ListView /> : <DetailView />}
    </PlanRestrictedFeature>
  )
}

export default OrgEditAutomations
