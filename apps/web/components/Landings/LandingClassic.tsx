'use client'

import React from 'react'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import TypeOfContentTitle from '@components/Objects/StyledElements/Titles/TypeOfContentTitle'
import CourseThumbnail from '@components/Objects/Thumbnails/CourseThumbnail'
import CollectionThumbnail from '@components/Objects/Thumbnails/CollectionThumbnail'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import NewCourseButton from '@components/Objects/StyledElements/Buttons/NewCourseButton'
import NewCollectionButton from '@components/Objects/StyledElements/Buttons/NewCollectionButton'
import ContentPlaceHolderIfUserIsNotAdmin from '@components/Objects/ContentPlaceHolder'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import { ExclamationCircle, ArrowRightMini } from '@components/Objects/Icons/MedusaIcons'
import { Text } from '@components/ui/text'
import { Container } from '@components/ui/container'

interface LandingClassicProps {
  courses: any[]
  collections: any[]
  orgslug: string
  org_id: string | number
}

function LandingClassic({ courses, collections, orgslug, org_id }: LandingClassicProps) {
  const { t } = useTranslation()

  // Limit to 12 courses (4x3 grid) for the home page
  const displayedCourses = courses.slice(0, 12)
  const hasMoreCourses = courses.length > 12

  return (
    <div className="w-full">
      <GeneralWrapperStyled>
        <div className="flex flex-col gap-y-3">
          {/* Collections */}
          <div className="flex flex-col gap-y-3">
            <Container>
              <div className="flex items-center justify-between pb-4">
                <TypeOfContentTitle title={t('collections.collections')} type="col" />
                <AuthenticatedClientElement
                  checkMethod="roles"
                  ressourceType="collections"
                  action="create"
                  orgId={org_id}
                >
                  <Link href={getUriWithOrg(orgslug, '/collections/new')}>
                    <NewCollectionButton />
                  </Link>
                </AuthenticatedClientElement>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {collections.map((collection: any) => (
                  <div key={collection.collection_id} className="flex flex-col">
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
          </div>

          {/* Courses */}
          <div className="flex flex-col gap-y-3">
            <Container>
              <div className="flex items-center justify-between pb-4">
                <TypeOfContentTitle title={t('courses.courses')} type="cou" />
                <AuthenticatedClientElement
                  ressourceType="courses"
                  action="create"
                  checkMethod="roles"
                  orgId={org_id}
                >
                  <Link href={getUriWithOrg(orgslug, '/courses?new=true')}>
                    <NewCourseButton />
                  </Link>
                </AuthenticatedClientElement>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedCourses.map((course: any) => (
                  <div key={course.course_uuid} className="flex">
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
                  <Link
                    href={getUriWithOrg(orgslug, '/courses')}
                    className="group inline-flex items-center gap-1"
                  >
                    <Text size="small" weight="plus" className="text-ui-fg-interactive group-hover:underline">
                      {t('courses.view_all_courses')} ({courses.length})
                    </Text>
                    <ArrowRightMini className="h-3.5 w-3.5 text-ui-fg-interactive transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
            </Container>
          </div>
        </div>
      </GeneralWrapperStyled>
    </div>
  )
}

export default LandingClassic
