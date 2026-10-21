'use client'
import React from 'react'
import { usePodcast } from '@components/Contexts/PodcastContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getCanonicalUrl } from '@/lib/seo/utils'
import { Copy, ExternalLink } from 'lucide-react'
import { SiApplepodcasts, SiSpotify, SiYoutubemusic, SiAudible } from '@icons-pack/react-simple-icons'
import { Input } from '@components/ui/input'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none"

interface PodcastDistributionProps {
  orgslug: string
  podcastuuid: string
}

function PodcastDistribution({ orgslug, podcastuuid }: PodcastDistributionProps) {
  const { t } = useTranslation()
  const { podcast } = usePodcast()
  const org = useOrg() as any

  const shortUuid = podcastuuid.replace('podcast_', '')
  const feedUrl = getCanonicalUrl(orgslug, `/podcast/${shortUuid}/feed`)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('podcasts.dashboard.distribution.copied'))
  }

  return (
    <div className="space-y-3">
      {/* RSS Feed URL */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-1">
          {t('common.sections.rss_feed')}
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          {t('podcasts.dashboard.distribution.rss_description')}
        </p>
        <div className="flex items-center space-x-2">
          <Input
            readOnly
            value={feedUrl}
            className={`${fieldClassName} font-mono text-sm`}
          />
          <button
            onClick={() => copyToClipboard(feedUrl)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            <Copy size={14} />
            {t('podcasts.dashboard.distribution.copy')}
          </button>
          <a href={feedUrl} target="_blank" rel="noopener noreferrer">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              <ExternalLink size={14} />
              {t('common.preview')}
            </button>
          </a>
        </div>
        {!podcast?.published && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {t('podcasts.dashboard.distribution.unpublished_warning')}
            </p>
          </div>
        )}
      </div>

      {/* Distribution Guide */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-1">
          {t('common.sections.submit_to_directories')}
        </h3>
        <p className="text-gray-400 text-xs mb-6">
          {t('podcasts.dashboard.distribution.guide_description')}
        </p>

        <div className="space-y-4">
          {/* Apple Podcasts */}
          <div className="border border-gray-100 rounded-lg p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <SiApplepodcasts size={22} color="#fff" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Apple Podcasts</h4>
                <p className="text-xs text-gray-400">{t('podcasts.dashboard.distribution.apple.also_on_apple_music')}</p>
              </div>
            </div>
            <ol className="text-sm text-gray-600 space-y-2 ms-1">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">1.</span>
                <span>{t('podcasts.dashboard.distribution.apple.step1_before')} <a href="https://podcastsconnect.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">podcastsconnect.apple.com</a> {t('podcasts.dashboard.distribution.apple.step1_after')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">2.</span>
                <span>{t('podcasts.dashboard.distribution.apple.step2_before')} <strong>+</strong> {t('podcasts.dashboard.distribution.apple.step2_after')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">3.</span>
                <span>{t('podcasts.dashboard.distribution.apple.step3')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">4.</span>
                <span>{t('podcasts.dashboard.distribution.apple.step4')}</span>
              </li>
            </ol>
          </div>

          {/* Spotify */}
          <div className="border border-gray-100 rounded-lg p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-[#1DB954] rounded-xl flex items-center justify-center">
                <SiSpotify size={22} color="#fff" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Spotify</h4>
                <p className="text-xs text-gray-400">{t('podcasts.dashboard.distribution.spotify.largest_platform')}</p>
              </div>
            </div>
            <ol className="text-sm text-gray-600 space-y-2 ms-1">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">1.</span>
                <span>{t('podcasts.dashboard.distribution.spotify.step1_before')} <a href="https://podcasters.spotify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">podcasters.spotify.com</a> {t('podcasts.dashboard.distribution.spotify.step1_after')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">2.</span>
                <span>{t('podcasts.dashboard.distribution.spotify.step2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">3.</span>
                <span>{t('podcasts.dashboard.distribution.spotify.step3')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">4.</span>
                <span>{t('podcasts.dashboard.distribution.spotify.step4')}</span>
              </li>
            </ol>
          </div>

          {/* YouTube Music */}
          <div className="border border-gray-100 rounded-lg p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <SiYoutubemusic size={22} color="#fff" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">YouTube Music</h4>
                <p className="text-xs text-gray-400">{t('podcasts.dashboard.distribution.youtube.migrated_note')}</p>
              </div>
            </div>
            <ol className="text-sm text-gray-600 space-y-2 ms-1">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">1.</span>
                <span>{t('podcasts.dashboard.distribution.youtube.step1')} <a href="https://podcasts.google.com/publish" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">podcasts.google.com/publish</a></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">2.</span>
                <span>{t('podcasts.dashboard.distribution.youtube.step2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">3.</span>
                <span>{t('podcasts.dashboard.distribution.youtube.step3')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">4.</span>
                <span>{t('podcasts.dashboard.distribution.youtube.step4')}</span>
              </li>
            </ol>
          </div>

          {/* Amazon Music */}
          <div className="border border-gray-100 rounded-lg p-5">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-[#00A8E1] rounded-xl flex items-center justify-center">
                <SiAudible size={22} color="#fff" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Amazon Music / Audible</h4>
                <p className="text-xs text-gray-400">{t('podcasts.dashboard.distribution.amazon.also_on_alexa')}</p>
              </div>
            </div>
            <ol className="text-sm text-gray-600 space-y-2 ms-1">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">1.</span>
                <span>{t('podcasts.dashboard.distribution.amazon.step1_before')} <a href="https://podcasters.amazon.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">podcasters.amazon.com</a> {t('podcasts.dashboard.distribution.amazon.step1_after')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">2.</span>
                <span>{t('podcasts.dashboard.distribution.amazon.step2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-gray-800 shrink-0">3.</span>
                <span>{t('podcasts.dashboard.distribution.amazon.step3')}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-3">
          {t('common.sections.tips_for_distribution')}
        </h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
            <span>{t('podcasts.dashboard.distribution.tips.thumbnail_before')} <strong>{t('podcasts.dashboard.distribution.tips.thumbnail_strong')}</strong> {t('podcasts.dashboard.distribution.tips.thumbnail_after')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
            <span>{t('podcasts.dashboard.distribution.tips.episode_before')} <strong>{t('podcasts.dashboard.distribution.tips.episode_strong')}</strong> {t('podcasts.dashboard.distribution.tips.episode_after')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
            <span>{t('podcasts.dashboard.distribution.tips.description_before')} <strong>{t('podcasts.dashboard.distribution.tips.description_strong')}</strong> {t('podcasts.dashboard.distribution.tips.description_after')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
            <span>{t('podcasts.dashboard.distribution.tips.auto_publish')}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
            <span>{t('podcasts.dashboard.distribution.tips.propagation')}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default PodcastDistribution
