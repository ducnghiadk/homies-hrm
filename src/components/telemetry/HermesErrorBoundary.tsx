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
  errorInfo?: ErrorInfo;
  retryCount: number;
  showDetails: boolean;
}

export class HermesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    const errorData = {
      name: error.name || 'ReactRenderError',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      route: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('hermes_last_active_error', JSON.stringify(errorData));
        window.dispatchEvent(new CustomEvent('hermes-active-error', { detail: errorData }));
      } catch {}
    }

    sendTelemetryError({
      error_name: errorData.name,
      error_message: errorData.message,
      stack_trace: errorData.stack,
      component_stack: errorData.componentStack,
    });
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    this.setState({ hasError: false, retryCount: 0 });
    window.location.reload();
  };

  handleAskHermes = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-hermes-copilot'));
    }
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
              ? 'Lỗi lặp lại nhiều lần. Bạn có thể mở Trợ lý Hermes để chẩn đoán nguyên nhân hoặc tải lại toàn bộ trang.'
              : 'Hệ thống đã tự động ghi nhận sự cố. Bạn có thể mở Trợ lý Hermes để đối soát lỗi hoặc thử lại ngay.'}
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center mb-3">
            {!maxRetriesReached && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Thử lại ({this.state.retryCount}/3)
              </button>
            )}
            <button
              onClick={this.handleAskHermes}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#2F6FA8] hover:bg-[#1D3E61] rounded-lg shadow transition cursor-pointer"
            >
              🤖 Hỏi Trợ lý Hermes về lỗi này
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg shadow-xs transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại trang
            </button>
          </div>

          {/* Chi tiết kỹ thuật mở rộng */}
          <div className="mt-2 w-full max-w-xl text-left">
            <button
              type="button"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="text-xs text-amber-800 dark:text-amber-300 hover:underline font-medium cursor-pointer"
            >
              {this.state.showDetails ? '▲ Ẩn chi tiết kỹ thuật' : '▼ Xem chi tiết lỗi kỹ thuật'}
            </button>

            {this.state.showDetails && this.state.error && (
              <div className="mt-2 p-3 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-mono overflow-x-auto text-rose-700 dark:text-rose-400">
                <p className="font-bold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[11px] whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 max-h-40 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
