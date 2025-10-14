'use client'

import React, { useEffect } from 'react'
// framer-motion removed for TypeScript compatibility
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { modalOverlay, modalContent } from '@/lib/animations'
import { FocusTrap } from './FocusTrap'
import { IconButton } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className
}: ModalProps) {
  const modalId = React.useId()
  const titleId = `${modalId}-title`
  const descriptionId = `${modalId}-description`

  // Prevent body scroll when modal is open
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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            role="button"
            tabIndex={0}
            className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 opacity-0 transition-opacity duration-300"
            style={{ animation: 'fade-in 0.3s ease-out forwards' }}
            onClick={handleOverlayClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleOverlayClick(e as unknown as React.MouseEvent)
              }
            }}
          >
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-ink-900/50 transition-opacity"
              aria-hidden="true"
            />

            <FocusTrap enabled={isOpen} onEscape={handleEscape}>
              <div
                className={cn(
                  'relative w-full transform overflow-hidden rounded-2xl bg-surface text-left shadow-xl opacity-0 scale-95 transition-all duration-300',
                  sizes[size],
                  className
                )}
                style={{ animation: 'scale-fade-in 0.3s ease-out forwards' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
              >
                {/* Close button */}
                {showCloseButton && (
                  <div className="absolute right-4 top-4 z-10">
                    <IconButton
                      icon={<XMarkIcon />}
                      label="Close dialog"
                      onClick={onClose}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                )}

                {/* Header */}
                {(title || description) && (
                  <div className="px-6 py-4 border-b border-surface-border">
                    {title && (
                      <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descriptionId} className="mt-1 text-sm text-ink-500">
                        {description}
                      </p>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4">
                  {children}
                </div>
              </div>
            </FocusTrap>
          </div>
        </div>
      )}
    </>
  )
}

// Modal footer component for consistent action layouts
export function ModalFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-border', className)}>
      {children}
    </div>
  )
}

// Confirmation modal variant
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}) {
  const { Button } = require('./Button')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="text-sm text-ink-700 mb-6">
        {message}
      </div>

      <ModalFooter>
        <Button
          onClick={onClose}
          variant="outline"
          disabled={loading}
          fullWidth
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant={variant}
          loading={loading}
          fullWidth
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// Hook for managing modal state
export function useModal(initialState = false) {
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

// Hook for confirmation modals
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title?: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'primary'
  } | null>(null)

  const confirm = React.useCallback((options: {
    title?: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'primary'
  }) => {
    setConfig(options)
    setIsOpen(true)
  }, [])

  const handleConfirm = React.useCallback(() => {
    config?.onConfirm()
    setIsOpen(false)
    setConfig(null)
  }, [config])

  const handleCancel = React.useCallback(() => {
    setIsOpen(false)
    setConfig(null)
  }, [])

  const ConfirmationDialog = React.useCallback(() => {
    if (!config) return null

    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        variant={config.variant}
      />
    )
  }, [isOpen, config, handleCancel, handleConfirm])

  return {
    confirm,
    ConfirmationDialog
  }
}