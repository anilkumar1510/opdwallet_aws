'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useSpecialties } from '@/lib/providers/specialties-provider'

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const { specialties } = useSpecialties() // Use cached specialties
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    specialtyId: '',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  // PERFORMANCE: Debounce search to prevent API spam
  const debouncedFilters = useDebounce(filters, 300)

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.specialtyId) params.append('specialtyId', filters.specialtyId)
      if (filters.search) params.append('search', filters.search)
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
  }, [filters.specialtyId, filters.search, pagination.page, pagination.limit])

  useEffect(() => {
    fetchDoctors()
  }, [debouncedFilters, pagination.page, fetchDoctors]) // Use debounced filters and page

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

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 }) // Reset to page 1 when filters change
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => router.push('/operations/doctors/new')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search doctors..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="input flex-1"
        />

        <select
          value={filters.specialtyId}
          onChange={(e) => handleFilterChange({ ...filters, specialtyId: e.target.value })}
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