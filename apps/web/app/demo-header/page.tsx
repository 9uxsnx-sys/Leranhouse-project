'use client'

import React from 'react'
import {
  Signpost,
  ChatsCircle,
  SquaresFour,
  Question,
  MagnifyingGlass,
  CaretDown,
  User,
  Gear,
  SignOut,
  Crown,
  Globe,
  ShoppingBag,
  Shield,
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'

/* ------------------------------------------------------------------ */
/* Shared fake content strip shown under each header preview           */
/* ------------------------------------------------------------------ */

const FakePageContent = () => (
  <div className="bg-[#f8f8f8] px-10 py-8">
    <div className="h-4 w-40 rounded bg-gray-200/70" />
    <div className="mt-4 grid grid-cols-3 gap-4">
      <div className="h-24 rounded-lg border border-gray-200 bg-white" />
      <div className="h-24 rounded-lg border border-gray-200 bg-white" />
      <div className="h-24 rounded-lg border border-gray-200 bg-white" />
    </div>
  </div>
)

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

const Wordmark = ({ dark = false }: { dark?: boolean }) => (
  <span
    className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}
  >
    LearnHouse
  </span>
)

const ProfileChip = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
        dark ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
      }`}
    >
      A
    </div>
    {!dark && <span className="hidden text-xs text-gray-500 xl:block">admin@school.dev</span>}
  </div>
)

const NAV_LINKS = ['Courses', 'Community', 'Store', 'Collections']

const IconBtn = ({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className: string
  label: string
}) => (
  <button className={className} aria-label={label}>
    {children}
  </button>
)

/* ------------------------------------------------------------------ */
/* OPTION 1 — Medusa Minimal (recommended)                             */
/* White bar, hairline border, indigo used ONLY as accent.             */
/* ------------------------------------------------------------------ */

const OptionOne = () => (
  <div className="flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
    <div className="flex items-center gap-8">
      <LinkLike>
        <Wordmark />
      </LinkLike>
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link}
            href="#"
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              i === 0
                ? 'relative text-indigo-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {i === 0 && <span className="absolute inset-x-2 -bottom-px h-px bg-indigo-600" />}
            {link}
          </a>
        ))}
      </nav>
    </div>

    <div className="hidden max-w-sm flex-1 justify-center px-6 md:flex">
      <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20">
        <MagnifyingGlass size={15} className="text-gray-400" />
        <input
          placeholder="Search courses..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
        />
      </div>
    </div>

    <div className="flex items-center gap-1">
      <IconBtn label="Progress" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <Signpost size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Communities" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <ChatsCircle size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Dashboard" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <SquaresFour size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Help" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
        <Question size={19} weight="fill" />
      </IconBtn>
      <div className="ml-2 pl-2 border-l border-gray-200">
        <ProfileChip />
      </div>
    </div>
  </div>
)

/* ------------------------------------------------------------------ */
/* OPTION 2 — Brand accent, white bar                                  */
/* White bar + org primary color used on active link, search, avatar.  */
/* ------------------------------------------------------------------ */

const OptionTwo = () => (
  <div className="flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
    <div className="flex items-center gap-8">
      <LinkLike>
        <Wordmark />
      </LinkLike>
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link}
            href="#"
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              i === 0
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {link}
          </a>
        ))}
      </nav>
    </div>

    <div className="hidden max-w-sm flex-1 justify-center px-6 md:flex">
      <div className="flex w-full items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20">
        <MagnifyingGlass size={15} className="text-indigo-500" />
        <input
          placeholder="Search courses..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
        />
      </div>
    </div>

    <div className="flex items-center gap-1">
      <IconBtn label="Progress" className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">
        <Signpost size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Communities" className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">
        <ChatsCircle size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Dashboard" className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">
        <SquaresFour size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Help" className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700">
        <Question size={19} weight="fill" />
      </IconBtn>
      <div className="ml-2 pl-2 border-l border-gray-200">
        <ProfileChip />
      </div>
    </div>
  </div>
)

/* ------------------------------------------------------------------ */
/* OPTION 3 — Full color bar (current concept, refined)                */
/* Keeps org primary color bar + white text, but tighter and cleaner.  */
/* ------------------------------------------------------------------ */

const OptionThree = () => (
  <div
    className="flex h-14 w-full items-center justify-between border-b border-black/10 px-6"
    style={{ backgroundColor: '#4f46e5' }}
  >
    <div className="flex items-center gap-8">
      <LinkLike>
        <Wordmark dark />
      </LinkLike>
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link}
            href="#"
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              i === 0 ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            {link}
          </a>
        ))}
      </nav>
    </div>

    <div className="hidden max-w-sm flex-1 justify-center px-6 md:flex">
      <div className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 focus-within:border-white/50">
        <MagnifyingGlass size={15} className="text-white/70" />
        <input
          placeholder="Search courses..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-white/60"
        />
      </div>
    </div>

    <div className="flex items-center gap-1">
      <IconBtn label="Progress" className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white">
        <Signpost size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Communities" className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white">
        <ChatsCircle size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Dashboard" className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white">
        <SquaresFour size={19} weight="fill" />
      </IconBtn>
      <IconBtn label="Help" className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white">
        <Question size={19} weight="fill" />
      </IconBtn>
      <div className="ml-2 pl-2 border-l border-white/20">
        <ProfileChip dark />
      </div>
    </div>
  </div>
)

/* ------------------------------------------------------------------ */
/* Preview card wrapper                                                */
/* ------------------------------------------------------------------ */

const LinkLike = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex items-center">{children}</div>
)

const OPTIONS = [
  {
    number: 'Option 1',
    name: 'Medusa Minimal',
    tag: 'Recommended',
    description:
      'Pure white bar + hairline border. Brand color is used ONLY as accent (active link underline, search focus ring). Cleanest, most Medusa-like. Works perfectly with the future "brand = whole theme" upgrade.',
    bullets: [
      'White/98 background, 1px bottom border — flat, no color blocks',
      'Nav links muted gray, active link gets indigo underline + text',
      'Search as a soft pill with indigo focus ring',
      'Icon buttons muted gray, hover = light gray chip',
      'Profile chip with border separator on the right',
    ],
    render: <OptionOne />,
  },
  {
    number: 'Option 2',
    name: 'Brand Accent',
    tag: 'White bar + brand touch',
    description:
      'Still a white bar, but the org primary color shows up in more places: active nav pill, search border/icon, icon hover states. Keeps brand identity without a full color block.',
    bullets: [
      'White bar + hairline border, same flat structure as Option 1',
      'Active nav link = soft brand-tinted pill (indigo-50 bg + indigo-700 text)',
      'Search input gets a brand-colored border and icon',
      'Icon hover states tint toward the brand color',
      'Good middle ground: clean, but visibly branded',
    ],
    render: <OptionTwo />,
  },
  {
    number: 'Option 3',
    name: 'Full Color Bar',
    tag: 'Current concept, refined',
    description:
      'Keeps the current colored-bar concept (org primary color background + white text) but tightens spacing, makes icons/search pills consistent, and removes the visual noise.',
    bullets: [
      'Org primary color bar + white text (as today, but 56px and tidy)',
      'Active nav link = white/15 pill, others white/75',
      'Search pill = white/10 with white/20 border, white text',
      'Icon buttons white/80, hover = white/15 chip',
      'Only choose this if you really want a colored header',
    ],
    render: <OptionThree />,
  },
]

/* ------------------------------------------------------------------ */
/* ACCOUNT SECTION — chip + dropdown options (all variants)            */
/* ------------------------------------------------------------------ */

const DemoAvatar = ({ size = 28 }: { size?: number }) => (
  <div
    className="flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
    style={{ width: size, height: size }}
  >
    <User size={Math.round(size * 0.55)} weight="fill" />
  </div>
)

const DemoRoleBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
    <Crown size={10} weight="fill" />
    Admin
  </span>
)

/* Dropdown panel — flat minimal list (and optional card header) */
const DemoMenu = ({ card = false }: { card?: boolean }) => (
  <DropdownMenuContent className={`${card ? 'w-72' : 'w-60'} bg-white`} align="end">
    <DropdownMenuLabel>
      <div className="flex items-center gap-2.5">
        {card && <DemoAvatar size={40} />}
        {!card && <DemoAvatar size={24} />}
        <div className="min-w-0">
          <p className="text-sm font-medium capitalize leading-tight text-gray-900">Admin</p>
          <p className="truncate text-xs text-muted-foreground">admin@school.dev</p>
        </div>
        <div className="ml-auto">
          <DemoRoleBadge />
        </div>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="flex items-center gap-2">
      <Shield size={16} weight="fill" />
      <span>Dashboard</span>
    </DropdownMenuItem>
    <DropdownMenuItem className="flex items-center gap-2">
      <User size={16} weight="fill" />
      <span>Account settings</span>
    </DropdownMenuItem>
    <DropdownMenuItem className="flex items-center gap-2">
      <ShoppingBag size={16} weight="fill" />
      <span>Purchases</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="flex items-center gap-2">
      <Globe size={16} weight="fill" />
      <span>Language</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600">
      <SignOut size={16} weight="fill" />
      <span>Sign Out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
)

/* Chip 1 — bare avatar only */
const ChipBare = ({ panel = 'flat' }: { panel?: 'flat' | 'card' }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
        aria-label="Account"
      >
        <DemoAvatar size={28} />
      </button>
    </DropdownMenuTrigger>
    {panel === 'flat' ? <DemoMenu /> : <DemoMenu card />}
  </DropdownMenu>
)

/* Chip 2 — avatar + name */
const ChipName = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-gray-700 transition-colors hover:bg-gray-100">
        <DemoAvatar size={28} />
        <span className="hidden text-[13px] font-medium sm:block">Admin</span>
      </button>
    </DropdownMenuTrigger>
    <DemoMenu />
  </DropdownMenu>
)

/* Chip 3 — split actions (avatar + separate settings icon) */
const ChipSplit = () => (
  <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label="Account"
        >
          <DemoAvatar size={28} />
        </button>
      </DropdownMenuTrigger>
      <DemoMenu />
    </DropdownMenu>
    <button
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label="Settings"
    >
      <Gear size={19} weight="fill" />
    </button>
  </>
)

/* Chip 4 — one-line chip (avatar + name + caret + muted role dot) */
const ChipOneLine = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-gray-700 transition-colors hover:bg-gray-100">
        <DemoAvatar size={28} />
        <span className="hidden text-[13px] font-medium sm:block">Admin</span>
        <span className="hidden h-1.5 w-1.5 rounded-full bg-gray-300 sm:block" title="Admin role" />
        <CaretDown size={13} weight="fill" className="text-gray-400" />
      </button>
    </DropdownMenuTrigger>
    <DemoMenu />
  </DropdownMenu>
)

/* Chip C — no dropdown, actions as bar buttons */
const ChipIconActions = () => (
  <>
    <button
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label="Settings"
    >
      <Gear size={19} weight="fill" />
    </button>
    <button
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      aria-label="Sign out"
    >
      <SignOut size={19} weight="fill" />
    </button>
  </>
)

/* Medusa Minimal bar used for every account variant */
const AccountBar = ({ children }: { children: React.ReactNode }) => (
  <div>
    <div className="flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-8">
        <LinkLike>
          <Wordmark />
        </LinkLike>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link}
              href="#"
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                i === 0
                  ? 'relative text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {i === 0 && <span className="absolute inset-x-2 -bottom-px h-px bg-indigo-600" />}
              {link}
            </a>
          ))}
        </nav>
      </div>

      <div className="hidden max-w-sm flex-1 justify-center px-6 md:flex">
        <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20">
          <MagnifyingGlass size={15} className="text-gray-400" />
          <input
            placeholder="Search courses..."
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="ml-2 flex items-center gap-0.5 border-l border-gray-200 pl-2">
        {children}
      </div>
    </div>
    <FakePageContent />
  </div>
)

const ACCOUNT_OPTIONS = [
  {
    number: '1',
    name: 'Bare avatar chip',
    note: 'A single 24px round avatar in the bar. Everything (name, email, role, menu) opens on click.',
    render: <ChipBare />,
  },
  {
    number: '2',
    name: 'Avatar + name',
    note: 'Username beside the avatar, hides on small screens. No email, role pills, or caret in the bar.',
    render: <ChipName />,
  },
  {
    number: '3',
    name: 'Split actions',
    note: 'Bare avatar chip + a separate Settings gear button. Settings is one click, no dropdown needed.',
    render: <ChipSplit />,
  },
  {
    number: '4',
    name: 'One-line clean chip',
    note: 'Avatar + name + caret with a tiny muted role dot. Email moved into the dropdown.',
    render: <ChipOneLine />,
  },
]

const DROPDOWN_OPTIONS = [
  {
    number: 'A',
    name: 'Flat minimal list',
    note: 'One-line user header (avatar + name + email + muted role badge), hairline dividers, red sign-out.',
    render: <ChipBare />,
  },
  {
    number: 'B',
    name: 'User card header',
    note: 'Wider panel with a bigger header block: larger avatar, name, email, role badge — then the items.',
    render: <ChipBare panel="card" />,
  },
  {
    number: 'C',
    name: 'No dropdown (icon actions)',
    note: 'Settings + sign-out become plain bar buttons. Nothing hides behind a click.',
    render: <ChipIconActions />,
  },
]

export default function DemoHeaderPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] py-10 px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Public header — pick a direction
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Three desktop options for the org menu (PC view). Choose one and I&apos;ll apply it to the real
          header. Mobile gets handled after.
        </p>

        <div className="mt-10 space-y-10">
          {OPTIONS.map((opt) => (
            <section key={opt.number} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {opt.number}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">{opt.name}</h2>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">
                  {opt.tag}
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">{opt.description}</p>

              {/* Header preview */}
              <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
                {opt.render}
                <FakePageContent />
              </div>

              <ul className="mt-4 grid max-w-3xl gap-1.5 sm:grid-cols-2">
                {opt.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Account chip + dropdown options */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Account
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Account chip + dropdown</h2>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">
                All options
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
              Four account chip designs on the same Medusa Minimal bar, plus three dropdown treatments.
              Click each chip to open its menu — everything is interactive.
            </p>

            <div className="mt-5 grid gap-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Chip designs
                </p>
                <div className="grid gap-4">
                  {ACCOUNT_OPTIONS.map((acc) => (
                    <div key={acc.number}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {acc.number}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{acc.name}</span>
                        <span className="text-xs text-gray-400">{acc.note}</span>
                      </div>
                      <div className="rounded-lg border border-gray-200">{acc.render}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Dropdown panel styles
                </p>
                <div className="grid gap-4">
                  {DROPDOWN_OPTIONS.map((dd) => (
                    <div key={dd.number}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          {dd.number}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{dd.name}</span>
                        <span className="text-xs text-gray-400">{dd.note}</span>
                      </div>
                      <div className="rounded-lg border border-gray-200">{dd.render}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Tell me the option number you like (or mix features from several) and I&apos;ll build it into the real
          header.
        </p>
      </div>
    </main>
  )
}
