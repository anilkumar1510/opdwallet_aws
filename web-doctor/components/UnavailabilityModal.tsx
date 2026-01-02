'use client'

import { useState, FormEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CreateUnavailabilityDto, Unavailability } from '@/lib/api/calendar'

interface UnavailabilityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUnavailabilityDto) => Promise<void>
  editData?: Unavailability | null
}

const UNAVAILABILITY_TYPES = [
  'VACATION',
  'CONFERENCE',
  'EMERGENCY',
  'PERSONAL',
  'SICK_LEAVE',
  'OTHER',
]

export default function UnavailabilityModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
}: UnavailabilityModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [startDate, setStartDate] = useState(
    editData?.startDate ? editData.startDate.split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    editData?.endDate ? editData.endDate.split('T')[0] : ''
  )
  const [startTime, setStartTime] = useState(editData?.startTime || '')
  const [endTime, setEndTime] = useState(editData?.endTime || '')
  const [type, setType] = useState(editData?.type || 'VACATION')
  const [reason, setReason] = useState(editData?.reason || '')
  const [isAllDay, setIsAllDay] = useState(editData?.isAllDay ?? true)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!startDate || !endDate) {
      setError('Please select start and end dates')
      return
    }

    if (!isAllDay && (!startTime || !endTime)) {
      setError('Please specify start and end times for partial day unavailability')
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        startDate,
        endDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        type,
        reason: reason.trim() || undefined,
        isAllDay,
      })

      // Reset form
      setStartDate('')
      setEndDate('')
      setStartTime('')
      setEndTime('')
      setType('VACATION')
      setReason('')
      setIsAllDay(true)

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save unavailability')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editData ? 'Edit Unavailability' : 'Add Unavailability'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input w-full"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input w-full"
                  required
                  disabled={loading}
                  min={startDate}
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 text-[#2B4D8C] focus:ring-[#2B4D8C] border-gray-300 rounded"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">
                  All Day Unavailability
                </span>
              </label>
            </div>

            {/* Time Range (if not all day) */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input w-full"
                    required={!isAllDay}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input w-full"
                    required={!isAllDay}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input w-full"
                required
                disabled={loading}
              >
                {UNAVAILABILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="input w-full"
                placeholder="e.g., Annual vacation, Medical conference..."
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#2B4D8C] text-white rounded-lg hover:bg-[#1E3A6B] transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : editData ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
