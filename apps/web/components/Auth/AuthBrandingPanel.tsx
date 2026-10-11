'use client'
import React from 'react'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'

interface AuthBrandingPanelProps {
  org: any
}

/**
 * Left panel of the auth shell — background image only.
 *
 * The org logomark / name / welcome message are intentionally omitted for now;
 * they will be layered back on top in a dedicated branding pass.
 */
export default function AuthBrandingPanel({ org }: AuthBrandingPanelProps) {
  const authBranding =
    org?.config?.config?.customization?.auth_branding ||
    org?.config?.config?.general?.auth_branding || {}

  const { background_type = 'gradient', background_image = '' } = authBranding

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background_type === 'custom' && background_image) {
      return {
        backgroundImage: `url(${getOrgAuthBackgroundMediaDirectory(org?.org_uuid, background_image)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (background_type === 'unsplash' && background_image) {
      return {
        backgroundImage: `url(${background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {
      background: 'linear-gradient(041.61deg, #202020 7.15%, #000000 90.96%)',
    }
  }

  const hasCustomBackground = background_type !== 'gradient' && background_image

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={getBackgroundStyle()}
    >
      {hasCustomBackground && <div className="absolute inset-0 bg-black/30" />}
    </div>
  )
}
