import {
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  Globe,
  GraduationCap,
  Key,
  Languages,
  LineChart,
  Link2,
  ListMusic,
  Lock,
  Megaphone,
  MessagesSquare,
  Mic,
  Palette,
  Pencil,
  Plus,
  Rss,
  SaveAllIcon,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
  UsersRound,
  X,
  Zap,
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

/**
 * SectionIcon — one icon per dashboard section, from the same library (lucide).
 *
 * The settings tab bars had drifted: the "General" tab alone was drawn with
 * three different icons (`TextIcon`, `Settings`, `Info`) depending on the area,
 * and two different sections could share the same glyph. Import from here so a
 * section always looks the same wherever it appears.
 *
 * @example
 * import { SectionIcon } from '@/components/ui/icons'
 * { id: 'general', label: 'General', icon: SectionIcon.general }
 *
 * If a section is missing, add it here rather than importing a one-off icon.
 */
export const SectionIcon = {
  general: Settings,
  content: BookOpen,
  access: Lock,
  contributors: Users,
  seo: Search,
  translations: Languages,
  certification: Award,
  analytics: BarChart3,
  domains: Globe,
  branding: Palette,
  automations: Zap,
  api: Key,
  moderation: Shield,
  linkedCourse: Link2,
  episodes: ListMusic,
  distribution: Rss,
  notifications: Bell,
  announcements: Megaphone,
  users: Users,
  userGroups: UsersRound,
  roles: ShieldCheck,
  signups: Ticket,
  auditLogs: ScrollText,
  overview: LineChart,
  learning: GraduationCap,
  audience: Globe,
  learners: UserCheck,
  courses: BookOpen,
  podcasts: Mic,
  community: MessagesSquare,
} as const

export type SectionName = keyof typeof SectionIcon
