// Route-based Code Splitting
// Phase 4: Performance optimization - Route configuration

import React, { lazy, Suspense } from 'react'

// Lazy loaded routes
const LazyAdminEmployees = lazy(() => import('@/app/employees/page'))
const LazyPayrollManage = lazy(() => import('@/app/payroll/page'))
const LazySettings = lazy(() => import('@/app/settings/page'))
const LazyLeaveApproval = lazy(() => import('@/app/leave/approval/page'))
const LazyReports = lazy(() => import('@/app/reports/attendance-report/page'))

// Route wrapper with loading state
interface RouteWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const DefaultFallback = () =>
  React.createElement('div', { className: 'min-h-screen p-4' },
    React.createElement('div', { className: 'max-w-lg mx-auto animate-pulse' },
      React.createElement('div', { className: 'h-48 bg-gray-200 rounded-xl mb-4' }),
      React.createElement('div', { className: 'h-24 bg-gray-200 rounded-xl mb-4' }),
      React.createElement('div', { className: 'h-16 bg-gray-200 rounded-xl' })
    )
  )

export function RouteWrapper({ children, fallback }: RouteWrapperProps) {
  return React.createElement(Suspense, { fallback: fallback || React.createElement(DefaultFallback) }, children)
}

// Export lazy components
export const LazyRoutes = {
  AdminEmployees: LazyAdminEmployees,
  PayrollManage: LazyPayrollManage,
  Settings: LazySettings,
  LeaveApproval: LazyLeaveApproval,
  Reports: LazyReports,
}

// Performance monitoring
interface BundleInfo { name: string; size: number }
const bundleStats: BundleInfo[] = []

export function trackBundle(name: string, size: number): void {
  bundleStats.push({ name, size })
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Bundle] ${name}: ${(size / 1024).toFixed(2)} KB`)
  }
}

export function printBundleReport(): void {
  const total = bundleStats.reduce((acc, b) => acc + b.size, 0)
  console.log('\nBundle Report: ', { total: `${(total / 1024).toFixed(2)} KB`, count: bundleStats.length })
}

// Core Web Vitals
interface PerformanceMetrics {
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
}

export function measureCoreWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve({}); return }
    const metrics: PerformanceMetrics = {}
    const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[]
    const fcp = paintEntries.find((p) => p.name === 'first-contentful-paint')
    if (fcp) metrics.fcp = fcp.startTime
    setTimeout(() => resolve(metrics), 1000)
  })
}

export function logPerformanceMetrics(): void {
  measureCoreWebVitals().then((m) => {
    console.log('Core Web Vitals:', m)
  })
}

const codeSplittingExports = { LazyRoutes, RouteWrapper, trackBundle, printBundleReport, measureCoreWebVitals, logPerformanceMetrics }

export default codeSplittingExports
