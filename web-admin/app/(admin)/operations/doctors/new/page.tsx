'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function NewDoctorPage() {
  const router = useRouter()
  const [specialties, setSpecialties] = useState<any[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingClinics, setLoadingClinics] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    qualifications: '',
    experienceYears: 0,
    specialtyId: '',
    specialty: '',
    specializations: [] as string[],
    consultationFee: 0,
    availableOnline: true,
    availableOffline: true,
    // Clinic selection from Clinic Master
    selectedClinicId: '',
  })

  useEffect(() => {
    fetchSpecialties()
    fetchClinics()
  }, [])

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

  const fetchClinics = async () => {
    try {
      console.log('[FetchClinics] Fetching clinics from Clinic Master')
      setLoadingClinics(true)
      const response = await apiFetch('/api/clinics?isActive=true')
      if (response.ok) {
        const result = await response.json()
        const clinicsList = result.data || []
        console.log('[FetchClinics] Fetched clinics:', clinicsList.length, 'active clinics')
        setClinics(clinicsList)
      } else {
        console.error('[FetchClinics] Failed to fetch clinics: HTTP', response.status)
        toast.error('Failed to load clinics. Please refresh the page.')
      }
    } catch (error) {
      console.error('[FetchClinics] Error fetching clinics:', error)
      toast.error('Failed to load clinics. Please check your connection.')
    } finally {
      setLoadingClinics(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.qualifications || !formData.specialtyId) {
      setError('Please fill in all required fields')
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.selectedClinicId) {
      setError('Please select a primary clinic location')
      toast.error('Please select a primary clinic location')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Find selected clinic from clinics list
      const selectedClinic = clinics.find(c => c.clinicId === formData.selectedClinicId)
      if (!selectedClinic) {
        setError('Selected clinic not found')
        toast.error('Selected clinic not found')
        setSaving(false)
        return
      }

      console.log('[CreateDoctor] Creating doctor with clinic:', {
        clinicId: selectedClinic.clinicId,
        clinicName: selectedClinic.name,
        doctorName: formData.name
      })

      // Create doctor payload according to CreateDoctorDto
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        qualifications: formData.qualifications,
        specializations: formData.specializations.length > 0 ? formData.specializations : [formData.specialty],
        specialtyId: formData.specialtyId,
        specialty: formData.specialty,
        experienceYears: formData.experienceYears,
        clinics: [
          {
            clinicId: selectedClinic.clinicId,
            name: selectedClinic.name,
            address: selectedClinic.address?.street || selectedClinic.address?.line1 || '',
            city: selectedClinic.address?.city || '',
            state: selectedClinic.address?.state || '',
            pincode: selectedClinic.address?.pincode || selectedClinic.address?.zipCode || '',
            consultationFee: formData.consultationFee,
          }
        ],
        consultationFee: formData.consultationFee,
        availableOnline: formData.availableOnline,
        availableOffline: formData.availableOffline,
      }

      console.log('[CreateDoctor] Payload:', JSON.stringify(payload, null, 2))

      const response = await apiFetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Doctor created successfully')
        router.push(`/operations/doctors/${data.doctorId}`)
      } else {
        const errorData = await response.json()
        console.error('Failed to create doctor:', errorData)
        const errorMessage = errorData.message || 'Failed to create doctor'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Failed to create doctor:', error)
      const errorMessage = (error as Error).message || 'Failed to create doctor'
      setError(errorMessage)
      toast.error('Failed to create doctor. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Create New Doctor</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new doctor to the system</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Email * (used for login)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="doctor@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label className="label">Qualifications *</label>
              <input
                type="text"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                className="input"
                placeholder="MBBS, MD"
                required
              />
            </div>

            <div>
              <label className="label">Experience (years) *</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Specialty *</label>
              <select
                value={formData.specialtyId}
                onChange={(e) => {
                  const selected = specialties.find(s => s.specialtyId === e.target.value)
                  setFormData({
                    ...formData,
                    specialtyId: e.target.value,
                    specialty: selected?.name || '',
                    specializations: selected?.name ? [selected.name] : []
                  })
                }}
                className="input"
                required
              >
                <option value="">Select Specialty</option>
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
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Clinic Location *</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select a clinic from the Clinic Master. The doctor will be automatically mapped to this clinic.
          </p>

          {loadingClinics ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading clinics...</span>
            </div>
          ) : clinics.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 mb-2">
                No active clinics found in the system. Please add a clinic first.
              </p>
              <button
                type="button"
                onClick={() => router.push('/operations/clinics/new')}
                className="btn-primary text-sm mt-2"
              >
                Add New Clinic
              </button>
            </div>
          ) : (
            <div>
              <label className="label">Select Clinic *</label>
              <select
                value={formData.selectedClinicId}
                onChange={(e) => {
                  console.log('[ClinicSelection] Selected clinic ID:', e.target.value)
                  const selectedClinic = clinics.find(c => c.clinicId === e.target.value)
                  if (selectedClinic) {
                    console.log('[ClinicSelection] Selected clinic details:', {
                      id: selectedClinic.clinicId,
                      name: selectedClinic.name,
                      city: selectedClinic.address?.city
                    })
                  }
                  setFormData({ ...formData, selectedClinicId: e.target.value })
                }}
                className="input"
                required
              >
                <option value="">-- Select a Clinic --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.name} - {clinic.address?.city || 'N/A'}, {clinic.address?.state || 'N/A'}
                  </option>
                ))}
              </select>

              {formData.selectedClinicId && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Selected Clinic Details</h4>
                  {(() => {
                    const selectedClinic = clinics.find(c => c.clinicId === formData.selectedClinicId)
                    return selectedClinic ? (
                      <div className="text-sm text-green-800 space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedClinic.name}</p>
                        <p><span className="font-medium">Address:</span> {selectedClinic.address?.street || selectedClinic.address?.line1 || 'N/A'}</p>
                        <p><span className="font-medium">City:</span> {selectedClinic.address?.city || 'N/A'}</p>
                        <p><span className="font-medium">State:</span> {selectedClinic.address?.state || 'N/A'}</p>
                        <p><span className="font-medium">Pincode:</span> {selectedClinic.address?.pincode || selectedClinic.address?.zipCode || 'N/A'}</p>
                        <p><span className="font-medium">Contact:</span> {selectedClinic.contactNumber || 'N/A'}</p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.availableOnline}
                onChange={(e) => setFormData({ ...formData, availableOnline: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Available for Online Consultations</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.availableOffline}
                onChange={(e) => setFormData({ ...formData, availableOffline: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Available for Clinic Visits</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 md:flex-initial md:px-8"
          >
            {saving ? 'Creating...' : 'Create Doctor'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/operations/doctors')}
            className="btn-secondary flex-1 md:flex-initial md:px-8"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
