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
  EyeIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import ProfileDropdown from '@/components/ProfileDropdown'
import SectionHeader from '@/components/SectionHeader'
import OPDCardCarousel from '@/components/OPDCardCarousel'
import ActiveAppointmentNudge from '@/components/ActiveAppointmentNudge'
import { useFamily } from '@/contexts/FamilyContext'

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
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
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
    case 'CONSULTATION': return UserIcon
    case 'PHARMACY': return CubeIcon
    case 'DIAGNOSTICS': return BeakerIcon
    case 'DENTAL':
    case 'VISION':
    case 'DENTAL_VISION': return EyeIcon
    case 'WELLNESS': return ClipboardDocumentCheckIcon
    default: return BanknotesIcon
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
    <div className="border border-blue-100 rounded-xl p-3 bg-blue-50 hover:bg-blue-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {React.createElement(icon, { className: "h-5 w-5 text-blue-600" })}
          <span className="text-sm font-medium text-gray-900">{category.name}</span>
        </div>
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            ₹ {typeof category.available === 'number' ? category.available.toLocaleString() : category.available}
            {typeof category.total === 'number' && (
              <span className="text-sm text-gray-500 font-normal"> / {category.total.toLocaleString()}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Remaining / Allocated</p>
        </div>
      </div>
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
    <div className="border border-gray-200 rounded-xl p-4">
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
          <p className="text-xs text-gray-500 mt-1">Remaining / Allocated</p>
        </div>
      </div>
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
  const { activeMember, viewingUserId } = useFamily()

  useEffect(() => {
    if (viewingUserId) {
      fetchUserData(viewingUserId)
    }
  }, [viewingUserId])

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[Dashboard] Starting fetchUserData for userId:', userId)

      // Fetch profile data
      const profileResponse = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      console.log('[Dashboard] Profile response status:', profileResponse.status)

      if (!profileResponse.ok) {
        console.error('[Dashboard] Profile fetch failed')
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (authResponse.ok) {
          const userData = await authResponse.json()
          setUser(userData)
        }
        setLoading(false)
        return
      }

      const profileData = await profileResponse.json()
      console.log('[Dashboard] Profile data received:', {
        hasUser: !!profileData.user,
        hasDependents: !!profileData.dependents,
        hasWallet: !!profileData.wallet,
        hasWalletCategories: !!profileData.walletCategories
      })

      // Fetch wallet data for the viewing user
      const walletUrl = `/api/wallet/balance?userId=${userId}`
      console.log('[Dashboard] Fetching wallet from:', walletUrl)

      const walletResponse = await fetch(walletUrl, {
        credentials: 'include',
      })

      console.log('[Dashboard] Wallet response status:', walletResponse.status)

      let walletData = { totalBalance: { allocated: 0, current: 0, consumed: 0 }, categories: [] }
      let walletCategories = []

      if (walletResponse.ok) {
        const walletResult = await walletResponse.json()
        console.log('[Dashboard] Wallet result structure:', {
          keys: Object.keys(walletResult),
          hasTotalBalance: !!walletResult.totalBalance,
          hasCategories: !!walletResult.categories,
          rawData: walletResult
        })

        // The wallet/balance endpoint returns { totalBalance, categories } directly
        walletData = walletResult
        // Map categories to walletCategories format
        walletCategories = walletResult.categories || []

        console.log('[Dashboard] Processed wallet data:', {
          walletData,
          walletCategories,
          totalBalanceCurrent: walletData?.totalBalance?.current,
          totalBalanceAllocated: walletData?.totalBalance?.allocated,
          categoriesCount: walletCategories?.length
        })
      } else {
        const errorText = await walletResponse.text()
        console.error('[Dashboard] Wallet fetch failed:', errorText)
      }

      // Combine data - use active member as primary user
      const userWithAssignments = {
        ...profileData.user,
        dependents: profileData.dependents || [],
        familyMembers: profileData.familyMembers || [],
        assignments: profileData.assignments || [],
        wallet: walletData,
        walletCategories: walletCategories,
        healthBenefits: profileData.healthBenefits || []
      }

      console.log('[Dashboard] Final user object:', {
        hasWallet: !!userWithAssignments.wallet,
        walletTotalCurrent: userWithAssignments.wallet?.totalBalance?.current,
        walletTotalAllocated: userWithAssignments.wallet?.totalBalance?.allocated,
        walletCategoriesCount: userWithAssignments.walletCategories?.length
      })

      setUser(userWithAssignments)
    } catch (error) {
      console.error('[Dashboard] Error fetching user data:', error)
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
      name: 'Health Records',
      description: 'View prescriptions and medical records',
      icon: DocumentTextIcon,
      href: '/member/health-records',
      categoryCode: 'HEALTH_RECORDS'
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

  // Get user policy before rendering
  const userPolicy = getUserPolicy()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Prepare all members array for carousel
  const allMembers = [user, ...(user?.dependents || [])]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="px-3 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <ProfileDropdown />
          <NotificationBell />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 max-w-md mx-auto lg:max-w-6xl">
        {/* Unified Layout for Mobile and Desktop */}
        <div className="space-y-4">
          {/* OPD Cards Section */}
          <div>
            <OPDCardCarousel
              members={allMembers}
              getPolicyNumber={(userId) => {
                if (userId === (user?._id || user?.id)) {
                  return userPolicy?.policyId?.policyNumber || 'N/A'
                }
                return getUserPolicyForMember(userId)?.policyId?.policyNumber || 'N/A'
              }}
              getValidTill={(userId) => {
                if (userId === (user?._id || user?.id)) {
                  return getPolicyExpiryDate()
                }
                return getPolicyExpiryForMember(userId)
              }}
              getCorporateName={(member) => member?.corporateName || user?.corporateName || 'N/A'}
            />
          </div>

        {/* Your Wallet Balance Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader title="Your Wallet Balance" showSeeAll={false} />

          {/* Total Available Balance - Highlighted */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Available Balance</p>
                <div className="text-2xl font-bold text-gray-900">
                  ₹ {totalAvailableBalance.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal"> / {totalWalletBalance.toLocaleString()}</span>
                </div>
              </div>
              <BanknotesIcon className="h-10 w-10 text-blue-600" />
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

        {/* Upcoming Appointment Section - Desktop only (mobile has floating banner) */}
        {user?._id && (
          <div className="hidden lg:block">
            <ActiveAppointmentNudge variant="section" userId={user._id} />
          </div>
        )}

        {/* Health Benefits Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader title="Health Benefits" showSeeAll={false} />

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
          <SectionHeader title="Claims" showSeeAll={false} />
          <Link
            href="/member/claims/new"
            className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">File a Claim</div>
                <div className="text-sm text-gray-600">Submit your medical bills</div>
              </div>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </Link>
        </div>

        {/* Order History Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader title="Order History" showSeeAll={false} />
          <Link
            href="/member/orders"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl hover:from-purple-100 hover:to-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <ReceiptPercentIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">View Order History</div>
                <div className="text-sm text-gray-600">Track payments and transactions</div>
              </div>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </Link>
        </div>

        {/* Extra padding for mobile to prevent overlap with appointment nudge */}
        <div className="h-24 lg:hidden" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  )
}
