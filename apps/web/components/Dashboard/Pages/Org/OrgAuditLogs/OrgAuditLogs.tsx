import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import UserAvatar from '@components/Objects/UserAvatar'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { Search, Activity, ShieldCheck, RefreshCw, Eye, Globe, Terminal, ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react'
import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { Input } from '@components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import { useTranslation } from 'react-i18next'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import { PlanLevel } from '@services/plans/plans'
import { usePlan } from '@components/Hooks/usePlan'
import { Column, DataTable } from '@components/Analytics/DataTable'
import { EmptyState } from '@components/Analytics/Feedback'

const ITEMS_PER_PAGE = 20

const OrgAuditLogs = () => {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const [offset, setOffset] = useState(0)
  const [searchField, setSearchField] = useState('action')
  const [openModalId, setOpenModalId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    searchValue: '',
    action: '',
    resource: '',
    status_code: '',
    date_range: 'all',
    start_date: '',
    end_date: '',
  })

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (org?.id) params.append('org_id', org.id.toString())
    params.append('limit', ITEMS_PER_PAGE.toString())
    params.append('offset', offset.toString())
    
    // Search logic based on selected field
    if (filters.searchValue) {
      if (searchField === 'user_id') {
        params.append('user_id', filters.searchValue)
      } else if (searchField === 'username') {
        params.append('username', filters.searchValue)
      } else if (searchField === 'name') {
        params.append('name', filters.searchValue)
      } else if (searchField === 'resource') {
        params.append('resource', filters.searchValue)
      } else if (searchField === 'ip_address') {
        params.append('ip_address', filters.searchValue)
      } else {
        params.append('action', filters.searchValue)
      }
    }

    if (filters.resource && filters.resource !== 'all') params.append('resource', filters.resource)
    if (filters.status_code && filters.status_code !== 'all') params.append('status_code', filters.status_code)
    
    let start = filters.start_date
    let end = filters.end_date

    if (filters.date_range !== 'custom' && filters.date_range !== 'all') {
      end = dayjs().endOf('day').toISOString()
      if (filters.date_range === 'today') start = dayjs().startOf('day').toISOString()
      if (filters.date_range === '7d') start = dayjs().subtract(7, 'day').startOf('day').toISOString()
      if (filters.date_range === '30d') start = dayjs().subtract(30, 'day').startOf('day').toISOString()
    }

    if (start) params.append('start_date', start)
    if (end) params.append('end_date', end)

    return params.toString()
  }

  const logsUrl = org && access_token ? `${getAPIUrl()}ee/audit_logs/?${buildQuery()}` : null
  const { data, isLoading, isValidating } = useSWR(
    logsUrl,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const logs = data?.items || []
  const total = data?.total || 0
  const currentPlan = usePlan()
  const rf = org?.config?.config?.resolved_features

  const handleRefresh = () => {
    mutate(logsUrl)
  }

  const handleExport = async () => {
    if (rf?.audit_logs?.enabled !== true) {
      toast.error(t('dashboard.organization.audit_logs.enterprise_only'))
      return
    }
    const toastId = toast.loading(t('dashboard.organization.audit_logs.export_toasts.generating'))
    try {
      const params = new URLSearchParams()
      if (org?.id) params.append('org_id', org.id.toString())
      if (filters.searchValue) {
        if (searchField === 'user_id') params.append('user_id', filters.searchValue)
        else if (searchField === 'username') params.append('username', filters.searchValue)
        else if (searchField === 'name') params.append('name', filters.searchValue)
        else if (searchField === 'resource') params.append('resource', filters.searchValue)
        else if (searchField === 'ip_address') params.append('ip_address', filters.searchValue)
        else params.append('action', filters.searchValue)
      }
      if (filters.resource && filters.resource !== 'all') params.append('resource', filters.resource)
      if (filters.status_code && filters.status_code !== 'all') params.append('status_code', filters.status_code)
      
      let start = filters.start_date
      let end = filters.end_date
      if (filters.date_range !== 'custom' && filters.date_range !== 'all') {
        end = dayjs().endOf('day').toISOString()
        if (filters.date_range === 'today') start = dayjs().startOf('day').toISOString()
        if (filters.date_range === '7d') start = dayjs().subtract(7, 'day').startOf('day').toISOString()
        if (filters.date_range === '30d') start = dayjs().subtract(30, 'day').startOf('day').toISOString()
      }
      if (start) params.append('start_date', start)
      if (end) params.append('end_date', end)

      const url = `${getAPIUrl()}ee/audit_logs/export?${params.toString()}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(t('dashboard.organization.audit_logs.export_toasts.success'), { id: toastId })
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('dashboard.organization.audit_logs.export_toasts.error'), { id: toastId })
    }
  }

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
  }

  const auditColumns: Column<any>[] = [
    {
      key: 'timestamp',
      header: t('dashboard.organization.audit_logs.table.timestamp'),
      width: '160px',
      sortable: true,
      value: (log) => log.created_at || '',
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{dayjs(log.created_at).format('MMM DD, YYYY')}</span>
          <span className="text-[11px] text-gray-400">{dayjs(log.created_at).format('HH:mm:ss')}</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: t('dashboard.organization.audit_logs.table.user'),
      width: '180px',
      sortable: true,
      value: (log) => log.username || '',
      render: (log) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar
            width={30}
            userId={log.user_id?.toString()}
            rounded="rounded-full"
            showProfilePopup={true}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              @{log.username || t('dashboard.organization.audit_logs.system_user')}
            </span>
            {log.user_id && (
              <span className="text-[11px] text-gray-400 font-mono">{t('dashboard.organization.audit_logs.user_id', { id: log.user_id })}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'resource',
      header: t('dashboard.organization.audit_logs.table.resource'),
      width: '170px',
      render: (log) => (
        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
          <Activity className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm capitalize truncate">{log.resource}</span>
          {log.resource_id && (
            <span className="text-[10px] bg-gray-50 border border-gray-200 px-1 rounded text-gray-400 font-mono truncate">
              {log.resource_id}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'path',
      header: t('dashboard.organization.audit_logs.table.path_method'),
      render: (log) => (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono truncate max-w-[260px]">
            <Terminal className="w-3 h-3 shrink-0" />
            <span className="truncate">{log.path}</span>
          </div>
          <span className={`w-fit text-[10px] font-semibold ${
            log.method === 'GET' ? 'text-blue-600' :
            log.method === 'POST' ? 'text-green-600' :
            log.method === 'PUT' ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {log.method}
          </span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: t('dashboard.organization.audit_logs.table.ip_address'),
      width: '140px',
      render: (log) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <Globe className="w-3 h-3" />
          {log.ip_address || '—'}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.organization.audit_logs.table.status'),
      width: '100px',
      align: 'right',
      sortable: true,
      value: (log) => log.status_code || 0,
      render: (log) => (
        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
          <span className={`w-2.5 h-2.5 rounded ${
            log.status_code >= 200 && log.status_code < 300 ? 'bg-green-500' :
            log.status_code >= 400 && log.status_code < 500 ? 'bg-orange-500' :
            log.status_code >= 500 ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          {log.status_code}
        </span>
      ),
    },
    {
      key: 'payload',
      header: t('dashboard.organization.audit_logs.table.payload'),
      width: '80px',
      align: 'right',
      render: (log) =>
        log.payload && Object.keys(log.payload).length > 0 ? (
          <Modal
            dialogTitle={t('dashboard.organization.audit_logs.modals.payload.title')}
            dialogDescription={t('dashboard.organization.audit_logs.modals.payload.description', { action: log.action })}
            minHeight="no-min"
            isDialogOpen={openModalId === log.id}
            onOpenChange={(open) => setOpenModalId(open ? log.id : null)}
            dialogContent={
              <div className="bg-gray-900 rounded-lg p-4 mt-2 overflow-auto max-h-[400px]">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            }
            dialogTrigger={
              <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors group">
                <Eye className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
              </button>
            }
          />
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        ),
    },
  ]

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan={(rf?.audit_logs?.required_plan || 'enterprise') as PlanLevel}
      icon={ShieldCheck}
      titleKey="common.plans.feature_restricted.audit_logs.title"
      descriptionKey="common.plans.feature_restricted.audit_logs.description"
    >
      <>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mx-auto">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-bold text-xl text-gray-800">{t('dashboard.organization.audit_logs.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('dashboard.organization.audit_logs.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-end">
               <button 
                onClick={handleRefresh}
                className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${isValidating ? 'animate-spin' : ''}`}
                title={t('dashboard.organization.audit_logs.refresh')}
               >
                <RefreshCw className="w-4 h-4 text-gray-600" />
               </button>

               <button 
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                title={t('dashboard.organization.audit_logs.export')}
               >
                <Download size={14} />
                <span>{t('dashboard.organization.audit_logs.export')}</span>
               </button>

               <div className="flex items-center gap-0 border border-gray-200 rounded-md overflow-hidden bg-white">
                <Select
                  value={searchField}
                  onValueChange={(val) => setSearchField(val)}
                >
                  <SelectTrigger className="w-[110px] h-9 text-[10px] border-none bg-gray-50 rounded-none focus:ring-0">
                    <SelectValue placeholder={t('dashboard.organization.audit_logs.search_by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action">{t('dashboard.organization.audit_logs.table.path_method')}</SelectItem>
                    <SelectItem value="resource">{t('dashboard.organization.audit_logs.filters.resource')}</SelectItem>
                    <SelectItem value="username">{t('dashboard.organization.audit_logs.table.user')}</SelectItem>
                    <SelectItem value="name">{t('dashboard.organization.audit_logs.table.user')}</SelectItem>
                    <SelectItem value="user_id">{t('dashboard.organization.audit_logs.table.user')}</SelectItem>
                    <SelectItem value="ip_address">{t('dashboard.organization.audit_logs.table.ip_address')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder={t('dashboard.organization.audit_logs.placeholders.search')}
                    className="ps-9 w-[180px] h-9 text-xs border-none focus-visible:ring-0 rounded-none"
                    value={filters.searchValue}
                    onChange={(e) => {
                      setFilters({ ...filters, searchValue: e.target.value })
                      setOffset(0)
                    }}
                  />
                </div>
              </div>
              
              <Select
                value={filters.resource}
                onValueChange={(val) => {
                    setFilters({ ...filters, resource: val })
                    setOffset(0)
                }}
              >
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder={t('dashboard.organization.audit_logs.filters.resource')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.organization.audit_logs.resources.all')}</SelectItem>
                  <SelectItem value="user">{t('dashboard.organization.audit_logs.resources.user')}</SelectItem>
                  <SelectItem value="course">{t('dashboard.organization.audit_logs.resources.course')}</SelectItem>
                  <SelectItem value="org">{t('dashboard.organization.audit_logs.resources.org')}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status_code}
                onValueChange={(val) => {
                    setFilters({ ...filters, status_code: val })
                    setOffset(0)
                }}
              >
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue placeholder={t('dashboard.organization.audit_logs.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="200">200 OK</SelectItem>
                  <SelectItem value="403">403</SelectItem>
                  <SelectItem value="404">404</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.date_range}
                onValueChange={(val) => {
                    setFilters({ ...filters, date_range: val, start_date: '', end_date: '' })
                    setOffset(0)
                }}
              >
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue placeholder={t('dashboard.organization.audit_logs.filters.date')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.organization.audit_logs.date_ranges.all')}</SelectItem>
                  <SelectItem value="today">{t('dashboard.organization.audit_logs.date_ranges.today')}</SelectItem>
                  <SelectItem value="7d">{t('dashboard.organization.audit_logs.date_ranges.7d')}</SelectItem>
                  <SelectItem value="30d">{t('dashboard.organization.audit_logs.date_ranges.30d')}</SelectItem>
                  <SelectItem value="custom">{t('dashboard.organization.audit_logs.date_ranges.custom')}</SelectItem>
                </SelectContent>
              </Select>

              {filters.date_range === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="h-9 text-xs w-[130px]"
                    value={filters.start_date ? dayjs(filters.start_date).format('YYYY-MM-DD') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? dayjs(e.target.value).startOf('day').toISOString() : ''
                      setFilters({ ...filters, start_date: date })
                      setOffset(0)
                    }}
                  />
                  <span className="text-gray-400 text-xs">{t('dashboard.organization.audit_logs.date_ranges.to')}</span>
                  <Input
                    type="date"
                    className="h-9 text-xs w-[130px]"
                    value={filters.end_date ? dayjs(filters.end_date).format('YYYY-MM-DD') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? dayjs(e.target.value).endOf('day').toISOString() : ''
                      setFilters({ ...filters, end_date: date })
                      setOffset(0)
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          {isLoading && !data ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">{t('dashboard.organization.audit_logs.loading')}</span>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={t('dashboard.organization.audit_logs.no_logs')}
            />
          ) : (
            <DataTable columns={auditColumns} rows={logs} />
          )}
        </div>

        {/* Pagination Controls */}
        {total > ITEMS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="text-xs text-gray-500">
              {t('dashboard.organization.audit_logs.pagination.showing', { 
                start: offset + 1, 
                end: Math.min(offset + ITEMS_PER_PAGE, total), 
                total 
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, offset - ITEMS_PER_PAGE))}
                disabled={offset === 0}
                className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePageChange(offset + ITEMS_PER_PAGE)}
                disabled={offset + ITEMS_PER_PAGE >= total}
                className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
        </div>
      </>
    </PlanRestrictedFeature>
  )
}

export default OrgAuditLogs
