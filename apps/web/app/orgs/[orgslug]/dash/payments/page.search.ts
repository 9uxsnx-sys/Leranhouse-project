import {
  CurrencyCircleDollar,
  Tag,
  Gear,
} from '@phosphor-icons/react'
import type { SearchMeta } from '@/lib/dashboard-search/types'

export const searchMetas: SearchMeta[] = [
  {
    id: 'dash.payments.overview',
    titleKey: 'dashboard.search.entries.payments_overview.title',
    descriptionKey: 'dashboard.search.entries.payments_overview.description',
    keywordsKey: 'dashboard.search.entries.payments_overview.keywords',
    icon: CurrencyCircleDollar,
    href: '/dash/payments/overview',
    group: 'payments',
    featureKey: 'payments',
  },
  {
    id: 'dash.payments.offers',
    titleKey: 'dashboard.search.entries.payments_products.title',
    descriptionKey: 'dashboard.search.entries.payments_products.description',
    keywordsKey: 'dashboard.search.entries.payments_products.keywords',
    icon: Tag,
    href: '/dash/payments/offers',
    group: 'payments',
    featureKey: 'payments',
  },
  {
    id: 'dash.payments.configuration',
    titleKey: 'dashboard.search.entries.payments_configuration.title',
    descriptionKey: 'dashboard.search.entries.payments_configuration.description',
    keywordsKey: 'dashboard.search.entries.payments_configuration.keywords',
    icon: Gear,
    href: '/dash/payments/configuration',
    group: 'payments',
    featureKey: 'payments',
  },
]
