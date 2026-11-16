'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, ArrowLeft, Trash2, Bookmark, Save, ChevronDown } from 'lucide-react'

/* ------------------------------------------------------------------ *
 *  Button comparison — LearnHouse (live components) vs Claude (spec)
 *
 *  Left  = the real <Button> from components/ui/button.tsx, running on
 *          our tokens. Hover / active / disabled are the real states.
 *  Right = Claude's measured spec. Anthropic Sans is licensed and not
 *          shipped here, so the type falls back to our Inter / Georgia.
 *          Everything else (fill, radius, height, padding, label colour)
 *          is the documented value.
 *
 *  Each element gets a full row and renders at natural size. Nothing is
 *  scaled down. Scroll, don't squint.
 * ------------------------------------------------------------------ */

const CLAUDE = {
  canvas: '#f5f4ed',
  surface: '#faf9f5',
  ink: '#141413',
  inkDeep: '#0f0f0e',
  onPrimary: '#faf9f5',
  body: '#5e5d59',
  label: '#4d4c48',
  muted: '#87867f',
  sand: '#e8e6dc',
  sandHover: '#dfdcd1',
  hairline: '#f0eee6',
  borderWarm: '#e8e6dc',
  ring: '#d1cfc5',
  terracotta: '#c96442',
  coral: '#d97757',
  error: '#b53333',
  errorHover: '#9e2b2b',
  disabledBg: '#e6dfd8',
  disabledFg: '#8e8b82',
  focus: '#3898ec',
}

type ClaudeVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand'

const claudeVariants: Record<ClaudeVariant, string> = {
  primary: 'bg-[#0f0f0e] text-[#faf9f5] hover:bg-[#252523]',
  secondary: 'bg-[#e8e6dc] text-[#4d4c48] hover:bg-[#dfdcd1]',
  outline: 'bg-transparent text-[#5e5d59] border border-[#d1cfc5] hover:bg-[#efece2]',
  ghost: 'bg-transparent text-[#4d4c48] hover:bg-[#efece2]',
  danger: 'bg-[#b53333] text-[#faf9f5] hover:bg-[#9e2b2b]',
  brand: 'bg-[#c96442] text-[#faf9f5] hover:bg-[#d97757]',
}

function ClaudeButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  iconOnly = false,
  children,
  className = '',
  style,
}: {
  variant?: ClaudeVariant
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  iconOnly?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const height = iconOnly ? 36 : size === 'sm' ? 32 : size === 'lg' ? 44 : 36
  const padding = iconOnly ? 0 : size === 'sm' ? '0 12px' : size === 'lg' ? '0 20px' : '0 16px'
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'relative inline-flex w-fit items-center justify-center gap-2 rounded-[8px] font-medium transition-colors',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        claudeVariants[variant],
        className,
      ].join(' ')}
      style={{ height, padding, fontSize, lineHeight: 1, ...style }}
    >
      <span className={loading ? 'invisible inline-flex items-center gap-2' : 'contents'}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  )
}

/* ---------------- row scaffolding ---------------- */

function Panel({
  side,
  meta,
  children,
  note,
}: {
  side: 'ours' | 'claude'
  meta: string
  children: React.ReactNode
  note?: string
}) {
  const isOurs = side === 'ours'
  return (
    <div
      className={isOurs ? 'bg-white lg:border-e lg:border-gray-200' : ''}
      style={isOurs ? undefined : { backgroundColor: CLAUDE.canvas }}
    >
      <div className="flex items-center justify-between gap-4 px-8 pt-6">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: isOurs ? '#71717a' : CLAUDE.muted }}
        >
          {isOurs ? 'LearnHouse' : 'Claude'}
        </span>
        <span
          className="text-right text-[10px] font-medium tabular-nums"
          style={{ color: isOurs ? '#a1a1aa' : CLAUDE.muted }}
        >
          {meta}
        </span>
      </div>

      <div className="flex min-h-[190px] flex-col items-start justify-center gap-6 px-8 py-10">
        <div className="flex flex-wrap items-center gap-4">{children}</div>
        {note && (
          <p
            className="max-w-[46ch] text-[11px] leading-relaxed"
            style={{ color: isOurs ? '#a1a1aa' : CLAUDE.muted }}
          >
            {note}
          </p>
        )}
      </div>
    </div>
  )
}

