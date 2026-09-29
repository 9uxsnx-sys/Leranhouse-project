'use client'
import React, { useState, useMemo } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCourse, getCourseMetaCacheKey } from '@components/Contexts/CourseContext'
import { mutate } from 'swr'
import {
  Trash2,
  BookOpen,
  Loader2,
  Search,
  ArrowUpDown,
  CheckSquare,
  MoreVertical,
  Copy,
  FileText,
  GripVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import {
  createActivity,
  deleteActivity,
} from '@services/courses/activities'
import { updateCourseOrderStructure } from '@services/courses/chapters'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { getOrganizationContextInfoWithoutCredentials } from '@services/organizations/orgs'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type ModuleFormProps = {
  chapter: any
  chapterIndex: number
  orgslug: string
  course_uuid: string
  onBack: () => void
  onLessonClick: (activity: any) => void
}

function ModuleForm({ chapter, chapterIndex, orgslug, course_uuid, onBack, onLessonClick }: ModuleFormProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const course = useCourse() as any
  const [isDeletingActivity, setIsDeletingActivity] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedActivityUuids, setSelectedActivityUuids] = useState<Set<string>>(new Set())
  const [activityOrder, setActivityOrder] = useState<string[] | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const toggleActivitySelection = (uuid: string) => {
    setSelectedActivityUuids((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) {
        next.delete(uuid)
      } else {
        next.add(uuid)
      }
      return next
    })
  }

  const activities = chapter.activities || []
  const withUnpublishedActivities = course?.withUnpublishedActivities || false
  const courseStructure = course?.courseStructure || {}
  const allChapters = courseStructure?.chapters || []

  const displayActivities = useMemo(() => {
    let result: any[]
    if (activityOrder) {
      const orderedMap = new Map(activityOrder.map((uuid, i) => [uuid, i]))
      result = [...activities].sort((a: any, b: any) => {
        const aIdx = orderedMap.get(a.activity_uuid)
        const bIdx = orderedMap.get(b.activity_uuid)
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx
        if (aIdx !== undefined) return -1
        if (bIdx !== undefined) return 1
        return 0
      })
    } else {
      result = [...activities]
      result.sort((a: any, b: any) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a: any) =>
        (a.name || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [activities, searchQuery, sortOrder, activityOrder])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || isReordering) return

    const items = Array.from(displayActivities)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)

    const newOrder = items.map((a: any) => a.activity_uuid)

    // Optimistic update
    setActivityOrder(newOrder)

    // Build the full payload: keep all chapters in their current order,
    // but update the activities for this specific chapter
    const chapterOrderByIds = allChapters.map((ch: any) => {
      if (ch.chapter_uuid === chapter.chapter_uuid) {
        // This is the chapter we're reordering activities in
        return {
          chapter_id: ch.id,
          activities_order_by_ids: items.map((a: any) => ({
            activity_id: a.id,
          })),
        }
      }
      // Other chapters keep their existing activity order
      return {
        chapter_id: ch.id,
        activities_order_by_ids: (ch.activities || []).map((a: any) => ({
          activity_id: a.id,
        })),
      }
    })

    setIsReordering(true)
    try {
      await updateCourseOrderStructure(
        course_uuid,
        { chapter_order_by_ids: chapterOrderByIds },
        access_token
      )
      toast.success('Lessons reordered')
    } catch {
      toast.error('Failed to reorder lessons')
      setActivityOrder(null) // Revert on error
    } finally {
      setIsReordering(false)
    }
  }

  const refreshCourseData = async () => {
    try {
      const key = getCourseMetaCacheKey(course_uuid, withUnpublishedActivities)
      const response = await fetch(key, {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      })
      if (response.ok) {
        const freshData = await response.json()
        await mutate(key, freshData, { revalidate: false })
      }
    } catch (e) {
      console.error('Failed to refresh course data:', e)
    }
  }

  const handleDeleteActivity = async (activity: any) => {
    if (!access_token) return
    setIsDeletingActivity(activity.activity_uuid)
    try {
      await deleteActivity(activity.activity_uuid, access_token)
      await refreshCourseData()
      toast.success('Lesson deleted')
    } catch (e) {
      toast.error('Failed to delete lesson')
    } finally {
      setIsDeletingActivity(null)
    }
  }

  const handleCreateLesson = async () => {
    if (!access_token) return
    setIsCreatingLesson(true)
    try {
      const org = await getOrganizationContextInfoWithoutCredentials(orgslug, { revalidate: 1800 })
      const activityData = {
        name: 'New Lesson',
        chapter_id: chapter.id,
        activity_type: 'TYPE_DYNAMIC',
        content: { description: '' },
      }
      const result = await createActivity(activityData, chapter.id, org.id, access_token)
      if (!result || result.detail) {
        throw new Error(result?.detail?.[0]?.msg || 'API error')
      }
      await refreshCourseData()
      toast.success('Lesson created')
    } catch (e) {
      toast.error('Failed to create lesson')
    } finally {
      setIsCreatingLesson(false)
    }
  }

  return (
    <div>
      {/* Toolbar Row */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        {/* Lesson count */}
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {displayActivities.length} {displayActivities.length === 1 ? 'lesson' : 'lessons'}
        </span>

        {/* Spacer pushes actions to the right */}
        <div className="flex-1" />

        {/* New Lesson Button */}
        <Button
          variant="primary"
          size="small"
          onClick={handleCreateLesson}
          disabled={isCreatingLesson}
        >
          {isCreatingLesson ? (
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
        <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} aria-label="Sort lessons">
          <ArrowUpDown size={15} />
        </IconButton>
      </div>

      {/* Lesson List — with drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lessons">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {displayActivities.map((activity: any, index: number) => {
                const isSelected = selectedActivityUuids.has(activity.activity_uuid)
                return (
                  <Draggable
                    key={activity.activity_uuid}
                    draggableId={activity.activity_uuid}
                    index={index}
                    isDragDisabled={isSelectMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...(isSelectMode ? {} : provided.draggableProps)}
                        onClick={() => {
                          if (isSelectMode) {
                            toggleActivitySelection(activity.activity_uuid)
                          } else {
                            onLessonClick(activity)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            if (isSelectMode) {
                              toggleActivitySelection(activity.activity_uuid)
                            } else {
                              onLessonClick(activity)
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
                                toggleActivitySelection(activity.activity_uuid)
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
                          <FileText size={18} className="text-gray-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.name || 'Untitled Lesson'}
                          </p>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteActivity(activity)
                              }}
                              className="text-red-600 gap-2"
                            >
                              {isDeletingActivity === activity.activity_uuid ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
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

              {displayActivities.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                  <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    {searchQuery ? 'No lessons match your search' : 'No lessons in this module yet'}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Click "New" to add your first lesson'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </div>
  )
}

export default ModuleForm
