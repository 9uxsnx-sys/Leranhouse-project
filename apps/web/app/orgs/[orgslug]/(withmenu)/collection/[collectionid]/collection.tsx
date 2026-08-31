'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookCopy } from 'lucide-react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getAPIUrl } from '@services/config/config'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import useSWR from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'

const removeCoursePrefix = (course_uuid: string) => course_uuid.replace('course_', '')

const CollectionClient = ({ orgslug, collectionid }: { orgslug: string; collectionid: string }) => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any

  const { data: col, error } = useSWR(
    collectionid && access_token ? [`collections/collection_${collectionid}`, access_token] : null,
    ([, token]) => swrFetcher(`${getAPIUrl()}collections/collection_${collectionid}`, token)
  )

  if (error) {
    return (
      <div className="pt-8 px-6 pb-0 flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
          <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
          {t('collections.not_found') || 'Collection not found'}
        </h2>
        <p className="txt-compact-small text-ui-fg-muted">
          {t('collections.not_found_description') || 'This collection might not exist or you may not have access to it'}
        </p>
      </div>
    )
  }

  if (!col) return <PageLoading />

  return (
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: '100dvh' }}>
      {/* Page title — collection name */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {col.name}
      </h1>

      {/* Grid area */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {col.courses?.map((course: any) => {
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
                lessons={0}
                duration="N/A"
                difficulty="All levels"
              />
            )
          })}

          {/* Empty state */}
          {(!col.courses || col.courses.length === 0) && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                {t('collections.no_courses') || 'No courses in this collection'}
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                {t('collections.no_courses_description') || 'Courses will appear here once they are added to the collection'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollectionClient
