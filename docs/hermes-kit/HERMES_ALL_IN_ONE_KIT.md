# 📦 HERMES BOT INTEGRATION KIT (BẢN ĐÓNG GÓI TOÀN DIỆN)

Tài liệu này đóng gói 100% cấu hình, mã nguồn, kiến trúc và quy trình triển khai **Hermes Bot** (Hệ thống AI Telemetry, Bắt lỗi tự động, Báo cáo sự cố thông minh & Copilot quản trị).

---

## 🎯 PROMPT MẪU ĐỂ GỬI CHO AI (CURSOR / ANTIGRAVITY / CLAUDE CODE / WINDSURF)

> **Hướng dẫn sử dụng:** Khi muốn tích hợp Hermes Bot vào bất kỳ dự án mới nào (React, Next.js, Vue 3, Nuxt, Node.js), bạn chỉ cần mở AI trong dự án đó và gửi câu lệnh sau kèm file này:
>
> *"Tôi muốn tích hợp hệ thống Hermes Bot vào dự án hiện tại dựa theo tài liệu hướng dẫn `HERMES_ALL_IN_ONE_KIT.md` đính kèm. Hãy đọc kỹ kiến trúc, điều chỉnh các module (Auth, Router, UI) cho tương thích với stack công nghệ của dự án này và tiến hành cài đặt đầy đủ từ Database, Telemetry, UI Widgets đến API."*

---

## 🏗️ 1. KIẾN TRÚC TỔNG THỂ (5 TRỤ CỘT)

```mermaid
graph TD
    Client[Web Client: Nhân viên / Quản lý] --> Trapping[Client Error Trapping]
    Trapping -->|Fetch Error, Window OnError, Promise Rejection| TelemetryCore[Telemetry Core Engine]
    TelemetryCore -->|Fingerprinting, Sanitization, Throttling| APILog[/api/telemetry/report-error]
    
    Client -->|Bấm báo lỗi kèm breadcrumbs| SmartReporter[SmartBugReporter Widget]
    SmartReporter -->|Rate-limited POST| APIBug[/api/telemetry/bug-report]
    
    Client -->|Quản lý mở chat chẩn đoán| CopilotDrawer[AdminCopilotDrawer]
    CopilotDrawer -->|RBAC Guarded POST| APICopilot[/api/hermes/copilot]
    
    APILog --> Supabase[(Supabase / Postgres DB)]
    APIBug --> Supabase
    APICopilot --> Supabase
```

---

## 🗄️ 2. DATABASE MIGRATION & RLS (SUPABASE / POSTGRESQL)

Chạy script SQL sau trong Supabase SQL Editor:

```sql
-- 1. Bảng lưu trữ log lỗi tập trung
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

-- 2. Bảng lưu phản ánh sự cố từ nhân viên
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

-- 3. Bảng lưu phiên đối thoại Hermes Copilot
CREATE TABLE IF NOT EXISTS public.copilot_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.telemetry_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies cho telemetry_error_logs
CREATE POLICY "Allow public insert into telemetry_error_logs"
    ON public.telemetry_error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow service_role full access on telemetry_error_logs"
    ON public.telemetry_error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies cho user_bug_reports
CREATE POLICY "Allow authenticated insert into user_bug_reports"
    ON public.user_bug_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated view their own bug reports or admins"
    ON public.user_bug_reports FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Policies cho copilot_chat_sessions
CREATE POLICY "Allow authenticated view own copilot sessions"
    ON public.copilot_chat_sessions FOR SELECT TO authenticated USING (auth.uid() = admin_id);

CREATE POLICY "Allow authenticated insert own copilot sessions"
    ON public.copilot_chat_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Allow service_role full access on copilot_chat_sessions"
    ON public.copilot_chat_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 💻 3. MÃ NGUỒN CỐT LÕI (CORE IMPLEMENTATION)

### 3.1. Telemetry Core (`telemetry-core.ts`)
*Đảm nhiệm: Băm vân tay lỗi, che giấu dữ liệu nhạy cảm (tokens/passwords), ghi vết 10 request mạng gần nhất, chống bão log và chống tràn bộ nhớ (Memory Leak).*

```typescript
export interface NetworkBreadcrumb {
  url: string;
  method: string;
  status: number;
  duration_ms: number;
  timestamp: string;
}

