'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AuthPreviewShell, { fieldClass, primaryBtnClass } from './AuthPreviewShell'
import CheckEmailState from './CheckEmailState'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
}

export default function ForgotPreview({ org }: { org: any }) {
  const [email, setEmail] = useState('')
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
                  htmlFor="fp-email"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="fp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <button type="submit" className={primaryBtnClass}>
                Send reset link
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
          <motion.div key="sent" {...fade}>
            <CheckEmailState email={email} message="We sent a reset link to" />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPreviewShell>
  )
}
