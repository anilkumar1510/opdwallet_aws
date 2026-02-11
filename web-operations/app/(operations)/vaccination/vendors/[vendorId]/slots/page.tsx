'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface Schedule {
  _id: string
  slotId: string
  pincode: string
  dayOfWeek: string
  startTime: string
  endTime: string
  slotDuration: number
  maxAppointments: number
  isActive: boolean
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  serviceablePincodes: string[]
}

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export default function VaccinationVendorSlotsPage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Form state for creating schedule
  const [formData, setFormData] = useState({
    pincode: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    maxAppointments: 20,
  })

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/vaccination/vendors')
      if (response.ok) {
        const data = await response.json()
        const foundVendor = data.data.find((v: Vendor) => v.vendorId === vendorId)
        setVendor(foundVendor)
      }
    } catch (error) {
      console.error('Error fetching vendor:', error)
      toast.error('Failed to fetch vendor details')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/admin/vaccination/vendors/${vendorId}/slots`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }, [vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  useEffect(() => {
    if (vendor) {
      fetchSchedules()
    }
  }, [vendor, fetchSchedules])

  const handleOpenModal = () => {
    setFormData({
      pincode: vendor?.serviceablePincodes?.[0] || '',
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      maxAppointments: 20,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pincode) {
      toast.error('Please select a pincode')
      return
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time')
      return
    }

    try {
      setCreating(true)

      const response = await apiFetch(`/api/admin/vaccination/vendors/${vendorId}/slots`, {
        method: 'POST',
        body: JSON.stringify({
          pincode: formData.pincode,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDuration: formData.slotDuration,
          maxAppointments: formData.maxAppointments,
        }),
      })

      if (response.ok) {
        toast.success('Schedule created successfully')
        handleCloseModal()
        fetchSchedules()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (schedule: Schedule) => {
    try {
      setToggling(schedule.slotId)
      const action = schedule.isActive ? 'deactivate' : 'activate'
      const response = await apiFetch(
        `/api/admin/vaccination/vendors/${vendorId}/slots/${schedule.slotId}/${action}`,
        { method: 'PATCH' }
      )

      if (response.ok) {
        toast.success(`Schedule ${action}d successfully`)
        fetchSchedules()
      } else {
        const data = await response.json()
        toast.error(data.message || `Failed to ${action} schedule`)
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
      toast.error('Failed to update schedule status')
    } finally {
      setToggling(null)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Vendor Schedules</h1>
            <p className="text-sm text-gray-600">{vendor?.name || vendorId}</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Schedules List */}
        {schedules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No schedules configured</p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Schedule
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slot ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pincode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Appointments
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-gray-600">{schedule.slotId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{schedule.pincode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{DAY_LABELS[schedule.dayOfWeek]}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{schedule.slotDuration} min</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{schedule.maxAppointments}</p>
                    </td>
                    <td className="px-4 py-3">
                      {schedule.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(schedule)}
                        disabled={toggling === schedule.slotId}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                          schedule.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {toggling === schedule.slotId
                          ? 'Updating...'
                          : schedule.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Schedule</h2>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <select
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Pincode</option>
                  {vendor?.serviceablePincodes?.map((pincode) => (
                    <option key={pincode} value={pincode}>
                      {pincode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {DAY_LABELS[day]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.slotDuration}
                    onChange={(e) =>
                      setFormData({ ...formData, slotDuration: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="10"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Appointments
                  </label>
                  <input
                    type="number"
                    value={formData.maxAppointments}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAppointments: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={creating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
