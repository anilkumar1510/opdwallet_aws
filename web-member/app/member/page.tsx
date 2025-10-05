'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
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
import NotificationBell from '@/components/NotificationBell'

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

// Helper function to format date for "Valid Till"
const formatValidTillDate = (dateStr: string) => {
  if (!dateStr) return 'No Expiry'
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.toLocaleString('default', { month: 'long' })
  const year = date.getFullYear()
  return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month} ${year}`
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

// Memoized MemberCard component
const MemberCard = memo(({
  member,
  isPrimary,
  policyNumber,
  validTill,
  corporateName
}: {
  member: any
  isPrimary: boolean
  policyNumber: string
  validTill: string
  corporateName: string
}) => {
  return (
    <div className="bg-[#457ec4] rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <span className="font-semibold text-lg">
            {member?.name?.firstName} {member?.name?.lastName}
          </span>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          OPD E-Card
        </span>
      </div>

      <div className="space-y-2 text-white/90">
        <div className="flex justify-between">
          <span className="text-sm">Age</span>
          <span className="font-medium">{calculateAge(member?.dob)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Member ID</span>
          <span className="font-medium">{member?.memberId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">UHID</span>
          <span className="font-medium">{member?.uhid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Policy Number</span>
          <span className="font-medium">{policyNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Valid Till</span>
          <span className="font-medium">{validTill}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Corporate Name</span>
          <span className="font-medium">{corporateName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Relationship</span>
          <span className="font-medium">
            {isPrimary ? 'Primary Member' : getRelationshipLabel(member?.relationship)}
          </span>
        </div>
      </div>
    </div>
  )
})

MemberCard.displayName = 'MemberCard'

// Memoized Desktop MemberCard component
const DesktopMemberCard = memo(({
  member,
  isPrimary,
  policyNumber,
  validTill,
  corporateName
}: {
  member: any
  isPrimary: boolean
  policyNumber: string
  validTill: string
  corporateName: string
}) => {
  return (
    <div className="bg-[#457ec4] rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 rounded-full p-1.5">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">
              {member?.name?.firstName} {member?.name?.lastName}
            </div>
            <div className="text-blue-100 text-xs">
              {isPrimary ? 'Primary' : getRelationshipLabel(member?.relationship)}
            </div>
          </div>
        </div>
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
          E-Card
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-100">Member ID</span>
          <span className="font-medium">{member?.memberId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-100">UHID</span>
          <span className="font-medium">{member?.uhid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-100">Valid Till</span>
          <span className="font-medium">{validTill}</span>
        </div>
      </div>
    </div>
  )
})

DesktopMemberCard.displayName = 'DesktopMemberCard'

// Memoized WalletCategoryCard component
const WalletCategoryCard = memo(({
  category,
  icon
}: {
  category: any
  icon: any
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {React.createElement(icon, { className: "h-5 w-5 text-gray-600" })}
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
  )
})

WalletCategoryCard.displayName = 'WalletCategoryCard'

// Memoized Desktop WalletCategoryCard component
const DesktopWalletCategoryCard = memo(({
  category,
  icon
}: {
  category: any
  icon: any
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            {React.createElement(icon, { className: "h-6 w-6 text-blue-600" })}
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
  )
})

DesktopWalletCategoryCard.displayName = 'DesktopWalletCategoryCard'

// Memoized Desktop BenefitCard component
const DesktopBenefitCard = memo(({
  benefit,
  onClick
}: {
  benefit: any
  onClick: () => void
}) => {
  return (
    <Link
      href={benefit.href}
      onClick={onClick}
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
  )
})

DesktopBenefitCard.displayName = 'DesktopBenefitCard'

// Memoized BenefitCard component
const BenefitCard = memo(({
  benefit,
  onClick
}: {
  benefit: any
  onClick: () => void
}) => {
  return (
    <Link
      href={benefit.href}
      onClick={onClick}
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
  )
})

BenefitCard.displayName = 'BenefitCard'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  // Memoized computed values
  const walletCategories = useMemo(() => user?.walletCategories || [], [user?.walletCategories])
  const totalAvailableBalance = useMemo(() => user?.wallet?.totalBalance?.current || 0, [user?.wallet?.totalBalance?.current])
  const totalWalletBalance = useMemo(() => user?.wallet?.totalBalance?.allocated || 0, [user?.wallet?.totalBalance?.allocated])

  // Helper function to get policy information for current user
  const getUserPolicy = useCallback(() => {
    if (!user?.assignments) return null
    const userIdStr = user._id?.toString() || user.id?.toString()
    const assignment = user.assignments.find((a: any) => {
      const assignmentUserIdStr = a.userId?.toString()
      return assignmentUserIdStr === userIdStr
    })
    return assignment?.assignment || null
  }, [user?.assignments, user?._id, user?.id])

  // Helper function to get policy expiry date
  const getPolicyExpiryDate = useCallback(() => {
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
  }, [getUserPolicy])

  // Helper function to get policy for any family member
  const getUserPolicyForMember = useCallback((userId: string) => {
    if (!user?.assignments) return null
    const userIdStr = userId?.toString()
    const assignment = user.assignments.find((a: any) => {
      const assignmentUserIdStr = a.userId?.toString()
      return assignmentUserIdStr === userIdStr
    })
    return assignment?.assignment || null
  }, [user?.assignments])

  // Helper function to get policy expiry date for any family member
  const getPolicyExpiryForMember = useCallback((userId: string) => {
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
  }, [getUserPolicyForMember])

  const healthBenefits = useMemo(() => [
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
      href: '/member/lab-tests',
      categoryCode: 'LAB'
    },
    {
      name: 'Annual Health Check',
      description: 'Schedule health checkup',
      icon: ClipboardDocumentCheckIcon,
      href: '/member/health-checkup',
      categoryCode: 'ANNUAL_HEALTH_CHECK'
    }
  ], [])

  const handleBenefitClick = useCallback((benefit: any) => {
    console.log(`[Dashboard] Navigating to ${benefit.name}`, {
      categoryCode: benefit.categoryCode,
      href: benefit.href,
      userId: user?._id
    })
  }, [user?._id])

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
      {/* Mobile Header */}
      <div className="bg-white shadow-sm px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">OPD Wallet</h1>
          <NotificationBell />
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-md mx-auto lg:max-w-4xl lg:mt-4">
        {/* Unified Layout for Mobile and Desktop */}
        <div className="space-y-6">
        {/* Horizontal Scrollable Member Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Covered Members</h2>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {/* Current User Card */}
            <div className="min-w-[320px] snap-start">
              <MemberCard
                member={user}
                isPrimary={true}
                policyNumber={userPolicy?.policyId?.policyNumber || 'N/A'}
                validTill={getPolicyExpiryDate()}
                corporateName={user?.corporateName || ''}
              />
            </div>

            {/* Dependent Member Cards */}
            {user?.dependents?.map((dependent: any, index: number) => (
              <div key={dependent._id || dependent.id || index} className="min-w-[320px] snap-start">
                <MemberCard
                  member={dependent}
                  isPrimary={false}
                  policyNumber={getUserPolicyForMember(dependent._id)?.policyId?.policyNumber || 'N/A'}
                  validTill={getPolicyExpiryForMember(dependent._id)}
                  corporateName={dependent?.corporateName || ''}
                />
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

          {/* Total Available Balance - Highlighted */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Available Balance</p>
                <div className="text-2xl font-bold text-gray-900">
                  ₹ {totalAvailableBalance.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal"> / {totalWalletBalance.toLocaleString()}</span>
                </div>
              </div>
              <BanknotesIcon className="h-10 w-10 text-orange-500" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Your total usage cannot exceed this amount</p>
          </div>

          {/* Category-wise Wallets */}
          <div className="space-y-4">
            {walletCategories.map((category: any, index: number) => (
              <WalletCategoryCard
                key={index}
                category={category}
                icon={getCategoryIcon(category.categoryCode)}
              />
            ))}
          </div>
        </div>

        {/* Health Benefits Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Benefits</h2>

          <div className="space-y-3">
            {healthBenefits.map((benefit: any, index: number) => (
              <BenefitCard
                key={index}
                benefit={benefit}
                onClick={() => handleBenefitClick(benefit)}
              />
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
      </div>
    </div>
  )
}
