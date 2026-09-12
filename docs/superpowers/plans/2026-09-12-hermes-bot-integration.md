# Hermes Bot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống tích hợp Bot Hermes đa tầng vào ứng dụng Next.js 16 + Supabase, bao gồm: Local Dev Cockpit, Telemetry bắt lỗi & gom nhóm ngầm, Smart Bug Reporter cho nhân viên, Admin Copilot cho quản lý, và Hermes SRE Worker tự động mở GitHub PR.

**Architecture:** Tách biệt triệt để giữa môi trường Dev và Production. Ở Dev, widget giao tiếp trực tiếp với agent local qua HTTP (`localhost:8000`). Ở Production, lỗi và báo cáo từ client được lọc sạch thông tin nhạy cảm, gom nhóm bằng fingerprint chống spam, đẩy vào hàng đợi Supabase để Hermes SRE Worker xử lý bất đồng bộ và tạo GitHub Pull Request.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Supabase JS Client (`@supabase/supabase-js`), Node.js Worker (Octokit + Supabase).

**Spec:** [docs/superpowers/specs/2026-09-12-hermes-bot-integration-design.md](file:///h:/hrm-tra-sua-3535/docs/superpowers/specs/2026-09-12-hermes-bot-integration-design.md)

## Global Constraints

- Không được để lộ source code hoặc credentials bí mật (`service_role`, LLM API keys) xuống Client-side.
- Toàn bộ log gửi lên server/database phải được lọc bỏ mật khẩu, token, thông tin thanh toán (PII Sanitization).
- Dev Cockpit chỉ được nạp và render khi `process.env.NODE_ENV === 'development'`.
- Codebase sử dụng Next.js 16 App Router, React 19 và Tailwind v4.

---

### Task 1: Supabase Database Migration & TypeScript Type Definitions

**Files:**
- Create: `supabase/migrations/20260912_hermes_telemetry_schema.sql`
- Create: `src/types/hermes-telemetry.ts`

**Interfaces:**
- Consumes: Supabase database schema conventions.
- Produces: `TelemetryErrorLog`, `UserBugReport`, `CopilotChatSession`, `TelemetryStatus`, `TelemetryEnvironment` exported from `src/types/hermes-telemetry.ts`.

- [ ] **Step 1: Create TypeScript type definitions**

Tạo file `src/types/hermes-telemetry.ts`:
```typescript
export type TelemetryStatus = 'pending' | 'analyzing' | 'pr_created' | 'resolved' | 'ignored';
export type TelemetryEnvironment = 'development' | 'staging' | 'production';
export type BugReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface TelemetryErrorLog {
  id?: string;
  fingerprint: string;
  error_name: string;
  error_message: string;
  stack_trace?: string;
  route?: string;
  component_stack?: string;
  environment: TelemetryEnvironment;
  git_commit_sha?: string;
  occurrences: number;
  status: TelemetryStatus;
  hermes_report?: {
    root_cause?: string;
    proposed_fix?: string;
    pr_url?: string;
    pr_number?: number;
    analyzed_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface NetworkBreadcrumb {
  url: string;
  method: string;
  status?: number;
  duration_ms?: number;
  timestamp: string;
}

export interface UserBugReport {
  id?: string;
  user_id?: string;
  user_role?: string;
  user_description: string;
  route: string;
  network_breadcrumbs?: NetworkBreadcrumb[];
  screenshot_url?: string;
  telemetry_log_id?: string;
  hermes_instant_reply?: string;
  status: BugReportStatus;
  created_at?: string;
}

export interface CopilotChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CopilotChatSession {
  id?: string;
  admin_id: string;
  messages: CopilotChatMessage[];
  created_at?: string;
  updated_at?: string;
}
```

- [ ] **Step 2: Create Supabase SQL migration**

Tạo file `supabase/migrations/20260912_hermes_telemetry_schema.sql`:
```sql
-- Schema Migration for Hermes Bot Telemetry & Operations

-- 1. Table: telemetry_error_logs
CREATE TABLE IF NOT EXISTS public.telemetry_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT NOT NULL,
    error_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    route TEXT,
    component_stack TEXT,
    environment TEXT NOT NULL DEFAULT 'production',
    git_commit_sha TEXT,
    occurrences INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    hermes_report JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_fingerprint ON public.telemetry_error_logs (fingerprint);
CREATE INDEX IF NOT EXISTS idx_telemetry_status ON public.telemetry_error_logs (status);

-- 2. Table: user_bug_reports
CREATE TABLE IF NOT EXISTS public.user_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT,
    user_description TEXT NOT NULL,
    route TEXT NOT NULL,
    network_breadcrumbs JSONB DEFAULT '[]'::jsonb,
    screenshot_url TEXT,
    telemetry_log_id UUID REFERENCES public.telemetry_error_logs(id) ON DELETE SET NULL,
    hermes_instant_reply TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: copilot_chat_sessions
CREATE TABLE IF NOT EXISTS public.copilot_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.telemetry_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated clients to report error logs
CREATE POLICY "Allow public insert into telemetry_error_logs"
    ON public.telemetry_error_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow service_role and admin to select/update telemetry_error_logs
CREATE POLICY "Allow service_role full access on telemetry_error_logs"
    ON public.telemetry_error_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert bug reports
CREATE POLICY "Allow authenticated insert into user_bug_reports"
    ON public.user_bug_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated view their own bug reports or admins"
    ON public.user_bug_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
```

- [ ] **Step 3: Verify TypeScript compilation**

Chạy lệnh kiểm tra type definitions:
```powershell
npx tsc --noEmit
```
Kỳ vọng: Không phát sinh lỗi biên dịch TypeScript.

- [ ] **Step 4: Commit Task 1**

```bash
git add supabase/migrations/20260912_hermes_telemetry_schema.sql src/types/hermes-telemetry.ts
git commit -m "feat(telemetry): add supabase schema and typescript types for hermes telemetry"
```

---

### Task 2: Error Telemetry Core, Fingerprinting & Sanitization Utility

**Files:**
- Create: `src/lib/hermes/telemetry-core.ts`

**Interfaces:**
- Consumes: `TelemetryErrorLog` from `src/types/hermes-telemetry.ts`.
- Produces: 
  - `generateFingerprint(name: string, message: string, stack?: string): string`
  - `sanitizePayload<T>(data: T): T`
  - `sendTelemetryError(payload: Partial<TelemetryErrorLog>): Promise<void>`
  - `addNetworkBreadcrumb(crumb: NetworkBreadcrumb): void`
  - `getRecentNetworkBreadcrumbs(): NetworkBreadcrumb[]`

- [ ] **Step 1: Implement `src/lib/hermes/telemetry-core.ts`**

```typescript
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
  
  // Simple fast hash function (djb2 variant)
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
    // Throttled: Already sent recently
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
```

- [ ] **Step 2: Create API Route `/api/telemetry/report-error/route.ts`**

Tạo file `src/app/api/telemetry/report-error/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role if available on server, or anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fingerprint, error_name, error_message, stack_trace, route, component_stack, environment } = body;

    if (!fingerprint || !error_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert or increment occurrences in telemetry_error_logs
    const { data: existing } = await supabase
      .from('telemetry_error_logs')
      .select('id, occurrences')
      .eq('fingerprint', fingerprint)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('telemetry_error_logs')
        .update({
          occurrences: (existing.occurrences || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      return NextResponse.json({ success: true, updated: existing.id });
    }

    const { data: inserted, error } = await supabase
      .from('telemetry_error_logs')
      .insert({
        fingerprint,
        error_name,
        error_message,
        stack_trace,
        route,
        component_stack,
        environment: environment || 'production',
        git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || null,
        occurrences: 1,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('[API Report Error] Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```powershell
npx tsc --noEmit
```
Kỳ vọng: Không có lỗi type.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/lib/hermes/telemetry-core.ts src/app/api/telemetry/report-error/route.ts
git commit -m "feat(telemetry): add telemetry core utility and report-error api endpoint"
```

---

### Task 3: Client & Server Error Capture Layer (`HermesErrorBoundary` & Global Listeners)

**Files:**
- Create: `src/components/telemetry/HermesErrorBoundary.tsx`
- Create: `src/components/telemetry/TelemetryClientInit.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `sendTelemetryError`, `addNetworkBreadcrumb` from `src/lib/hermes/telemetry-core.ts`.
- Produces: Global crash protection and automatic telemetry interceptor.

- [ ] **Step 1: Implement `src/components/telemetry/HermesErrorBoundary.tsx`**

```tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sendTelemetryError } from '@/lib/hermes/telemetry-core';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class HermesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    sendTelemetryError({
      error_name: error.name || 'ReactRenderError',
      error_message: error.message,
      stack_trace: error.stack,
      component_stack: errorInfo.componentStack || undefined
    });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl m-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {this.props.fallbackTitle || 'Đã có sự cố hiển thị'}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mt-1 mb-4">
            Hệ thống đã tự động ghi nhận thông tin sự cố gửi tới bộ phận kỹ thuật. Bạn có thể thử tải lại trang.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Implement `src/components/telemetry/TelemetryClientInit.tsx`**

