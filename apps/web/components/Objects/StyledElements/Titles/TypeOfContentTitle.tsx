import React from 'react'
import { Heading } from '@components/ui/heading'

interface TypeOfContentTitleProps {
  title: string
  type: 'col' | 'cou' | 'tra' | 'pod' | 'board' | 'pg' | string
}

function TypeOfContentTitle({ title }: TypeOfContentTitleProps) {
  return (
    <Heading level="h2" className="text-gray-900 text-xl">
      {title}
    </Heading>
  )
}

export default TypeOfContentTitle
