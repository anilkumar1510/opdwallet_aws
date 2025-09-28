'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function EditDoctorPage() {
  const router = useRouter()
  const params = useParams()
  const [doctor, setDoctor] = useState<any>(null)
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchDoctor()
      fetchSpecialties()
    }
  }, [params.id])


  const fetchDoctor = async () => {
    try {
      const response = await apiFetch(`/api/doctors/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setDoctor(data)
      } else {
        setError('Doctor not found')
      }
    } catch (error) {
      console.error('Failed to fetch doctor:', error)
      setError('Failed to load doctor')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecialties = async () => {
    try {
      const response = await apiFetch('/api/specialties')
      if (response.ok) {
        const data = await response.json()
        setSpecialties(data)
      }
    } catch (error) {
      console.error('Failed to fetch specialties:', error)
    }
  }

  const handleSave = async () => {
    if (!doctor) return

    try {
      setSaving(true)
      setError('')

      const response = await apiFetch(`/api/doctors/${doctor.doctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: doctor.name,
          qualifications: doctor.qualifications,
          experienceYears: doctor.experienceYears,
          specialtyId: doctor.specialtyId,
          specialty: doctor.specialty,
          specializations: doctor.specializations,
          consultationFee: doctor.consultationFee,
          availableOnline: doctor.availableOnline,
          availableOffline: doctor.availableOffline,
        }),
      })

      if (response.ok) {
        router.push('/operations/doctors')
      } else {
        setError('Failed to update doctor')
      }
    } catch (error) {
      console.error('Failed to update doctor:', error)
      setError('Failed to update doctor')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.push('/operations/doctors')} className="btn-primary">
          Back to Doctors
        </button>
      </div>
    )
  }

  if (!doctor) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Edit Doctor</h2>
          <p className="text-sm text-gray-600 mt-1">Doctor ID: {doctor.doctorId}</p>
        </div>
        <button
          onClick={() => router.push('/operations/doctors')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={doctor.name}
              onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Qualifications *</label>
            <input
              type="text"
              value={doctor.qualifications}
              onChange={(e) => setDoctor({ ...doctor, qualifications: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Experience (years) *</label>
            <input
              type="number"
              value={doctor.experienceYears}
              onChange={(e) => setDoctor({ ...doctor, experienceYears: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Specialty *</label>
            <select
              value={doctor.specialtyId}
              onChange={(e) => {
                const selected = specialties.find(s => s.specialtyId === e.target.value)
                setDoctor({
                  ...doctor,
                  specialtyId: e.target.value,
                  specialty: selected?.name || ''
                })
              }}
              className="input"
            >
              {specialties.map((spec) => (
                <option key={spec.specialtyId} value={spec.specialtyId}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Consultation Fee *</label>
            <input
              type="number"
              value={doctor.consultationFee}
              onChange={(e) => setDoctor({ ...doctor, consultationFee: parseFloat(e.target.value) || 0 })}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={doctor.availableOnline}
              onChange={(e) => setDoctor({ ...doctor, availableOnline: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Available for Online Consultations</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={doctor.availableOffline}
              onChange={(e) => setDoctor({ ...doctor, availableOffline: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Available for Clinic Visits</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedules</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure doctor schedules by clinic and day of week.
        </p>
        <button
          onClick={() => router.push(`/operations/doctors/${doctor.doctorId}/schedules`)}
          className="btn-primary"
        >
          Manage Schedules
        </button>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            doctor.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {doctor.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-sm text-gray-600">
            Current status of the doctor profile
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 md:flex-initial md:px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => router.push('/operations/doctors')}
          className="btn-secondary flex-1 md:flex-initial md:px-8"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}