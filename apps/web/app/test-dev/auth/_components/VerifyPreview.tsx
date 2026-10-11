'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AuthPreviewShell, { primaryBtnClass } from './AuthPreviewShell'

type VerifyState = 'verifying' | 'success' | 'error'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

export default function VerifyPreview({
  org,
  initialState,
}: {
  org: any
  initialState?: string
}) {
  // ?state=verifying|success|error pins a state for review.
  // Without it we mimic the real flow: spin briefly, then succeed.
  const pinned =
    initialState === 'verifying' ||
    initialState === 'success' ||
    initialState === 'error'
      ? initialState
      : null

  const [state, setState] = useState<VerifyState>(pinned ?? 'verifying')

  useEffect(() => {
    if (pinned) return
    const timer = setTimeout(() => setState('success'), 1600)
    return () => clearTimeout(timer)
  }, [pinned])

  return (
    <AuthPreviewShell org={org}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'verifying' && (
          <motion.div key="verifying" {...fade} className="text-center py-6">
            <Loader2 size={28} className="mx-auto animate-spin text-gray-400" />
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Verifying your email
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              This will only take a moment.
            </p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div key="success" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Check size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Email verified
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Your email has been confirmed. You can now sign in.
            </p>

            <div className="mt-6">
              <Link href="/test-dev/auth" className={primaryBtnClass}>
                Continue to sign in
              </Link>
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div key="error" {...fade} className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertTriangle size={22} className="text-gray-800" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Link invalid or expired
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              This verification link is no longer valid. Request a new one to
              continue.
            </p>

            <div className="mt-6">
              <Link href="/test-dev/auth/signup" className={primaryBtnClass}>
                Request a new link
              </Link>
            </div>

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
        )}
      </AnimatePresence>
    </AuthPreviewShell>
  )
}
