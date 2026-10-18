'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Users, X, SquareUserRound } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import useSWR, { mutate } from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import { updateBoard } from '@services/boards/boards'
import { linkResourcesToUserGroup, unLinkResourcesToUserGroup } from '@services/usergroups/usergroups'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { SectionCard } from '@components/Analytics/Card'
import { Column, DataTable } from '@components/Analytics/DataTable'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

interface BoardAccessTabProps {
  board: any
  boardUuid: string
  orgId: number
  boardKey: string | null
}

function BoardAccessTab({ board, boardUuid, orgId, boardKey }: BoardAccessTabProps) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const [isPublic, setIsPublic] = useState<boolean>(board.public ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const [userGroupModal, setUserGroupModal] = useState(false)

  useEffect(() => {
    setIsPublic(board.public ?? true)
  }, [board.public])

  const { data: usergroups } = useSWR(
    !isPublic && boardUuid && org?.id
      ? `${getAPIUrl()}usergroups/resource/${boardUuid}?org_id=${org.id}`
      : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false }
  )

  const handleSetAccess = async (value: boolean) => {
    setIsSaving(true)
    setIsPublic(value)
    try {
      await updateBoard(boardUuid, { public: value }, access_token)
      toast.success(value ? t('boards.access.board_set_public') : t('boards.access.board_set_private'))
      if (boardKey) mutate(boardKey)
      mutate((key) => typeof key === 'string' && key.includes('/boards/org/'), undefined, { revalidate: true })
    } catch {
      setIsPublic(!value)
      toast.error(t('boards.access.access_update_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const removeUserGroupLink = async (usergroup_id: number) => {
    try {
      const res = await unLinkResourcesToUserGroup(usergroup_id, boardUuid, orgId, access_token)
      if (res.status === 200) {
        toast.success(t('boards.access.user_group_unlinked'))
        mutate(`${getAPIUrl()}usergroups/resource/${boardUuid}?org_id=${org.id}`)
      } else {
        toast.error(`${t('boards.access.unlink_error')}${res.data?.detail || 'Unknown error'}`)
      }
    } catch {
      toast.error(t('boards.access.unlink_error_generic'))
    }
  }

  const groupColumns: Column<any>[] = [
    {
      key: 'name',
      header: t('boards.name'),
      sortable: true,
      value: (usergroup) => usergroup.name || '',
      render: (usergroup) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Users size={16} className="shrink-0 text-gray-400" />
          <span className="font-medium text-gray-900 truncate">{usergroup.name}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (usergroup) => (
        <ConfirmationModal
          confirmationButtonText={t('boards.access.unlink')}
          confirmationMessage={t('boards.access.unlink_confirm')}
          dialogTitle={t('boards.access.unlink_user_group')}
          dialogTrigger={
            <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-600 rounded-md text-xs font-medium nice-shadow transition-all">
              <X className="w-3.5 h-3.5" />
              <span>{t('boards.access.unlink')}</span>
            </button>
          }
          functionToExecute={() => removeUserGroupLink(usergroup.id)}
          status="warning"
        />
      ),
    },
  ]

  return (
    <div>
      <div className="h-6"></div>
      <div className="mx-4 sm:mx-10 bg-white rounded-xl shadow-xs px-4 py-4">
        <div className="flex flex-col bg-gray-50 -space-y-1 px-3 sm:px-5 py-3 rounded-md mb-3">
          <h1 className="font-bold text-lg sm:text-xl text-gray-800">{t('boards.access.title')}</h1>
          <h2 className="text-gray-500 text-xs sm:text-sm">{t('boards.access.description')}</h2>
        </div>
        <div className={`flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mx-auto mb-3 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
          <ConfirmationModal
            confirmationButtonText={t('boards.access.set_to_public')}
            confirmationMessage={t('boards.access.set_to_public_confirm')}
            dialogTitle={t('boards.access.make_board_public')}
            dialogTrigger={
              <div className="w-full h-[200px] bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                {isPublic && (
                  <div className="bg-green-200 text-green-600 font-bold w-fit my-3 mx-3 absolute text-sm px-3 py-1 rounded-lg">
                    {t('boards.access.active')}
                  </div>
                )}
                <div className="flex flex-col space-y-1 justify-center items-center h-full p-2 sm:p-4">
                  <Globe className="text-slate-400" size={32} />
                  <div className="text-xl sm:text-2xl text-slate-700 font-bold">{t('boards.access.public_option')}</div>
                  <div className="text-gray-400 text-sm sm:text-md tracking-tight w-full sm:w-[500px] leading-5 text-center">
                    {t('boards.access.public_description')}
                  </div>
                </div>
              </div>
            }
            functionToExecute={() => handleSetAccess(true)}
            status="info"
          />
          <ConfirmationModal
            confirmationButtonText={t('boards.access.set_to_private')}
            confirmationMessage={t('boards.access.set_to_private_confirm')}
            dialogTitle={t('boards.access.make_board_private')}
            dialogTrigger={
              <div className="w-full h-[200px] bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                {!isPublic && (
                  <div className="bg-green-200 text-green-600 font-bold w-fit my-3 mx-3 absolute text-sm px-3 py-1 rounded-lg">
                    {t('boards.access.active')}
                  </div>
                )}
                <div className="flex flex-col space-y-1 justify-center items-center h-full p-2 sm:p-4">
                  <Users className="text-slate-400" size={32} />
                  <div className="text-xl sm:text-2xl text-slate-700 font-bold">{t('boards.access.private_option')}</div>
                  <div className="text-gray-400 text-sm sm:text-md tracking-tight w-full sm:w-[500px] leading-5 text-center">
                    {t('boards.access.private_description')}
                  </div>
                </div>
              </div>
            }
            functionToExecute={() => handleSetAccess(false)}
            status="info"
          />
        </div>

        {/* UserGroups Section (shown when private) */}
        {!isPublic && (
          <SectionCard
            title={t('boards.access.user_groups')}
            right={
              <Modal
                isDialogOpen={userGroupModal}
                onOpenChange={() => setUserGroupModal(!userGroupModal)}
                minHeight="no-min"
                minWidth="md"
                dialogContent={
                  <LinkUserGroupToBoard
                    boardUuid={boardUuid}
                    orgId={orgId}
                    accessToken={access_token}
                    setModalOpen={setUserGroupModal}
                  />
                }
                dialogTitle={t('boards.access.link_to_user_group')}
                dialogDescription={t('boards.access.link_to_user_group_description')}
                dialogTrigger={
                  <button className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                    <SquareUserRound className="w-4 h-4" />
                    <span>{t('boards.access.link_to_usergroup_btn')}</span>
                  </button>
                }
              />
            }
            bleed
          >
            <p className="px-6 -mt-2 mb-4 text-xs text-gray-500">
              {t('boards.access.user_groups_description')}
            </p>

            {(!usergroups || usergroups.length === 0) ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {t('boards.access.no_user_groups')}
              </div>
            ) : (
              <DataTable columns={groupColumns} rows={usergroups} />
            )}
          </SectionCard>
        )}
      </div>
    </div>
  )
}

function LinkUserGroupToBoard({ boardUuid, orgId, accessToken, setModalOpen }: {
  boardUuid: string
  orgId: number
  accessToken: string
  setModalOpen: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const org = useOrg() as any

  const { data: usergroups } = useSWR(
    org ? `${getAPIUrl()}usergroups/org/${org.id}?org_id=${org.id}` : null,
    (url) => swrFetcher(url, accessToken),
    { revalidateOnFocus: false }
  )

  const [selectedUserGroup, setSelectedUserGroup] = useState<number | null>(null)

  useEffect(() => {
    if (usergroups && usergroups.length > 0) {
      setSelectedUserGroup(usergroups[0].id)
    }
  }, [usergroups])

  const handleLink = async () => {
    if (!selectedUserGroup) return
    const res = await linkResourcesToUserGroup(selectedUserGroup, boardUuid, orgId, accessToken)
    if (res.status === 200) {
      setModalOpen(false)
      toast.success(t('boards.access.user_group_linked'))
      mutate(`${getAPIUrl()}usergroups/resource/${boardUuid}?org_id=${org.id}`)
    } else {
      toast.error(`${t('boards.access.link_error')}${res.data?.detail || 'Unknown error'}`)
    }
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="p-4 flex-row flex justify-between items-center">
        {usergroups?.length >= 1 ? (
          <div className="py-1">
            <span className="px-3 text-gray-400 font-bold rounded-full py-1 bg-gray-100 mx-3">
              {t('boards.access.user_group')}
            </span>
            <select
              onChange={(e) => setSelectedUserGroup(Number(e.target.value))}
              defaultValue={selectedUserGroup ?? undefined}
            >
              {usergroups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex space-x-3 items-center">
            <span className="px-3 text-yellow-700 font-bold rounded-full py-1 mx-3">
              {t('boards.access.no_user_groups_available')}
            </span>
            <Link
              className="px-3 text-blue-700 font-bold rounded-full py-1 bg-blue-100 mx-1"
              target="_blank"
              href={getUriWithOrg(org?.slug, '/dash/users/settings/usergroups')}
            >
              {t('boards.access.create_user_group')}
            </Link>
          </div>
        )}
        <div className="py-3">
          <button
            onClick={handleLink}
            disabled={!selectedUserGroup}
            className="bg-green-700 text-white font-bold px-4 py-2 rounded-md shadow-sm disabled:opacity-50"
          >
            {t('boards.access.link')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BoardAccessTab
