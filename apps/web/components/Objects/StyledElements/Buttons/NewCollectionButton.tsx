'use client'
import { useTranslation } from 'react-i18next'
import { PlusMini } from '@components/Objects/Icons/MedusaIcons'
import { buttonVariants } from '@components/ui/button'
import { cn } from '@/lib/utils'

function NewCollectionButton() {
  const { t } = useTranslation()
  return (
    <div className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex w-fit cursor-pointer')}>
      <PlusMini className="h-4 w-4" />
      {t('collections.new_collection')}
    </div>
  )
}

export default NewCollectionButton
