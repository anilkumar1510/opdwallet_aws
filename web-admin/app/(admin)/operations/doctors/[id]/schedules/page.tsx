'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const CONSULTATION_TYPES = ['IN_CLINIC', 'ONLINE']

export default function DoctorSchedulesPage() {
  const params = useParams()
  const router = useRouter()
  const doctorId = params.id as string
  const [doctor, setDoctor] = useState<any>(null)
  const [clinics, setClinics] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    clinicId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    consultationFee: 500,
    consultationType: 'IN_CLINIC',
    maxAppointments: 20,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchDoctor = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/doctors/${doctorId}`)
      if (response.ok) {
        const data = await response.json()
        setDoctor(data)
      }
    } catch (error) {
      console.error('Failed to fetch doctor:', error)
    }
  }, [doctorId])

  const fetchClinics = async () => {
    try {
      const response = await apiFetch('/api/clinics?isActive=true')
      if (response.ok) {
        const result = await response.json()
        // API returns { data: [...], page, limit, total, pages }
        setClinics(Array.isArray(result.data) ? result.data : [])
      } else {
        console.error('Failed to fetch clinics:', response.status)
        setClinics([])
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
      setClinics([])
    }
  }

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/doctor-slots?doctorId=${doctorId}`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchDoctor()
    fetchClinics()
    fetchSlots()
  }, [doctorId, fetchDoctor, fetchSlots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      const response = await apiFetch('/api/doctor-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          doctorId,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        fetchSlots()
        setFormData({
          clinicId: '',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          consultationFee: 500,
          consultationType: 'IN_CLINIC',
          maxAppointments: 20,
        })
        toast.success('Schedule created successfully')
      } else {
        const error = await response.json()
        console.error('Failed to create slot:', error)
        toast.error(`Failed to create slot: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create slot:', error)
      toast.error('Failed to create slot. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSlotStatus = async (slotId: string, isActive: boolean) => {
    try {
      const endpoint = isActive
        ? `/api/doctor-slots/${slotId}/deactivate`
        : `/api/doctor-slots/${slotId}/activate`
      const response = await apiFetch(endpoint, { method: 'PATCH' })

      if (response.ok) {
        fetchSlots()
      }
    } catch (error) {
      console.error('Failed to toggle slot status:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{doctor?.name} - Schedules</h1>
          <p className="text-gray-600">{doctorId}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Schedule'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">Add New Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Clinic *</label>
              <select
                required
                value={formData.clinicId}
                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                className="input w-full"
              >
                <option value="">Select Clinic</option>
                {clinics.map((clinic) => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.name} - {clinic.address?.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Day of Week *</label>
              <select
                required
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="input w-full"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Slot Duration (minutes) *</label>
              <input
                type="number"
                required
                min="10"
                max="120"
                value={formData.slotDuration}
                onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Consultation Fee *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Consultation Type *</label>
              <select
                required
                value={formData.consultationType}
                onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                className="input w-full"
              >
                {CONSULTATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Max Appointments *</label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.maxAppointments}
                onChange={(e) => setFormData({ ...formData, maxAppointments: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Slot ID</th>
                  <th>Clinic</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Fee</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No schedules configured
                    </td>
                  </tr>
                ) : (
                  slots.map((slot) => (
                    <tr key={slot.slotId}>
                      <td className="font-mono text-sm">{slot.slotId}</td>
                      <td>{slot.clinicId}</td>
                      <td>{slot.dayOfWeek}</td>
                      <td>
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td>{slot.slotDuration} min</td>
                      <td>₹{slot.consultationFee}</td>
                      <td>{slot.consultationType}</td>
                      <td>
                        <span
                          className={`badge ${
                            slot.isActive ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleSlotStatus(slot.slotId, slot.isActive)}
                          className="btn btn-sm btn-ghost"
                        >
                          {slot.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}