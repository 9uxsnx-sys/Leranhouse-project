'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import AuthPreviewShell, {
  fieldClass,
  primaryBtnClass,
  secondaryBtnClass,
} from './AuthPreviewShell'
import { PasswordStrengthIndicator } from '@components/Auth/PasswordStrengthIndicator'
import { Checkbox } from '@components/ui/checkbox'
import CheckEmailState from './CheckEmailState'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

export default function SignUpPreview({ org }: { org: any }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <AuthPreviewShell org={org}>
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.div key="form" {...fade}>
            {/* Form */}
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="su-username"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="su-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="su-email"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="su-email"
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
                <label
                  htmlFor="su-password"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="su-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                />
                <AnimatePresence initial={false}>
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <PasswordStrengthIndicator password={password} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="su-terms"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5 h-[18px] w-[18px] rounded-md border-gray-300 shadow-sm data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 data-[state=checked]:text-white focus-visible:ring-4 focus-visible:ring-gray-900/5"
                />
                <label
                  htmlFor="su-terms"
                  className="text-[13px] leading-relaxed text-gray-500 cursor-pointer select-none"
                >
                  I agree to the{' '}
                  <Link href="#" className="text-gray-700 underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="#" className="text-gray-700 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button type="submit" className={primaryBtnClass}>
                Create account
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

            {/* Sign in */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link
                href="/test-dev/auth"
                className="font-semibold text-gray-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="sent" {...fade}>
            <CheckEmailState
              email={email}
              message="We sent a verification link to"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPreviewShell>
  )
}
