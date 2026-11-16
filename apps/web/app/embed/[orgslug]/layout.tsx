'use client'

import { use, useEffect } from 'react'
import { OrgProvider, useOrg } from '@components/Contexts/OrgContext'
import OrgLanguageSync from '@components/Contexts/OrgLanguageSync'
import { getBrandStyle } from '@services/utils/ts/colorUtils'
import '@styles/globals.css'

/** Inside the provider so the org colour is available to the iframe shell. */
function EmbedShell({ children }: { children: React.ReactNode }) {
  const org = useOrg() as any
  const brandColor =
    org?.config?.config?.customization?.general?.color ||
    org?.config?.config?.general?.color ||
    ''

  useEffect(() => {
    const vars = getBrandStyle(brandColor)
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
    return () => {
      Object.keys(vars).forEach((key) => root.style.removeProperty(key))
    }
  }, [brandColor])

  return (
    <div className="min-h-screen" style={getBrandStyle(brandColor) as React.CSSProperties}>
      {children}
    </div>
  )
}

export default function EmbedLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ orgslug: string }>
  }
) {
  const params = use(props.params)
  const { children } = props

  return (
    <OrgProvider orgslug={params.orgslug}>
      <OrgLanguageSync />
      {/* Suppress the root layout fade-in animation for embeds */}
      <style>{`.animate-fade-in{animation:none!important;opacity:1!important}`}</style>
      <EmbedShell>
        {children}
      </EmbedShell>
    </OrgProvider>
  )
}
