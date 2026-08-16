'use client'
import { useTranslation } from 'react-i18next'
import { PlusMini } from '@components/Objects/Icons/MedusaIcons'
import { buttonVariants } from '@components/ui/button'
import { cn } from '@/lib/utils'

interface NewCourseButtonProps {
  disabled?: boolean
}

function NewCourseButton({ disabled = false }: NewCourseButtonProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        buttonVariants({ variant: 'default', size: 'sm' }),
        'inline-flex w-fit cursor-pointer',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <PlusMini className="h-4 w-4" />
      {t('courses.new_course')}
    </div>
  )
}

export default NewCourseButton
