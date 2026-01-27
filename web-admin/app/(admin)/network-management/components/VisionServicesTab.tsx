'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

interface Clinic {
  _id: string
  clinicId: string
  name: string
  address: {
    city: string
    state: string
    street?: string
    zipCode?: string
  }
  visionServicesEnabled: boolean
  enabledServicesCount: number
  hasEnabledServices: boolean
}

export default function VisionServicesTab() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [allClinics, setAllClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '', // '' = all, 'true' = enabled, 'false' = disabled
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  const debouncedSearch = useDebounce(filters.search, 300)

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/ops/vision-services/clinics')

      if (response.ok) {
        const result = await response.json()
        // API response has clinics in result.data
        setAllClinics(result.data || [])
      } else {
        console.error('Failed to fetch clinics: HTTP', response.status)
        toast.error('Failed to load clinics')
        setAllClinics([])
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
      toast.error('Failed to load clinics')
      setAllClinics([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClinics()
  }, [fetchClinics])

  useEffect(() => {
    // Apply client-side filtering and pagination
    // Safeguard: ensure allClinics is an array
    if (!Array.isArray(allClinics)) {
      setClinics([])
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }))
      return
    }

    let filtered = [...allClinics]

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter((clinic: Clinic) =>
        clinic.name.toLowerCase().includes(searchLower) ||
        clinic.address.city.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status !== '') {
      const statusBool = filters.status === 'true'
      filtered = filtered.filter((clinic: Clinic) =>
        clinic.visionServicesEnabled === statusBool
      )
    }

    // Pagination
    const total = filtered.length
    const pages = Math.ceil(total / pagination.limit)
    const start = (pagination.page - 1) * pagination.limit
    const paginated = filtered.slice(start, start + pagination.limit)

    setClinics(paginated)
    setPagination(prev => ({ ...prev, total, pages }))
  }, [allClinics, debouncedSearch, filters.status, pagination.page, pagination.limit])

  const toggleVisionServices = async (clinicId: string, currentStatus: boolean) => {
    try {
      const newState = !currentStatus
      setToggling(clinicId)
      const response = await apiFetch(
        `/api/ops/vision-services/clinics/${clinicId}/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: newState }),
        }
      )

      if (response.ok) {
        const action = newState ? 'enabled' : 'disabled'
        toast.success(`Vision services ${action} successfully`)
        fetchClinics() // Refresh list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to toggle vision services')
      }
    } catch (error) {
      console.error('Failed to toggle vision services:', error)
      toast.error('Failed to toggle vision services')
    } finally {
      setToggling(null)
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Vision Services Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enable or disable vision services for clinics. Service slot management is handled in Operations Portal.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <input
          type="text"
          placeholder="Search by clinic name or city..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          className="input md:col-span-8"
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="input md:col-span-4"
        >
          <option value="">All Status</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {/* Clinics Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Clinic ID</th>
                  <th>Clinic Name</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Status</th>
                  <th>Enabled Services</th>
                  <th className="text-center">Toggle</th>
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
                      <td>{clinic.address.city}</td>
                      <td>{clinic.address.state}</td>
                      <td>
                        <span
                          className={`badge ${
                            clinic.visionServicesEnabled ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {clinic.visionServicesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {clinic.enabledServicesCount} service{clinic.enabledServicesCount !== 1 ? 's' : ''}
                      </td>
                      <td>
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleVisionServices(clinic.clinicId, clinic.visionServicesEnabled)}
                            disabled={toggling === clinic.clinicId}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                              clinic.visionServicesEnabled
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            } ${toggling === clinic.clinicId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={clinic.visionServicesEnabled ? 'Disable vision services' : 'Enable vision services'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                clinic.visionServicesEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
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
      {!loading && clinics.length > 0 && pagination.pages > 1 && (
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
