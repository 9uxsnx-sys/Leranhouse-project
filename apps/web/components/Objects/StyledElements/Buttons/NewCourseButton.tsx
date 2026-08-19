'use client'
import { useTranslation } from 'react-i18next'
import { PlusMini } from '@components/Objects/Icons/MedusaIcons'
import { Button, ButtonProps } from '@components/ui/button'

interface NewCourseButtonProps extends ButtonProps {}

function NewCourseButton({ disabled, className, ...props }: NewCourseButtonProps) {
  const { t } = useTranslation()
  return (
    <Button variant="default" size="sm" disabled={disabled} className={className} {...props}>
      <PlusMini className="h-4 w-4" />
      {t('courses.new_course')}
    </Button>
  )
}

export default NewCourseButton
