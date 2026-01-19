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
  ChevronLeftIcon,
  VideoCameraIcon,
  BeakerIcon,
  CubeIcon,
  EyeIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  HeartIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  FolderOpenIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import ProfileDropdown from '@/components/ProfileDropdown'
import SectionHeader from '@/components/SectionHeader'
import OPDCardCarousel from '@/components/OPDCardCarousel'
import ActiveAppointmentNudge from '@/components/ActiveAppointmentNudge'
import { useFamily } from '@/contexts/FamilyContext'
import { logger } from '@/lib/logger'
import { calculateAge, formatValidTillDate } from '@/lib/utils/formatters'
import { getRelationshipLabel, getCategoryIcon } from '@/lib/utils/mappers'
import type { MemberProfile, MemberProfileResponse, WalletCategory, HealthBenefit, PolicyAssignment } from '@/lib/api/types'
import MemberCard from '@/components/member/MemberCard'
import DesktopMemberCard from '@/components/member/DesktopMemberCard'
import WalletCategoryCard from '@/components/member/WalletCategoryCard'
import DesktopWalletCategoryCard from '@/components/member/DesktopWalletCategoryCard'
import UserGreeting from '@/components/member/UserGreeting'
import WalletBalanceCard from '@/components/member/WalletBalanceCard'
import QuickLinks from '@/components/member/QuickLinks'
import BenefitCardEnhanced from '@/components/member/BenefitCardEnhanced'
import MoreServices from '@/components/member/MoreServices'
import PolicyCarousel from '@/components/member/PolicyCarousel'

// Memoized Desktop BenefitCard component
const DesktopBenefitCard = memo(({
  benefit,
  onClick
}: {
  benefit: HealthBenefit & { icon: React.ComponentType<{ className?: string}>; href: string }
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
  benefit: HealthBenefit & { icon: React.ComponentType<{ className?: string }>; href: string }
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

// Define moreServices outside component to avoid re-creating on every render
const MORE_SERVICES = [
  {
    id: 'helpline',
    label: '24/7 Helpline',
    labelHighlight: '24/7',
    icon: <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/helpline'
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/claims'
  },
  {
    id: 'health-records',
    label: 'Health Records',
    labelHighlight: 'Health',
    icon: <FolderOpenIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/health-records'
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    labelHighlight: 'Transaction',
    icon: <BanknotesIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/transactions'
  }
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<MemberProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeftBenefitsArrow, setShowLeftBenefitsArrow] = useState(false)
  const [showRightBenefitsArrow, setShowRightBenefitsArrow] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  const { activeMember, viewingUserId } = useFamily()
  const benefitsScrollRef = React.useRef<HTMLDivElement>(null)

  // Compact wallet cards with modern design

  // Delay showing loader to avoid flicker on fast loads
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (loading) {
      timeout = setTimeout(() => setShowLoader(true), 200)
    } else {
      setShowLoader(false)
    }
    return () => clearTimeout(timeout)
  }, [loading])

  useEffect(() => {
    if (viewingUserId) {
      fetchUserData(viewingUserId)
    }
  }, [viewingUserId])

  const fetchUserData = async (userId: string) => {
    try {
      logger.info('Dashboard', 'Starting fetchUserData for userId:', userId)

      // Fetch profile data
      const profileResponse = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      logger.info('Dashboard', 'Profile response status:', profileResponse.status)

      if (!profileResponse.ok) {
        logger.error('Dashboard', 'Profile fetch failed')
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
      logger.info('Dashboard', 'Profile data received:', {
        hasUser: !!profileData.user,
        hasDependents: !!profileData.dependents,
        hasWallet: !!profileData.wallet,
        hasWalletCategories: !!profileData.walletCategories
      })

      // Fetch wallet data for the viewing user
      const walletUrl = `/api/wallet/balance?userId=${userId}`
      logger.info('Dashboard', 'Fetching wallet from:', walletUrl)

      const walletResponse = await fetch(walletUrl, {
        credentials: 'include',
      })

      logger.info('Dashboard', 'Wallet response status:', walletResponse.status)

      let walletData = { totalBalance: { allocated: 0, current: 0, consumed: 0 }, categories: [] }
      let walletCategories = []

      if (walletResponse.ok) {
        const walletResult = await walletResponse.json()
        logger.info('Dashboard', 'Wallet result structure:', {
          keys: Object.keys(walletResult),
          hasTotalBalance: !!walletResult.totalBalance,
          hasCategories: !!walletResult.categories,
          rawData: walletResult
        })

        // The wallet/balance endpoint returns { totalBalance, categories } directly
        walletData = walletResult
        // Map categories to walletCategories format
        walletCategories = walletResult.categories || []

        logger.info('Dashboard', 'Processed wallet data:', {
          walletData,
          walletCategories,
          totalBalanceCurrent: walletData?.totalBalance?.current,
          totalBalanceAllocated: walletData?.totalBalance?.allocated,
          categoriesCount: walletCategories?.length
        })
      } else {
        const errorText = await walletResponse.text()
        logger.error('Dashboard', 'Wallet fetch failed:', errorText)
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

      logger.info('Dashboard', 'Final user object:', {
        hasWallet: !!userWithAssignments.wallet,
        walletTotalCurrent: userWithAssignments.wallet?.totalBalance?.current,
        walletTotalAllocated: userWithAssignments.wallet?.totalBalance?.allocated,
        walletCategoriesCount: userWithAssignments.walletCategories?.length
      })

      setUser(userWithAssignments)
    } catch (error) {
      logger.error('Dashboard', 'Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoized computed values
  const walletCategories = useMemo(() => {
    const categories = user?.walletCategories || []
    // Sort by available balance (highest first)
    return [...categories].sort((a, b) => {
      const aBalance = Number(a.available) || 0
      const bBalance = Number(b.available) || 0
      return bBalance - aBalance
    })
  }, [user?.walletCategories])

  const totalAvailableBalance = useMemo(() => user?.wallet?.totalBalance?.current || 0, [user?.wallet?.totalBalance])
  const totalWalletBalance = useMemo(() => user?.wallet?.totalBalance?.allocated || 0, [user?.wallet?.totalBalance])

  // Helper function to get policy information for current user
  const getUserPolicy = useCallback(() => {
    if (!user?.assignments) return null
    const userIdStr = user._id?.toString() || user.id?.toString()
    const assignment = user.assignments.find((a: PolicyAssignment) => {
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
    const assignment = user.assignments.find((a: PolicyAssignment) => {
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

  // Map category codes from API to UI configuration
  const benefitUIConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; href: string; description?: string }> = useMemo(() => ({
    'CAT001': {
      icon: UserIcon,
      href: `/member/appointments${viewingUserId ? `?defaultPatient=${viewingUserId}` : ''}`,
      description: 'Book appointments with doctors'
    },
    'CAT005': {
      icon: VideoCameraIcon,
      href: `/member/online-consult${viewingUserId ? `?defaultPatient=${viewingUserId}` : ''}`,
      description: 'Video consultation with doctors'
    },
    'CAT002': {
      icon: CubeIcon,
      href: '/member/pharmacy',
      description: 'Order medicines online'
    },
    'CAT004': {
      icon: BeakerIcon,
      href: '/member/lab-tests',
      description: 'Book lab tests'
    },
    'CAT003': {
      icon: BeakerIcon,
      href: '/member/diagnostics',
      description: 'Diagnostic services'
    },
    'CAT006': {
      icon: SparklesIcon,
      href: '/member/dental',
      description: 'Dental care services'
    },
    'CAT007': {
      icon: EyeIcon,
      href: '/member/vision',
      description: 'Eye care & vision services'
    },
    'CAT008': {
      icon: ClipboardDocumentCheckIcon,
      href: '/member/wellness',
      description: 'Wellness & preventive care'
    },
    'dental': {
      icon: SparklesIcon,
      href: '/member/dental',
      description: 'Dental care services'
    },
    'vision': {
      icon: EyeIcon,
      href: '/member/vision',
      description: 'Eye care & vision services'
    },
    'wellness': {
      icon: ClipboardDocumentCheckIcon,
      href: '/member/wellness',
      description: 'Wellness & preventive care'
    }
  }), [viewingUserId])

  // Use API-filtered benefits merged with UI config
  const healthBenefits = useMemo(() => {
    if (!user?.healthBenefits) return []

    return user.healthBenefits
      .map((benefit: HealthBenefit) => {
        const uiConfig = benefitUIConfig[benefit.categoryCode]
        if (!uiConfig) {
          logger.warn('Dashboard', `No UI config found for category: ${benefit.categoryCode}`)
          return null
        }

        return {
          ...benefit,
          icon: uiConfig.icon,
          href: uiConfig.href,
          description: uiConfig.description || benefit.description
        }
      })
      .filter((b): b is HealthBenefit & { icon: React.ComponentType<{ className?: string }>; href: string } => b !== null)
  }, [user?.healthBenefits, benefitUIConfig])

  const handleBenefitClick = useCallback((benefit: HealthBenefit & { icon: React.ComponentType<{ className?: string }>; href: string }) => {
    logger.info('Dashboard', `Navigating to ${benefit.name}`, {
      categoryCode: benefit.categoryCode,
      href: benefit.href,
      userId: user?._id
    })
  }, [user?._id])

  // Health Benefits carousel handlers
  const handleBenefitsScroll = useCallback(() => {
    if (benefitsScrollRef.current) {
      const container = benefitsScrollRef.current
      const scrollLeft = container.scrollLeft
      setShowLeftBenefitsArrow(scrollLeft > 10)
      setShowRightBenefitsArrow(scrollLeft < container.scrollWidth - container.offsetWidth - 10)
    }
  }, [])

  const scrollBenefitsLeft = useCallback(() => {
    if (benefitsScrollRef.current) {
      benefitsScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }, [])

  const scrollBenefitsRight = useCallback(() => {
    if (benefitsScrollRef.current) {
      benefitsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const container = benefitsScrollRef.current
    if (container) {
      container.addEventListener('scroll', handleBenefitsScroll)
      handleBenefitsScroll() // Initial check
      return () => container.removeEventListener('scroll', handleBenefitsScroll)
    }
  }, [handleBenefitsScroll])

  // Get user policy before rendering
  const userPolicy = getUserPolicy()

  if (showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fadeIn">
        <div className="h-12 w-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (loading) {
    return null // Return nothing during the delay period
  }

  // Prepare all members array for carousel
  const allMembers = user ? [user, ...(user.dependents || [])] : []

  // Prepare family members for UserGreeting (primary user + dependents)
  const familyMembers = user ? [
    // Primary user first
    {
      id: user._id,
      _id: user._id,
      name: `${user.name?.firstName || ''} ${user.name?.lastName || ''}`.trim(),
      avatar: user.avatar,
      initials: `${user.name?.firstName?.[0] || ''}${user.name?.lastName?.[0] || ''}`.toUpperCase()
    },
    // Then dependents
    ...(user?.dependents || []).map((dep: any) => ({
      id: dep._id || dep.id,
      _id: dep._id || dep.id,
      name: `${dep.name?.firstName || ''} ${dep.name?.lastName || ''}`.trim(),
      avatar: dep.avatar,
      initials: `${dep.name?.firstName?.[0] || ''}${dep.name?.lastName?.[0] || ''}`.toUpperCase()
    }))
  ] : []

  // Prepare policies for PolicyCarousel
  const preparePolicies = () => {
    if (!user || !user.assignments) return []

    const members = [user, ...(user.dependents || [])]
    const allPolicies = members.map((member: any) => {
      const memberId = member?._id || member?.id

      // Find policy assignment for this member
      const userIdStr = memberId?.toString()
      const assignment = user.assignments.find((a: PolicyAssignment) => {
        const assignmentUserIdStr = a.userId?.toString()
        return assignmentUserIdStr === userIdStr
      })
      const policy = assignment?.assignment || null

      // Calculate age from dateOfBirth
      const calculateAge = (dob: string | Date) => {
        if (!dob) return undefined
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age
      }

      return {
        policyId: policy?.policyId?._id || policy?.policyId?.id || memberId,
        policyNumber: policy?.policyId?.policyNumber || 'N/A',
        policyHolder: `${member?.name?.firstName || ''} ${member?.name?.lastName || ''}`.trim(),
        policyHolderId: memberId,
        age: calculateAge(member?.dateOfBirth),
        corporate: policy?.policyId?.companyName || policy?.policyId?.company || 'Individual',
        coverageAmount: user.wallet?.totalBalance?.allocated || 0,
        expiryDate: policy?.effectiveTo || policy?.policyId?.effectiveTo || new Date()
      }
    })

    // Filter policies based on active member
    // Primary member sees all policies, dependents only see their own
    const isPrimaryMember = viewingUserId === user._id

    if (isPrimaryMember) {
      // Primary member sees all policies
      return allPolicies
    } else {
      // Dependent sees only their own policy
      return allPolicies.filter(policy => policy.policyHolderId === viewingUserId)
    }
  }

  const policies = preparePolicies()

  return (
    <div className="min-h-screen animate-fadeIn">
      {/* User Greeting Section */}
      <UserGreeting
        userName={`${activeMember?.name?.firstName || ''} ${activeMember?.name?.lastName || ''}`.trim()}
        familyMembers={familyMembers}
      />

      {/* Main Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-full">
        {/* Policy Carousel Section */}
        <PolicyCarousel policies={policies} />

        {/* Wallet Balance Card Section */}
        <WalletBalanceCard
          currentBalance={totalAvailableBalance}
          totalLimit={totalWalletBalance}
        />

        {/* Quick Links Section */}
        <QuickLinks />

        {/* Health Benefits Section */}
        <section className="py-6 lg:py-8 max-w-[480px] mx-auto lg:max-w-full">
          {/* Header */}
          <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6 px-4 lg:px-6">Health Benefits</h2>

          {/* Benefits Grid */}
          <div className="relative group px-4 lg:px-6">
            <div
              ref={benefitsScrollRef}
              className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4"
            >
              {walletCategories.map((category: any) => (
                <BenefitCardEnhanced
                  key={category.categoryCode}
                  benefitId={category.categoryCode}
                  title={category.name}
                  currentAmount={category.available}
                  totalAmount={category.total}
                  href={benefitUIConfig[category.categoryCode]?.href || '/member/benefits'}
                  icon={getCategoryIcon(category.categoryCode)}
                />
              ))}
            </div>

            {/* Arrow Navigation (Desktop) */}
            {showLeftBenefitsArrow && (
              <button
                onClick={scrollBenefitsLeft}
                className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                aria-label="Previous benefits"
              >
                <ChevronLeftIcon className="h-8 w-8 text-gray-600" />
              </button>
            )}

            {showRightBenefitsArrow && (
              <button
                onClick={scrollBenefitsRight}
                className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                aria-label="Next benefits"
              >
                <ChevronRightIcon className="h-8 w-8 text-gray-600" />
              </button>
            )}
          </div>

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </section>

        {/* More Services Section */}
        <MoreServices services={MORE_SERVICES} />

        {/* Extra padding for mobile to prevent overlap with bottom nav */}
        <div className="h-2 lg:hidden" aria-hidden="true" />
      </div>
    </div>
  )
}
