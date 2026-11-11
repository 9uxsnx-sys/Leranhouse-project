'use client'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { SectionRow } from './SectionRow'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { PodcastCard } from '@components/Objects/Thumbnails/PodcastCard'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import useSWR from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import { getAPIUrl } from '@services/config/config'

interface OrgHomeClientProps {
  orgslug: string
  courses: any[]
  podcasts: any[]
  trendingCourses: any[]
  trendingPodcasts: any[]
}

const removeCoursePrefix = (uuid: string) => uuid.replace('course_', '')
const removePodcastPrefix = (uuid: string) => uuid.replace('podcast_', '')

export function OrgHomeClient({
  orgslug,
  courses,
  podcasts,
  trendingCourses,
  trendingPodcasts,
}: OrgHomeClientProps) {
  const { t, i18n } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  // SWR: re-fetch courses and podcasts when locale changes on the client
  const contentLocale = (i18n.language || 'en').split('-')[0]
  const { data: swrCourses, mutate: mutateCourses } = useSWR(
    `${getAPIUrl()}courses/org_slug/${orgslug}/page/1/limit/100?locale=${contentLocale}`,
    (url: string) => swrFetcher(url, access_token),
    { fallbackData: courses, revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  const { data: swrPodcasts, mutate: mutatePodcasts } = useSWR(
    `${getAPIUrl()}podcasts/org_slug/${orgslug}/page/1/limit/100?locale=${contentLocale}`,
    (url: string) => swrFetcher(url, access_token),
    { fallbackData: podcasts, revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  // Force re-fetch when locale changes
  useEffect(() => {
    if (contentLocale) {
      mutateCourses()
      mutatePodcasts()
    }
  }, [contentLocale, mutateCourses, mutatePodcasts])

  const resolvedCourses = swrCourses || courses
  const resolvedPodcasts = swrPodcasts || podcasts

  return (
    <div className="w-full px-6 pt-8 pb-0 space-y-10">

      {/* Trending Courses */}
      {trendingCourses.length > 0 && (
        <SectionRow
          title={t('home.trending_courses', { defaultValue: 'Trending Courses' })}
          seeAllHref="/courses"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {trendingCourses.slice(0, 4).map((course: any) => {
            const imageUrl = course.thumbnail_image
              ? getCourseThumbnailMediaDirectory(org?.org_uuid, course.course_uuid, course.thumbnail_image)
              : ''
            return (
              <CourseCard
                key={course.course_uuid}
                id={removeCoursePrefix(course.course_uuid)}
                title={course.name}
                description={course.description || ''}
                image={imageUrl}
                lessons={course.extra_metadata?.lessons_count}
                lessonsLabel={t('collections.lessons')}
                duration={course.extra_metadata?.duration || ''}
                difficulty={course.extra_metadata?.difficulty || ''}
              />
            )
          })}
        </SectionRow>
      )}

      {/* Trending Podcasts */}
      {trendingPodcasts.length > 0 && (
        <SectionRow
          title={t('home.trending_podcasts', { defaultValue: 'Trending Podcasts' })}
          seeAllHref="/podcasts"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {trendingPodcasts.slice(0, 4).map((podcast: any) => (
            <PodcastCard
              key={podcast.podcast_uuid}
              id={removePodcastPrefix(podcast.podcast_uuid)}
              title={podcast.name}
              description={podcast.description || ''}
              thumbnailImage={podcast.thumbnail_image || ''}
              episodeCount={podcast.extra_metadata?.episode_count || podcast.episode_count || 0}
              totalDurationSeconds={podcast.extra_metadata?.total_duration_seconds || podcast.total_duration_seconds || 0}
              creationDate={podcast.creation_date}
              org_uuid={org?.org_uuid}
            />
          ))}
        </SectionRow>
      )}

      {/* New Courses */}
      {resolvedCourses.length > 0 && (
        <SectionRow
          title={t('home.new_courses', { defaultValue: 'New Courses' })}
          seeAllHref="/courses"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {resolvedCourses.slice(0, 4).map((course: any) => {
            const imageUrl = course.thumbnail_image
              ? getCourseThumbnailMediaDirectory(org?.org_uuid, course.course_uuid, course.thumbnail_image)
              : ''
            return (
              <CourseCard
                key={course.course_uuid}
                id={removeCoursePrefix(course.course_uuid)}
                title={course.name}
                description={course.description || ''}
                image={imageUrl}
                lessons={course.extra_metadata?.lessons_count}
                lessonsLabel={t('collections.lessons')}
                duration={course.extra_metadata?.duration || ''}
                difficulty={course.extra_metadata?.difficulty || ''}
              />
            )
          })}
        </SectionRow>
      )}

      {/* New Podcasts */}
      {resolvedPodcasts.length > 0 && (
        <SectionRow
          title={t('home.new_podcasts', { defaultValue: 'New Podcasts' })}
          seeAllHref="/podcasts"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {resolvedPodcasts.slice(0, 4).map((podcast: any) => (
            <PodcastCard
              key={podcast.podcast_uuid}
              id={removePodcastPrefix(podcast.podcast_uuid)}
              title={podcast.name}
              description={podcast.description || ''}
              thumbnailImage={podcast.thumbnail_image || ''}
              episodeCount={podcast.extra_metadata?.episode_count || podcast.episode_count || 0}
              totalDurationSeconds={podcast.extra_metadata?.total_duration_seconds || podcast.total_duration_seconds || 0}
              creationDate={podcast.creation_date}
              org_uuid={org?.org_uuid}
            />
          ))}
        </SectionRow>
      )}

      {/* Empty state */}
      {resolvedCourses.length === 0 && resolvedPodcasts.length === 0 && trendingCourses.length === 0 && trendingPodcasts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-400 text-sm">
            {t('home.no_content', { defaultValue: 'No content available yet' })}
          </p>
        </div>
      )}
    </div>
  )
}