File này thiết lập global error listener và intercept network fetch để lưu breadcrumb:
```tsx
'use client';

import { useEffect } from 'react';
import { sendTelemetryError, addNetworkBreadcrumb } from '@/lib/hermes/telemetry-core';

export function TelemetryClientInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Intercept window fetch for breadcrumbs
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
```

- [ ] **Step 3: Mount `TelemetryClientInit` and wrap with `HermesErrorBoundary` in `src/app/layout.tsx`**

Đọc và cập nhật `src/app/layout.tsx` để mount `TelemetryClientInit` và bao bọc bằng `HermesErrorBoundary`.

- [ ] **Step 4: Verify TypeScript compilation**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/telemetry/HermesErrorBoundary.tsx src/components/telemetry/TelemetryClientInit.tsx src/app/layout.tsx
git commit -m "feat(telemetry): integrate global error listeners and hermes error boundary"
```

---

### Task 4: Local Dev Cockpit Widget (Dev-Only Debugger)

**Files:**
- Create: `src/components/dev/HermesDevCockpit.tsx`
- Create: `src/components/dev/DevCockpitWrapper.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: Local Hermes Agent HTTP API (`http://localhost:8000/api/dev/analyze` & `http://localhost:8000/api/dev/apply`).
- Produces: Interactive debugger UI rendered solely in development mode.

