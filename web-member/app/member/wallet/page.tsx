'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeftIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  VideoCameraIcon,
  BeakerIcon,
  CubeIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// Icon mapping for categories - Comprehensive mapping for all category variations
const getCategoryIcon = (categoryCode: string, categoryName?: string) => {
  const code = categoryCode?.toUpperCase() || ''
  const name = categoryName?.toUpperCase() || ''
  const combined = `${code} ${name}`

  // Lab/Diagnostics - CHECK FIRST to prevent false matches
  if (code === 'CAT003' ||
      code === 'DIAGNOSTICS' ||
      code === 'LAB' ||
      combined.includes('LABORATORY') ||
      combined.includes('DIAGNOSTIC') ||
      combined.includes('LAB TEST') ||
      combined.includes('PATHOLOGY') ||
      combined.includes('RADIOLOGY') ||
      combined.includes('X-RAY') ||
      combined.includes('XRAY') ||
      combined.includes('SCAN') ||
      combined.includes('TEST') && !combined.includes('CONTEST') ||
      (combined.includes('LAB') && !combined.includes('AVAILABLE') && !combined.includes('COLLABORATION'))) {
    return BeakerIcon
  }

  // Pharmacy/Medicine
  if (code === 'CAT002' ||
      code === 'PHARMACY' ||
      code === 'MEDICINE' ||
      combined.includes('PHARMACY') ||
      combined.includes('MEDICINE') ||
      combined.includes('DRUG') ||
      combined.includes('PRESCRIPTION')) {
    return CubeIcon
  }

  // Online/Tele Consultation
  if (code === 'ONLINE_CONSULTATION' ||
      code === 'TELE_CONSULTATION' ||
      code === 'TELECONSULTATION' ||
      code.includes('ONLINE') ||
      code.includes('TELE') ||
      code.includes('VIRTUAL') ||
      combined.includes('ONLINE') ||
      combined.includes('TELE') ||
      combined.includes('VIRTUAL') ||
      combined.includes('VIDEO CONSULT')) {
    return HeartIcon
  }

  // In-Clinic Consultation
  if (code === 'CAT001' ||
      code === 'CONSULTATION' ||
      code === 'IN_CLINIC' ||
      code === 'IN_CLINIC_CONSULTATION' ||
      code.includes('CLINIC') ||
      combined.includes('CLINIC') ||
      combined.includes('IN-CLINIC') ||
      combined.includes('CONSULTATION') && !combined.includes('ONLINE') && !combined.includes('TELE')) {
    return VideoCameraIcon
  }

  // Dental/Vision - CHECK LAST to avoid conflicts
  if (code === 'CAT004' ||
      code === 'DENTAL' ||
      code === 'VISION' ||
      code === 'DENTAL_VISION' ||
      code === 'EYE_CARE' ||
      combined.includes('DENTAL') ||
      combined.includes('VISION') ||
      combined.includes('EYE CARE') ||
      combined.includes('EYECARE') ||
      combined.includes('OPTICAL') ||
      combined.includes('OPHTHALMOLOGY')) {
    return EyeIcon
  }

  // Wellness/Preventive/Other - Default with Heart icon
  return HeartIcon
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions')
  const [walletData, setWalletData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProfileData()
  }, [])

  // Fetch wallet data (balance + transactions) whenever selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      fetchWalletDataForUser(selectedUserId)
    }
  }, [selectedUserId])

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/member/profile', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()

        // Build family members list
        const members = [
          {
            userId: data.user._id,
            name: `${data.user.name.firstName} ${data.user.name.lastName}`,
            memberId: data.user.memberId,
            isPrimary: true,
            relationship: 'Self'
          },
          ...data.dependents.map((dep: any) => ({
            userId: dep._id,
            name: `${dep.name.firstName} ${dep.name.lastName}`,
            memberId: dep.memberId,
            isPrimary: false,
            relationship: dep.relationship
          }))
        ]

        setFamilyMembers(members)
        // Setting selectedUserId will trigger useEffect to fetch wallet data
        setSelectedUserId(data.user._id)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setLoading(false)
    }
    // Don't set loading=false here - let fetchWalletDataForUser handle it
  }

  // Single unified function to fetch all wallet data for a user
  const fetchWalletDataForUser = async (userId: string) => {
    setLoading(true)

    try {
      // Fetch both wallet balance AND transactions in parallel
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/wallet/balance?userId=${userId}`, {
          credentials: 'include'
        }),
        fetch(`/api/wallet/transactions?userId=${userId}&limit=15`, {
          credentials: 'include'
        })
      ])

      if (balanceResponse.ok) {
        const data = await balanceResponse.json()
        setWalletData({
          totalBalance: data.totalBalance,
          categories: data.categories
        })
      }

      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = (userId: string) => {
    // Simply update the selected user - useEffect will handle fetching
    setSelectedUserId(userId)
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  const totalBalance = walletData?.totalBalance || { allocated: 0, current: 0, consumed: 0 }
  const categories = walletData?.categories || []

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>My Wallet</h1>
              <p className="text-xs lg:text-sm text-gray-600">Manage your health benefits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Family Member Selector */}
        {familyMembers.length > 1 && (
          <div
            className="rounded-2xl p-5 lg:p-6 mb-6 border-2 shadow-md"
            style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}
          >
            <label className="text-sm lg:text-base font-semibold mb-3 block" style={{ color: '#0E51A2' }}>View Wallet For:</label>
            <div className="relative" ref={dropdownRef}>
              {/* Custom Dropdown Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 lg:p-4 bg-white rounded-xl text-sm lg:text-base font-medium hover:shadow-md transition-all cursor-pointer flex items-center justify-between border-2"
                style={{ borderColor: '#0F5FDC', color: '#303030' }}
              >
                <span>
                  {familyMembers.find(m => m.userId === selectedUserId)?.name} {familyMembers.find(m => m.userId === selectedUserId)?.isPrimary ? '(Self)' : `(${familyMembers.find(m => m.userId === selectedUserId)?.relationship})`}
                </span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#0F5FDC' }} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 rounded-xl shadow-lg overflow-hidden" style={{ borderColor: '#86ACD8' }}>
                  {familyMembers.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => handleUserChange(member.userId)}
                      className={`w-full p-3 lg:p-4 text-left text-sm lg:text-base font-medium transition-all flex items-center justify-between ${
                        selectedUserId === member.userId ? '' : 'hover:bg-blue-50'
                      }`}
                      style={selectedUserId === member.userId ? { background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)' } : {}}
                    >
                      <span style={{ color: '#303030' }}>
                        {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
                      </span>
                      {selectedUserId === member.userId && (
                        <CheckIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div
          className="rounded-2xl p-5 lg:p-6 mb-6 border-2 shadow-lg"
          style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#F7DCAF'
          }}
        >
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <BanknotesIcon className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: '#0F5FDC' }} />
            </div>
          </div>

          {/* Total Balance */}
          <div className="text-center mb-4">
            <p className="text-xs lg:text-sm text-gray-600 mb-1">Available Balance</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl lg:text-3xl font-bold" style={{ color: '#0E51A2' }}>
                ₹{totalBalance.current.toLocaleString()}
              </span>
              <span className="text-sm lg:text-base text-gray-500">
                / ₹{totalBalance.allocated.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3 border-2 text-center"
              style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}
            >
              <p className="text-xs text-gray-600 mb-1">Total Allocated</p>
              <p className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>
                ₹{totalBalance.allocated.toLocaleString()}
              </p>
            </div>
            <div
              className="rounded-xl p-3 border-2 text-center"
              style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}
            >
              <p className="text-xs text-gray-600 mb-1">Total Used</p>
              <p className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>
                ₹{totalBalance.consumed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md mb-6 border-2" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex" style={{ borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-4 text-sm lg:text-base font-semibold transition-all rounded-t-2xl ${
                activeTab === 'transactions' ? 'border-b-4' : ''
              }`}
              style={activeTab === 'transactions' ? { color: '#0E51A2', borderColor: '#0F5FDC' } : { color: '#6b7280' }}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-4 text-sm lg:text-base font-semibold transition-all rounded-t-2xl ${
                activeTab === 'categories' ? 'border-b-4' : ''
              }`}
              style={activeTab === 'categories' ? { color: '#0E51A2', borderColor: '#0F5FDC' } : { color: '#6b7280' }}
            >
              Categories
            </button>
          </div>

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="p-5 lg:p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                      border: '1px solid #A4BFFE7A',
                      boxShadow: '-2px 11px 46.1px 0px #0000000D'
                    }}
                  >
                    <ClockIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                  </div>
                  <p className="text-sm lg:text-base text-gray-600">No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="rounded-xl p-4 lg:p-5 border-2 shadow-sm hover:shadow-md transition-all"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm lg:text-base font-semibold mb-1" style={{ color: '#0E51A2' }}>
                              {transaction.notes || transaction.serviceType}
                            </p>
                            <p className="text-xs lg:text-sm text-gray-600 mb-2">{transaction.serviceProvider}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                  transaction.type === 'DEBIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {transaction.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(transaction.createdAt)} • {formatTime(transaction.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className={`text-base lg:text-lg font-bold ${
                                transaction.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {transaction.type === 'DEBIT' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Bal: ₹{transaction.newBalance.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Transactions CTA */}
                  <div className="mt-6">
                    <Link
                      href="/member/transactions"
                      className="block text-center py-3 lg:py-4 rounded-xl font-semibold transition-all hover:shadow-lg text-white"
                      style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                    >
                      View All Transactions →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="p-5 lg:p-6 space-y-4">
              {categories.map((category: any) => {
                const Icon = getCategoryIcon(category.categoryCode, category.name)
                const availablePercentage = category.total > 0 ? ((category.available / category.total) * 100) : 0

                return (
                  <div
                    key={category.categoryCode}
                    className="rounded-xl p-4 lg:p-5 border-2 shadow-sm hover:shadow-md transition-all"
                    style={{
                      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                      borderColor: '#86ACD8'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                            border: '1px solid #A4BFFE7A',
                            boxShadow: '-2px 11px 46.1px 0px #0000000D'
                          }}
                        >
                          <Icon className="h-6 w-6 lg:h-7 lg:w-7" style={{ color: '#0F5FDC' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm lg:text-base font-semibold mb-1 break-words" style={{ color: '#0E51A2' }}>
                            {category.name}
                          </p>
                          <p className="text-xs lg:text-sm text-gray-600 truncate">
                            {category.isUnlimited ? 'Unlimited' : `Limit: ₹${category.total.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg lg:text-xl font-bold whitespace-nowrap" style={{ color: '#0E51A2' }}>
                          ₹{category.available.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 whitespace-nowrap">Available</p>
                      </div>
                    </div>

                    {!category.isUnlimited && (
                      <>
                        <div className="flex justify-between text-xs lg:text-sm text-gray-600 mb-2">
                          <span>Used: ₹{category.consumed.toLocaleString()}</span>
                          <span className="font-semibold">{availablePercentage.toFixed(0)}% Available</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all bg-green-500"
                            style={{ width: `${Math.min(availablePercentage, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
