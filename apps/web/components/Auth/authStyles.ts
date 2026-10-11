/**
 * Shared class recipes for the auth surfaces.
 *
 * Every auth page (sign in, sign up, forgot, reset, verify) renders fields and
 * buttons from these constants so the look can never drift between pages.
 */

export const authFieldClass =
  'auth-field w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5 transition-colors'

export const authPrimaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white shadow-sm text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authSecondaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authLabelClass = 'text-[13px] font-medium text-gray-700'

export const authLinkClass =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline'

export const authMutedLinkClass =
  'text-[13px] text-gray-500 hover:text-gray-700 transition-colors'

export const authFieldErrorClass = 'text-[12px] text-rose-500'
