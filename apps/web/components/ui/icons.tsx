import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  Pencil,
  Plus,
  SaveAllIcon,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'

/**
 * ConceptIcon — one icon per concept, from **one** library (lucide).
 *
 * The dashboard previously drew the same concept several different ways
 * (delete was `Trash2`, `Trash`, `XCircle` and `X`; edit had five different
 * glyphs; a second library, phosphor, was also in play). Import from here
 * instead of reaching for an icon directly, so a concept always looks the same:
 *
 * @example
 * import { ConceptIcon } from '@/components/ui/icons'
 * <ConceptIcon.delete size={16} />
 *
 * If a concept is missing, add it here rather than importing a one-off icon.
 */
export const ConceptIcon = {
  /** Create something new. Pair with a `New <Entity>` or `Add <Thing>` label. */
  add: Plus,
  /** Edit / change an existing thing. */
  edit: Pencil,
  /** Destructive removal. Use `close` only for clearing a field, not deleting a row. */
  delete: Trash2,
  /** Persist changes (the Save/Saved button states). */
  save: SaveAllIcon,
  /** Upload a file. */
  upload: UploadCloud,
  /** Search input affordance. */
  search: Search,
  /** Filter control. */
  filter: SlidersHorizontal,
  /** Open the settings for a thing. */
  settings: Settings,
  /** Navigate back / return to a parent. */
  back: ArrowLeft,
  /** Previous page or item. */
  previous: ChevronLeft,
  /** Open a dropdown. */
  expand: ChevronDown,
  /** Duplicate / copy an item. */
  duplicate: Copy,
  /** Download / export. */
  download: Download,
  /** Confirm / success. */
  check: Check,
  /** Close or clear. */
  close: X,
} as const

export type ConceptName = keyof typeof ConceptIcon
