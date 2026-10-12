'use client'
import React, { useState } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { SectionCard } from '@components/Analytics/Card'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { learners } from '@components/Dashboard/Analytics/mockAnalytics'

type Learner = (typeof learners)[number]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Initials avatar, 30px — matches the dashboard user avatar footprint. */
function Avatar({ name }: { name: string }) {
  return (
    <span className="w-[30px] h-[30px] shrink-0 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center">
      {initials(name)}
    </span>
  )
}

/** Label/value row used across the learner-details card. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  )
}

/**
 * Learners — "what is this specific user doing?"
 * Same table as the dashboard Users/Contributors tabs (search lives in the action row);
 * the row action opens a learner-details card using the same pattern as the Users tab window.
 */
export function LearnersTab({ query = '' }: { query?: string }) {
  const [detail, setDetail] = useState<Learner | null>(null)

  const rows = learners.filter((l) =>
    `${l.name} ${l.email}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  const columns: Column<Learner>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      value: (l) => l.name,
      render: (l) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={l.name} />
          <span className="font-medium text-gray-900 truncate">{l.name}</span>
        </div>
      ),
    },
    { key: 'username', header: 'Username', render: (l) => <span className="text-gray-500">@{l.username}</span> },
    { key: 'email', header: 'Email', render: (l) => <span className="truncate text-gray-500">{l.email}</span> },
    { key: 'role', header: 'Role', width: '120px', render: (l) => <span className="text-gray-700">{l.role}</span> },
    {
      key: 'verified',
      header: 'Status',
      width: '130px',
      render: (l) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded ${l.verified ? 'bg-green-500' : 'bg-red-500'}`} />
          {l.verified ? 'Verified' : 'Unverified'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      align: 'right',
      render: (l) => <span className="text-[13px] text-gray-400">{l.joined}</span>,
    },
    {
      key: '_actions',
      header: '',
      width: '48px',
      align: 'right',
      render: (l) => (
        <button
          type="button"
          onClick={() => setDetail(l)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          title="View learner details"
        >
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <SectionCard bleed>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No learners match your search.</p>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </SectionCard>

      {/* Learner details — floating card, same approach as the Users tab window */}
      {detail && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDetail(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-[340px] max-h-[85vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <div className="flex justify-end pt-3 pr-3">
                <button
                  onClick={() => setDetail(null)}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Avatar + identity */}
              <div className="flex flex-col items-center px-6 pb-4">
                <span className="w-[52px] h-[52px] rounded-full bg-gray-100 text-gray-500 text-base font-semibold flex items-center justify-center">
                  {initials(detail.name)}
                </span>
                <span className="mt-3 text-base font-semibold text-gray-800">{detail.name}</span>
                <span className="text-xs text-gray-400">@{detail.username}</span>
                <span className="text-sm text-gray-500 mt-0.5">{detail.email}</span>
              </div>

              {/* Info rows */}
              <div className="px-6 pb-4 space-y-3">
                <Row label="Role">{detail.role}</Row>
                <Row label="Status">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${detail.verified ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {detail.verified ? 'Verified' : 'Unverified'}
                  </span>
                </Row>
                <Row label="Joined">{detail.joined}</Row>
                <Row label="Last active">{detail.lastActive}</Row>
              </div>

              {/* Course completion per course */}
              <div className="px-6 pb-6 space-y-2.5">
                <span className="text-xs text-gray-400 block">Courses</span>
                {detail.enrollments.map((c) => (
                  <div key={c.name} className="flex justify-between items-center gap-4">
                    <span className="text-sm text-gray-700 truncate">{c.name}</span>
                    <span className="text-sm text-gray-400 tabular-nums shrink-0">{c.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
