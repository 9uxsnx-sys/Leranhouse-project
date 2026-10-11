'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import AuthPreviewShell, {
  fieldClass,
  primaryBtnClass,
  secondaryBtnClass,
} from './AuthPreviewShell'

export default function SignInPreview({ org }: { org: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <AuthPreviewShell org={org}>
      {/* Form */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <label
            htmlFor="auth-email"
            className="text-[13px] font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-[13px] font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              href="/test-dev/auth/forgot"
              className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </div>

        <button type="submit" className={primaryBtnClass}>
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400">or</span>
        </div>
      </div>

      {/* Google */}
      <button type="button" className={secondaryBtnClass}>
        <img
          src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
          alt=""
          className="w-4 h-4"
        />
        Continue with Google
      </button>

      {/* Sign up */}
      <p className="text-center text-sm text-gray-500 mt-6">
        No account?{' '}
        <Link
          href="/test-dev/auth/signup"
          className="font-semibold text-gray-900 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthPreviewShell>
  )
}
