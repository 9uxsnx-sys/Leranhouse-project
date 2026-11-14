'use client';

import React from 'react'
import toast from 'react-hot-toast'
import UserAvatar from '@components/Objects/UserAvatar'
import { BookOpen, Mic, Users } from 'lucide-react'
import { getUserAvatarMediaDirectory, getUserBannerMediaDirectory, getCourseThumbnailMediaDirectory, getPodcastThumbnailMediaDirectory, getCommunityThumbnailMediaDirectory } from '@services/media/media'
import { getCoursesByUser, getPodcastsByUser, getCommunitiesByUser } from '@services/users/users'
import { removePodcastPrefix } from '@services/podcasts/podcasts'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useRegisterBreadcrumb } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useTranslation } from 'react-i18next'
import { CourseCard } from '@components/Objects/Thumbnails/CourseCard'
import { PodcastCard } from '@components/Objects/Thumbnails/PodcastCard'
import { CommunityCard } from '@components/Objects/Thumbnails/CommunityCard'

interface UserProfileClientProps {
  userData: any;
  profile: any;
  orgslug: string;
}

type TabType = 'courses' | 'podcasts' | 'communities';

const tabsConfig: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'podcasts', label: 'Podcasts', icon: <Mic className="w-4 h-4" /> },
  { id: 'communities', label: 'Communities', icon: <Users className="w-4 h-4" /> },
]

function UserProfileClient({ userData, profile, orgslug }: UserProfileClientProps) {
  const { t, i18n } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const access_token = session?.data?.tokens?.access_token
  const contentLocale = (i18n.language || 'en').split('-')[0]
  const [activeTab, setActiveTab] = React.useState<TabType>('courses')

  // Data states
  const [userCourses, setUserCourses] = React.useState<any[]>([])
  const [userPodcasts, setUserPodcasts] = React.useState<any[]>([])
  const [userCommunities, setUserCommunities] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState(false)

  useRegisterBreadcrumb([
    {
      label:
        `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim() ||
        userData.username ||
        t('navigation.breadcrumb.profile_fallback'),
    },
  ])

  React.useEffect(() => {
    let mounted = true
    if (!userData.id || !access_token) return

    const fetchAllData = async () => {
      setIsLoading(true)
      setFetchError(false)
      try {
        const [coursesRes, podcastsRes, communitiesRes] = await Promise.allSettled([
          getCoursesByUser(userData.id, access_token, contentLocale),
          getPodcastsByUser(userData.id, access_token),
          getCommunitiesByUser(userData.id, access_token, contentLocale),
        ])

        if (!mounted) return

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
          setUserCourses(coursesRes.value.data)
        }
        if (podcastsRes.status === 'fulfilled' && podcastsRes.value.data) {
          setUserPodcasts(podcastsRes.value.data)
        }
        if (communitiesRes.status === 'fulfilled' && communitiesRes.value.data) {
          setUserCommunities(communitiesRes.value.data)
        }

        const allFailed = [coursesRes, podcastsRes, communitiesRes].every(r => r.status === 'rejected')
        if (allFailed) {
          setFetchError(true)
          toast.error('Failed to load user data')
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching user data:', error)
          setFetchError(true)
          toast.error('Failed to load user data')
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchAllData()
    return () => { mounted = false }
  }, [userData.id, access_token, contentLocale])

  const bannerUrl = userData.banner_image
    ? getUserBannerMediaDirectory(userData.user_uuid, userData.banner_image)
    : ''

  const tabs = tabsConfig.map((tab) => ({
    ...tab,
    count:
      tab.id === 'courses' ? userCourses.length :
      tab.id === 'podcasts' ? userPodcasts.length :
      userCommunities.length,
  }))

  const orgUuid = org?.org_uuid

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Banner ── */}
      <div className="relative w-full aspect-[4/1] rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* ── Avatar + User Info + Stats ── */}
      <div className="px-4 sm:px-8 mt-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="rounded-full overflow-hidden shadow-lg flex-shrink-0">
            <UserAvatar
              width={130}
              avatar_url={userData.avatar_image ? getUserAvatarMediaDirectory(userData.user_uuid, userData.avatar_image) : ''}
              predefined_avatar={userData.avatar_image ? undefined : 'empty'}
              userId={userData.id}
              showProfilePopup
              rounded="rounded-full"
            />
          </div>
          <div className="flex flex-col gap-1 pt-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug tracking-tight">
              {userData.first_name} {userData.last_name}
            </h1>
            {userData.username && (
              <p className="text-sm text-gray-400">@{userData.username}</p>
            )}
            {userData.bio && (
              <p className="text-sm text-gray-600 max-w-xl leading-relaxed">{userData.bio}</p>
            )}
            <div className="flex items-center gap-5 text-sm text-gray-500 mt-1">
              {tabs.map((tab) => (
                <span key={tab.id}>
                  <span className="font-semibold text-gray-900">{tab.count}</span>
                  <span className="ml-1">{tab.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="border-b border-gray-200 px-4 sm:px-8 mb-6">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="px-4 sm:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 text-red-500">
            {t('courses.courses_load_error') || 'Failed to load data'}
          </div>
        ) : (
          <>
            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {userCourses.length > 0 ? (
                  userCourses.map((course: any) => {
                    const imageUrl = course.thumbnail_image && orgUuid
                      ? getCourseThumbnailMediaDirectory(orgUuid, course.course_uuid, course.thumbnail_image)
                      : ''
                    return (
                      <CourseCard
                        key={course.id}
                        id={course.course_uuid || course.id}
                        title={course.name}
                        description={course.description || ''}
                        image={imageUrl}
                        href={`/orgs/${orgslug}/course/${course.course_uuid || course.id}`}
                      />
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No courses yet</p>
                    <p className="text-sm mt-1">Courses created by this user will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'podcasts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {userPodcasts.length > 0 ? (
                  userPodcasts.map((podcast: any) => (
                    <PodcastCard
                      key={podcast.id}
                      id={removePodcastPrefix(podcast.podcast_uuid || podcast.id)}
                      title={podcast.name}
                      description={podcast.description || ''}
                      thumbnailImage={podcast.thumbnail_image}
                      episodeCount={0}
                      totalDurationSeconds={0}
                      creationDate={podcast.creation_date}
                      org_uuid={orgUuid}
                      href={`/orgs/${orgslug}/podcast/${removePodcastPrefix(podcast.podcast_uuid || podcast.id)}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No podcasts yet</p>
                    <p className="text-sm mt-1">Podcasts created by this user will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'communities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {userCommunities.length > 0 ? (
                  userCommunities.map((community: any) => (
                    <CommunityCard
                      key={community.id}
                      id={community.community_uuid || community.id}
                      title={community.name}
                      description={community.description || ''}
                      org_uuid={orgUuid}
                      community_uuid={community.community_uuid}
                      course_id={community.course_id}
                      public={community.public}
                      creation_date={community.creation_date}
                      thumbnail_image={community.thumbnail_image}
                      href={`/orgs/${orgslug}/community/${community.community_uuid || community.id}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No communities yet</p>
                    <p className="text-sm mt-1">Communities this user has access to will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserProfileClient
