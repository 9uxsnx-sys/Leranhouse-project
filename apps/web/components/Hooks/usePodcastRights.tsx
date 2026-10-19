'use client'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import useSWR from 'swr'
import { useLHSession } from '@components/Contexts/LHSessionContext'

export interface PodcastRights {
  podcast_uuid: string
  user_id: number
  is_anonymous: boolean
  permissions: {
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
    create_episodes: boolean
    update_episodes: boolean
    delete_episodes: boolean
    manage_access: boolean
  }
  ownership: {
    is_owner: boolean
    is_creator: boolean
    is_maintainer: boolean
    is_contributor: boolean
    authorship_status: string
  }
  roles: {
    is_admin: boolean
    is_maintainer_role: boolean
    is_instructor: boolean
    is_user: boolean
  }
}

export function usePodcastRights(podcastuuid: string) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const { data: rights, error, isLoading } = useSWR<PodcastRights>(
    podcastuuid ? `${getAPIUrl()}podcasts/${podcastuuid}/rights` : null,
    (url: string) => swrFetcher(url, access_token)
  )

  return {
    rights,
    error,
    isLoading,
    hasPermission: (permission: keyof PodcastRights['permissions']) => {
      return rights?.permissions?.[permission] ?? false
    },
  }
}
