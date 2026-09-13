import { useEffect, useRef } from 'react'

import { logger } from './logger'

type PerformanceMetric = {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

type ApiMetrics = {
  endpoint: string
  method: string
  count: number
  totalDuration: number
  avgDuration: number
  maxDuration: number
  minDuration: number
  errorCount: number
}

type BrowserMemoryInfo = {
  usedJSHeapSize: number
  jsHeapSizeLimit: number
}

type BrowserPerformanceWithMemory = Performance & {
  memory?: BrowserMemoryInfo
}

type AnyFunction = (...args: unknown[]) => unknown
type CancelableFunction<T extends AnyFunction> = ((...args: Parameters<T>) => void) & {
  cancel: () => void
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  start(name: string, metadata?: Record<string, unknown>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    })
    logger.debug(`Performance: Started "${name}"`, { metric: name })
  }

  end(name: string): number | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      logger.warn(`Performance: No start found for "${name}"`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    if (duration > 1000) {
      logger.warn(`Performance: "${name}" is slow (${duration.toFixed(2)}ms)`, {
        metric: name,
        duration: `${duration.toFixed(2)}ms`,
        slow: true,
        ...metric.metadata,
      })
    } else {
      logger.debug(`Performance: "${name}" completed (${duration.toFixed(2)}ms)`, {
        metric: name,
        duration: `${duration.toFixed(2)}ms`,
      })
    }

    return duration
  }

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number | null {
    const startTime = this.marks.get(startMark)
    if (startTime === undefined) {
      logger.warn(`Performance: No mark found for "${startMark}"`)
      return null
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now()
    if (endTime === undefined) {
      logger.warn(`Performance: No mark found for "${endMark}"`)
      return null
    }

    const duration = endTime - startTime
    this.measures.set(name, duration)

    if (duration > 1000) {
      logger.warn(`Performance: "${name}" measured (${duration.toFixed(2)}ms)`, {
        measure: name,
        duration: `${duration.toFixed(2)}ms`,
        slow: true,
      })
    }

    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  getSlowMetrics(threshold = 1000): PerformanceMetric[] {
    return this.getMetrics().filter((metric) => metric.duration !== undefined && metric.duration > threshold)
  }

  clear(): void {
    this.metrics.clear()
    this.marks.clear()
    this.measures.clear()
  }
}

class ApiPerformanceMonitor {
  private metrics: Map<string, ApiMetrics> = new Map()

  track(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    error?: Error
  ): void {
    const key = `${method}:${endpoint}`
    const existing = this.metrics.get(key)

    if (existing) {
      existing.count += 1
      existing.totalDuration += duration
      existing.avgDuration = existing.totalDuration / existing.count
      existing.maxDuration = Math.max(existing.maxDuration, duration)
      existing.minDuration = Math.min(existing.minDuration, duration)
      if (status >= 400 || error) {
        existing.errorCount += 1
      }
    } else {
      this.metrics.set(key, {
        endpoint,
        method,
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        maxDuration: duration,
        minDuration: duration,
        errorCount: status >= 400 || error ? 1 : 0,
      })
    }

    if (duration > 2000) {
      logger.warn(`Slow API: ${method} ${endpoint} took ${duration.toFixed(0)}ms`, {
        endpoint,
        method,
        duration: `${duration.toFixed(0)}ms`,
        slow: true,
      })
    }
  }

  getMetrics(): ApiMetrics[] {
    return Array.from(this.metrics.values())
  }

  getSlowEndpoints(threshold = 1000): ApiMetrics[] {
    return this.getMetrics().filter((metric) => metric.avgDuration > threshold)
  }

  getErrorEndpoints(): ApiMetrics[] {
    return this.getMetrics().filter((metric) => metric.errorCount > 0)
  }

  clear(): void {
    this.metrics.clear()
  }

  report(): string {
    const metrics = this.getMetrics()
    const slow = this.getSlowEndpoints()
    const errors = this.getErrorEndpoints()

    return `
API Performance Report
======================
Total endpoints tracked: ${metrics.length}
Slow endpoints: ${slow.length}
Endpoints with errors: ${errors.length}

${slow.length > 0 ? `Slow Endpoints:\n${slow.map((metric) => `  ${metric.method} ${metric.endpoint}: avg ${metric.avgDuration.toFixed(0)}ms`).join('\n')}` : ''}
${errors.length > 0 ? `Error Endpoints:\n${errors.map((metric) => `  ${metric.method} ${metric.endpoint}: ${metric.errorCount} errors`).join('\n')}` : ''}
    `.trim()
  }
}

export const perf = new PerformanceTracker()
export const apiPerf = new ApiPerformanceMonitor()

export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef<number | null>(null)

  useEffect(() => {
    renderCountRef.current += 1
    const now = performance.now()
    const previousRenderTime = lastRenderTimeRef.current
    const timeSinceLastRender = previousRenderTime === null ? 0 : now - previousRenderTime
    lastRenderTimeRef.current = now

    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log(
        `%c[Render] ${componentName} #${renderCountRef.current} (${timeSinceLastRender.toFixed(2)}ms since last)`,
        'color: #6366f1'
      )
    }
  })

  return {
    getRenderCount: () => renderCountRef.current,
    resetCount: () => {
      renderCountRef.current = 0
      lastRenderTimeRef.current = null
    },
  }
}

