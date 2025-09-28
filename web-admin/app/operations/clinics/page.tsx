'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function ClinicsPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    search: '',
    isActive: '',
  })

  useEffect(() => {
    fetchClinics()
  }, [filters])

  const fetchClinics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.city) params.append('city', filters.city)
      if (filters.search) params.append('search', filters.search)
      if (filters.isActive) params.append('isActive', filters.isActive)

      const response = await apiFetch(`/api/clinics?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setClinics(data)
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search clinics..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="input flex-1"
        />

        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="input flex-1"
        />

        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          className="input"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => router.push('/operations/clinics/new')}
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
                      <td>{clinic.phone || '-'}</td>
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
                            onClick={() => router.push(`/operations/clinics/${clinic.clinicId}`)}
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
    </div>
  )
}