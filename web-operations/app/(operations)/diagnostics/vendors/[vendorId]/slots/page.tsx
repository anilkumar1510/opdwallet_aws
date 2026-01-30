'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, PlusIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface Slot {
  _id: string
  slotId: string
  pincode: string
  date: string
  timeSlot: string
  startTime: string
  endTime: string
  maxBookings: number
  currentBookings: number
  isActive: boolean
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  serviceablePincodes: string[]
}

interface TimeSlotDefinition {
  id: string
  label: string
  startTime: string
  endTime: string
}

const TIME_SLOTS: TimeSlotDefinition[] = [
  { id: 'MORNING', label: 'Morning', startTime: '08:00', endTime: '12:00' },
  { id: 'AFTERNOON', label: 'Afternoon', startTime: '12:00', endTime: '16:00' },
  { id: 'EVENING', label: 'Evening', startTime: '16:00', endTime: '20:00' },
]

export default function DiagnosticVendorSlotsPage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Filter state for viewing slots
  const [filterPincode, setFilterPincode] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Form state for bulk slot creation
  const [formData, setFormData] = useState({
    pincode: '',
    startDate: '',
    endDate: '',
    selectedSlots: [] as string[],
    maxBookings: 5,
  })

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/diagnostics/vendors')
      if (response.ok) {
        const data = await response.json()
        const foundVendor = data.data.find((v: Vendor) => v.vendorId === vendorId)
        setVendor(foundVendor)

        // Set default pincode and date for viewing
        if (foundVendor?.serviceablePincodes?.length > 0) {
          setFilterPincode(foundVendor.serviceablePincodes[0])
        }
        setFilterDate(getTodayDate())
      }
    } catch (error) {
      console.error('Error fetching vendor:', error)
      toast.error('Failed to fetch vendor details')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  const fetchSlots = useCallback(async () => {
    if (!filterPincode || !filterDate) return

    try {
      const response = await apiFetch(
        `/api/admin/diagnostics/vendors/${vendorId}/slots?pincode=${filterPincode}&date=${filterDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setSlots(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }, [filterPincode, filterDate, vendorId])

  useEffect(() => {
    fetchVendor()
  }, [fetchVendor])

  useEffect(() => {
    if (filterPincode && filterDate) {
      fetchSlots()
    }
  }, [fetchSlots, filterPincode, filterDate])

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const handleOpenModal = () => {
    setFormData({
      pincode: vendor?.serviceablePincodes?.[0] || '',
      startDate: getTodayDate(),
      endDate: '',
      selectedSlots: [],
      maxBookings: 5,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const toggleTimeSlot = (slotId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slotId)
        ? prev.selectedSlots.filter((s) => s !== slotId)
        : [...prev.selectedSlots, slotId],
    }))
  }

  const validateBulkCreateForm = () => {
    if (formData.selectedSlots.length === 0) {
      toast.error('Please select at least one time slot')
      return false
    }

    if (!formData.startDate) {
      toast.error('Please select a start date')
      return false
    }

    return true
  }

  const createSingleSlot = async (date: string, timeSlot: TimeSlotDefinition) => {
    const response = await apiFetch(`/api/admin/diagnostics/vendors/${vendorId}/slots`, {
      method: 'POST',
      body: JSON.stringify({
        pincode: formData.pincode,
        date,
        timeSlot: timeSlot.id,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        maxBookings: formData.maxBookings,
      }),
    })

    return response.ok
  }

  const createSlotsForAllDatesAndTimes = async (dates: string[]) => {
    let createdCount = 0
    let errors = 0

    for (const date of dates) {
      for (const timeSlotId of formData.selectedSlots) {
        const timeSlot = TIME_SLOTS.find((s) => s.id === timeSlotId)
        if (!timeSlot) continue

        try {
          const success = await createSingleSlot(date, timeSlot)
          if (success) {
            createdCount++
          } else {
            errors++
          }
        } catch (error) {
          errors++
        }
      }
    }

    return { createdCount, errors }
  }

  const showCreationResults = (createdCount: number, errors: number) => {
    if (errors > 0) {
      toast.warning(`Created ${createdCount} slots. ${errors} failed.`)
    } else {
      toast.success(`Successfully created ${createdCount} slots`)
    }
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBulkCreateForm()) {
      return
    }

    try {
      setCreating(true)

      const dates = generateDateRange(formData.startDate, formData.endDate || formData.startDate)
      const { createdCount, errors } = await createSlotsForAllDatesAndTimes(dates)

      showCreationResults(createdCount, errors)
      handleCloseModal()
      fetchSlots()
    } catch (error) {
      console.error('Error creating slots:', error)
      toast.error('Failed to create slots')
    } finally {
      setCreating(false)
    }
  }

  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    const startDate = new Date(start)
    const endDate = new Date(end)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }

    return dates
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
            <h1 className="text-xl font-semibold text-gray-900">Diagnostic Vendor Slots</h1>
            <p className="text-sm text-gray-600">{vendor?.name || vendorId}</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Slots
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <select
                value={filterPincode}
                onChange={(e) => setFilterPincode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Slots List */}
        {!filterPincode || !filterDate ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select pincode and date to view slots</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No slots found for this date</p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Slots
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map((slot) => {
                  const isAvailable = slot.currentBookings < slot.maxBookings
                  return (
                    <tr key={slot._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{slot.timeSlot}</p>
                        <p className="text-sm text-gray-600">{slot.slotId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">
                          {slot.currentBookings} / {slot.maxBookings}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              isAvailable ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${(slot.currentBookings / slot.maxBookings) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isAvailable ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Full
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Slots in Bulk</h2>

            <form onSubmit={handleBulkCreate} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={getTodayDate()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slots
                </label>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <label
                      key={slot.id}
                      className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedSlots.includes(slot.id)}
                        onChange={() => toggleTimeSlot(slot.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{slot.label}</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bookings per Slot
                </label>
                <input
                  type="number"
                  value={formData.maxBookings}
                  onChange={(e) =>
                    setFormData({ ...formData, maxBookings: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                  max="50"
                />
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
                  {creating ? 'Creating...' : 'Create Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
