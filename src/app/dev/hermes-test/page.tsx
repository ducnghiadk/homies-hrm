'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { AlertCircle, Bug, Flame, Terminal } from 'lucide-react';

export default function HermesTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

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
      console.error('Fetch error:', e);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 font-sans">
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
