'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import {
  WalletIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  VideoCameraIcon,
  BeakerIcon,
  CubeIcon,
  HeartIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Helper function to get policy information for current user
  const getUserPolicy = () => {
    if (!user?.assignments) return null
    const assignment = user.assignments.find((a: any) =>
      a.userId === user._id || a.userId === user.id
    )
    return assignment?.assignment || null
  }

  // Helper function to format date for "Valid Till"
  const formatValidTillDate = (dateStr: string) => {
    if (!dateStr) return 'No Expiry'
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month} ${year}`
  }

  // Helper function to get policy expiry date
  const getPolicyExpiryDate = () => {
    const policy = getUserPolicy()
    if (!policy) return 'No Expiry'

    // First check if assignment has effectiveTo
    if (policy.effectiveTo) {
      return formatValidTillDate(policy.effectiveTo)
    }

    // Then check if policy has effectiveTo
    if (policy.policyId?.effectiveTo) {
      return formatValidTillDate(policy.policyId.effectiveTo)
    }

    return 'No Expiry'
  }

  // Helper function to get policy for any family member
  const getUserPolicyForMember = (userId: string) => {
    if (!user?.assignments) return null
    const assignment = user.assignments.find((a: any) => a.userId === userId)
    return assignment?.assignment || null
  }

  // Helper function to get policy expiry date for any family member
  const getPolicyExpiryForMember = (userId: string) => {
    const policy = getUserPolicyForMember(userId)
    if (!policy) return 'No Expiry'

    // First check if assignment has effectiveTo
    if (policy.effectiveTo) {
      return formatValidTillDate(policy.effectiveTo)
    }

    // Then check if policy has effectiveTo
    if (policy.policyId?.effectiveTo) {
      return formatValidTillDate(policy.policyId.effectiveTo)
    }

    return 'No Expiry'
  }

  // Helper function to get readable relationship label
  const getRelationshipLabel = (relationshipCode: string) => {
    const relationshipMap: { [key: string]: string } = {
      'REL001': 'Primary Member',
      'REL002': 'Spouse',
      'REL003': 'Child',
      'REL004': 'Parent',
      'REL005': 'Other'
    }
    return relationshipMap[relationshipCode] || relationshipCode
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })
      if (response.ok) {
        const profileData = await response.json()
        const userWithAssignments = {
          ...profileData.user,
          dependents: profileData.dependents || [],
          familyMembers: profileData.familyMembers || [],
          assignments: profileData.assignments || [],
          wallet: profileData.wallet || { totalBalance: { allocated: 0, current: 0, consumed: 0 }, categories: [] },
          walletCategories: profileData.walletCategories || [],
          healthBenefits: profileData.healthBenefits || []
        }
        setUser(userWithAssignments)
      } else {
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (authResponse.ok) {
          const userData = await authResponse.json()
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Get wallet categories from API data or show empty if no policy
  const walletCategories = user?.walletCategories || []
  const totalAvailableBalance = user?.wallet?.totalBalance?.current || 0
  const totalWalletBalance = user?.wallet?.totalBalance?.allocated || 0

  // Icon mapping for categories
  const getCategoryIcon = (categoryCode: string) => {
    switch (categoryCode) {
      case 'CONSULTATION': return VideoCameraIcon
      case 'PHARMACY': return CubeIcon
      case 'DIAGNOSTICS': return BeakerIcon
      case 'DENTAL':
      case 'VISION':
      case 'DENTAL_VISION': return EyeIcon
      case 'WELLNESS': return ClipboardDocumentCheckIcon
      default: return HeartIcon
    }
  }

  const healthBenefits = [
    {
      name: 'In Clinic Consult',
      description: 'Book appointments with doctors',
      icon: UserIcon,
      href: '/member/appointments',
      categoryCode: 'IN_CLINIC_CONSULT'
    },
    {
      name: 'Online Consult',
      description: 'Video consultation with doctors',
      icon: VideoCameraIcon,
      href: '/member/online-consult',
      categoryCode: 'ONLINE_CONSULT'
    },
    {
      name: 'Pharmacy',
      description: 'Order medicines online',
      icon: CubeIcon,
      href: '/member/pharmacy',
      categoryCode: 'PHARMACY'
    },
    {
      name: 'Lab',
      description: 'Book lab tests',
      icon: BeakerIcon,
      href: '/member/lab',
      categoryCode: 'LAB'
    },
    {
      name: 'Annual Health Check',
      description: 'Schedule health checkup',
      icon: ClipboardDocumentCheckIcon,
      href: '/member/health-checkup',
      categoryCode: 'ANNUAL_HEALTH_CHECK'
    }
  ]

  // Helper function to get service booking URLs
  const getServiceHref = (categoryCode: string) => {
    switch (categoryCode) {
      case 'CONSULTATION': return '/member/bookings/consultation'
      case 'DIAGNOSTICS': return '/member/bookings/diagnostics'
      case 'PHARMACY': return '/member/bookings/pharmacy'
      case 'DENTAL': return '/member/bookings/dental'
      case 'VISION': return '/member/bookings/vision'
      case 'WELLNESS': return '/member/bookings/health-checkup'
      default: return '/member/bookings'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  const userPolicy = getUserPolicy()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">OPD Wallet</h1>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-md mx-auto lg:max-w-7xl">
        {/* Mobile Layout (unchanged) */}
        <div className="lg:hidden space-y-6">
        {/* Horizontal Scrollable Member Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Covered Members</h2>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {/* Current User Card */}
            <div className="min-w-[320px] snap-start">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-semibold text-lg">
                      {user?.name?.firstName} {user?.name?.lastName}
                    </span>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    OPD E-Card
                  </span>
                </div>

                <div className="space-y-2 text-white/90">
                  <div className="flex justify-between">
                    <span className="text-sm">Age</span>
                    <span className="font-medium">{calculateAge(user?.dob)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Member ID</span>
                    <span className="font-medium">{user?.memberId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">UHID</span>
                    <span className="font-medium">{user?.uhid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Policy Number</span>
                    <span className="font-medium">{userPolicy?.policyId?.policyNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valid Till</span>
                    <span className="font-medium">{getPolicyExpiryDate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Corporate Name</span>
                    <span className="font-medium">{user?.corporateName || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Relationship</span>
                    <span className="font-medium">Primary Member</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependent Member Cards */}
            {user?.dependents?.map((dependent: any, index: number) => (
              <div key={dependent._id || dependent.id || index} className="min-w-[320px] snap-start">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-semibold text-lg">
                        {dependent?.name?.firstName} {dependent?.name?.lastName}
                      </span>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      OPD E-Card
                    </span>
                  </div>

                  <div className="space-y-2 text-white/90">
                    <div className="flex justify-between">
                      <span className="text-sm">Age</span>
                      <span className="font-medium">{calculateAge(dependent?.dob)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Member ID</span>
                      <span className="font-medium">{dependent?.memberId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">UHID</span>
                      <span className="font-medium">{dependent?.uhid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Policy Number</span>
                      <span className="font-medium">{getUserPolicyForMember(dependent._id)?.policyId?.policyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Valid Till</span>
                      <span className="font-medium">{getPolicyExpiryForMember(dependent._id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Corporate Name</span>
                      <span className="font-medium">{dependent?.corporateName || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Relationship</span>
                      <span className="font-medium">{getRelationshipLabel(dependent?.relationship)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Scroll Indicator (only show if dependents exist) */}
            {user?.dependents?.length > 0 && (
              <div className="min-w-[80px] snap-start flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <ChevronRightIcon className="h-8 w-8 mx-auto" />
                  <p className="text-xs mt-1">Scroll</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Your Wallet Balance Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Wallet Balance</h2>

          <div className="space-y-4">
            {walletCategories.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getCategoryIcon(category.categoryCode), { className: "h-5 w-5 text-gray-600" })}
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₹ {typeof category.available === 'number' ? category.available.toLocaleString() : category.available}
                      {typeof category.total === 'number' && (
                        <span className="text-sm text-gray-500 font-normal"> / {category.total.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="w-full mt-2 p-1">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available Balance Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Available Balance</h2>
          <div className="text-2xl font-bold text-gray-900">
            ₹ {totalAvailableBalance.toLocaleString()}
            <span className="text-sm text-gray-500 font-normal"> / {totalWalletBalance.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Your total usage cannot exceed this amount</p>
        </div>

        {/* Health Benefits Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Benefits</h2>

          <div className="space-y-3">
            {healthBenefits.map((benefit, index) => (
              <Link
                key={index}
                href={benefit.href}
                onClick={() => {
                  console.log(`[Dashboard] Navigating to ${benefit.name}`, {
                    categoryCode: benefit.categoryCode,
                    href: benefit.href,
                    userId: user?._id
                  })
                }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <benefit.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{benefit.name}</div>
                    <div className="text-sm text-gray-600">{benefit.description}</div>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* File Claims Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Link
            href="/member/claims/new"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6" />
              <div>
                <div className="font-semibold">File a Claim</div>
                <div className="text-sm text-orange-100">Submit your medical bills</div>
              </div>
            </div>
            <ChevronRightIcon className="h-6 w-6" />
          </Link>
        </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Desktop Member Cards Section - Full Width */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Covered Members</h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Current User Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-lg">
                        {user?.name?.firstName} {user?.name?.lastName}
                      </span>
                      <div className="text-blue-100 text-sm">Member ID: {user?.memberId}</div>
                    </div>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    OPD E-Card
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-white/90 text-sm">
                  <div>
                    <span className="text-blue-100 block">Age</span>
                    <span className="font-medium">{calculateAge(user?.dob)}</span>
                  </div>
                  <div>
                    <span className="text-blue-100 block">UHID</span>
                    <span className="font-medium">{user?.uhid}</span>
                  </div>
                  <div>
                    <span className="text-blue-100 block">Policy Number</span>
                    <span className="font-medium">{userPolicy?.policyId?.policyNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-100 block">Valid Till</span>
                    <span className="font-medium">{getPolicyExpiryDate()}</span>
                  </div>
                  <div>
                    <span className="text-blue-100 block">Corporate Name</span>
                    <span className="font-medium">{user?.corporateName || ''}</span>
                  </div>
                  <div>
                    <span className="text-blue-100 block">Relationship</span>
                    <span className="font-medium">Primary Member</span>
                  </div>
                </div>
              </div>

              {/* Dependent Member Cards */}
              {user?.dependents?.map((dependent: any, index: number) => (
                <div key={dependent._id || dependent.id || index} className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-lg">
                          {dependent?.name?.firstName} {dependent?.name?.lastName}
                        </span>
                        <div className="text-purple-100 text-sm">Member ID: {dependent?.memberId}</div>
                      </div>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      OPD E-Card
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-white/90 text-sm">
                    <div>
                      <span className="text-purple-100 block">Age</span>
                      <span className="font-medium">{calculateAge(dependent?.dob)}</span>
                    </div>
                    <div>
                      <span className="text-purple-100 block">UHID</span>
                      <span className="font-medium">{dependent?.uhid}</span>
                    </div>
                    <div>
                      <span className="text-purple-100 block">Policy Number</span>
                      <span className="font-medium">{getUserPolicyForMember(dependent._id)?.policyId?.policyNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-purple-100 block">Valid Till</span>
                      <span className="font-medium">{getPolicyExpiryForMember(dependent._id)}</span>
                    </div>
                    <div>
                      <span className="text-purple-100 block">Corporate Name</span>
                      <span className="font-medium">{dependent?.corporateName || ''}</span>
                    </div>
                    <div>
                      <span className="text-purple-100 block">Relationship</span>
                      <span className="font-medium">{getRelationshipLabel(dependent?.relationship)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Available Balance */}
            <div className="space-y-6">

              {/* Available Balance Summary - Desktop */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Available Balance</h2>
                <div className="text-3xl font-bold text-gray-900">
                  ₹ {totalAvailableBalance.toLocaleString()}
                  <span className="text-lg text-gray-500 font-normal"> / {totalWalletBalance.toLocaleString()}</span>
                </div>
                <p className="text-gray-600 mt-2">Your total usage cannot exceed this amount</p>
              </div>

              {/* File Claims - Desktop */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <Link
                  href="/member/claims/new"
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <DocumentTextIcon className="h-8 w-8" />
                    <div>
                      <div className="font-semibold text-lg">File a Claim</div>
                      <div className="text-orange-100">Submit your medical bills</div>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-8 w-8" />
                </Link>
              </div>
            </div>

            {/* Middle Column - Wallet Balance */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Wallet Balance</h2>

                <div className="space-y-4">
                  {walletCategories.map((category, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            {React.createElement(getCategoryIcon(category.categoryCode), { className: "h-6 w-6 text-blue-600" })}
                          </div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg text-gray-900">
                            ₹ {typeof category.available === 'number' ? category.available.toLocaleString() : category.available}
                            {typeof category.total === 'number' && (
                              <span className="text-sm text-gray-500 font-normal"> / {category.total.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="w-full mt-3 p-1">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Health Benefits */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Benefits</h2>

                <div className="space-y-4">
                  {healthBenefits.map((benefit, index) => (
                    <Link
                      key={index}
                      href={benefit.href}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <benefit.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{benefit.name}</div>
                          <div className="text-sm text-gray-600">{benefit.description}</div>
                        </div>
                      </div>
                      <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}