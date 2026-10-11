'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AuthPreviewShell, { fieldClass, primaryBtnClass } from './AuthPreviewShell'
import { PasswordStrengthIndicator } from '@components/Auth/PasswordStrengthIndicator'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

export default function ResetPreview({ org }: { org: any }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <AuthPreviewShell org={org}>
      <AnimatePresence mode="wait" initial={false}>
        {!done ? (
          <motion.div key="form" {...fade}>
            {/* Form */}
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                setDone(true)
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="rp-password"
                  className="text-[13px] font-medium text-gray-700"
                >
                  New password
                </label>
                <input
                  id="rp-password"
                  name="new_password"
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

              <div className="space-y-2">
                <label
                  htmlFor="rp-confirm"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Confirm password
                </label>
                <input
                  id="rp-confirm"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={fieldClass}
                />
                {mismatch && (
                  <p className="text-[12px] text-red-500">
                    Passwords don&apos;t match
                  </p>
                )}
              </div>

              <button type="submit" className={primaryBtnClass}>
                Change password
              </button>
            </form>

            {/* Back to sign in */}
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link
                href="/test-dev/auth"
                className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:underline"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="done" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Check size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Password changed
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              You can now sign in with your new password.
            </p>

            <div className="mt-6">
              <Link href="/test-dev/auth" className={primaryBtnClass}>
                Go to sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPreviewShell>
  )
}
