'use client'
import CreateCourseModal from '@components/Objects/Modals/Course/Create/CreateCourse'
import CourseCreationTypeSelector from '@components/Objects/Modals/Course/Create/CourseCreationTypeSelector'
import AICourseCreationModal from '@components/Objects/Modals/Course/Create/AICourse/AICourseCreationModal'
import { BookCopy, Search, X, Trash2, ChevronLeft, ChevronRight, Upload, Users, Info, Download, Copy, CheckSquare } from 'lucide-react'
import ScormCourseImport from '../../../../../ee/components/Modals/ScormCourseImport'
import { ImportTypeSelector, LearnHouseCourseImport } from '@components/Objects/Modals/Course/Import'
import { removeCoursePrefix, AdminEditOptions } from '@components/Objects/Thumbnails/CourseThumbnail'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import NewCourseButton from '@components/Objects/StyledElements/Buttons/NewCourseButton'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { useSearchParams, useRouter } from 'next/navigation'
import React, { useState, useMemo } from 'react'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { useOrg } from '@components/Contexts/OrgContext'
import { useTranslation } from 'react-i18next'
import { PlanLevel } from '@services/plans/plans'
import { OrgUsageResponse, orgUsageFetcher } from '@services/orgs/usage'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { deleteCourseFromBackend, cloneCourse } from '@services/courses/courses'
import { exportCourse, exportCoursesBatch, downloadBlob, ExportStatus } from '@services/courses/transfer'
import { exportToast } from '@components/Objects/StyledElements/Toast/ExportToast'
import { swrFetcher } from '@services/utils/ts/requests'
import { getUserGroups, getUserGroupResources } from '@services/usergroups/usergroups'
import { mutate } from 'swr'
import useSWR from 'swr'
import toast from 'react-hot-toast'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { usePlan } from '@components/Hooks/usePlan'
import { searchMatchesAny } from '@/lib/search/normalize'
import { IconButton } from '@components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@components/ui/dropdown-menu'
import { Button } from '@components/ui/button'

type CourseProps = {
  orgslug: string
  courses: any
  org_id: string | number
}

