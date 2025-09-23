'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import {
  WalletIcon,
  DocumentTextIcon,
  CalendarIcon,
  UsersIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  CurrencyRupeeIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [benefitComponents, setBenefitComponents] = useState<any>(null)

  // Helper function to get policy information for a user
  const getPolicyForUser = (userId: string) => {
    if (!user?.assignments) return null
    const assignment = user.assignments.find((a: any) => a.userId === userId)
    return assignment?.assignment?.policyId || null
  }

  // Helper function to get coverage period for a user
  const getCoveragePeriodForUser = (userId: string) => {
    if (!user?.assignments) return 'No Coverage'
    const assignment = user.assignments.find((a: any) => a.userId === userId)
    if (!assignment?.assignment) return 'No Coverage'

    const effectiveFrom = assignment.assignment.effectiveFrom
    const effectiveTo = assignment.assignment.effectiveTo

    if (!effectiveFrom) return 'No Coverage'

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString().slice(-2)
      return `${day}|${month}|${year}`
    }

    const fromDate = formatDate(effectiveFrom)
    const toDate = effectiveTo ? formatDate(effectiveTo) : 'Ongoing'

    return `${fromDate} to ${toDate}`
  }

  useEffect(() => {
    fetchUserData()
    fetchBenefitComponents()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.profile-dropdown')) {
          setProfileDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])

  const fetchBenefitComponents = async () => {
    try {
      const response = await fetch('/api/member/benefit-components', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setBenefitComponents(data.components || {})
      }
    } catch (error) {
      console.error('Error fetching benefit components:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      // Fetch user profile with family members from the new member API
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })
      if (response.ok) {
        const profileData = await response.json()

        // profileData contains: { user, dependents, familyMembers, assignments }
        const userWithDependents = {
          ...profileData.user,
          dependents: profileData.dependents,
          familyMembers: profileData.familyMembers,
          assignments: profileData.assignments || []
        }

        setUser(userWithDependents)
        setSelectedProfile(userWithDependents) // Set default selected profile
      } else {
        // Fallback to basic user data if member API fails
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (authResponse.ok) {
          const userData = await authResponse.json()
          setUser(userData)
          setSelectedProfile(userData)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Try fallback to basic user data
      try {
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (authResponse.ok) {
          const userData = await authResponse.json()
          setUser(userData)
          setSelectedProfile(userData)
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback user data:', fallbackError)
      }
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

  // Base quick actions always visible
  const baseQuickActions = [
    { name: 'File Claim', icon: DocumentTextIcon, href: '/member/claims/new', color: 'bg-brand-600' },
    { name: 'View Benefits', icon: SparklesIcon, href: '/member/benefits', color: 'bg-amber-600' },
  ]

  // Conditionally add actions based on enabled benefit components
  const quickActions = [...baseQuickActions]

  // Add "Avail Benefits" if any component is enabled
  if (benefitComponents && Object.values(benefitComponents).some((comp: any) => comp?.enabled)) {
    quickActions.splice(1, 0, { name: 'Avail Benefits', icon: CalendarIcon, href: '/member/bookings/new', color: 'bg-blue-600' })
  }

  // Always show Health Records
  quickActions.push({ name: 'Health Records', icon: UsersIcon, href: '/member/health-records', color: 'bg-purple-600' })

  const recentActivity = [
    { type: 'claim', title: 'Claim #12345', status: 'Approved', amount: '₹5,000', date: '2 days ago' },
    { type: 'booking', title: 'Dr. Sharma Consultation', status: 'Upcoming', date: 'Tomorrow, 10:00 AM' },
    { type: 'pharmacy', title: 'Medicine Order', status: 'Delivered', amount: '₹1,200', date: '5 days ago' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-12 w-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }


  return (
    <div>
      {/* Modern Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="p-4 sm:p-6">
          {/* Top row with back arrow, profile selector, and wallet balance */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">go to habit</span>
              </button>
            </div>

            {/* Right side: Profile selector and wallet balance */}
            <div className="flex items-center space-x-4">
              {/* Wallet balance */}
              <div className="flex items-center bg-brand-50 px-3 py-1.5 rounded-full">
                <WalletIcon className="h-5 w-5 text-brand-600 mr-2" />
                <span className="text-sm font-semibold text-brand-900">₹12,500</span>
              </div>

              {/* Profile selector dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-semibold hover:shadow-lg transition-all"
                >
                  {selectedProfile?.name?.firstName?.charAt(0) || 'M'}
                </button>

              {/* Dropdown menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border overflow-hidden z-40">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">
                      Switch Profile
                    </div>

                    {/* Current user */}
                    <button
                      onClick={() => {
                        setSelectedProfile(user)
                        setProfileDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedProfile?.id === user?.id ? 'bg-brand-50' : ''
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {user?.name?.firstName?.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name?.firstName} {user?.name?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Self</p>
                      </div>
                      {selectedProfile?.id === user?.id && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 bg-brand-600 rounded-full"></div>
                        </div>
                      )}
                    </button>

                    {/* Dependents */}
                    {user?.dependents?.map((dependent: any) => (
                      <button
                        key={dependent._id || dependent.id}
                        onClick={() => {
                          setSelectedProfile(dependent)
                          setProfileDropdownOpen(false)
                        }}
                        className={`w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedProfile?._id === dependent._id || selectedProfile?.id === dependent.id ? 'bg-brand-50' : ''
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-sm font-semibold mr-3">
                          {dependent.name?.firstName?.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {dependent.name?.firstName} {dependent.name?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{dependent.relationship}</p>
                        </div>
                        {(selectedProfile?._id === dependent._id || selectedProfile?.id === dependent.id) && (
                          <div className="ml-auto">
                            <div className="h-2 w-2 bg-brand-600 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Add member option */}
                  <div className="border-t p-2">
                    <Link
                      href="/member/family/add"
                      className="w-full flex items-center px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <UsersIcon className="h-5 w-5 mr-2" />
                      Add Family Member
                    </Link>
                  </div>

                  {/* Logout option */}
                  <div className="border-t p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Greeting and Member ID row */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Hi, {selectedProfile?.name?.firstName || 'Member'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Member ID: {selectedProfile?.memberId || 'OPD000001'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* OPD E-Cards Section - Compact Horizontal Scroll */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Covered Members</h2>

        {/* Scrollable container */}
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {/* Self Card */}
            <div className="min-w-[280px] snap-start">
              <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 p-3">
                {/* Download button */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{user?.name?.firstName} {user?.name?.lastName}</p>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">Self</span>
                  </div>
                  <button className="flex flex-col items-center text-white/80 hover:text-white">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="text-[10px] mt-0.5">E-Card</span>
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs">
                  <p className="text-white/90">Member ID: <span className="font-medium">{user?.memberId || 'N/A'}</span></p>
                  <p className="text-white/90">UHID: <span className="font-medium">{user?.uhid || 'N/A'}</span></p>
                  <p className="text-white/90">Policy: <span className="font-medium">{getPolicyForUser(user?._id)?.policyNumber || 'No Policy Mapped'}</span></p>
                  <p className="text-white/90">Relationship: <span className="font-medium">Primary Member</span></p>
                </div>

                {/* Coverage Period */}
                <div className="mt-2 pt-2 border-t border-white/20">
                  <p className="text-[10px] text-white/80">Coverage: {getCoveragePeriodForUser(user?._id)}</p>
                </div>
              </Card>
            </div>

            {/* Dependent Cards */}
            {user?.dependents?.map((dependent: any, index: number) => (
              <div key={dependent.id} className="min-w-[280px] snap-start">
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 p-3">
                  {/* Download button */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{dependent.name?.firstName} {dependent.name?.lastName}</p>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{dependent.relationship}</span>
                    </div>
                    <button className="flex flex-col items-center text-white/80 hover:text-white">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span className="text-[10px] mt-0.5">E-Card</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs">
                    <p className="text-white/90">Member ID: <span className="font-medium">{dependent.memberId || 'N/A'}</span></p>
                    <p className="text-white/90">UHID: <span className="font-medium">{dependent.uhid || 'N/A'}</span></p>
                    <p className="text-white/90">Policy: <span className="font-medium">{getPolicyForUser(dependent._id)?.policyNumber || 'No Policy Mapped'}</span></p>
                    <p className="text-white/90">Relationship: <span className="font-medium">{dependent.relationship}</span></p>
                  </div>

                  {/* Coverage Period */}
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-[10px] text-white/80">Coverage: {getCoveragePeriodForUser(dependent._id)}</p>
                  </div>
                </Card>
              </div>
            ))}

            {/* Hint card for more */}
            <div className="min-w-[80px] snap-start flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <ChevronRightIcon className="h-8 w-8 mx-auto" />
                <p className="text-xs mt-1">Scroll</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Actions - Desktop enhanced grid */}
          <div>
            <h2 className="text-lg font-semibold text-ink-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group flex flex-col items-center justify-center p-3 sm:p-4 bg-surface rounded-xl sm:rounded-2xl border border-surface-border hover:shadow-soft hover:border-brand-200 transition-all min-h-[80px] sm:min-h-[100px]"
                >
                  <div className={`${action.color} p-2 sm:p-3 rounded-lg sm:rounded-xl mb-1 sm:mb-2 group-hover:scale-105 transition-transform`}>
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-ink-900 text-center group-hover:text-brand-700">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Benefits & Family */}
        <div className="space-y-6">
          {/* Benefits Overview - Show only enabled components */}
          <Card title="Your Benefits">
            <div className="space-y-4">
              {benefitComponents?.consultation?.enabled && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Consultations</span>
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">8/10</p>
                  <p className="text-xs text-blue-600 mt-1">Used this year</p>
                </div>
              )}

              {benefitComponents?.ahc?.enabled && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Health Checkup</span>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Due</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">1</p>
                  <p className="text-xs text-purple-600 mt-1">Available</p>
                </div>
              )}

              {benefitComponents?.pharmacy?.enabled && (
                <div className="p-4 bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brand-900">Pharmacy</span>
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">20% off</span>
                  </div>
                  <p className="text-2xl font-bold text-brand-900">₹3,500</p>
                  <p className="text-xs text-brand-600 mt-1">Saved this year</p>
                </div>
              )}

              {!Object.values(benefitComponents || {}).some((comp: any) => comp?.enabled) && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No benefits currently enabled</p>
                  <p className="text-xs mt-1">Contact your administrator for details</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-border">
              <Link href="/member/benefits" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all benefits →
              </Link>
            </div>
          </Card>

        </div>
      </div>


      {/* Recent Activity - Full width section */}
      <Card title="Recent Activity" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="p-4 bg-surface-alt rounded-xl hover:bg-surface transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{activity.title}</p>
                  <p className="text-xs text-ink-500 mt-1">{activity.date}</p>
                </div>
                {activity.amount && (
                  <span className="text-sm font-semibold text-ink-900">{activity.amount}</span>
                )}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activity.status === 'Approved' ? 'bg-brand-100 text-brand-800' :
                activity.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Link href="/member/claims" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all claims →
          </Link>
          <Link href="/member/transactions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View transactions →
          </Link>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card title="Frequently Asked Questions" className="mb-6">
        <div className="space-y-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">How do I file a claim?</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 px-4 text-sm text-gray-600">
              You can file a claim by clicking on the "File Claim" button on your dashboard or navigating to the Claims section. Upload your bills and prescriptions, fill in the required details, and submit. You'll receive confirmation within 24 hours.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">What is covered under OPD benefits?</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 px-4 text-sm text-gray-600">
              Your OPD benefits cover consultations, diagnostic tests, pharmacy bills, dental care, optical care, and preventive health checkups. The coverage limit is ₹50,000 per year for the primary member and ₹25,000 for each dependent.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">How long does claim approval take?</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 px-4 text-sm text-gray-600">
              Most claims are processed within 3-5 business days. Pre-approved network claims are settled instantly. You can track your claim status in real-time through your dashboard.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">Can I add family members to my plan?</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 px-4 text-sm text-gray-600">
              Yes, you can add up to 5 family members (spouse, children, and parents) to your OPD plan. Each family member gets their own OPD e-card with individual benefit tracking.
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-900">How do I find network providers?</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-3 px-4 text-sm text-gray-600">
              Navigate to the "Avail Benefits" section to find our network of hospitals, clinics, pharmacies, and diagnostic centers. You can search by location, specialty, or provider name. Network providers offer cashless services and additional discounts.
            </div>
          </details>
        </div>
        <div className="mt-6 text-center">
          <Link href="/member/help" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all FAQs →
          </Link>
        </div>
      </Card>

      {/* Support CTAs */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="tel:+918001234567"
            className="flex items-center justify-center p-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm hover:shadow-md"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs opacity-90">Call Support</p>
              <p className="font-semibold">800-123-4567</p>
            </div>
          </a>
          <a
            href="mailto:support@opdwallet.com"
            className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="text-xs opacity-90">Email Us</p>
              <p className="font-semibold">support@opdwallet.com</p>
            </div>
          </a>
        </div>
      </div>

      </div>
    </div>
  )
}