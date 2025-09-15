'use client'

import React from 'react'
import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<NextImageProps, 'onLoad' | 'onError'> {
  fallback?: React.ReactNode
  skeleton?: React.ReactNode
  animate?: boolean
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  skeleton,
  animate = true,
  aspectRatio,
  width,
  height,
  fill,
  onLoad,
  onError,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  }

  const getAspectRatioClass = () => {
    if (typeof aspectRatio === 'number') {
      return `aspect-[${aspectRatio}]`
    }
    return aspectRatio ? aspectRatioClasses[aspectRatio] : ''
  }

  const handleLoad = React.useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = React.useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }, [onError])

  const skeletonElement = skeleton || (
    <div className="bg-surface-alt animate-pulse flex items-center justify-center">
      <svg
        className="w-8 h-8 text-ink-200"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm2 6l2-2 2 2 4-4v4H8v-2z" />
      </svg>
    </div>
  )

  const fallbackElement = fallback || (
    <div className="bg-surface-alt flex items-center justify-center">
      <div className="text-center">
        <svg
          className="w-8 h-8 text-ink-300 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-xs text-ink-500">Image not available</p>
      </div>
    </div>
  )

  if (hasError) {
    return (
      <div className={cn('relative overflow-hidden', getAspectRatioClass(), className)}>
        {fallbackElement}
      </div>
    )
  }

  const imageContent = (
    <div className={cn('relative overflow-hidden', getAspectRatioClass(), className)}>
      {isLoading && skeletonElement}

      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )

  if (animate) {
    return (
      <div
        className="opacity-0 scale-95 transition-all duration-300 ease-out"
        style={{ animation: 'scale-fade-in 0.3s ease-out forwards' }}
      >
        {imageContent}
      </div>
    )
  }

  return imageContent
})

// Avatar component using OptimizedImage
export const Avatar = React.memo(function Avatar({
  src,
  name,
  size = 'md',
  className,
  fallbackClassName,
  ...props
}: {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackClassName?: string
} & Omit<OptimizedImageProps, 'src' | 'alt' | 'width' | 'height'>) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const fallback = (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold',
        sizes[size],
        fallbackClassName
      )}
    >
      {getInitials(name)}
    </div>
  )

  if (!src) {
    return fallback
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      className={cn('rounded-full', sizes[size], className)}
      fallback={fallback}
      {...props}
    />
  )
})

// Logo component with optimizations
export const Logo = React.memo(function Logo({
  src,
  alt = 'Logo',
  width = 120,
  height = 40,
  priority = true,
  className,
  ...props
}: {
  src: string
  alt?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
} & Omit<OptimizedImageProps, 'src' | 'alt' | 'width' | 'height' | 'priority'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
      placeholder="empty"
      {...props}
    />
  )
})

// Gallery image component
export const GalleryImage = React.memo(function GalleryImage({
  src,
  alt,
  thumbnail,
  onClick,
  className,
  ...props
}: {
  src: string
  alt: string
  thumbnail?: string
  onClick?: () => void
} & OptimizedImageProps) {
  return (
    <div
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-105 active:scale-95',
        onClick && 'hover:opacity-90',
        className
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={thumbnail || src}
        alt={alt}
        fill
        className="object-cover"
        {...props}
      />

      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
      )}
    </div>
  )
})

// Hook for image preloading
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    urls.forEach(url => {
      const img = new Image()
      img.onload = () => {
        setLoadedImages(prev => new Set(Array.from(prev).concat(url)))
      }
      img.src = url
    })
  }, [urls])

  return loadedImages
}