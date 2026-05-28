'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  Copy,
  CheckCircle,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isCopied: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, isCopied: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    
    // Log to console
    console.error('🚨 ErrorBoundary caught:', error, errorInfo)
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  reportError(_error: Error, _errorInfo: ErrorInfo): void {
    void _error
    void _errorInfo
    // Placeholder for Sentry/LogRocket/etc
    // sendToErrorTracking({
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    // })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  copyError = (): void => {
    if (this.state.error) {
      const text = `${this.state.error.message}\n\nStack:\n${this.state.error.stack}`
      navigator.clipboard.writeText(text)
      this.setState({ isCopied: true })
      setTimeout(() => this.setState({ isCopied: false }), 2000)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
        onCopy={this.copyError}
        isCopied={this.state.isCopied}
        showDetails={this.props.showDetails}
      />
    }

    return this.props.children
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR FALLBACK UI
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onCopy: () => void
  isCopied: boolean
  showDetails?: boolean
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onCopy,
  isCopied,
  showDetails = false,
}: ErrorFallbackProps) {
  const [showStack, setShowStack] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-error-500" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Đã xảy ra lỗi không mong muốn
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700 font-medium">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        {/* Stack trace (dev only) */}
        {showDetails && showStack && errorInfo?.componentStack && (
          <div className="bg-gray-900 rounded-xl p-4 mb-4 max-h-48 overflow-auto">
            <pre className="text-xs text-success-400 whitespace-pre-wrap font-mono">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={onReset} className="w-full" size="lg">
            <RefreshCw className="w-5 h-5 mr-2" />
            Thử lại
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/'}
            >
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              title="Copy error"
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4 text-success-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {showDetails && (
            <button
              onClick={() => setShowStack(!showStack)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showStack ? 'rotate-180' : ''}`}
              />
              Chi tiết lỗi
            </button>
          )}
        </div>

        {/* Dev notice */}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-400 text-center mt-4">
            🔧 Development mode: Full error details visible
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC ERROR BOUNDARY (for Suspense boundaries)
// ─────────────────────────────────────────────────────────────────────────────

export class AsyncErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl">
          <p className="text-warning-800 font-medium">⚠️ Async operation failed</p>
          <Button size="sm" variant="outline" onClick={this.handleReset} className="mt-2">
            Retry
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK VERSION (Functional component)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      console.error('🚨 Error:', err)
      setError(err)
    }
  }

  const clearError = () => setError(null)

  const ErrorComponent = ({ children }: { children: ReactNode }) => {
    if (error) {
      return (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
          <p className="text-error-800 font-medium">{error.message}</p>
          <Button size="sm" onClick={clearError} className="mt-2">
            Dismiss
          </Button>
        </div>
      )
    }
    return <>{children}</>
  }

  return { handleError, clearError, ErrorComponent }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export default ErrorBoundary
