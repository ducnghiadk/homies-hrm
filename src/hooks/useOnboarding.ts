'use client'

import { useState, useCallback, useEffect } from 'react'

// --- Types ---

export interface OnboardingTooltips {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
  dragDropIntro: boolean
  shiftBarHover: boolean
  undoButton: boolean
}

export interface CompletedFlows {
  quickEstimate: boolean
  optimization: boolean
  scheduling: boolean
}

export interface OnboardingState {
  // Welcome
  welcomeScreenDismissed: boolean
  welcomeScreenDismissedAt: string | null // ISO date

  // Tooltips
  tooltipsViewed: OnboardingTooltips

  // Templates
  templatesUsed: {
    traffic: string | null   // 'bubble_tea', 'coffee', etc.
    salary: string | null    // 'hcm', 'hanoi', etc.
  }

  // Analytics
  completedFlows: CompletedFlows
  firstScheduleCreatedAt: string | null // ISO date
}

// --- Defaults ---

const DEFAULT_STATE: OnboardingState = {
  welcomeScreenDismissed: false,
  welcomeScreenDismissedAt: null,
  tooltipsViewed: {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    dragDropIntro: false,
    shiftBarHover: false,
    undoButton: false,
  },
  templatesUsed: {
    traffic: null,
    salary: null,
  },
  completedFlows: {
    quickEstimate: false,
    optimization: false,
    scheduling: false,
  },
  firstScheduleCreatedAt: null,
}

const STORAGE_KEY = 'hrm_onboarding_state'
const STALE_DAYS = 7

// --- Safe localStorage helpers ---

function safeGetFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    console.warn('[useOnboarding] localStorage read error, using defaults')
    return defaultValue
  }
}

function safeSaveToStorage(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn('[useOnboarding] localStorage write error')
  }
}

// --- Hook ---

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() =>
    safeGetFromStorage(STORAGE_KEY, DEFAULT_STATE)
  )

  // Persist on every state change
  useEffect(() => {
    safeSaveToStorage(STORAGE_KEY, state)
  }, [state])

  // --- Welcome ---
  const dismissWelcome = useCallback((dontShowAgain: boolean) => {
    setState(prev => ({
      ...prev,
      welcomeScreenDismissed: dontShowAgain ? true : prev.welcomeScreenDismissed,
      welcomeScreenDismissedAt: new Date().toISOString(),
    }))
  }, [])

  const shouldShowWelcome = useCallback(() => {
    return !state.welcomeScreenDismissed
  }, [state.welcomeScreenDismissed])

  // --- Tooltips ---
  const markTooltipViewed = useCallback((id: keyof OnboardingTooltips) => {
    setState(prev => ({
      ...prev,
      tooltipsViewed: { ...prev.tooltipsViewed, [id]: true },
    }))
  }, [])

  const shouldShowTooltip = useCallback((id: keyof OnboardingTooltips) => {
    return !state.tooltipsViewed[id]
  }, [state.tooltipsViewed])

  // --- Templates ---
  const setTemplateUsed = useCallback((type: 'traffic' | 'salary', key: string) => {
    setState(prev => ({
      ...prev,
      templatesUsed: { ...prev.templatesUsed, [type]: key },
    }))
  }, [])

  // --- Flow completion ---
  const markFlowCompleted = useCallback((flow: keyof CompletedFlows) => {
    setState(prev => ({
      ...prev,
      completedFlows: { ...prev.completedFlows, [flow]: true },
      firstScheduleCreatedAt: prev.firstScheduleCreatedAt || new Date().toISOString(),
    }))
  }, [])

  // --- Stale check: reset if dismissed >7 days ago & no completed flows ---
  const checkStaleOnboarding = useCallback(() => {
    if (!state.welcomeScreenDismissedAt) return
    const dismissDate = new Date(state.welcomeScreenDismissedAt)
    const daysSince = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24)
    const hasCompleted = Object.values(state.completedFlows).some(Boolean)

    if (daysSince > STALE_DAYS && !hasCompleted) {
      setState({ ...DEFAULT_STATE })
    }
  }, [state.welcomeScreenDismissedAt, state.completedFlows])

  // Check stale on mount
  useEffect(() => {
    checkStaleOnboarding()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Reset ---
  const resetOnboarding = useCallback(() => {
    setState({ ...DEFAULT_STATE })
  }, [])

  return {
    state,
    // Welcome
    dismissWelcome,
    shouldShowWelcome,
    // Tooltips
    markTooltipViewed,
    shouldShowTooltip,
    // Templates
    setTemplateUsed,
    // Flows
    markFlowCompleted,
    // Stale
    checkStaleOnboarding,
    // Reset
    resetOnboarding,
  }
}