function CoursesHome(params: CourseProps) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const isCreatingCourse = searchParams.get('new') ? true : false
  const [newCourseModal, setNewCourseModal] = React.useState(isCreatingCourse)
  const [importCourseModal, setImportCourseModal] = React.useState(false)
  const [importType, setImportType] = React.useState<'select' | 'scorm' | 'learnhouse'>('select')
  const [creationType, setCreationType] = React.useState<'select' | 'scratch' | 'ai'>('select')
  const [aiCourseModalOpen, setAiCourseModalOpen] = React.useState(false)
  const orgslug = params.orgslug
  const { isAdmin: isUserAdmin } = useAdminStatus()
  const org = useOrg() as any
  const currentPlan = usePlan()
  const session = useLHSession() as any
  const access_token = session.data?.tokens?.access_token

  // Check if courses feature is enabled
  const isCoursesEnabled = org?.config?.config?.resolved_features?.courses?.enabled ?? org?.config?.config?.features?.courses?.enabled !== false

  // SWR for courses data - only fetch if feature is enabled
  const { data: coursesData, mutate: mutateCourses } = useSWR(
    isCoursesEnabled && access_token ? `${getAPIUrl()}courses/org_slug/${orgslug}/page/1/limit/500?include_unpublished=true` : null,
    (url) => swrFetcher(url, access_token),
    { fallbackData: params.courses, revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  const allCourses = coursesData || params.courses

  // Fetch usage limits from backend
  const { data: usageData } = useSWR<OrgUsageResponse>(
    access_token && params.org_id ? `${getAPIUrl()}orgs/${params.org_id}/usage` : null,
    (url) => orgUsageFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  // Check course creation limit from backend
  const courseLimitReached = usageData?.features?.courses?.limit_reached ?? false
  const courseLimit = usageData?.features?.courses?.limit ?? 0

  // Usergroup filter — only shown on personal/family plans
  const usergroupsAvailable = currentPlan === 'personal' || currentPlan === 'family'
  const [usergroups, setUsergroups] = useState<any[]>([])
  const [selectedUsergroupId, setSelectedUsergroupId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lh_course_usergroup_filter') || ''
    }
    return ''
  })
  const [usergroupResourceUuids, setUsergroupResourceUuids] = useState<Set<string> | null>(null)
  const [showUsergroupInfo, setShowUsergroupInfo] = useState(false)

  // Fetch usergroups
  React.useEffect(() => {
    if (!usergroupsAvailable || !access_token || !params.org_id) return
    getUserGroups(params.org_id, access_token)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || []
        setUsergroups(list)
        // Clear saved selection if the usergroup no longer exists
        if (selectedUsergroupId && !list.some((ug: any) => String(ug.id) === selectedUsergroupId)) {
          setSelectedUsergroupId('')
          localStorage.removeItem('lh_course_usergroup_filter')
        }
      })
      .catch(() => setUsergroups([]))
  }, [usergroupsAvailable, access_token, params.org_id])

  // Fetch resource UUIDs for selected usergroup
  React.useEffect(() => {
    if (!selectedUsergroupId || !access_token || !params.org_id) {
      setUsergroupResourceUuids(null)
      return
    }
    getUserGroupResources(selectedUsergroupId, params.org_id, access_token)
      .then((res: any) => {
        const uuids = Array.isArray(res) ? res : res?.data || []
        setUsergroupResourceUuids(new Set(uuids))
      })
      .catch(() => setUsergroupResourceUuids(null))
  }, [selectedUsergroupId, access_token, params.org_id])

  const handleUsergroupChange = (value: string) => {
    setSelectedUsergroupId(value)
    if (value) {
      localStorage.setItem('lh_course_usergroup_filter', value)
    } else {
      localStorage.removeItem('lh_course_usergroup_filter')
    }
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter courses based on search and usergroup (client-side)
  const filteredCourses = useMemo(() => {
    let courses = allCourses

    // Usergroup filter
    if (usergroupResourceUuids) {
      courses = courses.filter((course: any) => usergroupResourceUuids.has(course.course_uuid))
    }

    // Search filter
    if (searchQuery.trim()) {
      courses = courses.filter((course: any) =>
        searchMatchesAny([course.name, course.description, course.tags], searchQuery)
      )
    }

    return courses
  }, [allCourses, searchQuery, usergroupResourceUuids])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedUsergroupId])

  // Calculate pagination (client-side)
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCourses, currentPage, itemsPerPage])

  // Selection state
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  async function closeNewCourseModal() {
    setNewCourseModal(false)
    setCreationType('select')
    mutateCourses()
  }

  const router = useRouter()
  const handleCreationTypeSelect = (type: 'scratch' | 'ai' | 'migrate') => {
    if (type === 'ai') {
      setNewCourseModal(false)
      setAiCourseModalOpen(true)
    } else if (type === 'migrate') {
      setNewCourseModal(false)
      router.push(getUriWithOrg(orgslug, '/dash/courses/migrate'))
    } else {
      setCreationType('scratch')
    }
  }

  const closeAICourseModal = () => {
    setAiCourseModalOpen(false)
    setCreationType('select')
    mutateCourses()
  }

  const getNewCourseModalContent = () => {
    switch (creationType) {
      case 'scratch':
        return (
          <CreateCourseModal
            closeModal={closeNewCourseModal}
            orgslug={orgslug}
          />
        )
      default:
        return <CourseCreationTypeSelector onSelectType={handleCreationTypeSelect} currentPlan={currentPlan} />
    }
  }

  const getNewCourseModalTitle = () => {
    switch (creationType) {
      case 'scratch':
        return null
      default:
        return t('courses.create.choose_type')
    }
  }

  const getNewCourseModalDescription = () => {
    switch (creationType) {
      case 'scratch':
        return undefined
      default:
        return t('courses.create.choose_type_description')
    }
  }

  async function closeImportCourseModal() {
    setImportCourseModal(false)
    setImportType('select')
    mutateCourses()
  }

  const handleImportTypeSelect = (type: 'scorm' | 'learnhouse') => {
    setImportType(type)
  }

  const getImportModalContent = () => {
    switch (importType) {
      case 'scorm':
        return (
          <ScormCourseImport
            orgId={Number(params.org_id)}
            orgslug={orgslug}
            closeModal={closeImportCourseModal}
          />
        )
      case 'learnhouse':
        return (
          <LearnHouseCourseImport
            orgId={Number(params.org_id)}
            orgslug={orgslug}
            closeModal={closeImportCourseModal}
          />
        )
      default:
        return <ImportTypeSelector onSelectType={handleImportTypeSelect} currentPlan={currentPlan} />
    }
  }

  const getImportModalTitle = () => {
    switch (importType) {
      case 'scorm':
        return t('dashboard.courses.import_scorm')
      case 'learnhouse':
        return t('dashboard.courses.import_learnhouse')
      default:
        return t('dashboard.courses.import_course')
    }
  }

  const getImportModalDescription = () => {
    switch (importType) {
      case 'scorm':
        return t('dashboard.courses.import_scorm_description')
      case 'learnhouse':
        return t('dashboard.courses.import_learnhouse_description')
      default:
        return t('dashboard.courses.import_select_type')
    }
  }

  // Toggle course selection
  const toggleCourseSelection = (courseUuid: string) => {
    const newSelection = new Set(selectedCourses)
    if (newSelection.has(courseUuid)) {
      newSelection.delete(courseUuid)
    } else {
      newSelection.add(courseUuid)
    }
    setSelectedCourses(newSelection)
  }

  // Select all visible courses (on current page)
  const selectAllCourses = () => {
    const allCourseUuids = paginatedCourses.map((course: any) => course.course_uuid)
    setSelectedCourses(new Set(allCourseUuids))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedCourses(new Set())
  }

  // Bulk delete courses
  const bulkDeleteCourses = async () => {
    const toastId = toast.loading(t('courses.deleting_courses', { count: selectedCourses.size }))
    let successCount = 0
    let errorCount = 0

    for (const courseUuid of selectedCourses) {
      try {
        await deleteCourseFromBackend(courseUuid, access_token)
        successCount++
      } catch (error) {
        errorCount++
      }
    }

    toast.dismiss(toastId)
    if (errorCount === 0) {
      toast.success(t('courses.courses_deleted_success', { count: successCount }))
    } else {
      toast.error(t('courses.courses_deleted_partial', { success: successCount, error: errorCount }))
    }

    clearSelection()
    mutateCourses()
  }

  // Bulk clone courses
  const bulkCloneCourses = async () => {
    const toastId = toast.loading(t('courses.cloning_courses', { count: selectedCourses.size }))
    let successCount = 0
    let errorCount = 0

    for (const courseUuid of selectedCourses) {
      try {
        const result = await cloneCourse(courseUuid, access_token)
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    toast.dismiss(toastId)
    if (errorCount === 0) {
      toast.success(t('courses.courses_cloned_success', { count: successCount }))
    } else {
      toast.error(t('courses.courses_cloned_partial', { success: successCount, error: errorCount }))
    }

    clearSelection()
    mutateCourses()
  }

  // Bulk export courses
  const bulkExportCourses = async () => {
    const count = selectedCourses.size
    const toastId = exportToast.start('batch', undefined, count)

    try {
      const blob = await exportCoursesBatch(
        Array.from(selectedCourses),
        access_token,
        (progress, status) => {
          exportToast.update(toastId, status as ExportStatus, progress, undefined, count, 'batch')
        }
      )
      const timestamp = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `learnhouse-courses-export-${timestamp}.zip`)
      exportToast.complete(toastId, undefined, count, 'batch')
    } catch (error: any) {
      exportToast.error(toastId, error.message || t('courses.courses_exported_error'), undefined, count, 'batch')
    }
    clearSelection()
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedCourses(new Set())
    }
  }

  const getVisiblePageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <FeatureDisabledView featureName="courses" orgslug={orgslug} context="dashboard">
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      {/* Page title */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('courses.courses')}
      </h1>

      {/* Search + Filter toolbar (only if courses exist) */}
      {allCourses.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          {/* Search + results count group (left side) */}
          <div className="flex items-center gap-3">
            {/* Search — custom search bar with icon */}
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('courses.search_courses')}
                className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {/* Search results count — next to search bar */}
            {searchQuery && (
              <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                {t('courses.search_results', { count: filteredCourses.length, query: searchQuery })}
              </span>
            )}
          </div>

          {/* Spacer pushes actions to the right */}
          <div className="flex-1" />

          {/* +New Course Button (opens create modal) */}
          <AuthenticatedClientElement
            checkMethod="roles"
            action="create"
            ressourceType="courses"
            orgId={params.org_id}
          >
            {courseLimitReached && (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg mr-2">
                {t('dashboard.courses.limit_reached', { limit: courseLimit })}
              </div>
            )}
            <Button
              variant="primary"
              size="small"
              disabled={courseLimitReached}
              onClick={() => { setCreationType('scratch'); setNewCourseModal(true); }}
            >
              +&nbsp;{t('courses.new_course')}
            </Button>
          </AuthenticatedClientElement>

          {/* Select Toggle (Admin feature) */}
          <Button
            variant="secondary"
            size="small"
            onClick={() => { setIsSelectMode(prev => !prev); if (isSelectMode) clearSelection(); }}
            className="gap-x-1.5"
          >
            <CheckSquare size={14} />
            <span>{isSelectMode ? t('cancel') : t('courses.select_courses')}</span>
          </Button>

          {/* Filter — Medusa IconButton + DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label={t('courses.filter_courses')}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-28">
              <DropdownMenuItem>All Courses</DropdownMenuItem>
              <DropdownMenuItem>Easy</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Hard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Usergroup filter — personal/family plans only */}
          {usergroupsAvailable && usergroups.length > 0 && (
            <div className="relative flex items-center gap-1.5">
              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ui-fg-muted w-3.5 h-3.5 pointer-events-none" />
                <select
                  value={selectedUsergroupId}
                  onChange={(e) => handleUsergroupChange(e.target.value)}
                  className="h-7 pl-7 pr-7 txt-compact-small bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base rounded-md appearance-none cursor-pointer min-w-[140px] outline-none focus-visible:shadow-borders-interactive-with-active"
                >
                  <option value="">{t('courses.usergroup_filter.all_courses')}</option>
                  {usergroups.map((ug: any) => (
                    <option key={ug.id} value={String(ug.id)}>
                      {ug.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowUsergroupInfo(!showUsergroupInfo)}
                className="flex items-center justify-center h-6 w-6 text-ui-fg-muted hover:text-ui-fg-base transition-colors rounded-md hover:bg-ui-bg-base-hover"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showUsergroupInfo && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-ui-bg-component shadow-elevation-flyout rounded-lg p-3">
                  <p className="txt-compact-xsmall-plus text-ui-fg-subtle mb-1">{t('courses.usergroup_filter.info_title')}</p>
                  <p className="txt-compact-xsmall text-ui-fg-muted leading-relaxed">{t('courses.usergroup_filter.info_description')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Bar (Admin feature) */}
      {selectedCourses.size > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-ui-bg-component rounded-lg shadow-borders-base">
          <span className="txt-compact-small-plus text-ui-fg-base mr-2">
            {t('courses.selected_count', { count: selectedCourses.size })}
          </span>
          <button onClick={selectAllCourses} className="txt-compact-small text-ui-fg-muted hover:text-ui-fg-base px-2 py-1">
            {t('courses.select_all')}
          </button>
          <button onClick={clearSelection} className="txt-compact-small text-ui-fg-muted hover:text-ui-fg-base px-2 py-1">
            <X className="w-3.5 h-3.5 inline mr-1" />{t('courses.clear_selection')}
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <AuthenticatedClientElement
            checkMethod="roles"
            action="update"
            ressourceType="courses"
            orgId={params.org_id}
          >
            <ConfirmationModal
              confirmationButtonText={t('courses.clone_selected')}
              confirmationMessage={t('courses.clone_selected_confirm', { count: selectedCourses.size })}
              dialogTitle={t('courses.clone_courses_title')}
              dialogTrigger={
                <button className="txt-compact-small text-ui-fg-muted hover:text-ui-fg-base px-2 py-1">
                  <Copy className="w-3.5 h-3.5 inline mr-1" />{t('courses.clone_selected')}
                </button>
              }
              functionToExecute={bulkCloneCourses}
              status="info"
            />
            <button onClick={bulkExportCourses} className="txt-compact-small text-ui-fg-muted hover:text-ui-fg-base px-2 py-1">
              <Download className="w-3.5 h-3.5 inline mr-1" />{t('courses.export_selected')}
            </button>
            <ConfirmationModal
              confirmationButtonText={t('courses.delete_selected')}
              confirmationMessage={t('courses.delete_selected_confirm', { count: selectedCourses.size })}
              dialogTitle={t('courses.delete_courses_title')}
              dialogTrigger={
                <button className="txt-compact-small text-red-600 hover:text-red-700 px-2 py-1">
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />{t('courses.delete_selected')}
                </button>
              }
              functionToExecute={bulkDeleteCourses}
              status="warning"
            />
          </AuthenticatedClientElement>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedCourses.map((course: any) => {
          const imageUrl = course.thumbnail_image
            ? getCourseThumbnailMediaDirectory(org?.org_uuid, course.course_uuid, course.thumbnail_image)
            : ''
          return (
            <div key={course.course_uuid} className="relative group">
              {/* Selection checkbox - visible in select mode */}
              {isSelectMode && (
                <div className="absolute top-2 left-2 z-20">
                  <IconButton
                    variant="transparent"
                    size="small"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCourseSelection(course.course_uuid); }}
                    aria-label={selectedCourses.has(course.course_uuid) ? 'Deselect course' : 'Select course'}
                    className="bg-white/90 backdrop-blur-sm"
                  >
                    {selectedCourses.has(course.course_uuid)
                      ? <CheckSquare className="h-4 w-4 text-black" />
                      : <div className="h-4 w-4 border border-gray-400 rounded" />
                    }
                  </IconButton>
                </div>
              )}

              <CourseCard
                id={removeCoursePrefix(course.course_uuid)}
                title={course.name}
                description={course.description || ''}
                image={imageUrl}
                lessons={0}
                duration="N/A"
                difficulty="All levels"
                href={`/dash/courses/course/${removeCoursePrefix(course.course_uuid)}/general`}
              />

              {/* Admin 3-dot menu overlay */}
              <AdminEditOptions
                course={course}
                orgSlug={orgslug}
                isDashboard={true}
                deleteCourse={async () => {
                  const toastId = toast.loading(t('courses.deleting_course'))
                  try {
                    await deleteCourseFromBackend(course.course_uuid, access_token)
                    mutateCourses()
                    toast.success(t('courses.course_deleted_success'))
                  } catch (error) {
                    toast.error(t('courses.course_deleted_error'))
                  } finally {
                    toast.dismiss(toastId)
                  }
                }}
                cloneCourse={async () => {
                  const toastId = toast.loading(t('courses.cloning_course'))
                  try {
                    const result = await cloneCourse(course.course_uuid, access_token)
                    if (result.success) {
                      mutateCourses()
                      toast.success(t('courses.course_cloned_success'))
                    } else {
                      toast.error(result.HTTPmessage || t('courses.course_cloned_error'))
                    }
                  } catch (error) {
                    toast.error(t('courses.course_cloned_error'))
                  } finally {
                    toast.dismiss(toastId)
                  }
                }}
                exportCourse={async () => {
                  const toastId = exportToast.start('single', course.name)
                  try {
                    const blob = await exportCourse(
                      course.course_uuid,
                      access_token,
                      (progress, status) => {
                        exportToast.update(toastId, status as ExportStatus, progress, course.name, undefined, 'single')
                      }
                    )
                    const timestamp = new Date().toISOString().split('T')[0]
                    downloadBlob(blob, `${course.name.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.zip`)
                    exportToast.complete(toastId, course.name, undefined, 'single')
                  } catch (error: any) {
                    exportToast.error(toastId, error.message || t('courses.course_exported_error'), course.name, undefined, 'single')
                  }
                }}
              />
            </div>
          )
        })}

        {/* Empty state — search with no results */}
        {filteredCourses.length === 0 && searchQuery && (
          <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
              <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
              {t('courses.no_search_results')}
            </h2>
            <p className="txt-compact-small text-ui-fg-muted">
              {t('courses.try_different_search')}
            </p>
          </div>
        )}

        {/* Empty state — no courses at all */}
        {allCourses.length === 0 && !searchQuery && (
          <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
              <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
              {t('dashboard.courses.no_courses')}
            </h1>
            <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
              {isUserAdmin ? t('dashboard.courses.create_course_placeholder') : t('dashboard.courses.no_courses_available')}
            </p>
            {isUserAdmin && !courseLimitReached && (
              <AuthenticatedClientElement
                action="create"
                ressourceType="courses"
                checkMethod="roles"
                orgId={params.org_id}
              >
                <NewCourseButton onClick={() => setNewCourseModal(true)} />
              </AuthenticatedClientElement>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-6 pb-0">
          <Button
            variant="transparent"
            size="small"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {getVisiblePageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 txt-compact-small text-ui-fg-muted">...</span>
                ) : (
                  <button
                    onClick={() => goToPage(page as number)}
                    className={`w-7 h-7 txt-compact-small-plus rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-ui-bg-base shadow-borders-base text-ui-fg-base'
                        : 'text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-base-hover'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <Button
            variant="transparent"
            size="small"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>

    {/* Create Course Modal */}
    <Modal
      isDialogOpen={newCourseModal}
      onOpenChange={(open) => {
        if (courseLimitReached) return
        setNewCourseModal(open)
      }}
      minHeight={creationType === 'select' ? 'no-min' : 'sm'}
      minWidth={creationType === 'select' ? 'md' : 'sm'}
      customWidth={creationType === 'scratch' ? 'md:!w-[500px] md:!max-w-[500px]' : undefined}
      noPadding={creationType === 'scratch'}
      hideCloseButton={creationType === 'scratch'}
      dialogContent={getNewCourseModalContent()}
      dialogTitle={getNewCourseModalTitle()}
      dialogDescription={getNewCourseModalDescription()}
    />

    {/* Import Course Modal */}
    <Modal
      isDialogOpen={importCourseModal}
      onOpenChange={(open) => {
        if (courseLimitReached) return
        setImportCourseModal(open)
        if (!open) setImportType('select')
      }}
      minHeight="no-min"
      dialogTitle={getImportModalTitle()}
      dialogDescription={getImportModalDescription()}
      dialogContent={getImportModalContent()}
    />

    {/* AI Course Creation Modal */}
    <AICourseCreationModal
      isOpen={aiCourseModalOpen}
      onClose={closeAICourseModal}
      orgId={Number(params.org_id)}
      orgslug={orgslug}
      accessToken={access_token}
    />
    </FeatureDisabledView>
  )
}

export default CoursesHome
