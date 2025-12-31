'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import {
  VideoCameraIcon,
  BeakerIcon,
  CubeIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// Icon mapping for categories
const getCategoryIcon = (categoryCode: string) => {
  switch (categoryCode) {
    case 'CAT001': return VideoCameraIcon
    case 'CAT002': return CubeIcon
    case 'CAT003': return BeakerIcon
    case 'CAT004': return EyeIcon
    default: return HeartIcon
  }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  const totalBalance = walletData?.totalBalance || { allocated: 0, current: 0, consumed: 0 }
  const categories = walletData?.categories || []

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/member" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Wallet</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Family Member Selector */}
        {familyMembers.length > 1 && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-900 mb-3 block">View Wallet For:</label>
            <div className="relative" ref={dropdownRef}>
              {/* Custom Dropdown Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 bg-white border-2 border-blue-500 rounded-xl text-sm font-medium text-gray-900 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>
                  {familyMembers.find(m => m.userId === selectedUserId)?.name} {familyMembers.find(m => m.userId === selectedUserId)?.isPrimary ? '(Self)' : `(${familyMembers.find(m => m.userId === selectedUserId)?.relationship})`}
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {familyMembers.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => handleUserChange(member.userId)}
                      className={`w-full p-3 text-left text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-between ${
                        selectedUserId === member.userId ? 'bg-blue-100' : ''
                      }`}
                    >
                      <span className="text-gray-900">
                        {member.name} {member.isPrimary ? '(Self)' : `(${member.relationship})`}
                      </span>
                      {selectedUserId === member.userId && (
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Balance Card */}
        <div className="rounded-xl p-4 mb-4 shadow-md" style={{ backgroundImage: 'linear-gradient(to bottom right, #0a529f, #084080)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₹{totalBalance.current.toLocaleString()}</span>
                <span className="text-blue-200 text-sm">/ ₹{totalBalance.allocated.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <BanknotesIcon className="h-12 w-12 text-blue-300 mb-1" />
              <p className="text-xs text-blue-200">Used: ₹{totalBalance.consumed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
            </button>
          </div>

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="p-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{transaction.notes || transaction.serviceType}</p>
                          <p className="text-xs text-gray-500 mt-1">{transaction.serviceProvider}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              transaction.type === 'DEBIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {transaction.type}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(transaction.createdAt)} • {formatTime(transaction.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-semibold ${
                            transaction.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'DEBIT' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Bal: ₹{transaction.newBalance.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Transactions CTA */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href="/member/transactions"
                      className="block text-center py-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
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
            <div className="p-4 space-y-3">
              {categories.map((category: any) => {
                const Icon = getCategoryIcon(category.categoryCode)
                const percentage = category.allocated > 0 ? ((category.consumed / category.allocated) * 100) : 0

                return (
                  <div key={category.categoryCode} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">
                            {category.isUnlimited ? 'Unlimited' : `Limit: ₹${category.total.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{category.available.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>

                    {!category.isUnlimited && (
                      <>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Used: ₹{category.consumed.toLocaleString()}</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
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
