import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getOrgThumbnailMediaDirectory, getOrgOgImageMediaDirectory } from '@services/media/media'
import { getOrgSeoConfig, buildPageTitle, buildBreadcrumbJsonLd } from '@/lib/seo/utils'
import { getServerCanonicalUrl } from '@/lib/seo/utils.server'
import { JsonLd } from '@components/SEO/JsonLd'
import { getServerSession } from '@/lib/auth/server'
import { getOrgCourses } from '@services/courses/courses'
import { getOrgPodcasts } from '@services/podcasts/podcasts'
import { getOrgCollections } from '@services/courses/collections'
import { localeCode } from '@/lib/direction'
import Store from './store'
import type { StoreProduct } from './store'

type PageParams = Promise<{ orgslug: string }>

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { orgslug } = await params
  const org = await getOrganizationContextInfo(orgslug, { revalidate: 120, tags: ['organizations'] })
  const seoConfig = getOrgSeoConfig(org)
  const ogImageUrl = seoConfig.default_og_image
    ? getOrgOgImageMediaDirectory(org?.org_uuid, seoConfig.default_og_image)
    : null
  const imageUrl = ogImageUrl || (org ? getOrgThumbnailMediaDirectory(org.org_uuid, org.thumbnail_image) : undefined)
  const title = buildPageTitle('Store', org?.name || 'Organization', seoConfig)
  const description = `Browse offers and subscriptions from ${org?.name || 'this organization'}`
  const canonical = await getServerCanonicalUrl(orgslug, '/store')

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl, width: 800, height: 600, alt: org?.name || 'Store' }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

function isPurchasable(resource: any): boolean {
  return (
    resource?.access_type === 'paid' &&
    resource?.published === true &&
    typeof resource?.price_amount === 'number' &&
    resource.price_amount > 0
  )
}

function toProduct(kind: StoreProduct['kind'], resource: any, uuidKey: string): StoreProduct {
  return {
    key: `${kind}:${resource[uuidKey]}`,
    kind,
    resource_uuid: resource[uuidKey],
    name: resource.name || '',
    description: resource.description || '',
    thumbnail_image: resource.thumbnail_image || '',
    price_amount: resource.price_amount,
    price_currency: resource.price_currency || 'DZD',
  }
}

/**
 * The store is the learner-facing shop window: it lists the paid, published
 * courses, podcasts and collections of the organization. Buying happens on the
 * resource page itself ("Get access" → Chargily checkout), so every card links
 * back to that product page.
 */
export default async function StorePage({ params }: { params: PageParams }) {
  const { orgslug } = await params
  const org = await getOrganizationContextInfo(orgslug, { revalidate: 120, tags: ['organizations'] })

  const paymentsEnabled = org?.config?.config?.resolved_features?.payments?.enabled ?? org?.config?.config?.features?.payments?.enabled !== false

  if (!paymentsEnabled) {
    return <Store orgslug={orgslug} products={[]} enabled={false} />
  }

  const session = await getServerSession()
  const access_token = session?.tokens?.access_token
  const cookieStore = await cookies()
  const locale = localeCode(cookieStore.get('i18next')?.value) || 'en'

  const [courses, podcasts, collections] = await Promise.all([
    getOrgCourses(orgslug, { revalidate: 120, tags: ['courses'] }, access_token, false, locale).catch(() => []),
    getOrgPodcasts(orgslug, { revalidate: 120, tags: ['podcasts'] }, access_token, false, locale).catch(() => []),
    getOrgCollections(String(org.id), access_token, { revalidate: 120, tags: ['collections'] }, locale).catch(() => []),
  ])

  const products: StoreProduct[] = [
    ...(Array.isArray(courses) ? courses.filter(isPurchasable).map((course: any) => toProduct('course', course, 'course_uuid')) : []),
    ...(Array.isArray(podcasts) ? podcasts.filter(isPurchasable).map((podcast: any) => toProduct('podcast', podcast, 'podcast_uuid')) : []),
    ...(Array.isArray(collections) ? collections.filter(isPurchasable).map((collection: any) => toProduct('collection', collection, 'collection_uuid')) : []),
  ]

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: await getServerCanonicalUrl(orgslug, '/') },
    { name: 'Store', url: await getServerCanonicalUrl(orgslug, '/store') },
  ])

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Store orgslug={orgslug} products={products} />
    </>
  )
}