function Row({
  n,
  title,
  hint,
  oursMeta,
  claudeMeta,
  ours,
  claude,
  oursNote,
  claudeNote,
}: {
  n: string
  title: string
  hint: string
  oursMeta: string
  claudeMeta: string
  ours: React.ReactNode
  claude: React.ReactNode
  oursNote?: string
  claudeNote?: string
}) {
  return (
    <section className="border-t border-gray-200">
      <div className="mx-auto max-w-[1800px] px-6 pt-9">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-semibold tabular-nums text-gray-400">{n}</span>
          <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="mt-1 max-w-[90ch] text-[12px] leading-relaxed text-gray-500">{hint}</p>
      </div>

      <div className="mx-auto max-w-[1800px] px-6 pb-9 pt-5">
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-gray-200 lg:grid-cols-2">
          <Panel side="ours" meta={oursMeta} note={oursNote}>
            {ours}
          </Panel>
          <Panel side="claude" meta={claudeMeta} note={claudeNote}>
            {claude}
          </Panel>
        </div>
      </div>
    </section>
  )
}

/* ---------------- page ---------------- */

export default function ButtonComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="mx-auto max-w-[1800px] px-6 pb-8 pt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          Design lab · test route · nothing here touches the platform
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
          Buttons — LearnHouse vs Claude
        </h1>
        <p className="mt-3 max-w-[92ch] text-[13px] leading-relaxed text-gray-600">
          Left is the live <code className="rounded bg-gray-200/70 px-1 py-0.5 text-[12px]">Button</code> component
          running on our real tokens — hover, active and disabled are genuine states. Right is Claude&apos;s measured
          spec, reproduced by hand. Anthropic Sans is licensed and not shipped, so the type falls back to our Inter and
          Georgia; every other value is the documented one. Each element owns a full row and renders at natural size.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-gray-500">
          <span>
            <strong className="font-semibold text-gray-800">Ours:</strong> ink #27272A · 6px radius · 30px · 13px/500 ·
            label 88% white
          </span>
          <span>
            <strong className="font-semibold text-gray-800">Claude:</strong> ink #0F0F0E · 8px radius · 36px · 15px/400
            · label #FAF9F5
          </span>
        </div>
      </header>

      {/* 01 ------------------------------------------------------------ */}
      <Row
        n="01"
        title="Primary button"
        hint="The single most important action on a screen. Compare the weight of the fill, the corner and the label."
        oursMeta="#27272A · 6px · 30px · 13/500"
        claudeMeta="#0F0F0E · 8px · 36px · 15/400"
        ours={<Button>Continue learning</Button>}
        claude={<ClaudeButton>Continue learning</ClaudeButton>}
        oursNote="Slightly lighter ink, smaller corner, 6px shorter, and a tighter label. Reads a little softer than the rest of the UI."
        claudeNote="Near-black on warm parchment, bigger corner, roomier height. Reads as a firm, deliberate action."
      />

      {/* 02 ------------------------------------------------------------ */}
      <Row
        n="02"
        title="Primary label contrast"
        hint="Same button, zoomed on the label. This is the single biggest reason our primary looks slightly faded."
        oursMeta="rgba(255,255,255,0.88)"
        claudeMeta="#FAF9F5 (98%)"
        ours={
          <div className="flex h-24 w-72 items-center justify-center rounded-md bg-[#27272a] text-lg font-medium text-white/[0.88]">
            Save changes
          </div>
        }
        claude={
          <div className="flex h-24 w-72 items-center justify-center rounded-[8px] bg-[#141413] text-lg font-medium text-[#faf9f5]">
            Save changes
          </div>
        }
        oursNote="12% of the label is transparent, which lands the text around #DCDCDD instead of white. On a dark fill that is visible."
        claudeNote="Full-strength ivory. Higher contrast, crisper edge, no haze."
      />

      {/* 03 ------------------------------------------------------------ */}
      <Row
        n="03"
        title="Primary with a leading icon"
        hint="The most common shape in the dashboard: icon, label, one action."
        oursMeta="16px icon · 6px gap"
        claudeMeta="16px icon · 8px gap"
        ours={
          <Button>
            <Plus className="h-4 w-4" />
            New course
          </Button>
        }
        claude={
          <ClaudeButton>
            <Plus size={16} strokeWidth={2} />
            New course
          </ClaudeButton>
        }
        oursNote="Icon sits very close to the label. Fine at 13px, feels cramped once the label grows."
        claudeNote="More air between glyph and word — the pair reads as one object rather than two."
      />

      {/* 04 ------------------------------------------------------------ */}
      <Row
        n="04"
        title="Large / learner-facing CTA"
        hint="Continue learning, Get access, Start course. These are the buttons learners actually press."
        oursMeta="large · 14px/500 · 40px"
        claudeMeta="lg · 16px/400 · 44px"
        ours={
          <Button size="large">
            Start learning
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        }
        claude={
          <ClaudeButton size="lg">
            Start learning
            <ArrowRight size={16} />
          </ClaudeButton>
        }
        oursNote="Already the right scale for a learner action. Keep this size for anything outside the dashboard."
        claudeNote="One step larger and one step lighter in weight. Feels like a link-to-action rather than a system control."
      />

      {/* 05 ------------------------------------------------------------ */}
      <Row
        n="05"
        title="Small / toolbar button"
        hint="List toolbars, table rows, filter bars. High frequency, low emphasis."
        oursMeta="small · 13px/500 · 26px"
        claudeMeta="sm · 13px/500 · 32px"
        ours={
          <Button size="small" variant="secondary">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        }
        claude={
          <ClaudeButton size="sm" variant="secondary">
            <Plus size={14} />
            Add
          </ClaudeButton>
        }
        oursNote="26px tall is dense but correct for a data-heavy dashboard. It matches our input heights."
        claudeNote="32px is closer to a comfortable pointer target, at the cost of density."
      />

      {/* 06 ------------------------------------------------------------ */}
      <Row
        n="06"
        title="Secondary action"
        hint="Cancel, Back, Download. The supporting action that must never compete with the primary."
        oursMeta="white + 1px #E4E4E7 · 30px"
        claudeMeta="sand fill, no border · 36px"
        ours={
          <Button variant="secondary">Cancel</Button>
        }
        claude={<ClaudeButton variant="secondary">Cancel</ClaudeButton>}
        oursNote="White fill held together by a hairline border — the border does all the work, so on a white surface it almost disappears."
        claudeNote="Warm sand fill with no border. The fill itself defines the shape, so it survives on any background."
      />

      {/* 07 ------------------------------------------------------------ */}
      <Row
        n="07"
        title="Ghost / text button"
        hint="Toolbars, icon actions, anything that should be discoverable but quiet."
        oursMeta="transparent · hover #F4F4F5"
        claudeMeta="transparent · hover #EFECE2"
        ours={
          <Button variant="transparent">
            <ChevronDown className="h-4 w-4" />
            More options
          </Button>
        }
        claude={
          <ClaudeButton variant="ghost">
            <ChevronDown size={16} />
            More options
          </ClaudeButton>
        }
        oursNote="Hover fill is a cool grey. Against our neutral greys it is invisible; against Claude's warm canvas it would look blue."
        claudeNote="Hover is a warm tint drawn from the surface family, so the interaction never leaves the palette."
      />

      {/* 08 ------------------------------------------------------------ */}
      <Row
        n="08"
        title="Destructive action"
        hint="Delete. Shown only when the action cannot be undone."
        oursMeta="#E11D48 (rose-600)"
        claudeMeta="#B53333 (warm crimson)"
        ours={
          <Button variant="danger">
            <Trash2 className="h-4 w-4" />
            Delete course
          </Button>
        }
        claude={
          <ClaudeButton variant="danger">
            <Trash2 size={16} />
            Delete course
          </ClaudeButton>
        }
        oursNote="Rose 600 is pink-leaning and highly saturated. Next to zinc greys it looks like an alert colour, not a button."
        claudeNote="A deeper, warmer red. Still unmistakably destructive, but it belongs to the same family as the neutrals."
      />

      {/* 09 ------------------------------------------------------------ */}
      <Row
        n="09"
        title="The 5% — brand CTA"
        hint="The one place an organization's colour is allowed to appear on a button. Today it is not wired at all."
        oursMeta="ink #27272A — brand not connected"
        claudeMeta="terracotta #C96442 + 1px ring"
        ours={<Button>Get access</Button>}
        claude={<ClaudeButton variant="brand">Get access</ClaudeButton>}
        oursNote="Phase 4 will swap this ink for --brand. Until then every org sees the same dark button."
        claudeNote="Terracotta is the only chromatic button in the system and it appears once per page — never twice, never as a secondary."
      />

      {/* 10 ------------------------------------------------------------ */}
      <Row
        n="10"
        title="Icon-only button"
        hint="Row actions, close, bookmark, expand."
        oursMeta="icon · 32 × 32 · 6px"
        claudeMeta="36 × 36 · 8px"
        ours={
          <>
            <Button size="icon" variant="secondary" aria-label="Bookmark">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button size="icon" aria-label="Save">
              <Save className="h-4 w-4" />
            </Button>
          </>
        }
        claude={
          <>
            <ClaudeButton iconOnly variant="secondary" aria-label="Bookmark">
              <Bookmark size={16} />
            </ClaudeButton>
            <ClaudeButton iconOnly aria-label="Save">
              <Save size={16} />
            </ClaudeButton>
          </>
        }
        oursNote="32px is below the comfortable minimum for touch. Acceptable on desktop, tight in the Capacitor wrapper."
        claudeNote="36px square keeps the same height as the text buttons, so a toolbar row lines up perfectly."
      />

      {/* 11 ------------------------------------------------------------ */}
      <Row
        n="11"
        title="Disabled state"
        hint="Two different philosophies: replace the fill, or dim it."
        oursMeta="fill → #F4F4F5, text → grey"
        claudeMeta="same fill at 40% opacity"
        ours={<Button disabled>Save changes</Button>}
        claude={<ClaudeButton disabled>Save changes</ClaudeButton>}
        oursNote="The button stops looking like the action — it becomes a grey placeholder. The label also loses its accent context."
        claudeNote="The action keeps its identity and only loses presence. It still reads as the same button."
      />

      {/* 12 ------------------------------------------------------------ */}
      <Row
        n="12"
        title="Loading state"
        hint="What the button does between the click and the response. This is currently broken on our side — look closely."
        oursMeta="grey cover layer + children on top"
        claudeMeta="fill kept, label hidden, spinner on top"
        ours={<Button isLoading>Saving…</Button>}
        claude={<ClaudeButton loading>Saving…</ClaudeButton>}
        oursNote="The overlay paints #F4F4F5 across the whole button while the children are still rendered over it, so the label turns near-invisible and the spinner sits under the text. Fix is a component-level rewrite of the loading block."
        claudeNote="The fill never changes. The label is hidden but keeps its width, and one spinner takes its place — no layout jump, no flash."
      />

      {/* 13 ------------------------------------------------------------ */}
      <Row
        n="13"
        title="Focus ring"
        hint="Keyboard navigation. Forced on for this comparison so you can actually see it."
        oursMeta="2px ring at 20% ink + 2px offset"
        claudeMeta="solid ring in the focus hue"
        ours={
          <Button className="ring-2 ring-gray-900/20 ring-offset-2">Save changes</Button>
        }
        claude={
          <ClaudeButton style={{ outline: `2px solid ${CLAUDE.focus}`, outlineOffset: 2 }}>
            Save changes
          </ClaudeButton>
        }
        oursNote="20% ink on white is roughly 1.4:1 contrast — below the 3:1 minimum for a focus indicator. On a bright screen it is nearly invisible."
        claudeNote="Their focus hue (#3898EC) is the only cool colour in the entire system and exists purely for accessibility."
      />

      {/* 14 ------------------------------------------------------------ */}
      <Row
        n="14"
        title="Toolbar save states"
        hint="The pattern repeated in 15 files: idle, saving, saved. Same action, three expressions."
        oursMeta="hand-written ternary, duplicated"
        claudeMeta="split action: primary + secondary joined"
        ours={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800 px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              type="button"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800 px-2 py-1 text-sm font-semibold text-white opacity-50"
            >
              Saving…
            </button>
            <button
              type="button"
              className="inline-flex cursor-default items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-600"
            >
              Saved
            </button>
          </div>
        }
        claude={
          <div className="flex items-stretch gap-px overflow-hidden rounded-[8px]" style={{ background: CLAUDE.ring }}>
            <button
              type="button"
              className="px-4 font-medium text-[#faf9f5] transition-colors hover:bg-[#252523]"
              style={{ height: 36, fontSize: 15, background: CLAUDE.inkDeep, borderRadius: '8px 0 0 8px' }}
            >
              Save
            </button>
            <button
              type="button"
              className="px-3 font-medium text-[#4d4c48] transition-colors hover:bg-[#dfdcd1]"
              style={{ height: 36, fontSize: 15, background: CLAUDE.sand, borderRadius: '0 8px 8px 0' }}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        }
        oursNote="Three separate class strings across 15 files. They already drift — some say “Save”, some “Save changes”, some show a spinner instead of a label."
        claudeNote="Two actions joined into one control: the main verb, plus a secondary for variants. One shape, one radius, one height."
      />

      {/* 15 ------------------------------------------------------------ */}
      <Row
        n="15"
        title="The real “Continue learning” (course end)"
        hint="Exact markup from CourseEndView.tsx — this one is not a <Button>. This is what a learner actually presses."
        oursMeta="pill · 48px · 16px label · 20px icon"
        claudeMeta="8px radius · 44px · 15px label · 16px icon"
        ours={
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center space-x-2 rounded-full bg-zinc-800 px-6 py-3 text-white transition duration-200 hover:bg-zinc-700"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Continue learning</span>
          </a>
        }
        claude={
          <ClaudeButton size="lg">
            <ArrowLeft size={16} />
            Continue learning
          </ClaudeButton>
        }
        oursNote="A 48px pill with a 20px icon. Every dashboard button is a 30px 6px-radius rectangle. That means the product currently ships two button languages — they never sit side by side, which is why it went unnoticed."
        claudeNote="Claude has one shape everywhere: 8px radius, 36–44px, one icon size. A pill is never used for a button, so the control reads the same on a landing page and inside the app."
      />

      {/* footer ------------------------------------------------------- */}
      <footer className="mx-auto mt-6 max-w-[1800px] px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-[13px] font-semibold text-gray-900">How to read this</h3>
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-gray-600">
            <li>
              <strong className="font-semibold text-gray-800">Geometry is frozen.</strong> Nothing here is a request to
              resize a specific button. The only geometry question on the table is the 6px → 8px radius.
            </li>
            <li>
              <strong className="font-semibold text-gray-800">The big four fixes</strong> are rows 02, 08, 12 and 13:
              label opacity, danger hue, loading state, focus ring. All of them are inside-the-fill changes.
            </li>
            <li>
              <strong className="font-semibold text-gray-800">Claude&apos;s canvas is warm</strong> (#F5F4ED). Ours is
              near-white. That is deliberate — a warm canvas is a brand decision, not a button decision, and it is out
              of scope for this pass.
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
