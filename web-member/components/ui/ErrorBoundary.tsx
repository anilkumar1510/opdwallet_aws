'use client'

import React from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Card } from './Card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error | null
    resetError: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.props.onError?.(error, errorInfo)

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      if (Fallback) {
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  resetError
}: {
  error: Error | null
  resetError: () => void
}) {
  return (
    <div
      className="min-h-[300px] flex items-center justify-center p-4 opacity-0 translate-y-5"
      style={{ animation: 'slide-up-fade 0.3s ease-out forwards' }}
      role="alert"
    >
      <Card className="max-w-md w-full text-center">
        <div className="p-6">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 opacity-0 scale-0"
            style={{ animation: 'scale-fade-in 0.2s ease-out 0.2s forwards' }}
          >
            <ExclamationTriangleIcon
              className="h-6 w-6 text-danger-600"
              aria-hidden="true"
            />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-ink-900">
              Something went wrong
            </h3>
            <p className="mt-2 text-sm text-ink-500">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-ink-700 hover:text-ink-900">
                  View error details
                </summary>
                <div className="mt-2 p-3 bg-surface-alt rounded-lg overflow-auto max-h-32">
                  <pre className="text-xs text-ink-600 whitespace-pre-wrap">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </div>
              </details>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              variant="primary"
              leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              fullWidth
            >
              Try again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              fullWidth
            >
              Refresh page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Hook for error boundary with toast notifications
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error handler:', error, errorInfo)
    }

    // Log to monitoring service in production
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }, [])

  return { handleError }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({
  children,
  onError
}: {
  children: React.ReactNode
  onError?: (error: Error) => void
}) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

      onError?.(error)
      console.error('Unhandled promise rejection:', error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [onError])

  return <>{children}</>
}

// Component wrapper that catches async errors
export function withErrorBoundary<P extends {}>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...(props as any)} ref={ref} />
    </ErrorBoundary>
  ))

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}