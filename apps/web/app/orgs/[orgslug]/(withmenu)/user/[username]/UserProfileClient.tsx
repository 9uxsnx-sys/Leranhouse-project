'use client';

import React from 'react'
import toast from 'react-hot-toast'
import UserAvatar from '@components/Objects/UserAvatar'
import { BookOpen, Mic, Users } from 'lucide-react'
import { getUserAvatarMediaDirectory, getUserBannerMediaDirectory, getCourseThumbnailMediaDirectory, getPodcastThumbnailMediaDirectory, getCommunityThumbnailMediaDirectory } from '@services/media/media'
import { getCoursesByUser, getPodcastsByUser, getCommunitiesByUser } from '@services/users/users'
import { getOrgCourses } from '@services/courses/courses'
import { getOrgPodcasts, removePodcastPrefix } from '@services/podcasts/podcasts'
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

/** Appends `extra` after `primary`, skipping items already listed. */
function mergeByUuid(primary: any[], extra: any[], key: string) {
  const seen = new Set(primary.map((item) => item?.[key]))
  return [...primary, ...extra.filter((item) => item && !seen.has(item[key]))]
}

function UserProfileClient({ userData, profile, orgslug }: UserProfileClientProps) {
  const { t, i18n } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const access_token = session?.data?.tokens?.access_token
  const contentLocale = (i18n.language || 'en').split('-')[0]
  // Ids, not usernames: a rename mid-session must not switch the tabs back to
  // authored-only. Viewing someone else keeps the portfolio semantics.
  const isOwnProfile =
    !!session?.data?.user?.id && String(session.data.user.id) === String(userData.id)
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

        let courses: any[] =
          coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value.data)
            ? coursesRes.value.data
            : []
        let podcasts: any[] =
          podcastsRes.status === 'fulfilled' && Array.isArray(podcastsRes.value.data)
            ? podcastsRes.value.data
            : []

        // The /users/{id} routes only return authored resources. On your own
        // profile the tabs answer "what can I open here", so the org listing is
        // merged in: it already covers published content, user-group access and
        // your own unpublished drafts.
        if (isOwnProfile) {
          const [orgCoursesRes, orgPodcastsRes] = await Promise.allSettled([
            getOrgCourses(orgslug, null, access_token, false, contentLocale),
            getOrgPodcasts(orgslug, null, access_token, false, contentLocale),
          ])
          if (orgCoursesRes.status === 'fulfilled' && Array.isArray(orgCoursesRes.value)) {
            courses = mergeByUuid(courses, orgCoursesRes.value, 'course_uuid')
          }
          if (orgPodcastsRes.status === 'fulfilled' && Array.isArray(orgPodcastsRes.value)) {
            podcasts = mergeByUuid(podcasts, orgPodcastsRes.value, 'podcast_uuid')
          }
        }

        if (!mounted) return

        setUserCourses(courses)
        setUserPodcasts(podcasts)
        if (communitiesRes.status === 'fulfilled' && Array.isArray(communitiesRes.value.data)) {
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
  }, [userData.id, access_token, contentLocale, isOwnProfile, orgslug])

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
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-dk-fg-1 leading-snug tracking-tight">
              {userData.first_name} {userData.last_name}
            </h1>
            {userData.username && (
              <p className="text-sm text-gray-400 dark:text-dk-fg-3">@{userData.username}</p>
            )}
            {userData.bio && (
              <p className="text-sm text-gray-600 dark:text-dk-fg-2 max-w-xl leading-relaxed">{userData.bio}</p>
            )}
            <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-dk-fg-3 mt-1">
              {tabs.map((tab) => (
                <span key={tab.id}>
                  <span className="font-semibold text-gray-900 dark:text-dk-fg-1">{tab.count}</span>
                  <span className="ml-1">{tab.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="border-b border-gray-200 dark:border-dk-line-strong px-4 sm:px-8 mb-6">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-gray-900 dark:text-dk-fg-1'
                  : 'border-transparent text-gray-500 dark:text-dk-fg-3 hover:text-gray-700 dark:hover:text-dk-fg-1 hover:border-gray-300 dark:hover:border-dk-line-strong'
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
                        lessons={course.extra_metadata?.lessons_count}
                        duration={course.extra_metadata?.duration || ''}
                        difficulty={course.extra_metadata?.difficulty || ''}
                        href={`/orgs/${orgslug}/course/${course.course_uuid || course.id}`}
                      />
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400 dark:text-dk-fg-3">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No courses yet</p>
                    <p className="text-sm mt-1">
                      {isOwnProfile
                        ? 'Courses you can open in this organisation will appear here.'
                        : 'Courses created by this user will appear here.'}
                    </p>
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
                      episodeCount={podcast.episode_count ?? podcast.extra_metadata?.episode_count ?? 0}
                      totalDurationSeconds={podcast.total_duration_seconds ?? podcast.extra_metadata?.total_duration_seconds ?? 0}
                      creationDate={podcast.creation_date}
                      org_uuid={orgUuid}
                      href={`/orgs/${orgslug}/podcast/${removePodcastPrefix(podcast.podcast_uuid || podcast.id)}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400 dark:text-dk-fg-3">
                    <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No podcasts yet</p>
                    <p className="text-sm mt-1">
                      {isOwnProfile
                        ? 'Podcasts you can open in this organisation will appear here.'
                        : 'Podcasts created by this user will appear here.'}
                    </p>
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
                      resource_type={community.resource_type}
                      creation_date={community.creation_date}
                      thumbnail_image={community.thumbnail_image}
                      href={`/orgs/${orgslug}/community/${community.community_uuid || community.id}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-400 dark:text-dk-fg-3">
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
