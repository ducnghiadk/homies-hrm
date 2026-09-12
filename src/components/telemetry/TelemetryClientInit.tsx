'use client';

import { useEffect } from 'react';
import { sendTelemetryError, addNetworkBreadcrumb } from '@/lib/hermes/telemetry-core';

export function TelemetryClientInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Intercept window fetch for network breadcrumbs
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || 'unknown';
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        // Ignore internal telemetry endpoints to avoid loops
        if (!url.includes('/api/telemetry/')) {
          addNetworkBreadcrumb({
            url,
            method,
            status: response.status,
            duration_ms: Date.now() - start,
            timestamp: new Date().toISOString()
          });
        }
        return response;
      } catch (err) {
        if (!url.includes('/api/telemetry/')) {
          addNetworkBreadcrumb({
            url,
            method,
            status: 0,
            duration_ms: Date.now() - start,
            timestamp: new Date().toISOString()
          });
        }
        throw err;
      }
    };

    // 2. Global Unhandled Errors
    const handleError = (event: ErrorEvent) => {
      sendTelemetryError({
        error_name: event.error?.name || 'UncaughtException',
        error_message: event.message || 'Unknown unhandled error',
        stack_trace: event.error?.stack
      });
    };

    // 3. Global Unhandled Promise Rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      sendTelemetryError({
        error_name: 'UnhandledRejection',
        error_message: typeof reason === 'string' ? reason : reason?.message || 'Promise rejected without error object',
        stack_trace: reason?.stack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
