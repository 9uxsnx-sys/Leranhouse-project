'use client'

import React, { use, useEffect, useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import useSWR from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import PaymentResultCard, {
  PaymentResultVariant,
} from '@components/Objects/Payments/PaymentResultCard'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import { useTranslation } from 'react-i18next'

type PaymentResultPageProps = {
  params: Promise<{ orgslug: string; status: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function PaymentResultPage({
  params,
  searchParams,
}: PaymentResultPageProps) {
  const { t } = useTranslation()
  const { orgslug, status } = use(params)
  const query = use(searchParams)
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const isSuccess = status === 'success'
  const resource = typeof query.resource === 'string' ? query.resource : null
  const orderRef = typeof query.order === 'string' ? query.order : null
  const rawAmount = typeof query.amount === 'string' ? Number(query.amount) : null
  const amountLabel =
    rawAmount !== null && Number.isFinite(rawAmount) && rawAmount > 0
      ? `${rawAmount.toLocaleString()} DZD`
      : null

  const [activated, setActivated] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  const isCollection = !!resource?.startsWith('collection_')

  // Poll the learner's trail: the webhook creates the TrailRun(s) when the
  // payment is confirmed, so their presence is our "access is active" signal.
  const { data: trailData } = useSWR(
    isSuccess && !isCollection && access_token && org?.id
      ? `${getAPIUrl()}trail/org/${org.id}/trail`
      : null,
    (url) => swrFetcher(url, access_token),
    {
      refreshInterval: isSuccess && !activated ? 2000 : 0,
      revalidateOnFocus: false,
    }
  )

  // Bundles are granted as a single entitlement. TrailRuns are not a reliable
  // signal here because podcasts never create one, so poll the access state.
  const { data: collectionAccessState } = useSWR(
    isSuccess && isCollection && resource && access_token
      ? `${getAPIUrl()}collections/${resource}/access/state`
      : null,
    (url) => swrFetcher(url, access_token),
    {
      refreshInterval: isSuccess && !activated ? 2000 : 0,
      revalidateOnFocus: false,
    }
  )

  const { data: collectionMeta } = useSWR(
    isSuccess && isCollection && resource && access_token
      ? `${getAPIUrl()}collections/${resource}`
      : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const activeRun = useMemo(() => {
    if (!trailData?.runs || !resource || isCollection) return null
    return (
      trailData.runs.find((run: any) => run.course?.course_uuid === resource) ||
      null
    )
  }, [trailData, resource, isCollection])

  const collectionActivated = Boolean(collectionAccessState?.has_paid_access)

  useEffect(() => {
    if (isCollection ? collectionActivated : activeRun) setActivated(true)
  }, [isCollection, collectionActivated, activeRun])

  useEffect(() => {
    if (!isSuccess || activated) return
    const timer = setTimeout(() => setTimedOut(true), 20000)
    return () => clearTimeout(timer)
  }, [isSuccess, activated])

  if (status !== 'success' && status !== 'failure') {
    notFound()
  }

  const courseUuid = resource?.startsWith('course_')
    ? resource.replace('course_', '')
    : null
  const podcastUuid = resource?.startsWith('podcast_')
    ? resource.replace('podcast_', '')
    : null
  const collectionUuid = isCollection ? resource!.replace('collection_', '') : null
  const backHref = courseUuid
    ? getUriWithOrg(orgslug, `/course/${courseUuid}`)
    : podcastUuid
      ? getUriWithOrg(orgslug, `/podcast/${podcastUuid}`)
      : collectionUuid
        ? getUriWithOrg(orgslug, `/collection/${collectionUuid}`)
        : getUriWithOrg(orgslug, '/courses')

  const purchasedName = isCollection
    ? collectionMeta?.name || null
    : activeRun?.course?.name || null

  let variant: PaymentResultVariant = 'failure'
  let title = t('payment.failure.title', 'Payment failed')
  let description = t(
    'payment.failure.description',
    'Your payment was not completed and you have not been charged. You can try again from the course page.'
  )

  if (isSuccess) {
    if (activated) {
      variant = 'active'
      title = t('payment.success.active_title', "You're all set")
      description = purchasedName
        ? t('payment.success.active_description_named', {
            defaultValue: 'You now have access to {{course}}.',
            course: purchasedName,
          })
        : t(
            'payment.success.active_description',
            'Your access is active. You can start learning now.'
          )
    } else if (timedOut) {
      variant = 'pending'
      title = t('payment.success.pending_title', 'Payment received')
      description = t(
        'payment.success.pending_description',
        "We're still confirming the payment. You can go back to the course — it will unlock automatically once the confirmation arrives."
      )
    } else {
      variant = 'processing'
      title = t('payment.success.processing_title', 'Payment received')
      description = t(
        'payment.success.processing_description',
        "We're activating your access. This usually takes a few seconds."
      )
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-16">
      <PaymentResultCard
        variant={variant}
        title={title}
        description={description}
        metaLabel={
          isSuccess && amountLabel
            ? t('payment.total_paid', {
                defaultValue: 'Total paid · {{amount}}',
                amount: amountLabel,
              })
            : null
        }
        orderRef={orderRef}
        backLabel={t('payment.back_to_course', 'Back to course')}
        secondaryLabel={t('payment.browse_courses', 'View my courses')}
        onBack={() => {
          window.location.href = backHref
        }}
        onSecondary={() => {
          window.location.href = getUriWithOrg(orgslug, '/trail')
        }}
      />
    </div>
  )
}
