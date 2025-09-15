'use client'

import React, { Suspense, lazy as ReactLazy } from 'react'
import { LoadingSpinner } from '../LoadingSpinner'
import { Skeleton } from './Skeleton'
import { ErrorBoundary } from './ErrorBoundary'

interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  skeleton?: React.ReactNode
  delay?: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function LazyLoad({
  children,
  fallback,
  skeleton,
  delay = 0,
  onLoad,
  onError
}: LazyLoadProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsLoaded(true)
        onLoad?.()
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setIsLoaded(true)
      onLoad?.()
    }
  }, [delay, onLoad])

  const defaultFallback = skeleton || (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" />
    </div>
  )

  if (!isLoaded) {
    return (
      <div
        className="animate-fade-in opacity-0 transition-opacity duration-200"
        style={{ animation: 'fade-in 0.2s ease-out forwards' }}
      >
        {fallback || defaultFallback}
      </div>
    )
  }

  return (
    <ErrorBoundary onError={onError}>
      <div
        className="opacity-0 translate-y-2 transition-all duration-300 ease-out"
        style={{ animation: 'slide-up 0.3s ease-out forwards' }}
      >
        {children}
      </div>
    </ErrorBoundary>
  )
}

// Intersection Observer based lazy loading
export function LazyLoadOnView({
  children,
  fallback,
  skeleton,
  threshold = 0.1,
  rootMargin = '50px',
  onIntersect,
  className
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  skeleton?: React.ReactNode
  threshold?: number
  rootMargin?: string
  onIntersect?: () => void
  className?: string
}) {
  const [isInView, setIsInView] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
          onIntersect?.()

          // Add a small delay to simulate loading
          setTimeout(() => setIsLoaded(true), 100)

          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, isInView, onIntersect])

  const defaultFallback = skeleton || (
    <div className="animate-pulse">
      <Skeleton height={200} />
    </div>
  )

  return (
    <div ref={elementRef} className={className}>
      {isInView && isLoaded ? (
        <div
          className="opacity-0 translate-y-5 transition-all duration-400 ease-out"
          style={{ animation: 'slide-up-fade 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards' }}
        >
          {children}
        </div>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  )
}

// Component lazy loader with error boundary
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode,
  skeleton?: React.ReactNode
) {
  const LazyComponent = ReactLazy(importFn)

  return React.memo(React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary>
      <Suspense fallback={fallback || skeleton || <LoadingSpinner />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  )))
}

// Image lazy loading component
export const LazyImage = React.memo(function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  onLoad,
  onError,
  placeholder,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: React.ReactNode
}) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(img)
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [])

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    onError?.(e)
  }

  const defaultPlaceholder = (
    <div
      className="bg-surface-alt animate-pulse flex items-center justify-center"
      style={{ width, height }}
    >
      <span className="text-ink-300 text-sm">Loading...</span>
    </div>
  )

  if (hasError) {
    return (
      <div
        className="bg-surface-alt flex items-center justify-center border border-surface-border rounded"
        style={{ width, height }}
      >
        <span className="text-ink-300 text-sm">Failed to load</span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && (placeholder || defaultPlaceholder)}

      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
})

// Hook for lazy loading state
export function useLazyLoad() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isError, setIsError] = React.useState(false)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
    setIsError(false)
  }, [])

  const finishLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const setError = React.useCallback(() => {
    setIsLoading(false)
    setIsError(true)
  }, [])

  return {
    isLoading,
    isError,
    startLoading,
    finishLoading,
    setError
  }
}