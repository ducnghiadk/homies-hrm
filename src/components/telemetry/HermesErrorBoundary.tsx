'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sendTelemetryError } from '@/lib/hermes/telemetry-core';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class HermesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

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
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1
    }));
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
            {maxRetriesReached
              ? 'Lỗi lặp lại nhiều lần. Vui lòng tải lại trang hoặc liên hệ quản trị viên.'
              : 'Hệ thống đã tự động ghi nhận sự cố. Bạn có thể thử lại ngay hoặc tải lại toàn bộ trang.'}
          </p>
          <div className="flex items-center gap-3">
            {!maxRetriesReached && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg shadow-sm transition"
              >
                <RotateCcw className="w-4 h-4" />
                Thử lại ({this.state.retryCount}/3)
              </button>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
