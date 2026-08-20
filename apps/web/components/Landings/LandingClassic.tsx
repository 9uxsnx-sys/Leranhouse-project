'use client'

import React from 'react'
import CourseThumbnail from '@components/Objects/Thumbnails/CourseThumbnail'
import CollectionThumbnail from '@components/Objects/Thumbnails/CollectionThumbnail'
import ContentPlaceHolderIfUserIsNotAdmin from '@components/Objects/ContentPlaceHolder'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import { ExclamationCircle, ArrowRightMini } from '@components/Objects/Icons/MedusaIcons'
import { Text } from '@components/ui/text'
import { Container } from '@components/ui/container'
import { Heading } from '@components/ui/heading'
import { Button } from '@components/ui/button'

interface LandingClassicProps {
  courses: any[]
  collections: any[]
  orgslug: string
  org_id: string | number
}

function LandingClassic({ courses, collections, orgslug, org_id }: LandingClassicProps) {
  const { t } = useTranslation()

  const displayedCourses = courses.slice(0, 12)
  const hasMoreCourses = courses.length > 12

  return (
    <div className="flex w-full flex-col gap-y-3">
      {/* Collections Section */}
      <Container>
        <div className="-mx-6 px-6 pb-3 mb-8 border-b border-gray-200">
          <Heading level="h2" className="!text-[22px]">{t('collections.collections')}</Heading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {collections.map((collection: any, index: number) => (
            <div key={collection.collection_id || index} className="flex flex-col">
              <CollectionThumbnail
                collection={collection}
                orgslug={orgslug}
                org_id={org_id}
              />
            </div>
          ))}
          {collections.length === 0 && (
            <div className="col-span-full flex h-[150px] w-full flex-col items-center justify-center gap-y-3">
              <ExclamationCircle className="h-6 w-6 text-gray-300" />
              <Text size="small" weight="plus" className="text-gray-600">
                {t('collections.no_collections')}
              </Text>
              <Text size="small" className="max-w-xs text-center text-gray-400">
                <ContentPlaceHolderIfUserIsNotAdmin
                  text={t('collections.create_collections_placeholder')}
                />
              </Text>
            </div>
          )}
        </div>
      </Container>

      {/* Courses Section */}
      <Container>
        <div className="-mx-6 px-6 pb-3 mb-8 border-b border-gray-200">
          <Heading level="h2" className="!text-[22px]">{t('courses.courses')}</Heading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {displayedCourses.map((course: any, index: number) => (
            <div key={course.course_uuid || index} className="flex justify-center">
              <CourseThumbnail course={course} orgslug={orgslug} />
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full flex h-[150px] w-full flex-col items-center justify-center gap-y-3">
              <ExclamationCircle className="h-6 w-6 text-gray-300" />
              <Text size="small" weight="plus" className="text-gray-600">
                {t('courses.no_courses')}
              </Text>
              <Text size="small" className="max-w-xs text-center text-gray-400">
                <ContentPlaceHolderIfUserIsNotAdmin text={t('courses.create_courses_placeholder')} />
              </Text>
            </div>
          )}
        </div>
        {hasMoreCourses && (
          <div className="flex justify-center pt-4">
            <Button asChild variant="ghost" size="small">
              <Link
                href={getUriWithOrg(orgslug, '/courses')}
                className="group inline-flex items-center gap-1"
              >
                <Text size="small" weight="plus" className="text-ui-fg-interactive group-hover:underline">
                  {t('courses.view_all_courses')} ({courses.length})
                </Text>
                <ArrowRightMini className="h-3.5 w-3.5 text-ui-fg-interactive transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  )
}

export default LandingClassic
