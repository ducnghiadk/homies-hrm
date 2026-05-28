

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = {
  userId?: string
  userRole?: string
  storeId?: string
  component?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  stack?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// LOG CONFIG
// ─────────────────────────────────────────────────────────────────────────────


const CONFIG = {
  enabled: process.env.NEXT_PUBLIC_DEBUG === 'true',
  minLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'warn',
  showTimestamp: false,
  showStack: process.env.NODE_ENV === 'development',
  persistErrors: true,
  maxLogs: 100,
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// ─────────────────────────────────────────────────────────────────────────────
// LOG STORAGE (for debugging)
// ─────────────────────────────────────────────────────────────────────────────

let logStore: LogEntry[] = []

export function getLogs(): LogEntry[] {
  return [...logStore]
}

export function clearLogs(): void {
  logStore = []
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE LOG FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  // Skip if disabled or below min level
  if (!CONFIG.enabled || LEVEL_PRIORITY[level] < LEVEL_PRIORITY[CONFIG.minLevel]) {
    return
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }

  // Add stack trace for errors
  if (level === 'error' && CONFIG.showStack) {
    entry.stack = new Error().stack
  }

  // Store if enabled
  if (CONFIG.persistErrors && level === 'error') {
    logStore.push(entry)
    if (logStore.length > CONFIG.maxLogs) {
      logStore = logStore.slice(-CONFIG.maxLogs)
    }
  }

  // Format message with context
  const prefix = CONFIG.showTimestamp
    ? `[${entry.timestamp}] `
    : ''
  const contextStr = Object.keys(context).length > 0
    ? ` ${JSON.stringify(context)}`
    : ''
  const fullMessage = `${prefix}[${level.toUpperCase()}] ${message}${contextStr}`

  // Log to console with style
  const styles: Record<LogLevel, string> = {
    debug: 'color: #9ca3af',
    info: 'color: #2F6FA8',
    warn: 'color: #F6C85F',
    error: 'color: #D9381E; font-weight: bold',
  }


  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `%c${fullMessage}`,
    styles[level],
    level === 'error' && entry.stack ? '\n' + entry.stack : ''
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOG METHODS
// ─────────────────────────────────────────────────────────────────────────────

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log('debug', message, context),

  info: (message: string, context?: LogContext) =>
    log('info', message, context),

  warn: (message: string, context?: LogContext) =>
    log('warn', message, context),

  error: (message: string, error?: Error, context?: LogContext) => {
    log('error', message, {
      ...context,
      errorMessage: error?.message,
      errorStack: error?.stack,
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED LOGGERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth logger
 */
export const authLogger = {
  login: (email: string, success: boolean) => {
    logger.info(success ? 'User logged in' : 'Login failed', {
      action: 'login',
      email: email.replace(/.+@/, '***@'),
      success,
    })
  },
  logout: (userId: string) => {
    logger.info('User logged out', { action: 'logout', userId })
  },
  sessionExpired: (userId: string) => {
    logger.warn('Session expired', { action: 'session_expired', userId })
  },
  permissionDenied: (userId: string, resource: string) => {
    logger.warn('Permission denied', {
      action: 'permission_denied',
      userId,
      resource,
    })
  },
}

/**
 * API logger
 */
export const apiLogger = {
  request: (method: string, url: string, params?: Record<string, unknown>) => {
    logger.debug(`API Request: ${method} ${url}`, { method, url, params })
  },
  response: (method: string, url: string, status: number, duration: number) => {
    const context = {
      method,
      url,
      status,
      duration: `${duration}ms`,
    }
    const message = `API Response: ${method} ${url} → ${status}`
    if (status >= 400) {
      logger.error(message, undefined, context)
    } else if (status >= 300) {
      logger.warn(message, context)
    } else {
      logger.info(message, context)
    }
  },
  error: (method: string, url: string, error: Error) => {
    logger.error(`API Error: ${method} ${url}`, error, { method, url })
  },
}

/**
 * Sync logger
 */
export const syncLogger = {
  offline: () => {
    logger.warn('Device went offline', { action: 'offline' })
  },
  online: () => {
    logger.info('Device back online', { action: 'online' })
  },
  syncStart: (count: number) => {
    logger.info(`Sync started`, { action: 'sync_start', count })
  },
  syncComplete: (synced: number, failed: number) => {
    logger.info(`Sync complete`, {
      action: 'sync_complete',
      synced,
      failed,
    })
  },
  syncError: (error: Error, operation: string) => {
    logger.error(`Sync failed: ${operation}`, error, {
      action: 'sync_error',
      operation,
    })
  },
}

/**
 * Performance logger
 */
export const perfLogger = {
  start: (label: string) => {
    logger.debug(`Performance start: ${label}`, { action: 'perf_start', label })
  },
  end: (label: string, duration: number) => {
    const level = duration > 1000 ? 'warn' : 'info'
    logger[level](`Performance: ${label} took ${duration}ms`, {
      action: 'perf_end',
      label,
      duration: `${duration}ms`,
      slow: duration > 1000,
    })
  },
  mark: (name: string, value: number) => {
    logger.debug(`Performance mark: ${name}`, { action: 'perf_mark', name, value })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE MEASUREMENT
// ─────────────────────────────────────────────────────────────────────────────

export function measure<T>(
  label: string,
  fn: () => T,
  context?: LogContext
): T {
  const start = performance.now()
  try {
    const result = fn()
    perfLogger.end(label, performance.now() - start)
    return result
  } catch (error) {
    logger.error(`Error in ${label}`, error as Error, context)
    throw error
  }
}

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    perfLogger.end(label, performance.now() - start)
    return result
  } catch (error) {
    logger.error(`Async error in ${label}`, error as Error, context)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT DEVTOOLS LOGGING
// ─────────────────────────────────────────────────────────────────────────────

export function logComponentRender(componentName: string, props?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Render: ${componentName}`, { component: componentName, props })
  }
}

export function logStateUpdate(componentName: string, newState: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`State update: ${componentName}`, {
      component: componentName,
      state: newState,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const loggerExports = {
  logger,
  authLogger,
  apiLogger,
  syncLogger,
  perfLogger,
  measure,
  measureAsync,
  getLogs,
  clearLogs,
  logComponentRender,
  logStateUpdate,
}

export default loggerExports
