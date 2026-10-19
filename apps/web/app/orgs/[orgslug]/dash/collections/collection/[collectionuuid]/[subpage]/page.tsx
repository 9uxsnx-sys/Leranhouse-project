'use client'
import React, { use } from 'react'
import useSWR from 'swr'
import { Lock, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import EditCollectionGeneral from '@components/Dashboard/Pages/Collection/EditCollectionGeneral/EditCollectionGeneral'
import EditCollectionContent from '@components/Dashboard/Pages/Collection/EditCollectionContent/EditCollectionContent'
import EditCollectionAccess from '@components/Dashboard/Pages/Collection/EditCollectionAccess/EditCollectionAccess'
import { PageTabs } from '@components/ui/page-tabs'
import { SectionIcon } from '@components/ui/icons'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'

export type CollectionEditorParams = {
  orgslug: string
  collectionuuid: string
  subpage: string
}

function CollectionEditorPage(props: { params: Promise<CollectionEditorParams> }) {
  const { t } = useTranslation()
  const params = use(props.params)
  const session = useLHSession() as any
  const org = useOrg() as any
  const { isAdmin, loading: adminLoading } = useAdminStatus()
  const accessToken = session?.data?.tokens?.access_token

  const collectionUuid = `collection_${params.collectionuuid}`
  const collectionKey =
    accessToken && collectionUuid
      ? `${getAPIUrl()}collections/${collectionUuid}`
      : null

  const { data: collection, error, isLoading, mutate } = useSWR(
    collectionKey,
    (url: string) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const tabs = [
    {
      key: 'general',
      label: t('collections.dashboard.tabs.general'),
      icon: SectionIcon.general,
      href: `/dash/collections/collection/${params.collectionuuid}/general`,
    },
    {
      key: 'content',
      label: t('collections.dashboard.tabs.content'),
      icon: SectionIcon.content,
      href: `/dash/collections/collection/${params.collectionuuid}/content`,
    },
    {
      key: 'access',
      label: t('collections.dashboard.tabs.access'),
      icon: SectionIcon.access,
      href: `/dash/collections/collection/${params.collectionuuid}/access`,
    },
  ]

  if (adminLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-[#f8f8f8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="h-screen w-full bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('collections.dashboard.not_found_title')}
          </h3>
          <p className="text-gray-500">
            {error?.status === 403
              ? t('collections.dashboard.forbidden')
              : t('collections.dashboard.not_found_description')}
          </p>
        </div>
      </div>
    )
  }

  const canEdit = isAdmin || org?.is_admin

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
          {collection.name}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <PageTabs
          variant="pill"
          indicatorId="collection-settings-tabs"
          active={params.subpage.toString()}
          tabs={tabs.map((tab) => ({
            id: tab.key,
            label: tab.label,
            icon: tab.icon,
            href: getUriWithOrg(params.orgslug, '') + tab.href,
          }))}
        />
      </div>

      <div className="w-full mx-auto max-w-7xl mt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <main className="max-w-7xl mx-auto">
          {!canEdit ? (
            <div className="text-center py-24 text-gray-500">
              {t('collections.dashboard.forbidden')}
            </div>
          ) : (
            <>
              {params.subpage === 'general' && (
                <EditCollectionGeneral
                  collection={collection}
                  orgslug={params.orgslug}
                  onUpdated={() => mutate()}
                />
              )}
              {params.subpage === 'content' && (
                <EditCollectionContent
                  collection={collection}
                  orgslug={params.orgslug}
                  onUpdated={() => mutate()}
                />
              )}
              {params.subpage === 'access' && (
                <EditCollectionAccess
                  collection={collection}
                  orgslug={params.orgslug}
                  onUpdated={() => mutate()}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default CollectionEditorPage
