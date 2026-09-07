'use client'
import React from 'react'
import { Toaster } from 'react-hot-toast'

function Toast() {
  return <Toaster position="top-center" toastOptions={{
    style: {
      borderRadius: '8px',
      background: '#fff',
      color: '#111827',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid #e5e7eb',
    },
  }} />
}

export default Toast
