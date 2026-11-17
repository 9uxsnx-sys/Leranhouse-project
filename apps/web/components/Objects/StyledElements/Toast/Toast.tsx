'use client'
import React from 'react'
import { Toaster } from 'react-hot-toast'

function Toast() {
  return <Toaster position="top-center" toastOptions={{
    style: {
      borderRadius: '8px',
      // Tokens resolve per mode, so the toast follows the theme without a JS read.
      background: 'var(--color-ui-bg-base)',
      color: 'var(--color-ui-fg-base)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid var(--color-ui-border-base)',
    },
  }} />
}

export default Toast
