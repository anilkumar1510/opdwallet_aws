'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import EditableField from '@/components/EditableField'
import DependentCard from '@/components/DependentCard'

interface User {
  _id: string
  name?: {
    firstName?: string
    lastName?: string
  }
  email?: string
  phone?: string
  dob?: string
  gender?: string
  memberId?: string
  bloodGroup?: string
  uhid?: string
  employeeId?: string
  corporateName?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
  }
}

interface Assignment {
  userId: string
  memberId: string
  memberName: string
  assignment: {
    policyId: {
      policyNumber?: string
      name?: string
      description?: string
      status?: string
      effectiveFrom?: string
      effectiveTo?: string
    }
    effectiveFrom?: string
    effectiveTo?: string
    isActive?: boolean
    assignmentId?: string
  } | null
}

interface ProfileData {
  user: User
  dependents: any[]
  assignments: Assignment[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfileData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateField = async (field: 'email' | 'mobile', value: string) => {
    try {
      const response = await fetch('/api/member/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const result = await response.json()

      // Update local state
      setProfileData((prev) => {
        if (!prev) return prev
        const userField = field === 'mobile' ? 'phone' : field
        return {
          ...prev,
          user: {
            ...prev.user,
            [userField]: value,
          },
        }
      })
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile')
    }
  }

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  }

  const validateMobile = (mobile: string): string | null => {
    if (!mobile) return 'Mobile number is required'
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      return 'Please enter a valid 10-digit mobile number'
    }
    return null
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const { user, dependents, assignments } = profileData
  const fullName = user.name
    ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim()
    : 'User'

  const primaryAssignment = assignments.find((a) => a.userId === user._id)
  const assignment = primaryAssignment?.assignment
  const policyDetails = assignment?.policyId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Personal Details Section */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-brand-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{fullName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Member ID</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{user.memberId || '-'}</span>
              </div>
            </div>

            {user.uhid && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">UHID</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{user.uhid}</span>
                </div>
              </div>
            )}

            {user.employeeId && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Employee ID</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{user.employeeId}</span>
                </div>
              </div>
            )}

            <EditableField
              label="Email"
              value={user.email || ''}
              type="email"
              onSave={(value) => handleUpdateField('email', value)}
              validation={validateEmail}
            />

            <EditableField
              label="Mobile"
              value={user.phone || ''}
              type="tel"
              onSave={(value) => handleUpdateField('mobile', value)}
              validation={validateMobile}
            />

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{formatDate(user.dob)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{user.gender || '-'}</span>
              </div>
            </div>

            {user.bloodGroup && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{user.bloodGroup}</span>
                </div>
              </div>
            )}

            {user.address && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">
                    {[
                      user.address.line1,
                      user.address.line2,
                      user.address.city,
                      user.address.state,
                      user.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Policy Details Section */}
        {policyDetails && (
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-brand-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Policy Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Policy Number
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-mono">
                    {policyDetails.policyNumber || '-'}
                  </span>
                </div>
              </div>

              {policyDetails.name && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Policy Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{policyDetails.name}</span>
                  </div>
                </div>
              )}

              {policyDetails.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Policy Status
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        policyDetails.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : policyDetails.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {policyDetails.status}
                    </span>
                  </div>
                </div>
              )}

              {assignment?.isActive !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Assignment Status
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {assignment.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              )}

              {policyDetails.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Policy Description
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{policyDetails.description}</span>
                  </div>
                </div>
              )}

              {/* Policy Validity Period */}
              {policyDetails.effectiveFrom && (
                <>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-2">
                      Policy Validity Period
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Policy Effective From
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">
                        {formatDate(policyDetails.effectiveFrom)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Policy Effective To
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">
                        {formatDate(policyDetails.effectiveTo)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Assignment Validity Period */}
              {assignment?.effectiveFrom && (
                <>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-2">
                      Your Coverage Period
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Coverage Start Date
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">
                        {formatDate(assignment.effectiveFrom)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Coverage End Date
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">
                        {formatDate(assignment.effectiveTo)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Dependents Section */}
        {dependents.length > 0 && (
          <section className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-brand-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Family Members ({dependents.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dependents.map((dependent) => (
                <DependentCard key={dependent._id || dependent.id} dependent={dependent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
