'use client'
import { useTranslation } from 'react-i18next'
import { PlusMini } from '@components/Objects/Icons/MedusaIcons'
import { Button, ButtonProps } from '@components/ui/button'

interface NewCollectionButtonProps extends ButtonProps {}

function NewCollectionButton({ className, ...props }: NewCollectionButtonProps) {
  const { t } = useTranslation()
  return (
    <Button variant="default" size="sm" className={className} {...props}>
      <PlusMini className="h-4 w-4" />
      {t('collections.new_collection')}
    </Button>
  )
}

export default NewCollectionButton
