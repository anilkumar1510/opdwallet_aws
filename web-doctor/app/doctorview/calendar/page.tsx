'use client'

import { useEffect, useState } from 'react'
import {
  createUnavailability,
  getUpcomingUnavailabilities,
  deleteUnavailability,
  Unavailability,
  CreateUnavailabilityDto,
} from '@/lib/api/calendar'
import UnavailabilityModal from '@/components/UnavailabilityModal'
import {
  PlusIcon,
  CalendarDaysIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function CalendarPage() {
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUnavailability, setSelectedUnavailability] = useState<Unavailability | null>(null)

  useEffect(() => {
    loadUnavailabilities()
  }, [])

  const loadUnavailabilities = async () => {
    try {
      setLoading(true)
      const data = await getUpcomingUnavailabilities()
      setUnavailabilities(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load unavailabilities')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: CreateUnavailabilityDto) => {
    await createUnavailability(data)
    await loadUnavailabilities()
  }

  const handleDelete = async (unavailabilityId: string) => {
    if (!confirm('Are you sure you want to delete this unavailability period?')) {
      return
    }

    try {
      await deleteUnavailability(unavailabilityId)
      await loadUnavailabilities()
    } catch (err: any) {
      alert(err.message || 'Failed to delete unavailability')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      VACATION: 'bg-blue-100 text-blue-800',
      CONFERENCE: 'bg-purple-100 text-purple-800',
      EMERGENCY: 'bg-red-100 text-red-800',
      PERSONAL: 'bg-yellow-100 text-yellow-800',
      SICK_LEAVE: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors.OTHER
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="card">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your unavailability periods and time blocks
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedUnavailability(null)
              setModalOpen(true)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Unavailability</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">About Calendar Management</h3>
              <p className="text-sm text-blue-700 mt-1">
                Mark periods when you're unavailable to prevent appointment bookings.
                This includes vacations, conferences, or personal time off.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Upcoming Unavailabilities */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Unavailability Periods
          </h2>

          {unavailabilities.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No unavailability periods scheduled</p>
              <p className="text-sm text-gray-500 mt-1">
                Add unavailability periods to block appointment slots
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {unavailabilities.map((unavailability) => (
                <div
                  key={unavailability._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Type Badge */}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getTypeColor(
                          unavailability.type
                        )}`}
                      >
                        {unavailability.type.replace('_', ' ')}
                      </span>

                      {/* Date Range */}
                      <div className="flex items-center space-x-2 text-gray-900 mb-2">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(unavailability.startDate)} - {formatDate(unavailability.endDate)}
                        </span>
                      </div>

                      {/* Time Range (if not all day) */}
                      {!unavailability.isAllDay && unavailability.startTime && unavailability.endTime && (
                        <div className="flex items-center space-x-2 text-gray-700 mb-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <span>
                            {unavailability.startTime} - {unavailability.endTime}
                          </span>
                        </div>
                      )}

                      {unavailability.isAllDay && (
                        <div className="flex items-center space-x-2 text-gray-700 mb-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <span>All Day</span>
                        </div>
                      )}

                      {/* Reason */}
                      {unavailability.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          {unavailability.reason}
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(unavailability.unavailabilityId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unavailability Modal */}
      <UnavailabilityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        editData={selectedUnavailability}
      />
    </div>
  )
}
