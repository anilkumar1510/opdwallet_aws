'use client'

import { useState } from 'react'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface EditableFieldProps {
  label: string
  value: string
  type?: 'text' | 'email' | 'tel'
  onSave: (newValue: string) => Promise<void>
  validation?: (value: string) => string | null
}

export default function EditableField({
  label,
  value,
  type = 'text',
  onSave,
  validation,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setError(null)
  }

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-600">{label}</label>

      {isEditing ? (
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="input flex-1"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              aria-label="Save"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              aria-label="Cancel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
          <span className="text-gray-900">{value || '-'}</span>
          <button
            onClick={handleEdit}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-brand-600 transition-all"
            aria-label={`Edit ${label}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
