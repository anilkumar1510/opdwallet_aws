'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    specialtyId: '',
    search: '',
  })

  useEffect(() => {
    fetchSpecialties()
    fetchDoctors()
  }, [])

  useEffect(() => {
    fetchDoctors()
  }, [filters])

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

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.specialtyId) params.append('specialtyId', filters.specialtyId)
      if (filters.search) params.append('search', filters.search)

      const response = await apiFetch(`/api/doctors?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDoctorStatus = async (doctorId: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? `/api/doctors/${doctorId}/deactivate` : `/api/doctors/${doctorId}/activate`
      const response = await apiFetch(endpoint, { method: 'PATCH' })

      if (response.ok) {
        fetchDoctors()
      }
    } catch (error) {
      console.error('Failed to toggle doctor status:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search doctors..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="input flex-1"
        />

        <select
          value={filters.specialtyId}
          onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
          className="input sm:w-64"
        >
          <option value="">All Specialties</option>
          {specialties.map((spec) => (
            <option key={spec.specialtyId} value={spec.specialtyId}>
              {spec.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor.doctorId} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doctor.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">ID:</span> {doctor.doctorId}
                    </div>
                    <div>
                      <span className="font-medium">Specialty:</span> {doctor.specialty}
                    </div>
                    <div>
                      <span className="font-medium">Experience:</span> {doctor.experienceYears} years
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Qualifications:</span> {doctor.qualifications}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Clinics:</span> {doctor.clinics?.length || 0} location(s)
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/operations/doctors/${doctor.doctorId}`)}
                    className="btn-primary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleDoctorStatus(doctor.doctorId, doctor.isActive)}
                    className={doctor.isActive ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                  >
                    {doctor.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}