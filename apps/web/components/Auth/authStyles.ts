/**
 * Shared class recipes for the auth surfaces.
 *
 * Every auth page (sign in, sign up, forgot, reset, verify) renders fields and
 * buttons from these constants so the look can never drift between pages.
 */

export const authFieldClass =
  'auth-field w-full h-11 px-3.5 rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-card text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:border-gray-400 dark:focus:border-zinc-500 focus:ring-4 focus:ring-gray-900/5 dark:focus:ring-zinc-100/10 transition-colors'

export const authPrimaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-brand text-brand-fg shadow-sm text-sm font-semibold hover:bg-brand-hover active:bg-brand-pressed transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authSecondaryBtnClass =
  'w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-card text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-dk-raised transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const authLabelClass = 'text-[13px] font-medium text-gray-700 dark:text-zinc-200'

export const authLinkClass =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-zinc-100 hover:underline'

export const authMutedLinkClass =
  'text-[13px] text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors'

export const authFieldErrorClass = 'text-[12px] text-rose-500'
