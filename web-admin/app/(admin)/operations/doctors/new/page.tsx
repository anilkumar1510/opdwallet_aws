'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function NewDoctorPage() {
  const router = useRouter()
  const [specialties, setSpecialties] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
    // Clinic information
    clinicName: '',
    clinicAddress: '',
    clinicCity: '',
    clinicState: '',
    clinicPincode: '',
  })

  useEffect(() => {
    fetchSpecialties()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.qualifications || !formData.specialtyId) {
      setError('Please fill in all required fields')
      return
    }

    if (!formData.clinicName || !formData.clinicAddress) {
      setError('Please provide at least one clinic location')
      return
    }

    try {
      setSaving(true)
      setError('')

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
            clinicId: `CLI${Date.now()}`, // Temporary ID
            name: formData.clinicName,
            address: formData.clinicAddress,
            city: formData.clinicCity,
            state: formData.clinicState,
            pincode: formData.clinicPincode,
            consultationFee: formData.consultationFee,
          }
        ],
        consultationFee: formData.consultationFee,
        availableOnline: formData.availableOnline,
        availableOffline: formData.availableOffline,
      }

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
            Add at least one clinic location. You can add more clinics after creating the doctor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Clinic Name *</label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="input"
                placeholder="City Hospital"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address *</label>
              <input
                type="text"
                value={formData.clinicAddress}
                onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                className="input"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={formData.clinicCity}
                onChange={(e) => setFormData({ ...formData, clinicCity: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">State</label>
              <input
                type="text"
                value={formData.clinicState}
                onChange={(e) => setFormData({ ...formData, clinicState: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Pincode</label>
              <input
                type="text"
                value={formData.clinicPincode}
                onChange={(e) => setFormData({ ...formData, clinicPincode: e.target.value })}
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
