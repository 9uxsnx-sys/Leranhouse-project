export const dynamic = 'force-dynamic'
import React from 'react'
import { getServerSession } from '@/lib/auth/server'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getOrgCourses } from '@services/courses/courses'
import { getOrgPodcasts } from '@services/podcasts/podcasts'
import { getOrgHomeTrending } from '@services/home/trending'
import { OrgHomeClient } from '@components/Objects/Home/OrgHomeClient'
import { cookies } from 'next/headers'
import { localeCode } from '@/lib/direction'

const OrgHomePage = async ({ params }: any) => {
  const orgslug = (await params).orgslug
  const session = await getServerSession()
  const access_token = session?.tokens?.access_token
  const cookieStore = await cookies()
  const locale = localeCode(cookieStore.get('i18next')?.value) || 'en'

  // Fetch org first so we have the id for trending
  const org = await getOrganizationContextInfo(orgslug, {
    revalidate: 120,
    tags: ['organizations'],
  })

  const [courses, podcasts, trending] = await Promise.all([
    getOrgCourses(
      orgslug,
      { revalidate: 120, tags: ['courses'] },
      access_token ?? undefined,
      false,
      locale
    ).catch(() => []),
    getOrgPodcasts(
      orgslug,
      { revalidate: 120, tags: ['podcasts'] },
      access_token ?? undefined,
      false,
      locale
    ).catch(() => []),
    getOrgHomeTrending(org?.id, access_token ?? undefined, 8, locale).catch(() => ({
      trending_courses: [],
      trending_podcasts: [],
    })),
  ])

  return (
    <OrgHomeClient
      orgslug={orgslug}
      courses={courses || []}
      podcasts={podcasts || []}
      trendingCourses={trending?.trending_courses || []}
      trendingPodcasts={trending?.trending_podcasts || []}
    />
  )
}

export default OrgHomePage
