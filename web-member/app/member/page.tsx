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
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ReceiptPercentIcon,
  BanknotesIcon
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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<MemberProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const { activeMember, viewingUserId } = useFamily()
  // Compact wallet cards with modern design

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
  const walletCategories = useMemo(() => user?.walletCategories || [], [user?.walletCategories])
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
      {/* Mobile Header - Now handled by fixed top header in BottomNavigation */}
      <div className="hidden">
        <div className="flex items-center justify-between">
          <ProfileDropdown />
          <NotificationBell />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 max-w-md mx-auto lg:max-w-6xl pt-6 lg:pt-8">
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
              getPolicyId={(userId) => {
                if (userId === (user?._id || user?.id)) {
                  return userPolicy?.policyId?._id || userPolicy?.policyId?.id || 'N/A'
                }
                const policy = getUserPolicyForMember(userId)
                return policy?.policyId?._id || policy?.policyId?.id || 'N/A'
              }}
            />
          </div>

          {/* Your Wallet Balance Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Your Wallet Balance" showSeeAll={false} />

            {/* Total Available Balance - Highlighted */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
              <div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Available Balance
                    {user?.wallet?.isFloater && (
                      <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                        FLOATER
                      </span>
                    )}
                  </p>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹ {totalAvailableBalance.toLocaleString()}
                    <span className="text-sm text-gray-500 font-normal"> / {totalWalletBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {user?.wallet?.isFloater
                  ? 'Shared wallet balance across all family members'
                  : 'Your total usage cannot exceed this amount'
                }
              </p>
            </div>

            {/* Floater Family Consumption Breakdown */}
            {user?.wallet?.isFloater && user?.wallet?.memberConsumption?.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Family Consumption</h4>
                <div className="space-y-2">
                  {user.wallet.memberConsumption.map((member: any, idx: number) => {
                    // Fetch member details from family members list
                    const memberDetails = [user, ...(user.dependents || [])].find(
                      m => (m._id || m.id)?.toString() === member.userId?.toString()
                    );

                    const memberName = memberDetails
                      ? `${memberDetails.name?.firstName || ''} ${memberDetails.name?.lastName || ''}`.trim()
                      : 'Unknown';

                    const isCurrentUser = (user._id || user.id)?.toString() === member.userId?.toString();

                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {memberName}
                          {isCurrentUser && <span className="ml-1 text-blue-600">(You)</span>}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₹ {member.consumed?.toLocaleString() || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category-wise Wallets */}
            <div className="space-y-2.5">
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
          {viewingUserId && (
            <div className="hidden lg:block">
              <ActiveAppointmentNudge variant="section" userId={viewingUserId} />
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

          {/* Health Records Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Health Records" showSeeAll={false} />
            <Link
              href="/member/health-records"
              className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">View Health Records</div>
                  <div className="text-sm text-gray-600">Access prescriptions and medical documents</div>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </Link>
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