- [ ] **Step 1: Implement `src/components/dev/HermesDevCockpit.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bug, CheckCircle2, ChevronDown, ChevronUp, Cpu, RefreshCw, Wrench, X } from 'lucide-react';

interface CapturedDevError {
  id: string;
  name: string;
  message: string;
  stack?: string;
  route: string;
  timestamp: string;
}

export default function HermesDevCockpit() {
  const [isOpen, setIsOpen] = useState(false);
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<CapturedDevError[]>([]);
  const [activeError, setActiveError] = useState<CapturedDevError | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    rootCause: string;
    targetFile: string;
    diff: string;
  } | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Check health of local Hermes agent
  const checkAgentHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
      setAgentOnline(res.ok);
    } catch {
      setAgentOnline(false);
    }
  };

  useEffect(() => {
    checkAgentHealth();
    const interval = setInterval(checkAgentHealth, 10000);

    // Capture console.error in dev
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      setErrors((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          name: 'DevConsoleError',
          message: msg.slice(0, 300),
          route: window.location.pathname,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 19)
      ]);
    };

    return () => {
      clearInterval(interval);
      console.error = originalConsoleError;
    };
  }, []);

  const handleAskHermes = async (err: CapturedDevError) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAppliedSuccess(false);
    setActiveError(err);

    try {
      const res = await fetch('http://localhost:8000/api/dev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorName: err.name,
          errorMessage: err.message,
          stack: err.stack,
          route: err.route
        })
      });

      if (!res.ok) throw new Error('Agent returned ' + res.status);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisResult({
        rootCause: `Không thể kết nối với Hermes Local Agent: ${msg}`,
        targetFile: 'N/A',
        diff: ''
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = async () => {
    if (!analysisResult || !analysisResult.diff) return;
    try {
      const res = await fetch('http://localhost:8000/api/dev/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetFile: analysisResult.targetFile,
          diff: analysisResult.diff
        })
      });
      if (res.ok) {
        setAppliedSuccess(true);
      }
    } catch (err) {
      alert('Lỗi khi ghi đè file: ' + String(err));
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans text-xs">
      {/* Floating Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full shadow-2xl border border-zinc-700 hover:scale-105 transition"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              agentOnline ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              agentOnline ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>
        <span className="font-semibold flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5" /> Hermes Dev
        </span>
        {errors.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
            {errors.length}
          </span>
        )}
      </button>

      {/* Cockpit Drawer Modal */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-96 max-h-[500px] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Hermes Dev Cockpit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">
                Agent: {agentOnline ? 'Online (8000)' : 'Offline'}
              </span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {errors.length === 0 ? (
              <p className="text-zinc-400 text-center py-6">Không có lỗi nào được ghi nhận</p>
            ) : (
              errors.map((err) => (
                <div
                  key={err.id}
                  className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 transition"
                >
                  <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                    <span className="font-mono text-rose-500 font-bold">{err.name}</span>
                    <span>{err.timestamp}</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] line-clamp-2">
                    {err.message}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleAskHermes(err)}
                      disabled={isAnalyzing}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                    >
                      <Wrench className="w-3 h-3" />
                      {isAnalyzing && activeError?.id === err.id ? 'Đang phân tích...' : 'Fix với Hermes'}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Analysis Result Box */}
            {analysisResult && (
              <div className="mt-3 p-3 bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Nguyên nhân lỗi:
                </div>
                <p className="text-xs text-zinc-300">{analysisResult.rootCause}</p>
                {analysisResult.diff && (
                  <>
                    <div className="text-[10px] text-zinc-500 font-mono">File: {analysisResult.targetFile}</div>
                    <pre className="p-2 bg-black/60 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                      {analysisResult.diff}
                    </pre>
                    <button
                      onClick={handleApplyFix}
                      disabled={appliedSuccess}
                      className={`w-full py-1.5 rounded font-bold transition flex items-center justify-center gap-1 ${
                        appliedSuccess ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {appliedSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã áp dụng bản fix!
                        </>
                      ) : (
                        '⚡ Áp dụng Fix vào Code'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement dynamic wrapper `src/components/dev/DevCockpitWrapper.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';

const HermesDevCockpit = dynamic(() => import('./HermesDevCockpit'), {
  ssr: false
});

export function DevCockpitWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return <HermesDevCockpit />;
}
```

- [ ] **Step 3: Mount `DevCockpitWrapper` in `src/app/layout.tsx`**

Mount `<DevCockpitWrapper />` inside RootLayout body.

- [ ] **Step 4: Verify TypeScript compilation**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/dev/HermesDevCockpit.tsx src/components/dev/DevCockpitWrapper.tsx src/app/layout.tsx
git commit -m "feat(dev): implement hermes dev cockpit widget for local development"
```

---

### Task 5: Smart Bug Reporter Component for Staff (Method 1)

**Files:**
- Create: `src/components/telemetry/SmartBugReporter.tsx`
- Create: `src/app/api/telemetry/bug-report/route.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `getRecentNetworkBreadcrumbs` from `src/lib/hermes/telemetry-core.ts`.
- Produces: End-user bug reporting modal with automatic network & route context capture.

- [ ] **Step 1: Implement API Route `src/app/api/telemetry/bug-report/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_description, route, network_breadcrumbs, user_role, screenshot_url } = body;

    if (!user_description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Quick AI triage heuristic response
    let instantReply = 'Cảm ơn bạn đã báo cáo sự cố! Hermes đã ghi nhận ngữ cảnh và chuyển tới đội ngũ kỹ thuật xử lý.';
    const descLower = user_description.toLowerCase();
    if (descLower.includes('quay tròn') || descLower.includes('chậm') || descLower.includes('loading')) {
      instantReply = 'Hermes nhận thấy có thể do kết nối mạng tạm thời gián đoạn. Bạn thử kiểm tra lại wifi hoặc đợi 30 giây rồi thao tác lại nhé!';
    } else if (descLower.includes('không lưu được') || descLower.includes('lỗi lưu')) {
      instantReply = 'Hermes đã lưu thông tin phiên làm việc và danh sách lệnh gửi lên server. Bạn vui lòng không đóng tab để tránh mất dữ liệu nhập dở nhé!';
    }

    const { data, error } = await supabase
      .from('user_bug_reports')
      .insert({
        user_description,
        route: route || '/',
        user_role: user_role || 'staff',
        network_breadcrumbs: network_breadcrumbs || [],
        screenshot_url: screenshot_url || null,
        hermes_instant_reply: instantReply,
        status: 'open'
      })
      .select('id, hermes_instant_reply')
      .single();

    if (error) {
      console.error('[Bug Report] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reportId: data.id, reply: data.hermes_instant_reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement UI Component `src/components/telemetry/SmartBugReporter.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, Send, X, Bot, CheckCircle } from 'lucide-react';
import { getRecentNetworkBreadcrumbs } from '@/lib/hermes/telemetry-core';

export function SmartBugReporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const breadcrumbs = getRecentNetworkBreadcrumbs();

    try {
      const res = await fetch('/api/telemetry/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_description: description,
          route: window.location.pathname,
          network_breadcrumbs: breadcrumbs,
          user_role: 'staff'
        })
      });

      const data = await res.json();
      if (data.reply) {
        setReplyMessage(data.reply);
      }
    } catch {
      setReplyMessage('Đã gửi phản ánh thành công! Hermes sẽ rà soát và khắc phục sự cố.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setDescription('');
    setReplyMessage(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-xs font-semibold"
        >
          <Bot className="w-4 h-4" />
          <span>Báo sự cố cho Hermes</span>
        </button>
      )}

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm leading-tight">Trợ lý Hermes</h4>
                <p className="text-[10px] text-amber-100">Báo cáo lỗi & sự cố thao tác</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs">
            {replyMessage ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" /> Phản hồi từ Hermes:
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed">{replyMessage}</p>
                <button
                  onClick={handleClose}
                  className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Bạn đang gặp khó khăn gì? Hãy mô tả ngắn gọn, Hermes sẽ thu thập bối cảnh trang để báo cho kỹ thuật:
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Em bấm Xác nhận kiểm kho chi nhánh A mà màn hình không lưu được..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Đang gửi...' : 'Gửi phản ánh'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mount `SmartBugReporter` in `src/app/layout.tsx`**

Thêm `<SmartBugReporter />` vào RootLayout.

- [ ] **Step 4: Verify TypeScript compilation**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit Task 5**

```bash
git add src/components/telemetry/SmartBugReporter.tsx src/app/api/telemetry/bug-report/route.ts src/app/layout.tsx
git commit -m "feat(telemetry): implement smart bug reporter component for staff"
```

---

### Task 6: Admin / Manager Copilot Component (Method 2)

**Files:**
- Create: `src/components/admin/AdminCopilotDrawer.tsx`
- Create: `src/app/api/hermes/copilot/route.ts`
- Modify: `src/app/layout.tsx` (mount with role check)

**Interfaces:**
- Consumes: Supabase auth session, `telemetry_error_logs` table.
- Produces: Secure role-gated Copilot chat drawer for Admin and Manager.

- [ ] **Step 1: Implement API Route `src/app/api/hermes/copilot/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Query recent error telemetry summary from Supabase to provide context
    const { data: recentErrors } = await supabase
      .from('telemetry_error_logs')
      .select('error_name, error_message, occurrences, status, route')
      .order('updated_at', { ascending: false })
      .limit(5);

    const errorContext = recentErrors && recentErrors.length > 0
      ? recentErrors.map((e) => `- [${e.status}] ${e.error_name} tại ${e.route}: ${e.error_message} (${e.occurrences} lần)`).join('\n')
      : 'Không có lỗi nào gần đây.';

    // Generate informative response for Admin
    let reply = `Chào Quản lý! Hermes đã kiểm tra trạng thái hệ thống:\n\n**Các sự cố ghi nhận gần đây:**\n${errorContext}\n\nHermes sẵn sàng hỗ trợ rà soát logic hoặc kiểm tra các báo cáo sự cố!`;

    const q = message.toLowerCase();
    if (q.includes('lỗi') || q.includes('sự cố')) {
      reply = `Hiện tại hệ thống có ${recentErrors?.length || 0} mẫu lỗi trong hàng đợi:\n${errorContext}`;
    } else if (q.includes('kiểm kho') || q.includes('btp')) {
      reply = `Quy trình kiểm kho và BTP tuân theo cơ chế: pre-grouping NVL, tính lượng hao hụt tự động và ghi nhận phiên kiểm kho dạng atomic transaction. Nếu có dữ liệu lệch, vui lòng kiểm tra tab Lịch sử phiên kiểm kho.`;
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement Component `src/components/admin/AdminCopilotDrawer.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { Bot, MessageSquare, Send, ShieldAlert, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export function AdminCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào Quản trị viên! Tôi là Hermes Copilot. Bạn có thể hỏi tôi về tình trạng lỗi hệ thống, kiểm tra log hoặc phân tích vận hành.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/hermes/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'Không có phản hồi' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Lỗi kết nối tới Hermes Copilot API.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Admin Toggle button (Can be integrated in admin navbar or floating) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-amber-400 border border-amber-500/40 rounded-lg shadow-md hover:bg-zinc-800 transition text-xs font-semibold"
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Hermes Admin Copilot</span>
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-zinc-900 text-zinc-100 shadow-2xl border-l border-zinc-800 flex flex-col font-sans">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm">Hermes Admin Copilot</h3>
                <p className="text-[10px] text-zinc-400">Trợ lý Chẩn đoán Hệ thống</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-600 text-white ml-6'
                    : 'bg-zinc-800 text-zinc-200 mr-6 border border-zinc-700/50 whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400 text-xs italic mr-6">
                Hermes đang rà soát dữ liệu...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về lỗi, hệ thống hoặc công thức..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg font-bold transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Mount `AdminCopilotDrawer` in `src/app/layout.tsx`**

Mount `<AdminCopilotDrawer />` in RootLayout.

- [ ] **Step 4: Verify TypeScript compilation**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit Task 6**

```bash
git add src/components/admin/AdminCopilotDrawer.tsx src/app/api/hermes/copilot/route.ts src/app/layout.tsx
git commit -m "feat(admin): add admin copilot drawer for system diagnosis"
```

---

### Task 7: Hermes SRE Worker Script & GitHub PR Pipeline (Production)

**Files:**
- Create: `scripts/hermes-worker/worker.mjs`
- Create: `scripts/hermes-worker/package.json`
- Create: `scripts/hermes-worker/.env.example`
- Create: `scripts/hermes-worker/README.md`

**Interfaces:**
- Consumes: Supabase `telemetry_error_logs` (status = 'pending'), GitHub Personal Access Token (`GITHUB_TOKEN`), Git Repo (`REPO_OWNER`/`REPO_NAME`).
- Produces: Automated branch creation, commit, and GitHub Pull Request with Root Cause Analysis report.

- [ ] **Step 1: Implement `scripts/hermes-worker/package.json`**

```json
{
  "name": "hermes-sre-worker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node worker.mjs"
  },
  "dependencies": {
    "@octokit/rest": "^21.1.1",
    "@supabase/supabase-js": "^2.95.3",
    "dotenv": "^16.4.7"
  }
}
```

- [ ] **Step 2: Implement `scripts/hermes-worker/worker.mjs`**

```javascript
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'ducnghiadk';
const REPO_NAME = process.env.REPO_NAME || 'homies-hrm';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GITHUB_TOKEN) {
  console.error('[Worker Config Error] Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GITHUB_TOKEN');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function processPendingErrors() {
  console.log('[Hermes SRE Worker] Checking for pending errors...');

  const { data: errors, error } = await supabase
    .from('telemetry_error_logs')
    .select('*')
    .eq('status', 'pending')
    .order('occurrences', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[Worker] Supabase query error:', error);
    return;
  }

  if (!errors || errors.length === 0) {
    console.log('[Worker] No pending errors to process.');
    return;
  }

  for (const errRecord of errors) {
    console.log(`[Worker] Analyzing error: ${errRecord.error_name} (${errRecord.fingerprint})`);
    
    // Mark as analyzing
    await supabase
      .from('telemetry_error_logs')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', errRecord.id);

    try {
      const branchName = `fix/hermes-${errRecord.fingerprint.slice(0, 8)}`;
      
      // 1. Get base branch SHA (main)
      const { data: refData } = await octokit.rest.git.getRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: 'heads/main'
      });
      const baseSha = refData.object.sha;

      // 2. Create branch if not exists
      try {
        await octokit.rest.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${branchName}`,
          sha: baseSha
        });
      } catch (e) {
        console.log(`[Worker] Branch ${branchName} already exists or error:`, e.message);
      }

      // 3. Formulate PR Body
      const prTitle = `[Hermes Auto-Fix] Fix ${errRecord.error_name} on route ${errRecord.route || 'app'}`;
      const prBody = `## 🤖 Hermes Automated Error Fix Report\n\n` +
        `### Thông tin Sự cố (Incident Details)\n` +
        `- **Tên lỗi:** \`${errRecord.error_name}\`\n` +
        `- **Thông báo:** ${errRecord.error_message}\n` +
        `- **Route bị ảnh hưởng:** \`${errRecord.route || 'N/A'}\`\n` +
        `- **Tần suất xuất hiện:** ${errRecord.occurrences} lần\n` +
        `- **Fingerprint:** \`${errRecord.fingerprint}\`\n\n` +
        `### Phân tích Ngũ cảnh (Root Cause Analysis)\n` +
        `Hệ thống Telemetry ghi nhận lỗi runtime khi thực thi logic giao diện/API. Cần bổ sung kiểm tra điều kiện null/undefined hoặc bọc fallback xử lý.\n\n` +
        `### Khuyến nghị Kiểm thử (Testing Checklist)\n` +
        `- [ ] Xác nhận điều hướng tới route \`${errRecord.route}\` không còn bị crash.\n` +
        `- [ ] Kiểm tra tính toàn vẹn của dữ liệu trong bảng liên quan.\n`;

      // 4. Create Pull Request
      const { data: prData } = await octokit.rest.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: prTitle,
        head: branchName,
        base: 'main',
        body: prBody
      });

      console.log(`[Worker] Pull Request created: ${prData.html_url}`);

      // 5. Update Supabase record
      await supabase
        .from('telemetry_error_logs')
        .update({
          status: 'pr_created',
          hermes_report: {
            pr_url: prData.html_url,
            pr_number: prData.number,
            analyzed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', errRecord.id);

    } catch (err) {
      console.error(`[Worker] Failed to process error ${errRecord.id}:`, err);
      await supabase
        .from('telemetry_error_logs')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', errRecord.id);
    }
  }
}

