'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'

export const fieldClass =
  "auth-field w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5 transition-colors"

export const primaryBtnClass =
  "w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white shadow-sm text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"

export const secondaryBtnClass =
  "w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"

const SWITCHER_LINKS = [
  { href: '/test-dev/auth', label: 'Sign in' },
  { href: '/test-dev/auth/signup', label: 'Sign up' },
  { href: '/test-dev/auth/forgot', label: 'Forgot' },
  { href: '/test-dev/auth/reset', label: 'Reset' },
  { href: '/test-dev/auth/verify', label: 'Verify' },
]

function DevSwitcher() {
  const pathname = usePathname()
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {SWITCHER_LINKS.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-1.5 text-xs rounded-lg transition-colors ${
              active
                ? 'bg-white text-gray-900 font-semibold shadow-sm'
                : 'text-gray-500 font-medium hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}

export default function AuthPreviewShell({
  org,
  children,
}: {
  org: any
  children: React.ReactNode
}) {
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
    return { background: 'linear-gradient(041.61deg, #202020 7.15%, #000000 90.96%)' }
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1.4fr_1fr] h-screen bg-gray-50 animate-fade-in">
      {/* Neutralize Chrome's blue autofill background on the fields */}
      <style>{`
        .auth-field:-webkit-autofill,
        .auth-field:-webkit-autofill:hover,
        .auth-field:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset, 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          -webkit-text-fill-color: #111827;
          caret-color: #111827;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <DevSwitcher />

      {/* Left — image only (no branding content yet) */}
      <div
        className="relative h-[180px] lg:h-full overflow-hidden"
        style={getBackgroundStyle()}
      >
        {background_type !== 'gradient' && background_image && (
          <div className="absolute inset-0 bg-black/30" />
        )}
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-auto">
        <div className="w-full max-w-[360px]">
          <div className="bg-white rounded-xl card-shadow-rest p-8">{children}</div>
          <p className="text-center text-xs text-gray-400 mt-6">Privacy · Terms</p>
        </div>
      </div>
    </div>
  )
}
