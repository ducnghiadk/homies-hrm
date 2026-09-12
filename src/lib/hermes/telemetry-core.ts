import { TelemetryErrorLog, NetworkBreadcrumb } from '@/types/hermes-telemetry';

// In-memory cache for recent fingerprints to prevent log storms (5 min throttle)
const recentFingerprints = new Map<string, number>();
const THROTTLE_WINDOW_MS = 5 * 60 * 1000;

// In-memory circular buffer for recent network requests (max 10 items)
const MAX_BREADCRUMBS = 10;
const breadcrumbBuffer: NetworkBreadcrumb[] = [];

/**
 * Generate a consistent SHA-256-like fingerprint hash from error traits
 */
export function generateFingerprint(errorName: string, errorMessage: string, stack?: string): string {
  // Extract top relevant stack frame (file + line), ignoring node_modules or anonymous wrappers
  let topFrame = 'unknown_location';
  if (stack) {
    const lines = stack.split('\n');
    for (const line of lines) {
      if (line.includes('src/') || line.includes('app/') || line.includes('components/')) {
        topFrame = line.trim();
        break;
      }
    }
  }

  const raw = `${errorName.trim()}:${errorMessage.trim()}:${topFrame}`;
  
  // Fast hash function (djb2 variant)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

/**
 * Recursively sanitize sensitive keys and tokens
 */
export function sanitizePayload<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      return data
        .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
        .replace(/password\s*[:=]\s*["']?[^"',\s]+["']?/gi, 'password="[REDACTED]"') as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'credit_card', 'service_role'];

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizePayload(value);
    }
  }
  return sanitized as T;
}

/**
 * Record a network call for diagnostic breadcrumbs
 */
export function addNetworkBreadcrumb(crumb: NetworkBreadcrumb): void {
  breadcrumbBuffer.push(crumb);
  if (breadcrumbBuffer.length > MAX_BREADCRUMBS) {
    breadcrumbBuffer.shift();
  }
}

export function getRecentNetworkBreadcrumbs(): NetworkBreadcrumb[] {
  return [...breadcrumbBuffer];
}

/**
 * Dispatch telemetry error to server endpoint or Supabase
 */
export async function sendTelemetryError(payload: Partial<TelemetryErrorLog>): Promise<void> {
  const fp = payload.fingerprint || generateFingerprint(payload.error_name || 'Error', payload.error_message || '', payload.stack_trace);
  
  const now = Date.now();
  const lastSent = recentFingerprints.get(fp);
  if (lastSent && (now - lastSent < THROTTLE_WINDOW_MS)) {
    // Throttled: Already sent recently within window
    return;
  }
  recentFingerprints.set(fp, now);

  const cleanPayload = sanitizePayload({
    ...payload,
    fingerprint: fp,
    environment: (process.env.NODE_ENV || 'production') as TelemetryErrorLog['environment'],
    route: typeof window !== 'undefined' ? window.location.pathname : payload.route,
    occurrences: 1,
    status: 'pending'
  });

  try {
    if (typeof window !== 'undefined') {
      await fetch('/api/telemetry/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
        keepalive: true
      });
    }
  } catch (err) {
    console.warn('[Hermes Telemetry] Failed to dispatch error log:', err);
  }
}
