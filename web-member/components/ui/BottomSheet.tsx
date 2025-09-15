'use client'

import React, { useEffect } from 'react'
// framer-motion removed for TypeScript compatibility
import { cn } from '@/lib/utils'
import { slideUp } from '@/lib/animations'
import { FocusTrap } from './FocusTrap'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  snapPoints?: number[]
  initialSnap?: number
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showHandle?: boolean
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  snapPoints = [0.4, 0.8],
  initialSnap = 0,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showHandle = true,
  className
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap)
  const sheetId = React.useId()
  const titleId = title ? `${sheetId}-title` : undefined

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizes = {
    sm: 'max-h-[40vh]',
    md: 'max-h-[60vh]',
    lg: 'max-h-[80vh]',
    full: 'h-screen'
  }

  const getSnapHeight = (snap: number) => {
    return `${snap * 100}vh`
  }

  const handleDragEnd = (_: any, info: any) => {
    const shouldClose = info.velocity.y > 500 || (info.velocity.y >= 0 && info.point.y > window.innerHeight * 0.7)

    if (shouldClose) {
      onClose()
      return
    }

    // Find the closest snap point
    const currentHeight = window.innerHeight - info.point.y
    const currentPercent = currentHeight / window.innerHeight

    let closestSnap = 0
    let minDistance = Math.abs(snapPoints[0] - currentPercent)

    snapPoints.forEach((snap, index) => {
      const distance = Math.abs(snap - currentPercent)
      if (distance < minDistance) {
        minDistance = distance
        closestSnap = index
      }
    })

    setCurrentSnap(closestSnap)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  const handleEscape = closeOnEscape ? onClose : undefined

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-ink-900/50 opacity-0 transition-opacity duration-300"
            style={{ animation: 'fade-in 0.3s ease-out forwards' }}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          <FocusTrap enabled={isOpen} onEscape={handleEscape}>
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-xl translate-y-full transition-transform duration-300',
                snapPoints.length > 1 ? '' : sizes[size],
                className
              )}
              style={{
                height: snapPoints.length > 1 ? getSnapHeight(snapPoints[currentSnap]) : undefined,
                animation: 'slide-up 0.3s ease-out forwards'
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              {/* Drag handle */}
              {showHandle && (
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-ink-200 rounded-full" />
                </div>
              )}

              {/* Header */}
              {title && (
                <div className="px-6 py-4 border-b border-surface-border">
                  <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                    {title}
                  </h2>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  )
}

// Hook for managing bottom sheet state
export function useBottomSheet(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle
  }
}

// Preset bottom sheet components
export function ActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  cancelLabel = 'Cancel'
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  actions: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive'
    icon?: React.ReactNode
  }>
  cancelLabel?: string
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showHandle={false}
    >
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={cn(
              'flex items-center w-full p-4 text-left rounded-xl transition-colors',
              action.variant === 'destructive'
                ? 'text-danger-600 hover:bg-danger-50'
                : 'text-ink-900 hover:bg-surface-alt'
            )}
          >
            {action.icon && (
              <span className="mr-3" aria-hidden="true">
                {action.icon}
              </span>
            )}
            <span className="font-medium">{action.label}</span>
          </button>
        ))}

        <div className="pt-2 mt-4 border-t border-surface-border">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-full p-4 text-ink-700 font-medium rounded-xl hover:bg-surface-alt transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// Share sheet component
export function ShareSheet({
  isOpen,
  onClose,
  url,
  title: shareTitle,
  text
}: {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  text?: string
}) {
  const shareData = {
    title: shareTitle,
    text,
    url
  }

  const canShare = typeof navigator !== 'undefined' && navigator.share

  const handleNativeShare = async () => {
    if (canShare) {
      try {
        await navigator.share(shareData)
        onClose()
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      onClose()
      // Show toast notification
    } catch (error) {
      // Handle error
    }
  }

  const shareOptions = [
    {
      label: 'Copy Link',
      onClick: handleCopyLink,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
  ]

  if (canShare) {
    shareOptions.unshift({
      label: 'Share',
      onClick: handleNativeShare,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )
    })
  }

  return (
    <ActionSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Share"
      actions={shareOptions}
    />
  )
}