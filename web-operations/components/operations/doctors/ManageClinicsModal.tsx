'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

interface ManageClinicsModalProps {
  isOpen: boolean
  onClose: () => void
  doctorId: string
  doctorName: string
  onSuccess: () => void
}

interface Clinic {
  clinicId: string
  name: string
  address: {
    line1: string
    city: string
    state: string
    pincode: string
    country: string
  }
  isActive: boolean
}

export default function ManageClinicsModal({
  isOpen,
  onClose,
  doctorId,
  doctorName,
  onSuccess
}: ManageClinicsModalProps) {
  const [allClinics, setAllClinics] = useState<Clinic[]>([])
  const [assignedClinicIds, setAssignedClinicIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, doctorId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all active clinics
      const clinicsResponse = await apiFetch('/api/clinics?isActive=true')
      if (!clinicsResponse.ok) {
        throw new Error('Failed to fetch clinics')
      }
      const clinicsData = await clinicsResponse.json()
      setAllClinics(clinicsData.data || [])

      // Fetch assigned clinics for this doctor
      const assignedResponse = await apiFetch(`/api/doctor-clinic-assignments/doctor/${doctorId}`)
      if (!assignedResponse.ok) {
        throw new Error('Failed to fetch assigned clinics')
      }
      const assignedData = await assignedResponse.json()
      const assignedIds = new Set((assignedData.data || []).map((clinic: Clinic) => clinic.clinicId))
      setAssignedClinicIds(assignedIds)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch clinic data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleClinic = (clinicId: string) => {
    const newAssignedIds = new Set(assignedClinicIds)
    if (newAssignedIds.has(clinicId)) {
      newAssignedIds.delete(clinicId)
    } else {
      newAssignedIds.add(clinicId)
    }
    setAssignedClinicIds(newAssignedIds)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await apiFetch(
        `/api/doctor-clinic-assignments/doctor/${doctorId}/sync`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinicIds: Array.from(assignedClinicIds),
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        // Handle nested error message structure
        let errorMessage = 'Failed to update clinic assignments'
        if (typeof errorData.message === 'object' && errorData.message.message) {
          errorMessage = errorData.message.message
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        } else if (errorData.message?.error) {
          errorMessage = errorData.message.error
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      toast.success(result.message || 'Clinic assignments updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating clinic assignments:', error)
      toast.error(error.message || 'Failed to update clinic assignments. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredClinics = allClinics.filter(clinic => {
    const query = searchQuery.toLowerCase()
    return (
      clinic.name.toLowerCase().includes(query) ||
      clinic.address?.city?.toLowerCase().includes(query) ||
      clinic.address?.line1?.toLowerCase().includes(query) ||
      clinic.address?.state?.toLowerCase().includes(query)
    )
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Clinics</h2>
            <p className="text-sm text-gray-600 mt-1">Doctor: {doctorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clinics by name, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {assignedClinicIds.size} of {allClinics.length} clinics selected
          </p>
        </div>

        {/* Clinic List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading clinics...</p>
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchQuery ? 'No clinics match your search' : 'No clinics available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClinics.map((clinic) => (
                <label
                  key={clinic.clinicId}
                  className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={assignedClinicIds.has(clinic.clinicId)}
                    onChange={() => handleToggleClinic(clinic.clinicId)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{clinic.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {clinic.address?.city} • {clinic.address?.line1}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
