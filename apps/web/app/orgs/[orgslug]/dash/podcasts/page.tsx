import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import React from 'react'
import { getServerSession } from '@/lib/auth/server'
import { localeCode } from '@/lib/direction'
import { getOrgPodcasts } from '@services/podcasts/podcasts'
import PodcastsDashClient from './client'

type MetadataProps = {
  params: Promise<{ orgslug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const params = await props.params
  const org = await getOrganizationContextInfo(params.orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  return {
    title: 'Podcasts — ' + org.name,
    description: `Manage podcasts for ${org.name}`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

async function PodcastsDashPage(params: any) {
  const orgslug = (await params.params).orgslug
  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token

  let podcasts = []
  try {
    const cookieStore = await cookies()
    const locale = localeCode(cookieStore.get('i18next')?.value) || 'en'
    podcasts = await getOrgPodcasts(
      orgslug,
      { revalidate: 0, tags: ['podcasts'] },
      access_token ? access_token : undefined,
      true, // include_unpublished for dashboard
      locale
    )
  } catch (error) {
    console.error('Failed to fetch podcasts:', error)
    podcasts = []
  }

  return (
    <PodcastsDashClient
      org_id={org.id}
      orgslug={orgslug}
      podcasts={podcasts || []}
    />
  )
}

export default PodcastsDashPage
