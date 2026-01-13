'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface FilterPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  anchorEl: HTMLElement | null
  title: string
  children: React.ReactNode
}

export default function FilterPopup({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  anchorEl,
  title,
  children,
}: FilterPopupProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  // Calculate popup position
  useEffect(() => {
    if (isOpen && anchorEl && popupRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect()
      const popupRect = popupRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let top = anchorRect.bottom + 8 // 8px gap below button
      let left = anchorRect.left

      // Adjust if popup goes off right edge
      if (left + popupRect.width > viewportWidth - 16) {
        left = viewportWidth - popupRect.width - 16
      }

      // Adjust if popup goes off left edge
      if (left < 16) {
        left = 16
      }

      // Adjust if popup goes off bottom edge
      if (top + popupRect.height > viewportHeight - 16) {
        // Position above button instead
        top = anchorRect.top - popupRect.height - 8
        // If still doesn't fit, position at top of viewport
        if (top < 16) {
          top = 16
        }
      }

      setPosition({ top, left })
    }
  }, [isOpen, anchorEl])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  if (!isOpen) return null

  const popupContent = (
    <div
      className="fixed inset-0 z-[1000]"
      style={{ background: 'rgba(0, 0, 0, 0.1)' }}
      onClick={handleOverlayClick}
    >
      <div
        ref={popupRef}
        className="absolute bg-white rounded-2xl shadow-2xl"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          border: '2px solid #86ACD8',
          minWidth: '280px',
          maxWidth: '400px',
          animation: 'slideDown 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: '#e5e7eb' }}
        >
          <h3 className="text-base font-bold" style={{ color: '#0E51A2' }}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div
          className="px-4 py-4 max-h-[400px] overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#86ACD8 #f3f4f6',
          }}
        >
          {children}
        </div>

        {/* Actions */}
        <div
          className="px-4 py-3 border-t flex gap-2 justify-end"
          style={{ borderColor: '#e5e7eb' }}
        >
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-gray-200"
            style={{ background: '#f3f4f6', color: '#6b7280' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#0F5FDC' }}
          >
            Confirm
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )

  return createPortal(popupContent, document.body)
}
