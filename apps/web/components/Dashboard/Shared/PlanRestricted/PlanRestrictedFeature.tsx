'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { PlanLevel } from '@services/plans/plans'

interface PlanRestrictedFeatureProps {
  /** Ignored. Kept so existing call sites do not need a rename sweep. */
  currentPlan?: PlanLevel
  /** Ignored. Plan gates were removed from the platform. */
  requiredPlan?: PlanLevel
  /** Ignored. */
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
  /** Ignored. */
  customIcon?: React.ReactNode
  /** Ignored. */
  titleKey?: string
  /** Ignored. */
  descriptionKey?: string
  /** Always rendered. */
  children: React.ReactNode
  /** Ignored. */
  fullScreen?: boolean
}

/**
 * Plan gates were removed: every feature is available on every deployment.
 * This component is now a transparent wrapper kept for compatibility with the
 * existing call sites.
 */
const PlanRestrictedFeature: React.FC<PlanRestrictedFeatureProps> = ({
  children,
}) => <>{children}</>

export default PlanRestrictedFeature
