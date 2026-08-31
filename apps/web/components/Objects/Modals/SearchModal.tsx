'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlass,
  XMark,
  Book,
  FolderOpen,
} from '@components/Objects/Icons/MedusaIcons'
import { Text } from '@components/ui/text'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useDebounce } from '@/hooks/useDebounce'
import { searchOrgContent } from '@services/search/search'
import { getUriWithOrg } from '@services/config/config'
import { removeCoursePrefix } from '@components/Objects/Thumbnails/CourseThumbnail'

interface SearchModalProps {
  open: boolean
  onClose: () => void
  orgslug: string
}

interface CourseResult {
  course_uuid: string
  name: string
  description: string
  thumbnail_image: string
}

interface CollectionResult {
  collection_uuid: string
  name: string
  description: string
}

interface SearchApiResponse {
  courses: CourseResult[]
  collections: CollectionResult[]
  total_courses: number
  total_collections: number
}

const ResultsSkeleton = () => (
  <div className="px-3 py-4 space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-3 w-20 bg-ui-bg-subtle-hover rounded animate-pulse" />
        <div className="h-4 w-full bg-ui-bg-subtle-hover rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-ui-bg-subtle-hover rounded animate-pulse" />
      </div>
    ))}
  </div>
)

export function SearchModal({ open, onClose, orgslug }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ courses: CourseResult[]; collections: CollectionResult[] }>({ courses: [], collections: [] })
  const [isLoading, setIsLoading] = useState(false)
  const session = useLHSession() as any
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setResults({ courses: [], collections: [] })
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length === 0) {
        setResults({ courses: [], collections: [] })
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await searchOrgContent(
          orgslug,
          debouncedQuery,
          1,
          5,
          null,
          session?.data?.tokens?.access_token
        )

        const data = response.data as SearchApiResponse

        setResults({
          courses: Array.isArray(data?.courses) ? data.courses : [],
          collections: Array.isArray(data?.collections) ? data.collections : [],
        })
      } catch (error) {
        console.error('Error searching content:', error)
        setResults({ courses: [], collections: [] })
      }
      setIsLoading(false)
    }

    fetchResults()
  }, [debouncedQuery, orgslug, session?.data?.tokens?.access_token])

  if (!open) return null

  const hasResults = results.courses.length > 0 || results.collections.length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="bg-ui-bg-base shadow-elevation-modal dark:shadow-elevation-modal-dark w-full max-w-2xl rounded-xl mx-4 flex flex-col max-h-[60vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-x-3 border-b border-ui-border-base px-4 py-3 shrink-0">
          <MagnifyingGlass className="h-4 w-4 shrink-0 text-ui-fg-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search courses, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[16px] text-ui-fg-base outline-none placeholder:text-ui-fg-muted"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex size-6 items-center justify-center rounded-md text-ui-fg-muted hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base"
            >
              <XMark className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-1 py-1">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12">
              <Text size="small" weight="plus" className="text-ui-fg-muted">
                Type to search...
              </Text>
            </div>
          )}

          {query && isLoading && <ResultsSkeleton />}

          {query && !isLoading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-12">
              <Text size="small" weight="plus" className="text-ui-fg-muted">
                No results found
              </Text>
            </div>
          )}

          {query && !isLoading && hasResults && (
            <div className="flex flex-col">
              {/* Courses */}
              {results.courses.length > 0 && (
                <div>
                  <div className="flex items-center gap-x-2 px-3 pt-3 pb-1">
                    <Book className="h-3.5 w-3.5 text-ui-fg-muted" />
                    <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                      Courses
                    </Text>
                  </div>
                  {results.courses.map((course) => (
                    <Link
                      key={course.course_uuid}
                      href={getUriWithOrg(orgslug, `/course/${removeCoursePrefix(course.course_uuid)}`)}
                      onClick={onClose}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-ui-bg-subtle-hover transition-fg block"
                    >
                      <Text size="small" weight="plus" className="text-ui-fg-base">
                        {course.name}
                      </Text>
                      <Text size="xsmall" className="text-ui-fg-muted mt-0.5 line-clamp-1">
                        {course.description}
                      </Text>
                    </Link>
                  ))}
                </div>
              )}

              {/* Collections */}
              {results.collections.length > 0 && (
                <div>
                  <div className="flex items-center gap-x-2 px-3 pt-3 pb-1">
                    <FolderOpen className="h-3.5 w-3.5 text-ui-fg-muted" />
                    <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                      Collections
                    </Text>
                  </div>
                  {results.collections.map((collection) => (
                    <Link
                      key={collection.collection_uuid}
                      href={getUriWithOrg(orgslug, `/collection/${collection.collection_uuid}`)}
                      onClick={onClose}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-ui-bg-subtle-hover transition-fg block"
                    >
                      <Text size="small" weight="plus" className="text-ui-fg-base">
                        {collection.name}
                      </Text>
                      <Text size="xsmall" className="text-ui-fg-muted mt-0.5 line-clamp-1">
                        {collection.description}
                      </Text>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {query && !isLoading && hasResults && (
          <div className="flex items-center gap-x-4 border-t border-ui-border-base px-4 py-2 shrink-0">
            <div className="flex items-center gap-x-1.5">
              <kbd className="inline-flex h-5 items-center rounded-sm border border-ui-border-base bg-ui-bg-subtle px-1.5 text-[11px] text-ui-fg-muted">↑</kbd>
              <kbd className="inline-flex h-5 items-center rounded-sm border border-ui-border-base bg-ui-bg-subtle px-1.5 text-[11px] text-ui-fg-muted">↓</kbd>
              <Text size="xsmall" className="text-ui-fg-muted">Navigate</Text>
            </div>
            <div className="flex items-center gap-x-1.5">
              <kbd className="inline-flex h-5 items-center rounded-sm border border-ui-border-base bg-ui-bg-subtle px-1.5 text-[11px] text-ui-fg-muted">↵</kbd>
              <Text size="xsmall" className="text-ui-fg-muted">Open</Text>
            </div>
            <div className="flex items-center gap-x-1.5">
              <kbd className="inline-flex h-5 items-center rounded-sm border border-ui-border-base bg-ui-bg-subtle px-1.5 text-[11px] text-ui-fg-muted">Esc</kbd>
              <Text size="xsmall" className="text-ui-fg-muted">Close</Text>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
