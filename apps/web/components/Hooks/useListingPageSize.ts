'use client'
import { useMediaQuery } from 'usehooks-ts'

/**
 * Page size follows the card grid so a page never ends on a half row:
 * 4-up (>=1536) -> 8 (two rows), 3-up (1024-1535) -> 12 (four rows),
 * 2-up (640-1023) -> 8 (four rows), 1-up (<640) -> 6.
 *
 * The thresholds mirror the listing grids' own Tailwind classes. Reading them
 * from the media queries (rather than duplicating the numbers in JS) keeps the
 * two in sync when the grid changes.
 *
 * `initializeWithValue: false` keeps the server and the first client render
 * identical; the layout effect inside `useMediaQuery` resolves the real width
 * before paint, so a wide screen never flashes the narrow page size.
 */
export function useListingPageSize() {
  const is2xl = useMediaQuery('(min-width: 1536px)', { initializeWithValue: false })
  const isLg = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false })
  const isSm = useMediaQuery('(min-width: 640px)', { initializeWithValue: false })

  if (is2xl) return 8
  if (isLg) return 12
  if (isSm) return 8
  return 6
}