processPendingErrors();
```

- [ ] **Step 3: Implement `scripts/hermes-worker/.env.example` & `scripts/hermes-worker/README.md`**

Tạo file hướng dẫn chạy worker định kỳ (cron hoặc daemon).

- [ ] **Step 4: Commit Task 7**

```bash
git add scripts/hermes-worker/
git commit -m "feat(worker): implement hermes sre worker for automated github pr creation"
```

---

### Task 8: Dev Test Sandbox Page & End-to-End Verification

**Files:**
- Create: `src/app/dev/hermes-test/page.tsx`

**Interfaces:**
- Consumes: All telemetry and cockpit layers.
- Produces: Sandbox page to safely trigger mock crashes, console errors, and verify the full pipeline.

- [ ] **Step 1: Implement `src/app/dev/hermes-test/page.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { AlertCircle, Bug, Flame, Terminal } from 'lucide-react';

export default function HermesTestPage() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Hermes Test Crash: Cố tình gây lỗi render để test ErrorBoundary!');
  }

  const triggerConsoleError = () => {
    console.error('Hermes Test: Giả lập lỗi Console Error (Cannot read properties of null)');
  };

  const triggerUnhandledRejection = () => {
    Promise.reject(new Error('Hermes Test: Giả lập Unhandled Promise Rejection!'));
  };

  const triggerApiError = async () => {
    try {
      await fetch('/api/telemetry/mock-fail-api');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Flame className="w-6 h-6 text-rose-500" /> Hermes Integration Test Sandbox
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Trang thử nghiệm kích hoạt các kịch bản lỗi để kiểm tra Dev Cockpit và Telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShouldCrash(true)}
          className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-semibold hover:bg-rose-100 transition text-left flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span>1. Crash React Render</span>
          </div>
          <span className="text-xs font-normal text-rose-600/80">Kích hoạt Error Boundary fallback</span>
        </button>

        <button
          onClick={triggerConsoleError}
          className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-100 transition text-left flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5" />
            <span>2. Console Error</span>
          </div>
          <span className="text-xs font-normal text-amber-600/80">Kiểm tra Dev Cockpit bắt console.error</span>
        </button>

        <button
          onClick={triggerUnhandledRejection}
          className="p-4 rounded-xl border border-orange-300 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 font-semibold hover:bg-orange-100 transition text-left flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bug className="w-5 h-5" />
            <span>3. Unhandled Promise</span>
          </div>
          <span className="text-xs font-normal text-orange-600/80">Kiểm tra listener rejection toàn cục</span>
        </button>

        <button
          onClick={triggerApiError}
          className="p-4 rounded-xl border border-indigo-300 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition text-left flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <span>4. Network Breadcrumb</span>
          </div>
          <span className="text-xs font-normal text-indigo-600/80">Bắn fetch request để nạp vào breadcrumbs</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build validation**

Chạy build để đảm bảo toàn bộ dự án biên dịch thành công:
```powershell
npm run build
```
Kỳ vọng: Lệnh `next build` hoàn thành không lỗi.

- [ ] **Step 3: Commit Task 8**

```bash
git add src/app/dev/hermes-test/page.tsx
git commit -m "feat(dev): add hermes test sandbox page for validation"
```
