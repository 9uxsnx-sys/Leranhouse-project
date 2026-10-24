'use client'
import React, { use } from 'react'
import NotificationsManagement from '@components/Dashboard/Pages/Notifications/NotificationsManagement'

export default function NotificationsSubpage(props: {
  params: Promise<{ orgslug: string; subpage: string }>
}) {
  const params = use(props.params)

  return <NotificationsManagement orgslug={params.orgslug} subpage={params.subpage} />
}
