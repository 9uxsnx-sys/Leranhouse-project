/**
 * Shared class recipes for the auth surfaces.
 *
 * Every auth page (sign in, sign up, forgot, reset, verify) renders fields and
 * buttons from these constants so the look can never drift between pages.
 */

export const authFieldClass =
  'auth-field w-full h-11 px-3.5 rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-inset text-sm text-gray-900 dark:text-dk-fg-1 placeholder:text-gray-400 dark:placeholder:text-dk-fg-4 shadow-sm focus:outline-none focus:border-gray-400 dark:focus:border-dk-line-strong focus:ring-4 focus:ring-gray-900/5 dark:focus:ring-dk-fg-1/10 transition-colors'

export const authPrimaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-brand text-brand-fg shadow-sm text-sm font-semibold hover:bg-brand-hover active:bg-brand-pressed transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authSecondaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-card text-sm font-medium text-gray-600 dark:text-dk-fg-2 hover:bg-gray-50 dark:hover:bg-dk-raised transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authLabelClass = 'text-[13px] font-medium text-gray-700 dark:text-dk-fg-2'

export const authLinkClass =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-dk-fg-1 hover:underline'

export const authMutedLinkClass =
  'text-[13px] text-gray-500 dark:text-dk-fg-3 hover:text-gray-700 dark:hover:text-dk-fg-1 transition-colors'

export const authFieldErrorClass = 'text-[12px] text-rose-500 dark:text-rose-400'
