'use client'

interface CardMetaRowProps {
  /** Meta values in reading order (count, duration, level, date…). Falsy entries are dropped. */
  parts: Array<string | null | undefined>
}

/**
 * Metadata line under a card's description.
 *
 * Rendered as discrete, bidi-isolated items instead of one joined string: a
 * single string lets the browser merge adjacent Latin values into one LTR run,
 * which flips the visual order from card to card in RTL. The row is always
 * rendered so cards in a grid keep the same height.
 */
export function CardMetaRow({ parts }: CardMetaRowProps) {
  const items = parts.filter(Boolean) as string[]

  return (
    <div
      className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-gray-400 ${items.length === 0 ? 'invisible' : ''}`}
    >
      {items.length > 0 ? (
        items.map((part, index) => (
          <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
            <span dir="auto">{part}</span>
            {index < items.length - 1 && <span aria-hidden="true">·</span>}
          </span>
        ))
      ) : (
        <span>{'\u00A0'}</span>
      )}
    </div>
  )
}
