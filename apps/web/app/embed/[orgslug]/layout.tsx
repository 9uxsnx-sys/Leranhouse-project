'use client'

import { use, useEffect } from 'react'
import { OrgProvider, useOrg } from '@components/Contexts/OrgContext'
import OrgLanguageSync from '@components/Contexts/OrgLanguageSync'
import { getBrandStyle, getOrgBrandConfig } from '@services/utils/ts/colorUtils'
import { useTheme } from '@components/Contexts/ThemeContext'
import '@styles/globals.css'

/** Inside the provider so the org colour is available to the iframe shell. */
function EmbedShell({ children }: { children: React.ReactNode }) {
  const org = useOrg() as any
  const { resolvedTheme } = useTheme()
  const { light: lightBrand, dark: darkBrand } = getOrgBrandConfig(org?.config?.config)

  useEffect(() => {
    const vars = getBrandStyle(
      lightBrand.color,
      lightBrand.fg,
      lightBrand.sidebarBrand,
      lightBrand.hover,
      resolvedTheme,
      darkBrand
    )
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
    return () => {
      Object.keys(vars).forEach((key) => root.style.removeProperty(key))
    }
  }, [
    lightBrand.color,
    lightBrand.fg,
    lightBrand.sidebarBrand,
    lightBrand.hover,
    darkBrand.color,
    darkBrand.fg,
    darkBrand.hover,
    darkBrand.sidebarBrand,
    resolvedTheme,
  ])

  return (
    <div
      className="min-h-screen"
      style={
        getBrandStyle(
          lightBrand.color,
          lightBrand.fg,
          lightBrand.sidebarBrand,
          lightBrand.hover,
          resolvedTheme,
          darkBrand
        ) as React.CSSProperties
      }
    >
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
