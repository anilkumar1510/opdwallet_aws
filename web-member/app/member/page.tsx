'use client'

import { useState, useEffect } from 'react'
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
  Bars3Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  useEffect(() => {
    fetchUserData()
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

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setSelectedProfile(userData) // Set default selected profile

        // Mock dependents data for demo (replace with actual API call)
        const mockDependents = [
          { id: '2', name: { firstName: 'Sarah', lastName: 'Doe' }, memberId: 'OPD000002', relationship: 'Spouse' },
          { id: '3', name: { firstName: 'Emma', lastName: 'Doe' }, memberId: 'OPD000003', relationship: 'Child' },
        ]
        userData.dependents = mockDependents
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { name: 'File Claim', icon: DocumentTextIcon, href: '/member/claims/new', color: 'bg-brand-600' },
    { name: 'Book Appointment', icon: CalendarIcon, href: '/member/bookings/new', color: 'bg-blue-600' },
    { name: 'Add Family', icon: UsersIcon, href: '/member/family/add', color: 'bg-purple-600' },
    { name: 'View Benefits', icon: SparklesIcon, href: '/member/benefits', color: 'bg-amber-600' },
  ]

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
          {/* Top row with back arrow and "go to habit" */}
          <div className="flex items-center mb-4">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">go to habit</span>
            </button>
          </div>

          {/* Main header row */}
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              {/* Hamburger menu button for mobile */}
              <button
                onClick={() => {
                  // Trigger sidebar open by dispatching a custom event
                  window.dispatchEvent(new CustomEvent('toggleSidebar'))
                }}
                className="mr-4 text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Welcome message and member ID */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Hi, {selectedProfile?.name?.firstName || 'Member'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Member ID: {selectedProfile?.memberId || 'OPD000001'}
                </p>
              </div>
            </div>

            {/* Profile selector dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-semibold hover:shadow-lg transition-all"
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
                        key={dependent.id}
                        onClick={() => {
                          setSelectedProfile(dependent)
                          setProfileDropdownOpen(false)
                        }}
                        className={`w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedProfile?.id === dependent.id ? 'bg-brand-50' : ''
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
                        {selectedProfile?.id === dependent.id && (
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Desktop Layout: Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Wallet & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Snapshot - Enhanced for desktop */}
          <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <WalletIcon className="h-6 w-6 mr-2" />
                  <span className="text-lg font-semibold">OPD Wallet Balance</span>
                </div>
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-300" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center">
                    <CurrencyRupeeIcon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mr-1" />
                    <span className="truncate">50,000</span>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-100 mt-1">Available Balance</p>
                </div>
                <div className="flex items-center justify-end">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-brand-500/30 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold">75%</p>
                      <p className="text-xs text-brand-100">Remaining</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-brand-500">
                <div>
                  <p className="text-brand-100 text-xs sm:text-sm">Used</p>
                  <p className="text-sm sm:text-lg font-semibold truncate">₹12,500</p>
                </div>
                <div>
                  <p className="text-brand-100 text-xs sm:text-sm">Limit</p>
                  <p className="text-sm sm:text-lg font-semibold truncate">₹2L</p>
                </div>
                <div>
                  <p className="text-brand-100 text-xs sm:text-sm">Saved</p>
                  <p className="text-sm sm:text-lg font-semibold truncate">₹8,500</p>
                </div>
              </div>
            </div>
          </Card>

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
          {/* Benefits Overview - Compact vertical layout */}
          <Card title="Your Benefits">
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Consultations</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">8/10</p>
                <p className="text-xs text-blue-600 mt-1">Used this year</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Health Checkup</span>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Due</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">1</p>
                <p className="text-xs text-purple-600 mt-1">Available</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Pharmacy</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">20% off</span>
                </div>
                <p className="text-2xl font-bold text-green-900">₹3,500</p>
                <p className="text-xs text-green-600 mt-1">Saved this year</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-border">
              <Link href="/member/benefits" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all benefits →
              </Link>
            </div>
          </Card>

          {/* Family Members - Vertical stack for desktop sidebar */}
          {user?.dependents && user.dependents.length > 0 && (
            <Card title="Family Members">
              <div className="space-y-3">
                {user.dependents.slice(0, 3).map((dependent: any, index: number) => (
                  <div key={dependent.id || index} className="flex items-center p-3 bg-surface-alt rounded-xl hover:bg-surface transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold mr-3">
                      {dependent.name?.firstName?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900">
                        {dependent.name?.firstName} {dependent.name?.lastName}
                      </p>
                      <p className="text-xs text-ink-500">{dependent.relationship}</p>
                    </div>
                  </div>
                ))}
                {user.dependents.length > 3 && (
                  <p className="text-xs text-ink-500 text-center">+{user.dependents.length - 3} more members</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-border">
                <Link href="/member/family" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Manage family →
                </Link>
              </div>
            </Card>
          )}
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
                activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
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

      </div>
    </div>
  )
}