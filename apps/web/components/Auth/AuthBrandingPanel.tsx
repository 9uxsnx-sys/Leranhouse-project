'use client'
import React from 'react'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'

interface AuthBrandingPanelProps {
  org: any
}

/**
 * Left panel of the auth shell — the organization's uploaded image, shown as
 * an image (not as a CSS background) next to the white form panel.
 *
 * No dark overlay: nothing is layered on top of it, so the artwork keeps its
 * real colours. With no image configured the panel falls back to the default
 * dark gradient.
 */
export default function AuthBrandingPanel({ org }: AuthBrandingPanelProps) {
  const authBranding =
    org?.config?.config?.customization?.auth_branding ||
    org?.config?.config?.general?.auth_branding || {}

  const { background_type = 'gradient', background_image = '' } = authBranding

  // Uploads store a file name; legacy Unsplash selections store an absolute URL.
  const imageUrl =
    background_type === 'custom' && background_image
      ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, background_image)
      : background_type === 'unsplash' && background_image
        ? background_image
        : ''

  if (!imageUrl) {
    return (
      <div
        className="w-full h-full"
        style={{ background: 'linear-gradient(041.61deg, #202020 7.15%, #000000 90.96%)' }}
      />
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100 dark:bg-dk-inset">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  )
}
