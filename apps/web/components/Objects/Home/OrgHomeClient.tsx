'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { SectionRow } from './SectionRow'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { PodcastCard } from '@components/Objects/Thumbnails/PodcastCard'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'

interface OrgHomeClientProps {
  courses: any[]
  podcasts: any[]
  trendingCourses: any[]
  trendingPodcasts: any[]
}

const removeCoursePrefix = (uuid: string) => uuid.replace('course_', '')
const removePodcastPrefix = (uuid: string) => uuid.replace('podcast_', '')

export function OrgHomeClient({
  courses,
  podcasts,
  trendingCourses,
  trendingPodcasts,
}: OrgHomeClientProps) {
  const { t } = useTranslation()
  const org = useOrg() as any

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
      {courses.length > 0 && (
        <SectionRow
          title={t('home.new_courses', { defaultValue: 'New Courses' })}
          seeAllHref="/courses"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {courses.slice(0, 4).map((course: any) => {
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
                duration={course.extra_metadata?.duration || ''}
                difficulty={course.extra_metadata?.difficulty || ''}
              />
            )
          })}
        </SectionRow>
      )}

      {/* New Podcasts */}
      {podcasts.length > 0 && (
        <SectionRow
          title={t('home.new_podcasts', { defaultValue: 'New Podcasts' })}
          seeAllHref="/podcasts"
          seeAllLabel={t('home.see_all', { defaultValue: 'See All' })}
        >
          {podcasts.slice(0, 4).map((podcast: any) => (
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
      {courses.length === 0 && podcasts.length === 0 && trendingCourses.length === 0 && trendingPodcasts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-400 text-sm">
            {t('home.no_content', { defaultValue: 'No content available yet' })}
          </p>
        </div>
      )}
    </div>
  )
}
