import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPodcastMeta, PodcastMeta } from '@services/podcasts/podcasts'
import { getEpisode } from '@services/podcasts/episodes'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getPodcastThumbnailMediaDirectory, getOrgOgImageMediaDirectory } from '@services/media/media'
import { getServerSession } from '@/lib/auth/server'
import { localeCode } from '@/lib/direction'
import { getCanonicalUrl, getOrgSeoConfig, buildPageTitle, buildBreadcrumbJsonLd } from '@/lib/seo/utils'
import { getServerCanonicalUrl } from '@/lib/seo/utils.server'
import { JsonLd } from '@components/SEO/JsonLd'
import EpisodeClient from './episode'

type PageParams = Promise<{
  orgslug: string
  podcastuuid: string
  episodeid: string
}>

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const { orgslug, podcastuuid, episodeid } = await params
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token
  const cookieStore = await cookies()
  const locale = localeCode(cookieStore.get('i18next')?.value) || 'en'

  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  let podcastMeta: PodcastMeta | null = null
  let episodeData: any = null
  try {
    ;[podcastMeta, episodeData] = await Promise.all([
      getPodcastMeta(
        `podcast_${podcastuuid}`,
        { revalidate: 120, tags: ['podcasts'] },
        access_token,
        locale
      ),
      getEpisode(
        `episode_${episodeid}`,
        { revalidate: 120, tags: ['podcasts'] },
        access_token,
        locale
      ),
    ])
  } catch (error) {
    console.error('Error fetching episode metadata:', error)
  }

  const seoConfig = getOrgSeoConfig(org)
  const episodeTitle = episodeData?.title || 'Episode'
  const podcastName = podcastMeta?.podcast?.name || 'Podcast'
  const title = buildPageTitle(`${episodeTitle} — ${podcastName}`, org?.name || 'Organization', seoConfig)
  const description = episodeData?.description || podcastMeta?.podcast?.description || seoConfig.default_meta_description || ''
  const ogImageUrl = seoConfig.default_og_image
    ? getOrgOgImageMediaDirectory(org?.org_uuid, seoConfig.default_og_image)
    : undefined
  const imageUrl = podcastMeta?.podcast?.thumbnail_image
    ? getPodcastThumbnailMediaDirectory(
        org?.org_uuid,
        `podcast_${podcastuuid}`,
        podcastMeta.podcast.thumbnail_image
      )
    : ogImageUrl
  const canonical = await getServerCanonicalUrl(orgslug, `/podcast/${podcastuuid}/episode/${episodeid}`)

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: episodeTitle,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
      ...(seoConfig.twitter_handle && { site: seoConfig.twitter_handle }),
    },
  }
}

export default async function EpisodePage({ params }: { params: PageParams }) {
  const { orgslug, podcastuuid, episodeid } = await params
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token
  const cookieStore = await cookies()
  const locale = localeCode(cookieStore.get('i18next')?.value) || 'en'

  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  let podcastMeta: PodcastMeta | null = null
  let episodeData: any = null
  let fetchError: { status?: number } | null = null

  try {
    ;[podcastMeta, episodeData] = await Promise.all([
      getPodcastMeta(
        `podcast_${podcastuuid}`,
        { revalidate: 120, tags: ['podcasts'] },
        access_token,
        locale
      ),
      getEpisode(
        `episode_${episodeid}`,
        { revalidate: 120, tags: ['podcasts'] },
        access_token,
        locale
      ),
    ])
  } catch (error: any) {
    fetchError = { status: error?.status }
    console.error('Error fetching episode:', error)
  }

  if (!podcastMeta || !episodeData) {
    if (!fetchError || !access_token) {
      notFound()
    }
    return (
      <EpisodeClient
        orgslug={orgslug}
        org_id={org?.id || 0}
        podcastUuid={`podcast_${podcastuuid}`}
        episodeId={`episode_${episodeid}`}
        initialPodcast={null as any}
        initialEpisodes={[]}
        initialEpisode={null as any}
        denied
      />
    )
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: await getServerCanonicalUrl(orgslug, '/') },
    { name: 'Podcasts', url: await getServerCanonicalUrl(orgslug, '/podcasts') },
    { name: podcastMeta.podcast.name, url: await getServerCanonicalUrl(orgslug, `/podcast/${podcastuuid}`) },
    { name: episodeData.title, url: await getServerCanonicalUrl(orgslug, `/podcast/${podcastuuid}/episode/${episodeid}`) },
  ])

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <EpisodeClient
        orgslug={orgslug}
        org_id={org?.id || 0}
        podcastUuid={`podcast_${podcastuuid}`}
        episodeId={`episode_${episodeid}`}
        initialPodcast={podcastMeta.podcast}
        initialEpisodes={podcastMeta.episodes}
        initialEpisode={episodeData}
      />
    </>
  )
}
