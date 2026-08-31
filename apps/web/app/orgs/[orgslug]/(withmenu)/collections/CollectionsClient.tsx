'use client'
import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, BookCopy, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react'
import { CollectionCard } from '@components/Objects/Thumbnails/CollectionCard'
import { searchMatchesAny } from '@/lib/search/normalize'

// Medusa components
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface CollectionsClientProps {
  orgslug: string
  collections: any[]
  org_id: string | number
  org_uuid?: string
}

function CollectionsClient(props: CollectionsClientProps) {
  const { t } = useTranslation()
  const orgslug = props.orgslug
  const allCollections = props.collections
  const org_uuid = props.org_uuid

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    let collections = allCollections

    if (searchQuery.trim()) {
      collections = collections.filter((col: any) =>
        searchMatchesAny([col.name, col.description], searchQuery)
      )
    }

    return collections
  }, [allCollections, searchQuery])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage)
  const paginatedCollections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCollections.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCollections, currentPage, itemsPerPage])

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      {/* Page title */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('collections.collections') || 'Collections'}
      </h1>

      {/* Search + Filter toolbar (only if collections exist) */}
      {allCollections.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          {/* Search + results count group (left side) */}
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('collections.search_collections') || 'Search collections...'}
                className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {searchQuery && (
              <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                {filteredCollections.length} result{filteredCollections.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          {/* Spacer pushes filter to the right */}
          <div className="flex-1" />

          {/* Filter — Medusa IconButton + DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Filter collections">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-28">
              <DropdownMenuItem>All Collections</DropdownMenuItem>
              <DropdownMenuItem>Public</DropdownMenuItem>
              <DropdownMenuItem>Private</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Grid area */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCollections.map((collection: any) => (
            <CollectionCard
              key={collection.collection_uuid}
              id={collection.collection_uuid.replace('collection_', '')}
              title={collection.name}
              description={collection.description || ''}
              courses={collection.courses || []}
              org_uuid={org_uuid}
              public={collection.public || false}
              creation_date={collection.creation_date || collection.created_at || ''}
              href={`/orgs/${orgslug}/collection/${collection.collection_uuid.replace('collection_', '')}`}
            />
          ))}

          {/* Empty state — search with no results */}
          {filteredCollections.length === 0 && searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                No collections found
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                Try a different search term
              </p>
            </div>
          )}

          {/* Empty state — no collections at all */}
          {allCollections.length === 0 && !searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <FolderOpen className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
                No collections yet
              </h1>
              <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
                Collections will appear here once they are created
              </p>
            </div>
          )}
        </div>
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
            <span className="hidden sm:inline ml-1">Previous</span>
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
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default CollectionsClient
