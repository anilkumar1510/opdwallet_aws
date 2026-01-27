'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'

interface Doctor {
  _id: string
  doctorId: string
  name: string
  email: string
  phone: string
  qualifications: string
  specializations: string[]
  specialty: string
  specialtyId: string
  experienceYears: number
  profilePhoto?: string
  isActive: boolean
  clinics?: any[]
  consultationFee?: number
}

interface Specialty {
  _id: string
  specialtyId: string
  name: string
  isActive: boolean
}

export default function DoctorsTab() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    specialtyId: '',
    search: '',
    isActive: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  // Debounce filters to prevent API spam on every keystroke
  const debouncedFilters = useDebounce(filters, 300)

  // Fetch specialties for dropdown
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await apiFetch('/api/specialties')
        if (response.ok) {
          const data = await response.json()
          setSpecialties(data.filter((s: Specialty) => s.isActive))
        }
      } catch (error) {
        console.error('Failed to fetch specialties:', error)
      }
    }
    fetchSpecialties()
  }, [])

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.specialtyId) params.append('specialtyId', filters.specialtyId)
      if (filters.search) params.append('search', filters.search)
      // Only append isActive if a specific value is selected (not empty string for "All Status")
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await apiFetch(`/api/doctors?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setDoctors(result.data || [])
        setPagination({
          page: result.page || 1,
          limit: result.limit || 20,
          total: result.total || 0,
          pages: result.pages || 0,
        })
      } else {
        console.error('Failed to fetch doctors: HTTP', response.status)
        setDoctors([])
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [filters.specialtyId, filters.search, filters.isActive, pagination.page, pagination.limit])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const toggleDoctorStatus = async (doctorId: string, isActive: boolean) => {
    try {
      const endpoint = isActive
        ? `/api/doctors/${doctorId}/deactivate`
        : `/api/doctors/${doctorId}/activate`
      const response = await apiFetch(endpoint, { method: 'PATCH' })

      if (response.ok) {
        fetchDoctors()
      }
    } catch (error) {
      console.error('Failed to toggle doctor status:', error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 }) // Reset to page 1 when filters change
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <input
          type="text"
          placeholder="Search doctors..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="input md:col-span-4"
        />

        <select
          value={filters.specialtyId}
          onChange={(e) => handleFilterChange({ ...filters, specialtyId: e.target.value })}
          className="input md:col-span-3"
        >
          <option value="">All Specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty._id} value={specialty.specialtyId}>
              {specialty.name}
            </option>
          ))}
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange({ ...filters, isActive: e.target.value })}
          className="input md:col-span-3"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => router.push('/network-management/doctors/new?from=doctors')}
          className="btn btn-primary whitespace-nowrap md:col-span-2"
        >
          Add Doctor
        </button>
      </div>

      {/* Doctors Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th>Qualifications</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No doctors found
                    </td>
                  </tr>
                ) : (
                  doctors.map((doctor) => (
                    <tr key={doctor.doctorId}>
                      <td className="font-mono text-sm">{doctor.doctorId}</td>
                      <td className="font-medium">{doctor.name}</td>
                      <td>{doctor.specialty}</td>
                      <td>{doctor.experienceYears} years</td>
                      <td>{doctor.qualifications}</td>
                      <td>
                        <span
                          className={`badge ${
                            doctor.isActive ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/network-management/doctors/${doctor.doctorId}?from=doctors`)}
                            className="btn btn-sm btn-ghost"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleDoctorStatus(doctor.doctorId, doctor.isActive)}
                            className="btn btn-sm btn-ghost"
                          >
                            {doctor.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && doctors.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} doctors
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.pages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNumber = pagination.pages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