export function useAsyncPerformance(operationName: string) {
  const startTimeRef = useRef<number | null>(null)
  const durationRef = useRef<number | null>(null)
  const errorRef = useRef<Error | null>(null)

  const start = () => {
    startTimeRef.current = performance.now()
    durationRef.current = null
    errorRef.current = null
    perf.start(operationName)
  }

  const end = () => {
    if (startTimeRef.current === null) {
      return null
    }

    durationRef.current = performance.now() - startTimeRef.current
    perf.end(operationName)
    return durationRef.current
  }

  const fail = (error: Error) => {
    errorRef.current = error
    return end()
  }

  return {
    start,
    end,
    fail,
    getDuration: () => durationRef.current,
    getError: () => errorRef.current,
    isSlow: () => {
      const duration = durationRef.current
      return duration !== null && duration > 1000
    },
  }
}

export function getMemoryInfo(): {
  used: number
  total: number
  percentage: number
} | null {
  if (typeof window === 'undefined') {
    return null
  }

  const browserPerformance = performance as BrowserPerformanceWithMemory
  const memory = browserPerformance.memory
  if (!memory) {
    return null
  }

  const used = Math.round(memory.usedJSHeapSize / 1048576)
  const total = Math.round(memory.jsHeapSizeLimit / 1048576)
  const percentage = Math.round((used / total) * 100)

  return { used, total, percentage }
}

export function logMemoryUsage(): void {
  const memory = getMemoryInfo()
  if (!memory) {
    return
  }

  logger.info(`Memory: ${memory.used}MB / ${memory.total}MB (${memory.percentage}%)`, {
    memory_used: `${memory.used}MB`,
    memory_total: `${memory.total}MB`,
    memory_percentage: `${memory.percentage}%`,
    high_memory: memory.percentage > 80,
  })
}

export function measureBundleSize(): {
  total: number
  byType: Record<string, number>
} {
  if (typeof window === 'undefined') {
    return { total: 0, byType: {} }
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const byType: Record<string, number> = {}
  let total = 0

  resources.forEach((resource) => {
    const size = resource.transferSize ?? 0
    const type = resource.name.match(/\.(\w+)$/)?.[1] ?? 'other'
    byType[type] = (byType[type] || 0) + size
    total += size
  })

  return {
    total: Math.round(total / 1024),
    byType: Object.fromEntries(
      Object.entries(byType).map(([key, value]) => [key, Math.round(value / 1024)])
    ) as Record<string, number>,
  }
}

export function createTimer(label: string) {
  const start = performance.now()

  return {
    stop: (log = true) => {
      const duration = performance.now() - start
      if (log) {
        logger.info(`${label}: ${duration.toFixed(2)}ms`, {
          timer: label,
          duration: `${duration.toFixed(2)}ms`,
        })
      }
      return duration
    },
    start,
  }
}

export function createDebouncedFunction<T extends AnyFunction>(
  fn: T,
  wait: number
): CancelableFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      fn(...args)
      timeout = null
    }, wait)
  }) as CancelableFunction<T>

  debounced.cancel = () => {
    if (!timeout) {
      return
    }

    clearTimeout(timeout)
    timeout = null
  }

  return debounced
}

export function createThrottledFunction<T extends AnyFunction>(
  fn: T,
  limit: number
): CancelableFunction<T> {
  let inThrottle = false
  let timeout: ReturnType<typeof setTimeout> | null = null

  const throttled = ((...args: Parameters<T>) => {
    if (inThrottle) {
      return
    }

    fn(...args)
    inThrottle = true
    timeout = setTimeout(() => {
      inThrottle = false
      timeout = null
    }, limit)
  }) as CancelableFunction<T>

  throttled.cancel = () => {
    inThrottle = false
    if (!timeout) {
      return
    }

    clearTimeout(timeout)
    timeout = null
  }

  return throttled
}

const performanceUtils = {
  perf,
  useRenderPerformance,
  useAsyncPerformance,
  apiPerf,
  getMemoryInfo,
  logMemoryUsage,
  measureBundleSize,
  createTimer,
  createDebouncedFunction,
  createThrottledFunction,
}

export default performanceUtils
