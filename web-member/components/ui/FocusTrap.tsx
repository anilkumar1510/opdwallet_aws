'use client'

import React, { useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  onEscape?: () => void
  initialFocus?: React.RefObject<HTMLElement>
  restoreFocus?: boolean
}

export function FocusTrap({
  children,
  enabled = true,
  onEscape,
  initialFocus,
  restoreFocus = true
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle initial focus separately from keyboard events
  useEffect(() => {
    if (!enabled) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the initial element or the container (only when first enabled)
    const focusElement = initialFocus?.current || containerRef.current
    if (focusElement) {
      focusElement.focus()
    }

    return () => {
      // Restore focus to the previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
    // Only run when enabled state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Handle keyboard events separately
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      if (event.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      const focusableElements = getFocusableElements(container)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onEscape])

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      {children}
    </div>
  )
}

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
  ]

  const elements = container.querySelectorAll(focusableSelectors.join(','))

  return Array.from(elements).filter((element) => {
    return (
      element instanceof HTMLElement &&
      isVisible(element) &&
      !element.hasAttribute('disabled') &&
      !element.getAttribute('aria-hidden')
    )
  }) as HTMLElement[]
}

// Check if an element is visible
function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  )
}

// Hook for managing focus trap
export function useFocusTrap(enabled: boolean = true) {
  const trapRef = useRef<HTMLDivElement>(null)

  const enable = () => {
    if (trapRef.current) {
      const focusableElements = getFocusableElements(trapRef.current)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }

  const disable = () => {
    // Focus will be restored by the FocusTrap component
  }

  return {
    trapRef,
    enable,
    disable
  }
}