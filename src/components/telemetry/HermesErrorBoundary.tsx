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