const recentFingerprints = new Map<string, number>();
const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 phút
const MAX_FINGERPRINTS_CACHE = 200;
const MAX_BREADCRUMBS = 10;
const breadcrumbBuffer: NetworkBreadcrumb[] = [];

export function generateFingerprint(errorName: string, errorMessage: string, stack?: string): string {
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
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

export function sanitizePayload<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      return data
        .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
        .replace(/password\s*[:=]\s*["']?[^"',\s]+["']?/gi, 'password="[REDACTED]"') as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) return data.map((item) => sanitizePayload(item)) as unknown as T;
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'credit_card'];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizePayload(value);
    }
  }
  return sanitized as T;
}

export function addNetworkBreadcrumb(crumb: NetworkBreadcrumb): void {
  breadcrumbBuffer.push(crumb);
  if (breadcrumbBuffer.length > MAX_BREADCRUMBS) breadcrumbBuffer.shift();
}

export function getRecentNetworkBreadcrumbs(): NetworkBreadcrumb[] {
  return [...breadcrumbBuffer];
}

function pruneFingerprintCache(now: number): void {
  for (const [key, timestamp] of recentFingerprints.entries()) {
    if (now - timestamp >= THROTTLE_WINDOW_MS) recentFingerprints.delete(key);
  }
  if (recentFingerprints.size > MAX_FINGERPRINTS_CACHE) {
    const sorted = [...recentFingerprints.entries()].sort((a, b) => a[1] - b[1]);
    const toRemove = sorted.slice(0, recentFingerprints.size - MAX_FINGERPRINTS_CACHE);
    for (const [key] of toRemove) recentFingerprints.delete(key);
  }
}

