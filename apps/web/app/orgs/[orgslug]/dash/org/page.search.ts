import {
  Buildings,
  Palette,
  Compass,
  Globe,
  Lightning,
  Key,
} from '@phosphor-icons/react'
import type { SearchMeta } from '@/lib/dashboard-search/types'

/**
 * Searchable org-settings sub-pages.
 *
 * IMPORTANT: every entry here must correspond to a sub-page actually rendered by
 * `org/settings/[subpage]/page.tsx`. Entries for pages that don't render will
 * send the command palette to a blank screen.
 */
export const searchMetas: SearchMeta[] = [
  {
    id: 'dash.org.general',
    titleKey: 'dashboard.organization.settings.tabs.general',
    descriptionKey: 'dashboard.search.entries.org_general.description',
    keywordsKey: 'dashboard.search.entries.org_general.keywords',
    icon: Buildings,
    href: '/dash/org/settings/general',
    group: 'settings',
  },
  {
    id: 'dash.org.branding',
    titleKey: 'dashboard.organization.settings.tabs.branding',
    descriptionKey: 'dashboard.search.entries.org_branding.description',
    keywordsKey: 'dashboard.search.entries.org_branding.keywords',
    icon: Palette,
    href: '/dash/org/settings/branding',
    group: 'settings',
  },
  {
    id: 'dash.org.seo',
    titleKey: 'dashboard.organization.settings.tabs.seo',
    descriptionKey: 'dashboard.search.entries.org_seo.description',
    keywordsKey: 'dashboard.search.entries.org_seo.keywords',
    icon: Compass,
    href: '/dash/org/settings/seo',
    group: 'settings',
  },
  {
    id: 'dash.org.domains',
    titleKey: 'dashboard.organization.settings.tabs.domains',
    descriptionKey: 'dashboard.search.entries.org_domains.description',
    keywordsKey: 'dashboard.search.entries.org_domains.keywords',
    icon: Globe,
    href: '/dash/org/settings/domains',
    group: 'settings',
  },
  {
    id: 'dash.org.automations',
    titleKey: 'dashboard.organization.settings.tabs.automations',
    descriptionKey: 'dashboard.search.entries.org_automations.description',
    keywordsKey: 'dashboard.search.entries.org_automations.keywords',
    icon: Lightning,
    href: '/dash/org/settings/automations',
    group: 'settings',
  },
  {
    id: 'dash.org.api',
    titleKey: 'dashboard.organization.settings.tabs.api',
    descriptionKey: 'dashboard.search.entries.org_api.description',
    keywordsKey: 'dashboard.search.entries.org_api.keywords',
    icon: Key,
    href: '/dash/org/settings/api',
    group: 'settings',
  },
]
