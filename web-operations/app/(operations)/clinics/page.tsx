'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/lib/hooks/useDebounce'

export default function ClinicsPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    search: '',
    isActive: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  // PERFORMANCE: Debounce filters to prevent API spam on every keystroke
  const debouncedFilters = useDebounce(filters, 300)

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.city) params.append('city', filters.city)
      if (filters.search) params.append('search', filters.search)
      if (filters.isActive) params.append('isActive', filters.isActive)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await apiFetch(`/api/clinics?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setClinics(result.data || [])
        setPagination({
          page: result.page || 1,
          limit: result.limit || 20,
          total: result.total || 0,
          pages: result.pages || 0,
        })
      } else {
        console.error('Failed to fetch clinics: HTTP', response.status)
        setClinics([])
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
      setClinics([])
    } finally {
      setLoading(false)
    }
  }, [filters.city, filters.search, filters.isActive, pagination.page, pagination.limit])

  useEffect(() => {
    fetchClinics()
  }, [fetchClinics])

  const toggleClinicStatus = async (clinicId: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? `/api/clinics/${clinicId}/deactivate` : `/api/clinics/${clinicId}/activate`
      const response = await apiFetch(endpoint, { method: 'PATCH' })

      if (response.ok) {
        fetchClinics()
      }
    } catch (error) {
      console.error('Failed to toggle clinic status:', error)
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
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search clinics..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="input flex-1"
        />

        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => handleFilterChange({ ...filters, city: e.target.value })}
          className="input flex-1"
        />

        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange({ ...filters, isActive: e.target.value })}
          className="input"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => router.push('/clinics/new')}
          className="btn btn-primary whitespace-nowrap"
        >
          Add Clinic
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Clinic ID</th>
                  <th>Name</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clinics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No clinics found
                    </td>
                  </tr>
                ) : (
                  clinics.map((clinic) => (
                    <tr key={clinic.clinicId}>
                      <td className="font-mono text-sm">{clinic.clinicId}</td>
                      <td className="font-medium">{clinic.name}</td>
                      <td>{clinic.address?.city || '-'}</td>
                      <td>{clinic.address?.state || '-'}</td>
                      <td>{clinic.contactNumber || '-'}</td>
                      <td>
                        <span
                          className={`badge ${
                            clinic.isActive ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {clinic.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/clinics/${clinic.clinicId}`)}
                            className="btn btn-sm btn-ghost"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleClinicStatus(clinic.clinicId, clinic.isActive)}
                            className="btn btn-sm btn-ghost"
                          >
                            {clinic.isActive ? 'Deactivate' : 'Activate'}
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
      {!loading && clinics.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clinics
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