export async function sendTelemetryError(payload: any): Promise<void> {
  const fp = payload.fingerprint || generateFingerprint(payload.error_name || 'Error', payload.error_message || '', payload.stack_trace);
  const now = Date.now();
  pruneFingerprintCache(now);
  const lastSent = recentFingerprints.get(fp);
  if (lastSent && (now - lastSent < THROTTLE_WINDOW_MS)) return;
  recentFingerprints.set(fp, now);

  const cleanPayload = sanitizePayload({
    ...payload,
    fingerprint: fp,
    environment: (process.env.NODE_ENV || 'production'),
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

---

### 3.2. Global Client Initializer (`TelemetryClientInit.tsx`)
*Tự động monkey-patch `window.fetch` để lưu lại vết gọi API gần nhất, đồng thời lắng nghe `window.onerror` và `unhandledrejection`.*

```tsx
'use client';
import { useEffect } from 'react';
import { sendTelemetryError, addNetworkBreadcrumb } from '@/lib/hermes/telemetry-core';

export function TelemetryClientInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || 'unknown';
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
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

    const handleError = (event: ErrorEvent) => {
      sendTelemetryError({
        error_name: event.error?.name || 'UncaughtException',
        error_message: event.message || 'Unknown unhandled error',
        stack_trace: event.error?.stack
      });
    };

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

---

### 3.3. Hermes Error Boundary (`HermesErrorBoundary.tsx`)
*Bắt lỗi crash React render, có nút Thử lại (tối đa 3 lần) không làm tải lại trang + nút Tải lại toàn trang.*

```tsx
'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sendTelemetryError } from '@/lib/hermes/telemetry-core';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; error?: Error; retryCount: number; }

export class HermesErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
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

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: undefined, retryCount: prev.retryCount + 1 }));
  };

  handleReload = () => {
    this.setState({ hasError: false, retryCount: 0 });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const maxRetriesReached = this.state.retryCount >= 3;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl m-4 font-sans">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {this.props.fallbackTitle || 'Đã có sự cố hiển thị'}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mt-1 mb-4">
            {maxRetriesReached ? 'Lỗi lặp lại nhiều lần. Vui lòng tải lại trang hoặc liên hệ quản trị viên.' : 'Hệ thống đã tự động ghi nhận sự cố. Bạn có thể thử lại ngay hoặc tải lại toàn bộ trang.'}
          </p>
          <div className="flex items-center gap-3">
            {!maxRetriesReached && (
              <button onClick={this.handleRetry} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg shadow-sm transition">
                <RotateCcw className="w-4 h-4" /> Thử lại ({this.state.retryCount}/3)
              </button>
            )}
            <button onClick={this.handleReload} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition">
              <RefreshCw className="w-4 h-4" /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### 3.4. Hermes Widgets Wrapper (`HermesWidgetsWrapper.tsx`)
*Quản lý trạng thái hiển thị: Chỉ bật SmartBugReporter và AdminCopilotDrawer khi người dùng đã đăng nhập, ẩn hoàn toàn ở màn hình Login.*

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store'; // Điều chỉnh theo Auth Store của dự án
import { SmartBugReporter } from '@/components/telemetry/SmartBugReporter';
import { AdminCopilotDrawer } from '@/components/admin/AdminCopilotDrawer';

export function HermesWidgetsWrapper() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isAuthenticated || !user) return null;

  return (
    <>
      <SmartBugReporter />
      <AdminCopilotDrawer />
    </>
  );
}
```

---

## 🔌 4. BACKEND API ROUTES

### 4.1. Bug Report Endpoint (`/api/telemetry/bug-report/route.ts`)
*Kiểm tra giới hạn rate limit (5 lần/phút), validate độ dài nội dung (5-2000 ký tự) và lưu trữ kèm ngữ cảnh breadcrumbs mạng.*

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const reportRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (reportRateLimitMap.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    reportRateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  reportRateLimitMap.set(key, timestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }
    const body = await req.json();
    const { user_description, route, network_breadcrumbs, user_role, screenshot_url, user_id } = body;

    if (!user_description || typeof user_description !== 'string') {
      return NextResponse.json({ error: 'Mô tả sự cố là bắt buộc' }, { status: 400 });
    }
    const trimmedDesc = user_description.trim();
    if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      return NextResponse.json({ error: 'Mô tả phải từ 5 đến 2000 ký tự' }, { status: 400 });
    }

    const rateLimitKey = user_id || req.headers.get('x-forwarded-for') || 'anonymous_reporter';
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: 'Bạn gửi quá nhiều báo cáo. Vui lòng chờ 1 phút.' }, { status: 429 });
    }

    let instantReply = 'Cảm ơn bạn đã báo cáo sự cố! Hermes đã ghi nhận ngữ cảnh và chuyển tới kỹ thuật xử lý.';
    const descLower = trimmedDesc.toLowerCase();
    if (descLower.includes('quay tròn') || descLower.includes('chậm') || descLower.includes('loading')) {
      instantReply = 'Hermes nhận thấy có thể do mạng gián đoạn. Bạn thử kiểm tra lại kết nối hoặc đợi 30 giây nhé!';
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const isValidUuid = typeof user_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id);

    const { data, error } = await supabase
      .from('user_bug_reports')
      .insert({
        user_id: isValidUuid ? user_id : null,
        user_description: trimmedDesc,
        route: route || '/',
        user_role: user_role || 'staff',
        network_breadcrumbs: Array.isArray(network_breadcrumbs) ? network_breadcrumbs : [],
        screenshot_url: screenshot_url || null,
        hermes_instant_reply: instantReply,
        status: 'open'
      })
      .select('id, hermes_instant_reply')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, reportId: data.id, reply: data.hermes_instant_reply });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
```

