'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

// API base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'

export default function EditDoctorPage() {
  const router = useRouter()
  const params = useParams()
  const [doctor, setDoctor] = useState<any>(null)
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const fetchDoctor = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/doctors/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setDoctor(data)
        if (data.profilePhoto) {
          setPhotoPreview(data.profilePhoto)
        }
      } else {
        setError('Doctor not found')
      }
    } catch (error) {
      console.error('Failed to fetch doctor:', error)
      setError('Failed to load doctor')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchDoctor()
      fetchSpecialties()
    }
  }, [params.id, fetchDoctor])

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[PhotoUpload] Upload initiated')
    const file = e.target.files?.[0]

    if (!file) {
      console.log('[PhotoUpload] No file selected')
      return
    }

    console.log('[PhotoUpload] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    })

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      console.error('[PhotoUpload] Invalid file type:', file.type)
      setError('Only JPG and PNG images are allowed')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('[PhotoUpload] File too large:', file.size, 'bytes')
      setError('Image size must be less than 2MB')
      return
    }

    console.log('[PhotoUpload] Validation passed, uploading to doctor:', doctor.doctorId)

    try {
      setUploadingPhoto(true)
      setError('')

      const formData = new FormData()
      formData.append('photo', file)

      console.log('[PhotoUpload] FormData created, making API call to:', `/api/doctors/${doctor.doctorId}/photo`)

      const response = await apiFetch(`/api/doctors/${doctor.doctorId}/photo`, {
        method: 'POST',
        body: formData,
      })

      console.log('[PhotoUpload] Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[PhotoUpload] Upload successful:', data)
        setPhotoPreview(data.photoUrl)
        setDoctor({ ...doctor, profilePhoto: data.photoUrl })
        toast.success('Photo uploaded successfully')
      } else {
        const errorData = await response.text()
        console.error('[PhotoUpload] Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        const errorMessage = `Failed to upload photo: ${response.status} ${response.statusText}`
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('[PhotoUpload] Exception during upload:', error)
      const errorMessage = 'Failed to upload photo: ' + (error as Error).message
      setError(errorMessage)
      toast.error('Failed to upload photo. Please check your connection and try again.')
    } finally {
      setUploadingPhoto(false)
      console.log('[PhotoUpload] Upload process completed')
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
          email: doctor.email,
          phone: doctor.phone,
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
        toast.success('Doctor updated successfully')
        router.push('/operations/doctors')
      } else {
        const errorData = await response.json()
        console.error('Failed to update doctor:', errorData)
        const errorMessage = errorData.message || 'Failed to update doctor'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Failed to update doctor:', error)
      const errorMessage = (error as Error).message || 'Failed to update doctor'
      setError(errorMessage)
      toast.error('Failed to update doctor. Please check your connection and try again.')
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
            <label className="label">Email * (used for login)</label>
            <input
              type="email"
              value={doctor.email || ''}
              onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
              className="input"
              placeholder="doctor@example.com"
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={doctor.phone || ''}
              onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
              className="input"
              placeholder="+91 1234567890"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a professional photo of the doctor. Recommended size: 300x300px. Max file size: 2MB. Formats: JPG, PNG
        </p>

        <div className="flex items-start gap-6">
          <div className="relative">
            {photoPreview ? (
              <img
                src={`${API_BASE_URL}${photoPreview}`}
                alt="Doctor photo"
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                onError={(e) => {
                  console.error('[PhotoUpload] Failed to load image:', photoPreview)
                  console.error('[PhotoUpload] Attempted URL:', `${API_BASE_URL}${photoPreview}`)
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              id="photo-upload"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label
              htmlFor="photo-upload"
              className={`inline-block px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                uploadingPhoto
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {uploadingPhoto ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Upload Photo'}
            </label>
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

      {/* Schedules Section - Moved to doctor list page */}
      {/* <div className="card">
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
      </div> */}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication & Security</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage doctor login credentials. The doctor will use their email address to log in.
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">Login Email</label>
            <input
              type="email"
              value={doctor.email || ''}
              disabled
              className="input bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Update in Basic Information section.</p>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value="••••••••"
                disabled
                className="input bg-gray-50 cursor-not-allowed flex-1"
              />
              <button
                onClick={async () => {
                  const newPassword = prompt('Enter new password for this doctor (minimum 6 characters):')
                  if (!newPassword) return

                  if (newPassword.length < 6) {
                    toast.error('Password must be at least 6 characters long')
                    return
                  }

                  try {
                    const response = await apiFetch(`/api/doctors/${doctor.doctorId}/set-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: newPassword }),
                    })

                    if (response.ok) {
                      toast.success('Password set successfully! The doctor can now login with their email and this password.')
                    } else {
                      const error = await response.text()
                      console.error('Failed to set password:', error)
                      toast.error('Failed to set password: ' + error)
                    }
                  } catch (error) {
                    console.error('Error setting password:', error)
                    toast.error('Failed to set password: ' + (error as Error).message)
                  }
                }}
                className="btn-primary whitespace-nowrap"
              >
                Set/Reset Password
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Click &quot;Set/Reset Password&quot; to create or update login credentials</p>
          </div>
        </div>
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