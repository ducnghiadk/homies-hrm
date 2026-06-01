// ═══════════════════════════════════════════════════════════════════════════════
// Performance Analyzer - Monitor & optimize app performance
// Phase 4: Code splitting & lazy loading utilities
// ═══════════════════════════════════════════════════════════════════════════════

import { logger } from './logger'

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE MARKER
// ─────────────────────────────────────────────────────────────────────────────

class PerformanceMarker {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  /**
   * Start timing for a label
   */
  start(label: string): void {
    this.marks.set(label, performance.now())
    logger.debug(`⏱️ Performance: Start "${label}"`)
  }

  /**
   * End timing and return duration
   */
  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      logger.warn(`Performance: No start found for "${label}"`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measures.set(label, duration)
    this.marks.delete(label)

    // Log based on duration
    if (duration > 1000) {
      logger.warn(`🐌 Performance: "${label}" is SLOW (${duration.toFixed(0)}ms)`, {
        label,
        duration: `${duration.toFixed(0)}ms`,
        slow: true,
      })
    } else if (duration > 500) {
      logger.warn(`⚠️ Performance: "${label}" took ${duration.toFixed(0)}ms`, {
        label,
        duration: `${duration.toFixed(0)}ms`,
      })
    } else {
      logger.debug(`✅ Performance: "${label}" (${duration.toFixed(0)}ms)`)
    }

    return duration
  }

  /**
   * Measure a function
   */
  measure<T>(label: string, fn: () => T): T {
    this.start(label)
    try {
      const result = fn()
      this.end(label)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }

  /**
   * Measure async function
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }

  /**
   * Get all recorded measures
   */
  getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }

  /**
   * Get slow operations (>500ms)
   */
  getSlowOperations(threshold = 500): Array<{ label: string; duration: number }> {
    return Array.from(this.measures.entries())
      .filter(([, duration]) => duration > threshold)
      .map(([label, duration]) => ({ label, duration }))
      .sort((a, b) => b.duration - a.duration)
  }

  /**
   * Print report
   */
  report(): void {
    const measures = this.getMeasures()
    const slow = this.getSlowOperations()

    console.log('\n📊 Performance Report')
    console.log('═'.repeat(40))

    if (Object.keys(measures).length === 0) {
      console.log('No performance measures recorded.')
      return
    }

    // Print all measures
    console.log('\n📈 All Measures:')
    Object.entries(measures)
      .sort(([, a], [, b]) => b - a)
      .forEach(([label, duration]) => {
        const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '✅'
        console.log(`  ${emoji} ${label}: ${duration.toFixed(0)}ms`)
      })

    // Print slow operations
    if (slow.length > 0) {
      console.log('\n🐌 Slow Operations:')
      slow.forEach(({ label, duration }) => {
        console.log(`  ⚠️ ${label}: ${duration.toFixed(0)}ms`)
      })
    }

    console.log('')
  }

  /**
   * Clear all measures
   */
  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }
}

export const perf = new PerformanceMarker()

// ─────────────────────────────────────────────────────────────────────────────
// LAZY LOAD ANALYZER
// ─────────────────────────────────────────────────────────────────────────────

interface LazyLoadStats {
  componentName: string
  loadedAt: number
  loadTime: number
  error?: string
}

const lazyLoadStats: LazyLoadStats[] = []

export function trackLazyLoad(
  componentName: string,
  startTime: number,
  error?: string
): void {
  const loadTime = performance.now() - startTime

  lazyLoadStats.push({
    componentName,
    loadedAt: Date.now(),
    loadTime,
    error,
  })

  // Keep only last 50 records
  if (lazyLoadStats.length > 50) {
    lazyLoadStats.shift()
  }

  logger.debug(`LazyLoad: "${componentName}" (${loadTime.toFixed(0)}ms)`, {
    component: componentName,
    loadTime: `${loadTime.toFixed(0)}ms`,
  })
}

export function getLazyLoadStats(): LazyLoadStats[] {
  return [...lazyLoadStats]
}