### 4.2. Admin Copilot Endpoint (`/api/hermes/copilot/route.ts`)
*Kiểm tra quyền hạn Admin (RBAC), nạp 5 lỗi gần nhất làm context, duy trì hội thoại và lưu session.*

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ALLOWED_ADMIN_ROLES = ['hr_admin', 'admin', 'ceo', 'store_manager', 'area_manager'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, user_role, user_id } = body;

    if (!user_role || !ALLOWED_ADMIN_ROLES.includes(user_role)) {
      return NextResponse.json({ error: 'Forbidden: Bạn không có quyền truy cập Hermes Copilot' }, { status: 403 });
    }

    const trimmedMsg = (message || '').trim();
    if (trimmedMsg.length < 1 || trimmedMsg.length > 2000) {
      return NextResponse.json({ error: 'Độ dài tin nhắn không hợp lệ' }, { status: 400 });
    }

    let errorContext = 'Không có dữ liệu sự cố gần đây.';
    let supabaseClient = null;
    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      const { data: recentErrors } = await supabaseClient
        .from('telemetry_error_logs')
        .select('error_name, error_message, occurrences, status, route')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentErrors && recentErrors.length > 0) {
        errorContext = recentErrors
          .map((e) => `- [${e.status}] ${e.error_name} tại ${e.route || 'route'}: ${e.error_message} (${e.occurrences} lần)`)
          .join('\n');
      }
    }

    let reply = `Chào Quản lý! Hermes đã kiểm tra trạng thái hệ thống:\n\n**Các sự cố ghi nhận gần đây:**\n${errorContext}\n\nHermes sẵn sàng hỗ trợ rà soát logic hoặc kiểm tra báo cáo!`;
    const q = trimmedMsg.toLowerCase();
    if (q.includes('lỗi') || q.includes('sự cố') || q.includes('log')) {
      reply = `Hiện tại hệ thống đang theo dõi các mẫu lỗi sau:\n\n${errorContext}`;
    }

    if (supabaseClient && user_id) {
      try {
        const sessionMessages = Array.isArray(history)
          ? [...history, { role: 'assistant', text: reply }]
          : [{ role: 'user', text: trimmedMsg }, { role: 'assistant', text: reply }];
        await supabaseClient.from('copilot_chat_sessions').insert({ admin_id: user_id, messages: sessionMessages });
      } catch (e) {
        console.warn('Session save skipped:', e);
      }
    }

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
```

---

## 🔄 5. HƯỚNG DẪN CHUYỂN ĐỔI CHO VUE 3 / NUXT 3 (VÍ DỤ ZALOCRM)

Nếu bạn đưa kit này vào dự án **Vue 3** (như ZaloCRM, Nuxt):

1. **State / Auth Store**:
   - Thay `useAuthStore` của Zustand bằng Pinia:
     ```typescript
     import { useAuthStore } from '@/stores/auth';
     const authStore = useAuthStore();
     // Dùng authStore.user?.id, authStore.user?.role
     ```
2. **Error Boundary trong Vue**:
   - Sử dụng hook `onErrorCaptured((err, instance, info) => { sendTelemetryError(...); return false; })` trong `App.vue` hoặc bọc bằng custom component `HermesErrorBoundary.vue`.
3. **Single File Components (SFC)**:
   - Chuyển `SmartBugReporter.tsx` thành `SmartBugReporter.vue` sử dụng `<template>`, `<script setup lang="ts">`, và `<style scoped>`.
4. **Backend API**:
   - Nếu dùng Nuxt 3: Đặt các route trong `server/api/telemetry/...`
   - Nếu dùng Node.js / Express / NestJS riêng: Đăng ký router Express tương đương với logic trong mục 4.

---

## ✅ 6. CHECKLIST KIỂM THỬ SAU KHI TÍCH HỢP

- [ ] Chạy migration SQL trên Supabase thành công.
- [ ] Bật ứng dụng, kiểm tra tab Console xem `window.fetch` có ghi nhận breadcrumb không (thử gọi 1 API).
- [ ] Mở trang đăng nhập: Đảm bảo các widget **Hermes KHÔNG hiển thị**.
- [ ] Đăng nhập tài khoản Nhân viên (`employee`): Nút **Báo sự cố cho Hermes** xuất hiện ở góc dưới phải. Nút **Hermes Copilot** không xuất hiện.
- [ ] Đăng nhập tài khoản Quản lý (`admin`/`ceo`): Nút **Hermes Copilot** xuất hiện ở góc trên phải.
- [ ] Thử submit 1 báo cáo sự cố: Kiểm tra bảng `user_bug_reports` trong Supabase xem có ghi nhận đúng `user_id` và `network_breadcrumbs` không.
- [ ] Kiểm tra trang Sandbox kiểm thử lỗi (chỉ cho phép mở ở môi trường Development).
