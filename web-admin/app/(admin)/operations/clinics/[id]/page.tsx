'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function EditClinicPage() {
  const router = useRouter()
  const params = useParams()
  const clinicId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  const fetchClinic = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/clinics/${clinicId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
      }
    } catch (error) {
      console.error('Failed to fetch clinic:', error)
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    fetchClinic()
  }, [fetchClinic])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Clean the data to match UpdateClinicDto - remove database fields
      const updateData = {
        name: formData.name,
        contactNumber: formData.contactNumber,
        email: formData.email || undefined,
        address: formData.address ? {
          line1: formData.address.line1,
          line2: formData.address.line2 || undefined,
          city: formData.address.city,
          state: formData.address.state,
          pincode: formData.address.pincode,
          country: formData.address.country || 'India'
        } : undefined,
        location: formData.location || undefined,
        operatingHours: formData.operatingHours || undefined,
        facilities: formData.facilities || undefined,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      }

      // Remove undefined values to avoid sending empty fields
      const cleanedData = JSON.parse(JSON.stringify(updateData))

      console.log('[EditClinicPage] Sending update request:', { clinicId, cleanedData })

      const response = await apiFetch(`/api/clinics/${clinicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      })

      if (response.ok) {
        toast.success('Clinic updated successfully')
        router.push('/operations/clinics')
      } else {
        const error = await response.json()
        console.error('[EditClinicPage] Failed to update clinic:', error)
        toast.error(`Failed to update clinic: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('[EditClinicPage] Failed to update clinic:', error)
      toast.error('Failed to update clinic. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!formData) {
    return <div className="text-center py-8">Clinic not found</div>
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Clinic - {formData.clinicId}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Clinic Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Street *</label>
              <input
                type="text"
                required
                value={formData.address?.line1 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, line1: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">City *</label>
              <input
                type="text"
                required
                value={formData.address?.city || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">State *</label>
              <input
                type="text"
                required
                value={formData.address?.state || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Pincode *</label>
              <input
                type="text"
                required
                value={formData.address?.pincode || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, pincode: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Country *</label>
              <input
                type="text"
                required
                value={formData.address?.country || 'India'}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value }
                })}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}