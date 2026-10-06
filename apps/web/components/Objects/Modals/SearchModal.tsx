'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Command } from 'cmdk'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  House,
  BookOpen,
  Users,
  Headphones,
  ShoppingCart,
  Route,
  MagnifyingGlass,
  Stack,
} from '@phosphor-icons/react'

import { getUriWithOrg } from '@services/config/config'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useDebounce } from '@/hooks/useDebounce'
import { searchOrgContent } from '@services/search/search'
import { normalizeForSearch } from '@/lib/search/normalize'
import { removeCoursePrefix } from '@components/Objects/Thumbnails/CourseThumbnail'
import type { SearchMeta } from '@/lib/dashboard-search/types'
import useSWR from 'swr'

interface SearchModalProps {
  open: boolean
  onClose: () => void
  orgslug: string
}

interface ContentResult {
  id: string
  type: 'course' | 'collection'
  title: string
  subtitle?: string
  href: string
}

const userPages: SearchMeta[] = [
  {
    id: 'user.home',
    titleKey: 'Home',
    descriptionKey: 'Organization home page',
    icon: House,
    href: '',
    group: 'navigation',
  },
  {
    id: 'user.courses',
    titleKey: 'Courses',
    descriptionKey: 'Browse courses',
    icon: BookOpen,
    href: '/courses',
    group: 'navigation',
  },
  {
    id: 'user.communities',
    titleKey: 'Communities',
    descriptionKey: 'Browse communities',
    icon: Users,
    href: '/communities',
    group: 'navigation',
  },
  {
    id: 'user.podcasts',
    titleKey: 'Podcasts',
    descriptionKey: 'Browse podcasts',
    icon: Headphones,
    href: '/podcasts',
    group: 'navigation',
  },
  {
    id: 'user.store',
    titleKey: 'Store',
    descriptionKey: 'Browse store',
    icon: ShoppingCart,
    href: '/store',
    group: 'navigation',
  },
  {
    id: 'user.trail',
    titleKey: 'Trail',
    descriptionKey: 'Your learning progress',
    icon: Route,
    href: '/trail',
    group: 'navigation',
  },
]

