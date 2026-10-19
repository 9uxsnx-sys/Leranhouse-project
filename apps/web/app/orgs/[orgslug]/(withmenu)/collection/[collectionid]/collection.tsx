'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import {
  Award,
  BookCopy,
  BookOpen,
  Check,
  Download,
  Layers,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

import PageLoading from '@components/Objects/Loaders/PageLoading'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import CourseLearnings from '@components/Objects/Courses/CourseLearnings/CourseLearnings'
import CourseShare from '@components/Objects/Courses/CourseShare/CourseShare'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { EmptyState } from '@components/Analytics/Feedback'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useRegisterBreadcrumb } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { createResourceCheckout } from '@services/payments/checkout'
import {
  getCollectionBannerMediaDirectory,
  getCollectionThumbnailMediaDirectory,
  getCourseThumbnailMediaDirectory,
} from '@services/media/media'
import { swrFetcher } from '@services/utils/ts/requests'

const removeCoursePrefix = (uuid: string) => uuid.replace('course_', '')

const CollectionClient = ({
  orgslug,
  collectionid,
}: {
  orgslug: string
  collectionid: string
}) => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const org = useOrg() as any

  const collectionUuid = `collection_${collectionid}`

  const { data: collection, error } = useSWR(
    collectionid && accessToken
      ? `${getAPIUrl()}collections/${collectionUuid}`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const { data: memberRows } = useSWR(
    collection
      ? `${getAPIUrl()}collections/${collectionUuid}/courses?limit=100`
      : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const { data: trailData } = useSWR(
    accessToken && org?.id ? `${getAPIUrl()}trail/org/${org.id}/trail` : null,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const members: any[] = useMemo(
    () => memberRows || collection?.courses || [],
    [memberRows, collection?.courses]
  )

  useRegisterBreadcrumb([
    { label: t('collections.collections'), href: '/collections' },
    { label: collection?.name || t('navigation.breadcrumb.collection_fallback') },
  ])

  const learnings = useMemo(() => {
    if (!collection?.learnings) return [] as any[]
    try {
      const parsed = JSON.parse(collection.learnings)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // legacy comma-separated value
    }
    return String(collection.learnings)
      .split(',')
      .map((text) => ({ id: text, text: text.trim(), emoji: '📝' }))
      .filter((item) => item.text)
  }, [collection?.learnings])

  const totalLessons = useMemo(
    () =>
      members.reduce(
        (sum: number, course: any) =>
          sum + Number(course.lessons ?? course.chapters?.length ?? 0),
        0
      ),
    [members]
  )

  const completedRuns = useMemo(() => {
    if (!trailData?.runs || members.length === 0) return 0
    const runCourseUuids = new Set(
      trailData.runs
        .map((run: any) => run.course?.course_uuid)
        .filter(Boolean)
    )
    return members.filter((course: any) => runCourseUuids.has(course.course_uuid))
      .length
  }, [trailData, members])

  const isOwned = members.length > 0 && completedRuns === members.length

  const isPaid = collection?.access_type === 'paid'
  const price =
    typeof collection?.price_amount === 'number' ? collection.price_amount : null

  const [isStarting, setIsStarting] = useState(false)

  if (error) {
    return (
      <div
        className="pt-8 px-6 pb-0 flex flex-col items-center justify-center"
        style={{ minHeight: '100dvh' }}
      >
        <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
          <BookCopy className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
          {t('collections.not_found')}
        </h2>
        <p className="txt-compact-small text-ui-fg-muted">
          {t('collections.not_found_description')}
        </p>
      </div>
    )
  }

  if (!collection) return <PageLoading />

  const heroImage = collection.banner_image
    ? getCollectionBannerMediaDirectory(
        org?.org_uuid,
        collection.collection_uuid,
        collection.banner_image
      )
    : collection.thumbnail_image
      ? getCollectionThumbnailMediaDirectory(
          org?.org_uuid,
          collection.collection_uuid,
          collection.thumbnail_image
        )
      : ''

  const handleGetAccess = async () => {
    if (!collection?.collection_uuid || !org?.id || !accessToken) return

    if (!isPaid) {
      document.getElementById('included')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setIsStarting(true)
    try {
      const checkout = await createResourceCheckout(
        org.id,
        { resource_uuid: collection.collection_uuid, resource_type: 'collection' },
        accessToken
      )
      if (checkout?.checkout_url) {
        window.location.href = checkout.checkout_url
        return
      }
      throw new Error('Missing checkout URL')
    } catch (err: any) {
      toast.error(
        err?.detail || t('collections.dashboard.access.price_error')
      )
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <GeneralWrapperStyled>
      {/* ── HERO BANNER ── */}
      <div className="relative w-full mx-auto max-w-7xl aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100 ring-1 ring-inset ring-black/5">
        {heroImage ? (
          <img
            src={heroImage}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center mx-auto">
                <Layers className="w-10 h-10 text-indigo-400" />
              </div>
              <Text size="small" className="text-gray-400 mt-3">
                {t('collections.collection')}
              </Text>
            </div>
          </div>
        )}
      </div>

      <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-ui-fg-base leading-tight">
                {collection.name}
              </h1>
              {collection.description && (
                <Text size="base" className="text-ui-fg-subtle mt-2 leading-relaxed">
                  {collection.description}
                </Text>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge variant="grey" className="flex items-center gap-1">
                  <Layers size={12} />
                  {t('collections.dashboard.content.course_count', {
                    count: members.length,
                  })}
                </Badge>
                <Badge variant="grey" className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {totalLessons} {t('collections.dashboard.content.lessons')}
                </Badge>
                {isOwned && (
                  <Badge variant="grey" className="flex items-center gap-1">
                    <Check size={12} />
                    {t('collections.owned')}
                  </Badge>
                )}
                <div className="ml-auto">
                  <CourseShare
                    courseName={collection.name}
                    courseUrl={getUriWithOrg(orgslug, `/collection/${collectionid}`)}
                  />
                </div>
              </div>
            </div>

            {learnings.length > 0 && (
              <CourseLearnings items={learnings.map((item: any) => item.text || item)} />
            )}

            {collection.about && (
              <div>
                <Heading level="h1" className="!text-2xl mb-4">
                  {t('collections.about_title')}
                </Heading>
                <div className="space-y-4">
                  {collection.about
                    .split('\n\n')
                    .filter((paragraph: string) => paragraph.trim())
                    .map((paragraph: string, index: number) => (
                      <Text
                        key={index}
                        size="base"
                        className="text-ui-fg-subtle leading-relaxed block"
                      >
                        {paragraph.trim()}
                      </Text>
                    ))}
                </div>
              </div>
            )}

            {/* ── WHAT'S INCLUDED ── */}
            <div id="included">
              <Heading level="h1" className="!text-2xl mb-4">
                {t('collections.included_title')}
              </Heading>

              {members.length === 0 ? (
                <EmptyState
                  icon={BookCopy}
                  title={t('collections.no_courses')}
                  description={t('collections.no_courses_description')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {members.map((course: any) => {
                    const imageUrl = course.thumbnail_image
                      ? getCourseThumbnailMediaDirectory(
                          org?.org_uuid,
                          course.course_uuid,
                          course.thumbnail_image
                        )
                      : ''
                    return (
                      <CourseCard
                        key={course.course_uuid}
                        id={removeCoursePrefix(course.course_uuid)}
                        title={course.name}
                        description={course.description || ''}
                        image={imageUrl}
                        lessons={course.lessons ?? 0}
                        duration={t('collections.self_paced')}
                        difficulty={t('collections.all_levels')}
                        href={getUriWithOrg(
                          orgslug,
                          `/course/${removeCoursePrefix(course.course_uuid)}`
                        )}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
                  {isOwned
                    ? t('collections.owned_title')
                    : t('collections.get_access')}
                </h3>

                {isOwned ? (
                  <>
                    <p className="text-sm text-gray-500 mb-4 leading-snug">
                      {t('collections.owned_description')}
                    </p>
                    <Link href={getUriWithOrg(orgslug, '/trail')}>
                      <Button variant="primary" size="large" className="w-full">
                        {t('collections.go_to_progress')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-2 leading-snug">
                      {isPaid
                        ? t('collections.get_access_paid')
                        : t('collections.get_access_free')}
                    </p>
                    {isPaid && price !== null && price > 0 && (
                      <p className="text-2xl font-semibold text-gray-900 mb-4">
                        {price.toLocaleString()}{' '}
                        <span className="text-sm font-normal text-gray-500">DZD</span>
                      </p>
                    )}
                    <Button
                      variant="primary"
                      size="large"
                      className="w-full"
                      onClick={handleGetAccess}
                      disabled={isStarting || !accessToken}
                    >
                      {isStarting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          {t('collections.processing')}
                        </span>
                      ) : isPaid ? (
                        t('collections.get_access')
                      ) : (
                        t('collections.explore_courses')
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                  {t('collections.bundle_includes')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      {t('collections.dashboard.content.course_count', {
                        count: members.length,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      {totalLessons} {t('collections.dashboard.content.lessons')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      {t('collections.self_paced')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      {t('collections.certificate')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
                  {t('collections.updates')}
                </h3>
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t('collections.last_updated', {
                      date: collection.update_date
                        ? new Date(collection.update_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}

export default CollectionClient
