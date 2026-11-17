'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, MessageSquare, HelpCircle, Lightbulb, Megaphone, Star, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { DISCUSSION_LABELS, DiscussionLabel } from '@services/communities/discussions'

interface LabelFilterProps {
  value: string | null
  onChange: (value: string | null) => void
}

// Get the icon component for a label
function getLabelIcon(iconName: string, size: number = 12) {
  switch (iconName) {
    case 'HelpCircle':
      return <HelpCircle size={size} />
    case 'Lightbulb':
      return <Lightbulb size={size} />
    case 'Megaphone':
      return <Megaphone size={size} />
    case 'Star':
      return <Star size={size} />
    default:
      return <MessageSquare size={size} />
  }
}

export function LabelFilter({ value, onChange }: LabelFilterProps) {
  const { t } = useTranslation()
  const currentLabel = value ? DISCUSSION_LABELS.find(l => l.id === value) : null

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-3 py-2 h-8 text-xs bg-gray-50 dark:bg-dk-inset/40 border border-gray-200 dark:border-dk-line-strong rounded-md hover:bg-gray-100 dark:hover:bg-dk-raised transition-colors">
            {currentLabel ? (
              <>
                <span style={{ color: currentLabel.color }}>
                  {getLabelIcon(currentLabel.icon, 12)}
                </span>
                <span className="font-medium text-gray-700 dark:text-dk-fg-1">{t(`communities.labels.${currentLabel.id}`)}</span>
              </>
            ) : (
              <>
                <span className="text-gray-500 dark:text-dk-fg-3">{t('communities.label_filter.label')}</span>
                <span className="font-medium text-gray-700 dark:text-dk-fg-1">{t('communities.label_filter.all')}</span>
              </>
            )}
            <ChevronDown size={12} className="text-gray-400 dark:text-dk-fg-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem
            onClick={() => onChange(null)}
            className={`flex items-center gap-2 text-sm cursor-pointer ${!value ? 'bg-gray-100 dark:bg-dk-inset text-gray-900 dark:text-dk-fg-1' : 'text-gray-600 dark:text-dk-fg-2'}`}
          >
            <MessageSquare size={14} className="text-gray-400 dark:text-dk-fg-3" />
            <span>{t('communities.label_filter.all_discussions')}</span>
          </DropdownMenuItem>
          {DISCUSSION_LABELS.map((label) => (
            <DropdownMenuItem
              key={label.id}
              onClick={() => onChange(label.id)}
              className={`flex items-center gap-2 text-sm cursor-pointer ${value === label.id ? 'bg-gray-100 dark:bg-dk-inset text-gray-900 dark:text-dk-fg-1' : 'text-gray-600 dark:text-dk-fg-2'}`}
            >
              <span style={{ color: label.color }}>
                {getLabelIcon(label.icon, 14)}
              </span>
              <span>{t(`communities.labels.${label.id}`)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear button when filter is active */}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-dk-raised rounded transition-colors"
          title={t('communities.label_filter.clear_filter')}
        >
          <X size={12} className="text-gray-400 dark:text-dk-fg-3" />
        </button>
      )}
    </div>
  )
}

export default LabelFilter
