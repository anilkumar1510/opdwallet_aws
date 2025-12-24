'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function NewClinicPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    location: {
      latitude: 0,
      longitude: 0,
    },
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: true },
    },
    facilities: [],
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Transform operating hours to match backend schema
      const transformedOperatingHours: Record<string, any> = {}
      Object.entries(formData.operatingHours).forEach(([day, hours]: [string, any]) => {
        transformedOperatingHours[day] = {
          isOpen: !hours.closed,
          openTime: hours.open,
          closeTime: hours.close,
        }
      })

      const payload = {
        ...formData,
        operatingHours: transformedOperatingHours,
      }

      const response = await apiFetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Clinic created successfully')
        router.push('/clinics')
      } else {
        const error = await response.json()
        console.error('Failed to create clinic:', error)
        toast.error(`Failed to create clinic: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create clinic:', error)
      toast.error('Failed to create clinic. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Clinic</h1>
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
                value={formData.email}
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
                value={formData.address.line1}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">City *</label>
              <input
                type="text"
                required
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">State *</label>
              <input
                type="text"
                required
                value={formData.address.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Pincode *</label>
              <input
                type="text"
                required
                value={formData.address.pincode}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Country *</label>
              <input
                type="text"
                required
                value={formData.address.country}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
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
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Clinic'}
          </button>
        </div>
      </form>
    </div>
  )
}