export function getLazyLoadReport(): {
  total: number
  failed: number
  avgLoadTime: number
  slowest: LazyLoadStats | null
} {
  if (lazyLoadStats.length === 0) {
    return { total: 0, failed: 0, avgLoadTime: 0, slowest: null }
  }

  const failed = lazyLoadStats.filter((s) => s.error).length
  const avgLoadTime = lazyLoadStats.reduce((acc, s) => acc + s.loadTime, 0) / lazyLoadStats.length
  const slowest = lazyLoadStats.reduce((prev, curr) =>
    curr.loadTime > prev.loadTime ? curr : prev
  )

  return { total: lazyLoadStats.length, failed, avgLoadTime, slowest }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNDLE SIZE TRACKER
// ─────────────────────────────────────────────────────────────────────────────

interface BundleStats {
  name: string
  size: number
  gzipped?: number
  timestamp: number
}

const bundleStats: BundleStats[] = []

export function trackBundleSize(name: string, size: number, gzipped?: number): void {
  bundleStats.push({
    name,
    size,
    gzipped,
    timestamp: Date.now(),
  })

  logger.debug(`Bundle: "${name}" (${(size / 1024).toFixed(2)} KB)`, {
    bundle: name,
    size: `${(size / 1024).toFixed(2)} KB`,
  })
}

export function getBundleReport(): {
  total: number
  byName: Record<string, BundleStats>
  largest: BundleStats | null
} {
  const byName: Record<string, BundleStats> = {}
  let largest: BundleStats | null = null

  bundleStats.forEach((stat) => {
    byName[stat.name] = stat
    if (!largest || stat.size > largest.size) {
      largest = stat
    }
  })

  return {
    total: bundleStats.length,
    byName,
    largest,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TIME TRACKER
// ─────────────────────────────────────────────────────────────────────────────

interface ApiStats {
  endpoint: string
  method: string
  responseTime: number
  status: number
  timestamp: number
}

const apiStats: ApiStats[] = []

export function trackApiCall(
  endpoint: string,
  method: string,
  responseTime: number,
  status: number
): void {
  apiStats.push({
    endpoint,
    method,
    responseTime,
    status,
    timestamp: Date.now(),
  })

  if (responseTime > 1000) {
    logger.warn(`🐌 API Slow: ${method} ${endpoint} (${responseTime.toFixed(0)}ms)`, {
      endpoint,
      method,
      responseTime: `${responseTime.toFixed(0)}ms`,
      slow: true,
    })
  }
}

export function getApiStats(): {
  avgResponseTime: number
  slowEndpoints: Array<{ endpoint: string; avg: number; count: number }>
  errorRate: number
} {
  if (apiStats.length === 0) {
    return { avgResponseTime: 0, slowEndpoints: [], errorRate: 0 }
  }

  const avgResponseTime = apiStats.reduce((acc, s) => acc + s.responseTime, 0) / apiStats.length
  const errors = apiStats.filter((s) => s.status >= 400).length
  const errorRate = (errors / apiStats.length) * 100

  // Group by endpoint
  const byEndpoint: Record<string, { total: number; count: number }> = {}
  apiStats.forEach((s) => {
    const key = `${s.method}:${s.endpoint}`
    if (!byEndpoint[key]) {
      byEndpoint[key] = { total: 0, count: 0 }
    }
    byEndpoint[key].total += s.responseTime
    byEndpoint[key].count++
  })

  const slowEndpoints = Object.entries(byEndpoint)
    .map(([key, data]) => ({
      endpoint: key,
      avg: data.total / data.count,
      count: data.count,
    }))
    .filter((e) => e.avg > 500)
    .sort((a, b) => b.avg - a.avg)

  return { avgResponseTime, slowEndpoints, errorRate }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT RENDER TRACKER
// ─────────────────────────────────────────────────────────────────────────────

const renderStats: Map<string, { count: number; totalTime: number; lastTime: number }> = new Map()

export function trackRender(componentName: string, renderTime: number): void {
  const existing = renderStats.get(componentName)

  if (existing) {
    existing.count++
    existing.totalTime += renderTime
    existing.lastTime = renderTime
  } else {
    renderStats.set(componentName, {
      count: 1,
      totalTime: renderTime,
      lastTime: renderTime,
    })
  }
}

export function getRenderStats(): Array<{
  component: string
  count: number
  avgTime: number
  lastTime: number
}> {
  return Array.from(renderStats.entries())
    .map(([component, stats]) => ({
      component,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      lastTime: stats.lastTime,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL PERFORMANCE REPORT
// ─────────────────────────────────────────────────────────────────────────────

export function generatePerformanceReport(): void {
  console.log('\n' + '═'.repeat(60))
  console.log('📊 FULL PERFORMANCE REPORT')
  console.log('═'.repeat(60))

  // Lazy Load Stats
  const lazyStats = getLazyLoadReport()
  console.log('\n📦 Lazy Loads:')
  console.log(`  Total: ${lazyStats.total}`)
  console.log(`  Failed: ${lazyStats.failed}`)
  console.log(`  Avg Load Time: ${lazyStats.avgLoadTime.toFixed(0)}ms`)
  if (lazyStats.slowest) {
    console.log(`  Slowest: ${lazyStats.slowest.componentName} (${lazyStats.slowest.loadTime.toFixed(0)}ms)`)
  }

  // API Stats
  const api = getApiStats()
  console.log('\n🌐 API Calls:')
  console.log(`  Avg Response: ${api.avgResponseTime.toFixed(0)}ms`)
  console.log(`  Error Rate: ${api.errorRate.toFixed(1)}%`)
  if (api.slowEndpoints.length > 0) {
    console.log('  Slow Endpoints:')
    api.slowEndpoints.slice(0, 5).forEach((e) => {
      console.log(`    ${e.endpoint}: ${e.avg.toFixed(0)}ms (${e.count} calls)`)
    })
  }

  // Render Stats
  const renders = getRenderStats()
  if (renders.length > 0) {
    console.log('\n🎨 Components (Slowest):')
    renders.slice(0, 5).forEach((r) => {
      const emoji = r.avgTime > 50 ? '🐌' : r.avgTime > 20 ? '⚠️' : '✅'
      console.log(`  ${emoji} ${r.component}: avg ${r.avgTime.toFixed(1)}ms (${r.count} renders)`)
    })
  }

  // Bundle Stats
  const bundle = getBundleReport()
  if (bundle.largest) {
    console.log('\n📦 Largest Bundle:')
    console.log(`  ${bundle.largest.name}: ${(bundle.largest.size / 1024).toFixed(2)} KB`)
  }

  console.log('\n' + '═'.repeat(60) + '\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-REPORT IN DEVELOPMENT
// ─────────────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  // Print report on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      generatePerformanceReport()
    })

    // Add command to window for manual report
    const perfWindow = window as Window & {
      perfReport?: typeof generatePerformanceReport
      perfClear?: () => void
    }

    perfWindow.perfReport = generatePerformanceReport
    perfWindow.perfClear = () => {
      perf.clear()
      lazyLoadStats.length = 0
      apiStats.length = 0
      renderStats.clear()
      console.log('Performance stats cleared.')
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT HOOKS
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react'

/**
 * Hook to track component render performance
 */
export function useTrackRender(componentName: string): void {
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (startTime.current === null) {
      startTime.current = performance.now()
      return
    }

    const renderTime = performance.now() - startTime.current
    startTime.current = performance.now()
    trackRender(componentName, renderTime)
  })
}

/**
 * Hook to track async operation
 */
export function useTrackAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
): { execute: () => Promise<T>; isLoading: boolean } {
  const startTime = useRef(0)
  const [isLoading, setIsLoading] = useState(false)
  void deps

  const execute = async (): Promise<T> => {
    startTime.current = performance.now()
    setIsLoading(true)
    try {
      const result = await asyncFn()
      return result
    } finally {
      setIsLoading(false)
    }
  }

  return { execute, isLoading }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const perfAnalyzerExports = {
  perf,
  trackLazyLoad,
  getLazyLoadStats,
  getLazyLoadReport,
  trackBundleSize,
  getBundleReport,
  trackApiCall,
  getApiStats,
  trackRender,
  getRenderStats,
  generatePerformanceReport,
  useTrackRender,
  useTrackAsync,
}

export default perfAnalyzerExports