export function SearchModal({ open, onClose, orgslug }: SearchModalProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  // Reset state when modal closes
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const onSelect = (href: string) => {
    onClose()
    router.push(href)
  }

  const openSelectedInNewTab = (rootEl: HTMLElement | null) => {
    const selected = rootEl?.querySelector(
      '[cmdk-item][aria-selected="true"]',
    ) as HTMLElement | null
    const href = selected?.getAttribute('data-href')
    if (!href) return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  // Content search via SWR
  const trimmed = debouncedQuery.trim()
  const searchEnabled = trimmed.length >= 2 && !!orgslug

  const { data: contentResults, isLoading } = useSWR(
    searchEnabled ? ['user-search', orgslug, trimmed, accessToken ?? null] : null,
    async () => {
      const res = await searchOrgContent(orgslug, trimmed, 1, 5, null, accessToken)
      if (!res?.success || !res?.data) return []
      const data = res.data as any
      const results: ContentResult[] = []

      for (const c of data.courses ?? []) {
        results.push({
          id: c.course_uuid,
          type: 'course',
          title: c.name,
          subtitle: c.description ?? undefined,
          href: getUriWithOrg(orgslug, `/course/${removeCoursePrefix(c.course_uuid)}`),
        })
      }
      for (const col of data.collections ?? []) {
        results.push({
          id: col.collection_uuid,
          type: 'collection',
          title: col.name,
          subtitle: col.description ?? undefined,
          href: getUriWithOrg(orgslug, `/collection/${col.collection_uuid}`),
        })
      }

      return results
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 1500,
    },
  )

  const isWaiting = query.trim().length >= 2 && trimmed !== query.trim()

  const renderPageItem = (p: SearchMeta) => {
    const title = t(p.titleKey)
    const description = p.descriptionKey ? t(p.descriptionKey) : undefined
    const Icon = p.icon
    const href = p.href ? getUriWithOrg(orgslug, p.href) : getUriWithOrg(orgslug, '/')

    return (
      <Command.Item
        key={p.id}
        value={`${title} ${description ?? ''}`}
        onSelect={() => onSelect(href)}
        className="group/item flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-ui-fg-muted transition-colors aria-selected:bg-ui-bg-subtle-hover aria-selected:text-ui-fg-base"
        data-href={href}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ui-bg-subtle text-ui-fg-muted group-aria-selected/item:bg-ui-bg-base">
          <Icon size={14} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="truncate text-[13px] font-medium text-ui-fg-base">
            {title}
          </span>
          {description ? (
            <span className="truncate text-[12px] text-ui-fg-muted">{description}</span>
          ) : null}
        </span>
        <span className="hidden text-ui-fg-muted/40 group-aria-selected/item:inline text-[11px] font-medium">Open</span>
      </Command.Item>
    )
  }

  const renderContentItem = (r: ContentResult) => {
    const Icon = r.type === 'course' ? BookOpen : Stack
    return (
      <Command.Item
        key={`${r.type}-${r.id}`}
        value={`${r.title} ${r.subtitle ?? ''}`}
        onSelect={() => onSelect(r.href)}
        className="group/item flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-ui-fg-muted transition-colors aria-selected:bg-ui-bg-subtle-hover aria-selected:text-ui-fg-base"
        data-href={r.href}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ui-bg-subtle text-ui-fg-muted group-aria-selected/item:bg-ui-bg-base">
          <Icon size={14} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="truncate text-[13px] font-medium text-ui-fg-base">
            {r.title}
          </span>
          {r.subtitle ? (
            <span className="truncate text-[12px] text-ui-fg-muted">{r.subtitle}</span>
          ) : null}
        </span>
        <span className="hidden text-ui-fg-muted/40 group-aria-selected/item:inline text-[11px] font-medium">Open</span>
      </Command.Item>
    )
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-150 data-[state=closed]:duration-100 ease-out"
          style={{ zIndex: 'var(--z-modal-backdrop)' as any }}
        />
        <DialogPrimitive.Content
          aria-label="Search"
          className="fixed left-1/2 top-[12%] flex w-[94vw] max-w-[640px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 data-[state=open]:duration-150 data-[state=closed]:duration-100 ease-out"
          style={{ zIndex: 'var(--z-modal)' as any }}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            const input = (e.currentTarget as HTMLElement).querySelector('input')
            if (input) (input as HTMLInputElement).focus()
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>

          <Command
            label="Search"
            shouldFilter={true}
            filter={(value: string, search: string) => {
              const haystack = normalizeForSearch(value)
              const needle = normalizeForSearch(search)
              if (!needle) return 1
              if (haystack.includes(needle)) return 1
              const tokens = needle.split(/\s+/u).filter(Boolean)
              return tokens.every((tok: string) => haystack.includes(tok)) ? 0.8 : 0
            }}
            className="flex flex-col [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ui-fg-muted/50"
          >
            {/* Header with search input */}
            <div className="flex items-center gap-3 px-4 py-3">
              <MagnifyingGlass size={16} className="shrink-0 text-ui-fg-muted/50" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, courses..."
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    const root = (e.currentTarget as HTMLElement).closest(
                      '[cmdk-root]',
                    ) as HTMLElement | null
                    openSelectedInNewTab(root)
                  }
                }}
                className="w-full bg-transparent text-[15px] font-normal leading-tight tracking-tight text-ui-fg-base outline-none placeholder:text-ui-fg-muted/50"
              />
              {(isLoading || isWaiting) && (
                <span className="shrink-0 text-[11px] text-ui-fg-muted/50">Loading</span>
              )}
              <kbd className="hidden sm:inline-flex h-[20px] items-center rounded-md border border-ui-border-base bg-ui-bg-field px-1.5 font-sans text-[11px] font-medium leading-none text-ui-fg-muted shadow-sm">
                Esc
              </kbd>
            </div>

            {/* List — no dividers */}
            <Command.List
              className="min-h-[200px] max-h-[55vh] overflow-y-auto px-2 pb-3 scroll-py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ui-border-base hover:[&::-webkit-scrollbar-thumb]:bg-ui-border-hover"
              style={{ scrollbarColor: 'rgba(0,0,0,0.12) transparent', scrollbarWidth: 'thin' }}
            >
              <Command.Empty className="px-4 py-12 text-center text-sm text-ui-fg-muted/60">
                {isLoading || isWaiting ? 'Loading...' : 'No results found'}
              </Command.Empty>

              <Command.Group heading="Pages">
                {userPages.map(renderPageItem)}
              </Command.Group>

              {contentResults && contentResults.length > 0 && (
                <Command.Group heading="Content">
                  {contentResults.map(renderContentItem)}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer — minimal, no border */}
            <div className="flex items-center gap-4 px-4 py-2.5 text-[11px] text-ui-fg-muted/40">
              <span className="inline-flex items-center gap-1">
                <span>Navigate</span>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-ui-border-base bg-ui-bg-field px-1 font-sans text-[10px] font-medium leading-none text-ui-fg-muted/60">↑</kbd>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-ui-border-base bg-ui-bg-field px-1 font-sans text-[10px] font-medium leading-none text-ui-fg-muted/60">↓</kbd>
              </span>
              <span className="inline-flex items-center gap-1">
                <span>Open</span>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-ui-border-base bg-ui-bg-field px-1 font-sans text-[10px] font-medium leading-none text-ui-fg-muted/60">↵</kbd>
              </span>
              <span className="inline-flex items-center gap-1">
                <span>New tab</span>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-ui-border-base bg-ui-bg-field px-1 font-sans text-[10px] font-medium leading-none text-ui-fg-muted/60">⌘</kbd>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-ui-border-base bg-ui-bg-field px-1 font-sans text-[10px] font-medium leading-none text-ui-fg-muted/60">↵</kbd>
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
