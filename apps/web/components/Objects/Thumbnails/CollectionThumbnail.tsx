'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { getUriWithOrg } from '@services/config/config'
import { deleteCollection } from '@services/courses/collections'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { revalidateTags } from '@services/utils/ts/requests'
import { Library, BookCopy } from 'lucide-react'
import { EllipsisHorizontal, Trash } from '@components/Objects/Icons/MedusaIcons'
import { Text } from '@components/ui/text'
import { IconButton } from '@components/ui/icon-button'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"

type PropsType = {
  collection: any
  orgslug: string
  org_id: string | number
}

const removeCollectionPrefix = (collectionid: string) => {
  return collectionid.replace('collection_', '')
}

function CollectionThumbnail(props: PropsType) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const collectionId = removeCollectionPrefix(props.collection.collection_uuid)
  const courses = props.collection.courses || []

  return (
    <div 
      className="group relative flex flex-col bg-white rounded-lg card-shadow-rest hover:card-shadow-hover overflow-hidden w-full transition-shadow duration-200"
    >
      <CollectionAdminEditsArea
        orgslug={props.orgslug}
        org_id={props.org_id}
        collection_uuid={props.collection.collection_uuid}
        collection={props.collection}
      />

      <Link 
        href={getUriWithOrg(props.orgslug, `/collection/${collectionId}`)}
        className="block relative aspect-video overflow-hidden bg-gray-50"
      >
        {courses.length > 0 ? (
          <div className="flex items-center justify-center h-full w-full bg-gray-100/50 relative p-4">
            <div className="flex -space-x-10 items-center justify-center w-full">
              {courses.slice(0, 3).map((course: any, index: number) => (
                <div
                  key={course.course_uuid}
                  className="relative h-20 w-32 overflow-hidden rounded-lg border-2 border-white shadow-lg transition-all duration-300 shrink-0"
                  style={{
                    backgroundImage: `url(${course.thumbnail_image
                      ? getCourseThumbnailMediaDirectory(
                          org?.org_uuid,
                          course.course_uuid,
                          course.thumbnail_image
                        )
                      : '/empty_thumbnail.png'
                    })`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 3 - index,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 text-gray-300 gap-1.5">
            <Library size={32} strokeWidth={1.5} />
            <Text size="xsmall" className="text-gray-400">{t('collections.empty_collection')}</Text>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col gap-y-1.5">
        <Text asChild size="base" weight="plus" className="text-gray-900 leading-tight">
          <Link
            href={getUriWithOrg(props.orgslug, `/collection/${collectionId}`)}
            className="hover:text-black transition-colors line-clamp-1"
          >
            {props.collection.name}
          </Link>
        </Text>
        
        {props.collection.description && (
          <Text size="small" className="text-gray-500 line-clamp-2 min-h-[1.5rem]">
            {props.collection.description}
          </Text>
        )}

        <div className="pt-1.5 flex items-center justify-between border-t border-[#e4e4e7]">
          <div className="flex items-center gap-1.5 text-gray-500">
            <BookCopy size={12} className="text-gray-400" />
            <Text size="xsmall" className="text-gray-500">
              {courses.length === 1 ? t('courses.course_count', { count: 1 }) : t('courses.course_count_plural', { count: courses.length })}
            </Text>
          </div>
          
          <Text asChild size="xsmall" weight="plus" className="text-primary hover:underline">
            <Link href={getUriWithOrg(props.orgslug, `/collection/${collectionId}`)}>
              {t('common.view_details')}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  )
}

const CollectionAdminEditsArea = (props: any) => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any

  const deleteCollectionUI = async () => {
    await deleteCollection(props.collection_uuid, session.data?.tokens?.access_token)
    await revalidateTags(['collections'], props.orgslug)
    router.refresh()
  }

  return (
    <AuthenticatedClientElement
      action="delete"
      ressourceType="collections"
      orgId={props.org_id}
      checkMethod="roles"
    >
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="transparent"
              size="small"
              aria-label="Collection actions"
              className="bg-white/90 backdrop-blur-sm"
            >
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <ConfirmationModal
                confirmationMessage={t('collections.delete_collection_confirm')}
                confirmationButtonText={t('collections.delete_collection')}
                dialogTitle={t('collections.delete_collection_title', { name: props.collection.name })}
                dialogTrigger={
                  <button className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Trash /> {t('collections.delete_collection')}
                  </button>
                }
                functionToExecute={deleteCollectionUI}
                status="warning"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </AuthenticatedClientElement>
  )
}

export default CollectionThumbnail
