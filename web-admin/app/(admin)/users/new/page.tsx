'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [cugs, setCugs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    uhid: '',
    memberId: '',
    employeeId: '',
    cugId: '',
    corporateName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER',
    status: 'ACTIVE',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
  })

  const fillDummyData = () => {
    const timestamp = Date.now()
    const dummyData = {
      uhid: `UHID${timestamp}`,
      memberId: `MEM${timestamp}`,
      email: `user${timestamp}@example.com`,
      phone: '+919876543210',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'MEMBER',
      status: 'ACTIVE',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      gender: 'MALE',
      bloodGroup: 'O+',
      address: {
        line1: '123 Main Street',
        line2: 'Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    }

    console.group('⚡ [USER CREATION] Fill Dummy Data')
    console.log('Timestamp:', timestamp)
    console.log('Generated UHID:', dummyData.uhid)
    console.log('Generated Member ID:', dummyData.memberId)
    console.log('Generated Email:', dummyData.email)
    console.log('Full Dummy Data:', JSON.stringify(dummyData, null, 2))
    console.groupEnd()

    setFormData(dummyData)
    setErrors([])
  }

  useEffect(() => {
    console.group('📄 [USER CREATION] Page Loaded')
    console.log('⏰ Page Load Time:', new Date().toISOString())
    console.log('📍 Current URL:', window.location.href)
    console.log('🔧 Environment:')
    console.log('  - User Agent:', navigator.userAgent)
    console.log('  - Platform:', navigator.platform)
    console.log('  - Language:', navigator.language)
    console.log('  - Online:', navigator.onLine)
    console.log('  - Cookies Enabled:', navigator.cookieEnabled)
    console.groupEnd()

    // Fetch active CUGs
    fetchActiveCugs()
  }, [])

  const fetchActiveCugs = async () => {
    try {
      const response = await apiFetch('/api/cugs/active')
      if (response.ok) {
        const data = await response.json()
        setCugs(data)
      }
    } catch (error) {
      console.error('Failed to fetch CUGs:', error)
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

  const validateForm = () => {
    console.group('✅ [USER CREATION] Validation Check')

    // Check password match
    console.log('Checking password match...')
    console.log('Password length:', formData.password?.length)
    console.log('Confirm Password length:', formData.confirmPassword?.length)
    console.log('Passwords match:', formData.password === formData.confirmPassword)

    if (formData.password !== formData.confirmPassword) {
      console.error('❌ Passwords do not match')
      console.groupEnd()
      setErrors(['Passwords do not match'])
      return false
    }

    // Check required fields
    const requiredFields = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      uhid: formData.uhid,
      memberId: formData.memberId,
    }

    console.log('Checking required fields:')
    console.table(Object.entries(requiredFields).map(([field, value]) => ({
      Field: field,
      Value: value || '(empty)',
      Filled: !!value,
    })))

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field, _]) => field)

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      console.groupEnd()
      setErrors(['Please fill in all required fields (Email, Password, First Name, Last Name, Phone, UHID, Member ID)'])
      return false
    }

    console.log('✅ All validation checks passed')
    console.groupEnd()
    return true
  }

  const buildUserPayload = () => {
    console.group('🏗️ [USER CREATION] Building Payload')

    const hasAddress = !!formData.address.line1
    console.log('Has Address:', hasAddress)

    if (hasAddress) {
      console.log('Address Details:', {
        line1: formData.address.line1,
        line2: formData.address.line2,
        city: formData.address.city,
        state: formData.address.state,
        pincode: formData.address.pincode,
      })
    }

    const payload = {
      uhid: formData.uhid,
      memberId: formData.memberId,
      employeeId: formData.employeeId || undefined,
      cugId: formData.cugId || undefined,
      corporateName: formData.corporateName || undefined,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      status: formData.status,
      name: {
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      dob: formData.dateOfBirth || undefined,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup || undefined,
      address: hasAddress ? formData.address : undefined,
    }

    console.log('Built Payload Structure:')
    console.log('- uhid:', payload.uhid)
    console.log('- memberId:', payload.memberId)
    console.log('- email:', payload.email)
    console.log('- phone:', payload.phone)
    console.log('- password:', payload.password ? `[${payload.password.length} chars]` : '(empty)')
    console.log('- role:', payload.role)
    console.log('- status:', payload.status)
    console.log('- name:', payload.name)
    console.log('- dob:', payload.dob || '(not set)')
    console.log('- gender:', payload.gender)
    console.log('- bloodGroup:', payload.bloodGroup || '(not set)')
    console.log('- address:', payload.address ? 'included' : '(not set)')

    console.groupEnd()

    return payload
  }

  const parseErrorMessages = (data: any): string[] => {
    if (Array.isArray(data.message)) {
      return data.message
    }

    if (data.errors && Array.isArray(data.errors)) {
      return data.errors
    }

    if (typeof data.message === 'string') {
      const matches = data.message.match(/property [^p]+/g)
      if (matches) {
        return matches.map((msg: string) => msg.trim())
      }
      return [data.message]
    }

    return ['Failed to create user']
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    console.group('🚀 [USER CREATION] Form Submission Started')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('📍 Current URL:', window.location.href)
    console.log('🌐 User Agent:', navigator.userAgent)
    console.groupEnd()

    console.group('📋 [USER CREATION] Form Validation')
    console.log('Form Data (Raw):', JSON.stringify(formData, null, 2))

    if (!validateForm()) {
      console.error('❌ [USER CREATION] Validation Failed')
      console.log('Validation Errors:', errors)
      console.groupEnd()
      return
    }
    console.log('✅ [USER CREATION] Validation Passed')
    console.groupEnd()

    setLoading(true)

    try {
      const payload = buildUserPayload()

      console.group('📦 [USER CREATION] Request Payload')
      console.log('Payload Object:', payload)
      console.log('Payload JSON:', JSON.stringify(payload, null, 2))
      console.log('Payload Size:', new Blob([JSON.stringify(payload)]).size, 'bytes')
      console.groupEnd()

      console.group('🌐 [USER CREATION] API Request')
      console.log('Method: POST')
      console.log('URL: /api/users')
      console.log('Full URL:', window.location.origin + '/api/users')
      console.log('Headers:', { 'Content-Type': 'application/json' })
      console.log('Credentials: include')
      console.log('Body:', JSON.stringify(payload))
      console.groupEnd()

      const requestStartTime = performance.now()

      const response = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const requestEndTime = performance.now()
      const requestDuration = requestEndTime - requestStartTime

      console.group('📨 [USER CREATION] API Response')
      console.log('⏱️ Request Duration:', requestDuration.toFixed(2), 'ms')
      console.log('Status Code:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('OK:', response.ok)
      console.log('Response Type:', response.type)
      console.log('Response URL:', response.url)
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
      console.groupEnd()

      if (response.ok) {
        console.log('✅ [USER CREATION] Success - User Created')
        console.log('Redirecting to /users...')
        console.groupEnd()
        router.push('/users')
        return
      }

      console.group('❌ [USER CREATION] Error Response')
      console.log('Response Status:', response.status)

      // Clone response to read body multiple times
      const responseClone = response.clone()
      let data
      let rawResponseText = ''

      try {
        rawResponseText = await responseClone.text()
        console.log('Raw Response Text:', rawResponseText)
        console.log('Raw Response Length:', rawResponseText.length, 'characters')
      } catch (textError) {
        console.error('Failed to read response as text:', textError)
      }

      try {
        data = await response.json()
        console.log('Parsed Response JSON:', JSON.stringify(data, null, 2))
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError)
        console.log('JSON Parse Error:', jsonError)
        data = { message: rawResponseText || 'Unknown error' }
      }

      const errorMessages = parseErrorMessages(data)
      console.log('Extracted Error Messages:', errorMessages)
      console.groupEnd()

      setErrors(errorMessages)
    } catch (error: any) {
      console.group('💥 [USER CREATION] Exception Caught')
      console.error('Error Type:', error?.constructor?.name)
      console.error('Error Message:', error?.message)
      console.error('Error Stack:', error?.stack)
      console.error('Full Error Object:', error)

      if (error instanceof TypeError) {
        console.error('🔍 This is a TypeError - likely network or CORS issue')
        console.log('Network State:', navigator.onLine ? 'Online' : 'Offline')
      }

      if (error instanceof SyntaxError) {
        console.error('🔍 This is a SyntaxError - likely JSON parsing issue')
      }

      console.groupEnd()

      setErrors([`Failed to create user: ${error?.message || 'Unknown error'}`])
    } finally {
      setLoading(false)
      console.log('🏁 [USER CREATION] Request Completed')
      console.log('═'.repeat(80))
    }
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Add New User</h1>
          <p className="section-subtitle">Create a new user account</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={fillDummyData}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Fill Dummy Data
          </button>
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">
                {error}
              </li>
            ))}
          </ul>
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
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
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
                UHID *
              </label>
              <input
                type="text"
                id="uhid"
                name="uhid"
                required
                value={formData.uhid}
                onChange={handleInputChange}
                className="input"
                placeholder="Unique Health ID"
              />
            </div>

            <div>
              <label htmlFor="memberId" className="label">
                Member ID *
              </label>
              <input
                type="text"
                id="memberId"
                name="memberId"
                required
                value={formData.memberId}
                onChange={handleInputChange}
                className="input"
                placeholder="MEM001"
              />
            </div>

            <div>
              <label htmlFor="cugId" className="label">
                Corporate Group
              </label>
              <select
                id="cugId"
                name="cugId"
                value={formData.cugId}
                onChange={(e) => {
                  const selectedCug = cugs.find(c => c._id === e.target.value)
                  setFormData({
                    ...formData,
                    cugId: e.target.value,
                    corporateName: selectedCug?.companyName || ''
                  })
                }}
                className="input"
              >
                <option value="">Select Corporate Group...</option>
                {cugs.map((cug) => (
                  <option key={cug._id} value={cug._id}>
                    {cug.companyName}{cug.shortCode ? ` (${cug.shortCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="employeeId" className="label">
                Employee ID
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="input"
                placeholder="EMP001"
              />
            </div>

            {formData.corporateName && (
              <div>
                <label className="label">Corporate Name</label>
                <input
                  type="text"
                  value={formData.corporateName}
                  className="input bg-gray-50"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-populated from CUG</p>
              </div>
            )}

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
                <option value="OPS">Operations</option>
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
              <label htmlFor="address.line1" className="label">
                Address Line 1
              </label>
              <input
                type="text"
                id="address.line1"
                name="address.line1"
                value={formData.address.line1}
                onChange={handleInputChange}
                className="input"
                placeholder="123 Main Street"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address.line2" className="label">
                Address Line 2
              </label>
              <input
                type="text"
                id="address.line2"
                name="address.line2"
                value={formData.address.line2}
                onChange={handleInputChange}
                className="input"
                placeholder="Apartment, suite, etc. (optional)"
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
              <label htmlFor="address.pincode" className="label">
                Pincode
              </label>
              <input
                type="text"
                id="address.pincode"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleInputChange}
                className="input"
                placeholder="400001"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.push('/users')}
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