'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { relationshipsApi, type Relationship } from '@/lib/api/relationships'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [relationshipsLoading, setRelationshipsLoading] = useState(true)
  const [formData, setFormData] = useState({
    uhid: '',
    memberId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER',
    status: 'ACTIVE',
    relationship: 'REL002', // Default to Spouse (since Self is not a relationship)
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  })

  useEffect(() => {
    fetchRelationships()
  }, [])

  const fetchRelationships = async () => {
    try {
      setRelationshipsLoading(true)
      const data = await relationshipsApi.getAll()
      setRelationships(data.filter(rel => rel.isActive))
    } catch (error) {
      console.error('Failed to fetch relationships:', error)
      setError('Failed to load relationships')
    } finally {
      setRelationshipsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate required fields
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const payload = {
        uhid: formData.uhid,
        memberId: formData.memberId,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        relationship: formData.relationship,
        name: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        address: formData.address.street ? formData.address : undefined,
        emergencyContact: formData.emergencyContact.name ? formData.emergencyContact : undefined,
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/admin/users')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to create user')
      }
    } catch (error) {
      setError('Failed to create user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Add New User</h1>
          <p className="section-subtitle">Create a new user account</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="label">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="gender" className="label">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="input"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="bloodGroup" className="label">
                Blood Group
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="uhid" className="label">
                UHID
              </label>
              <input
                type="text"
                id="uhid"
                name="uhid"
                value={formData.uhid}
                onChange={handleInputChange}
                className="input"
                placeholder="Unique Health ID"
              />
            </div>

            <div>
              <label htmlFor="memberId" className="label">
                Member ID
              </label>
              <input
                type="text"
                id="memberId"
                name="memberId"
                value={formData.memberId}
                onChange={handleInputChange}
                className="input"
                placeholder="MEM001"
              />
            </div>

            <div>
              <label htmlFor="role" className="label">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label htmlFor="relationship" className="label">
                Relationship
              </label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                className="input"
                disabled={relationshipsLoading}
              >
                {relationshipsLoading ? (
                  <option value="">Loading relationships...</option>
                ) : relationships.length > 0 ? (
                  relationships.map((rel) => (
                    <option key={rel._id} value={rel.relationshipCode}>
                      {rel.displayName}
                    </option>
                  ))
                ) : (
                  <option value="">No relationships available</option>
                )}
              </select>
              {relationshipsLoading && (
                <p className="text-xs text-gray-500 mt-1">Loading relationships from master data...</p>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="label">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input"
                placeholder="Confirm password"
              />
            </div>
          </div>
        </div>

        {/* Address (Optional) */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="address.street" className="label">
                Street Address
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="input"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label htmlFor="address.city" className="label">
                City
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="input"
                placeholder="Mumbai"
              />
            </div>

            <div>
              <label htmlFor="address.state" className="label">
                State
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="input"
                placeholder="Maharashtra"
              />
            </div>

            <div>
              <label htmlFor="address.zipCode" className="label">
                ZIP Code
              </label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                className="input"
                placeholder="400001"
              />
            </div>

            <div>
              <label htmlFor="address.country" className="label">
                Country
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                className="input"
                placeholder="India"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact (Optional) */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="emergencyContact.name" className="label">
                Contact Name
              </label>
              <input
                type="text"
                id="emergencyContact.name"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleInputChange}
                className="input"
                placeholder="Contact name"
              />
            </div>

            <div>
              <label htmlFor="emergencyContact.phone" className="label">
                Contact Phone
              </label>
              <input
                type="tel"
                id="emergencyContact.phone"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
                className="input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label htmlFor="emergencyContact.relationship" className="label">
                Relationship
              </label>
              <input
                type="text"
                id="emergencyContact.relationship"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleInputChange}
                className="input"
                placeholder="Spouse, Parent, etc."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}