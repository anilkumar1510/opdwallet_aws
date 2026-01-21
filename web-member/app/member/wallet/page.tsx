'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ChevronLeftIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  SparklesIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import {
  VideoCameraIcon,
  BeakerIcon,
  CubeIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import FilterPopup from '../transactions/FilterPopup'

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

  // Multi-level filter state (applied filters)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([])
  const [includeReversed, setIncludeReversed] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Available filter options
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([])

  // Popup control state
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [anchorElements, setAnchorElements] = useState<Record<string, HTMLElement | null>>({})

  // Temporary filter states (for popup editing before confirm)
  const [tempTypes, setTempTypes] = useState<string[]>([])
  const [tempCategories, setTempCategories] = useState<string[]>([])
  const [tempDateFrom, setTempDateFrom] = useState<string>('')
  const [tempDateTo, setTempDateTo] = useState<string>('')
  const [tempMinAmount, setTempMinAmount] = useState<string>('')
  const [tempMaxAmount, setTempMaxAmount] = useState<string>('')
  const [tempServiceTypes, setTempServiceTypes] = useState<string[]>([])
  const [tempSortBy, setTempSortBy] = useState<'date' | 'amount'>('date')
  const [tempSortOrder, setTempSortOrder] = useState<'asc' | 'desc'>('desc')
  const [tempIncludeReversed, setTempIncludeReversed] = useState<boolean>(true)

  // Helper Functions

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedCategories([])
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setSelectedServiceTypes([])
    setIncludeReversed(true)
    setSortBy('date')
    setSortOrder('desc')
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedTypes.length > 0) count++
    if (selectedCategories.length > 0) count++
    if (dateFrom || dateTo) count++
    if (minAmount || maxAmount) count++
    if (selectedServiceTypes.length > 0) count++
    if (!includeReversed) count++
    if (sortBy !== 'date' || sortOrder !== 'desc') count++
    return count
  }, [selectedTypes, selectedCategories, dateFrom, dateTo, minAmount, maxAmount, selectedServiceTypes, includeReversed, sortBy, sortOrder])

  // Open popup and initialize temp state
  const openPopup = (popupName: string, buttonEl: HTMLElement) => {
    setActivePopup(popupName)
    setAnchorElements({ ...anchorElements, [popupName]: buttonEl })

    switch (popupName) {
      case 'transactionType':
        setTempTypes([...selectedTypes])
        break
      case 'category':
        setTempCategories([...selectedCategories])
        break
      case 'dateRange':
        setTempDateFrom(dateFrom)
        setTempDateTo(dateTo)
        break
      case 'amountRange':
        setTempMinAmount(minAmount)
        setTempMaxAmount(maxAmount)
        break
      case 'serviceType':
        setTempServiceTypes([...selectedServiceTypes])
        break
      case 'sortBy':
        setTempSortBy(sortBy)
        setTempSortOrder(sortOrder)
        setTempIncludeReversed(includeReversed)
        break
    }
  }

  // Confirm popup
  const confirmPopup = (popupName: string) => {
    switch (popupName) {
      case 'transactionType':
        setSelectedTypes([...tempTypes])
        break
      case 'category':
        setSelectedCategories([...tempCategories])
        break
      case 'dateRange':
        setDateFrom(tempDateFrom)
        setDateTo(tempDateTo)
        break
      case 'amountRange':
        setMinAmount(tempMinAmount)
        setMaxAmount(tempMaxAmount)
        break
      case 'serviceType':
        setSelectedServiceTypes([...tempServiceTypes])
        break
      case 'sortBy':
        setSortBy(tempSortBy)
        setSortOrder(tempSortOrder)
        setIncludeReversed(tempIncludeReversed)
        break
    }
    setActivePopup(null)
  }

  // Cancel popup
  const cancelPopup = () => {
    setActivePopup(null)
  }

  // Toggle helpers
  const toggleTempType = (type: string) => {
    if (tempTypes.includes(type)) {
      setTempTypes(tempTypes.filter(t => t !== type))
    } else {
      setTempTypes([...tempTypes, type])
    }
  }

  const toggleTempCategory = (category: string) => {
    if (tempCategories.includes(category)) {
      setTempCategories(tempCategories.filter(c => c !== category))
    } else {
      setTempCategories([...tempCategories, category])
    }
  }

  const toggleTempServiceType = (serviceType: string) => {
    if (tempServiceTypes.includes(serviceType)) {
      setTempServiceTypes(tempServiceTypes.filter(st => st !== serviceType))
    } else {
      setTempServiceTypes([...tempServiceTypes, serviceType])
    }
  }

  // Quick date presets
  const setQuickDateRange = (range: 'today' | '7days' | '30days' | '90days') => {
    const today = new Date()
    const toDate = today.toISOString().split('T')[0]

    let fromDate = ''
    switch (range) {
      case 'today':
        fromDate = toDate
        break
      case '7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        fromDate = sevenDaysAgo.toISOString().split('T')[0]
        break
      case '30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        fromDate = thirtyDaysAgo.toISOString().split('T')[0]
        break
      case '90days':
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(today.getDate() - 90)
        fromDate = ninetyDaysAgo.toISOString().split('T')[0]
        break
    }

    setTempDateFrom(fromDate)
    setTempDateTo(toDate)
  }

  // Individual filter removal helpers (needed for tag X buttons)
  const toggleType = (type: string) => {
    setSelectedTypes(selectedTypes.filter(t => t !== type))
  }

  const toggleCategory = (categoryCode: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== categoryCode))
  }

  const toggleServiceType = (serviceType: string) => {
    setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType))
  }

  // Helper to get category name from code
  const getCategoryName = (categoryCode: string) => {
    const category = walletData?.categories?.find((cat: any) => cat.categoryCode === categoryCode)
    return category?.name || categoryCode
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  // Fetch wallet data (balance + transactions) whenever selectedUserId or filters change
  useEffect(() => {
    if (selectedUserId) {
      fetchWalletDataForUser(selectedUserId)
    }
  }, [
    selectedUserId,
    selectedTypes,
    selectedCategories,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    selectedServiceTypes,
    includeReversed,
    sortBy,
    sortOrder
  ])

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
      // Build query parameters for transactions
      const params = new URLSearchParams()
      params.append('userId', userId)
      params.append('limit', '100') // Increase from 15 to 100 for better filtering

      if (selectedTypes.length > 0) {
        params.append('type', selectedTypes.join(','))
      }
      if (selectedCategories.length > 0) {
        params.append('categoryCode', selectedCategories.join(','))
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }
      if (dateTo) {
        params.append('dateTo', dateTo)
      }
      if (minAmount) {
        params.append('minAmount', minAmount)
      }
      if (maxAmount) {
        params.append('maxAmount', maxAmount)
      }
      if (selectedServiceTypes.length > 0) {
        params.append('serviceType', selectedServiceTypes.join(','))
      }
      params.append('includeReversed', includeReversed.toString())
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      // Fetch both wallet balance AND transactions in parallel
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/wallet/balance?userId=${userId}`, {
          credentials: 'include'
        }),
        fetch(`/api/wallet/transactions?${params.toString()}`, {
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

        // Extract unique service types
        const uniqueServiceTypes = Array.from(
          new Set(
            (data.transactions || [])
              .map((t: any) => t.serviceType)
              .filter((st: string | undefined) => st)
          )
        ) as string[]
        setAvailableServiceTypes(uniqueServiceTypes)
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
            <div className="p-5 lg:p-6 overflow-hidden">
              {/* Filter Buttons Row */}
              <div className="mb-4 -mx-5 px-5 lg:-mx-6 lg:px-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {/* Transaction Type Filter */}
                  <button
                    onClick={(e) => openPopup('transactionType', e.currentTarget)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                      selectedTypes.length > 0
                        ? 'text-white'
                        : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                    }`}
                    style={selectedTypes.length > 0 ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                  >
                    <FunnelIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>Type</span>
                    {selectedTypes.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                        {selectedTypes.length}
                      </span>
                    )}
                  </button>

                  {/* Date Range Filter */}
                  <button
                    onClick={(e) => openPopup('dateRange', e.currentTarget)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                      (dateFrom || dateTo)
                        ? 'text-white'
                        : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                    }`}
                    style={(dateFrom || dateTo) ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>Date</span>
                    {(dateFrom || dateTo) && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Amount Range Filter */}
                  <button
                    onClick={(e) => openPopup('amountRange', e.currentTarget)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                      (minAmount || maxAmount)
                        ? 'text-white'
                        : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                    }`}
                    style={(minAmount || maxAmount) ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                  >
                    <BanknotesIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>Amount</span>
                    {(minAmount || maxAmount) && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Category Filter */}
                  {walletData?.categories && walletData.categories.length > 0 && (
                    <button
                      onClick={(e) => openPopup('category', e.currentTarget)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                        selectedCategories.length > 0
                          ? 'text-white'
                          : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                      }`}
                      style={selectedCategories.length > 0 ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                    >
                      <TagIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span>Category</span>
                      {selectedCategories.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                          {selectedCategories.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Service Type Filter */}
                  {availableServiceTypes.length > 0 && (
                    <button
                      onClick={(e) => openPopup('serviceType', e.currentTarget)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                        selectedServiceTypes.length > 0
                          ? 'text-white'
                          : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                      }`}
                      style={selectedServiceTypes.length > 0 ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                    >
                      <TagIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span>Service</span>
                      {selectedServiceTypes.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                          {selectedServiceTypes.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Sort By Filter */}
                  <button
                    onClick={(e) => openPopup('sortBy', e.currentTarget)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
                      (sortBy !== 'date' || sortOrder !== 'desc')
                        ? 'text-white'
                        : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                    }`}
                    style={(sortBy !== 'date' || sortOrder !== 'desc') ? { backgroundColor: '#0F5FDC', borderColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                  >
                    {sortOrder === 'desc' ? <ArrowDownIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <ArrowUpIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                    <span>Sort</span>
                    {(sortBy !== 'date' || sortOrder !== 'desc') && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Clear All Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold text-white transition-all shadow-sm whitespace-nowrap hover:opacity-90"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      Clear All ({activeFilterCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Tags */}
              {activeFilterCount > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Transaction Type Tags */}
                    {selectedTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold shadow-sm"
                      >
                        <TagIcon className="w-3 h-3" />
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                        <button
                          onClick={() => toggleType(type)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}

                    {/* Category Tags */}
                    {selectedCategories.map((catCode) => (
                      <span
                        key={catCode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold shadow-sm"
                      >
                        <TagIcon className="w-3 h-3" />
                        {getCategoryName(catCode)}
                        <button
                          onClick={() => toggleCategory(catCode)}
                          className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}

                    {/* Date Range Tags */}
                    {dateFrom && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold shadow-sm">
                        <CalendarIcon className="w-3 h-3" />
                        From: {new Date(dateFrom).toLocaleDateString()}
                        <button
                          onClick={() => setDateFrom('')}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                    {dateTo && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold shadow-sm">
                        <CalendarIcon className="w-3 h-3" />
                        To: {new Date(dateTo).toLocaleDateString()}
                        <button
                          onClick={() => setDateTo('')}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}

                    {/* Amount Range Tags */}
                    {minAmount && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold shadow-sm">
                        <BanknotesIcon className="w-3 h-3" />
                        Min: ₹{minAmount}
                        <button
                          onClick={() => setMinAmount('')}
                          className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                    {maxAmount && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold shadow-sm">
                        <BanknotesIcon className="w-3 h-3" />
                        Max: ₹{maxAmount}
                        <button
                          onClick={() => setMaxAmount('')}
                          className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}

                    {/* Service Type Tags */}
                    {selectedServiceTypes.map((st) => (
                      <span
                        key={st}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold shadow-sm"
                      >
                        <TagIcon className="w-3 h-3" />
                        {st}
                        <button
                          onClick={() => toggleServiceType(st)}
                          className="ml-1 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}

                    {/* Reversed Transactions Tag */}
                    {!includeReversed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold shadow-sm">
                        Excluding Reversed
                        <button
                          onClick={() => setIncludeReversed(true)}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

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

      {/* Filter Popups */}

      {/* Transaction Type Popup */}
      <FilterPopup
        isOpen={activePopup === 'transactionType'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('transactionType')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.transactionType}
        title="Transaction Type"
      >
        <div className="flex flex-col gap-3">
          {['DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'].map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50"
            >
              <input
                type="checkbox"
                checked={tempTypes.includes(type)}
                onChange={() => toggleTempType(type)}
                className="w-4 h-4 rounded border-2 cursor-pointer"
                style={{ borderColor: '#86ACD8', accentColor: '#0F5FDC' }}
              />
              <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </FilterPopup>

      {/* Date Range Popup */}
      <FilterPopup
        isOpen={activePopup === 'dateRange'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('dateRange')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.dateRange}
        title="Date Range"
      >
        <div className="flex flex-col gap-4">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickDateRange('today')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
              style={{ background: '#f3f4f6', color: '#0E51A2' }}
            >
              Today
            </button>
            <button
              onClick={() => setQuickDateRange('7days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
              style={{ background: '#f3f4f6', color: '#0E51A2' }}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setQuickDateRange('30days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
              style={{ background: '#f3f4f6', color: '#0E51A2' }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setQuickDateRange('90days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
              style={{ background: '#f3f4f6', color: '#0E51A2' }}
            >
              Last 90 Days
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0E51A2' }}>
                From Date
              </label>
              <input
                type="date"
                value={tempDateFrom}
                onChange={(e) => setTempDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 text-sm"
                style={{ borderColor: '#86ACD8' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0E51A2' }}>
                To Date
              </label>
              <input
                type="date"
                value={tempDateTo}
                onChange={(e) => setTempDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 text-sm"
                style={{ borderColor: '#86ACD8' }}
              />
            </div>
          </div>
        </div>
      </FilterPopup>

      {/* Amount Range Popup */}
      <FilterPopup
        isOpen={activePopup === 'amountRange'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('amountRange')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.amountRange}
        title="Amount Range"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0E51A2' }}>
              Minimum Amount (₹)
            </label>
            <input
              type="number"
              value={tempMinAmount}
              onChange={(e) => setTempMinAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 rounded-lg border-2 text-sm"
              style={{ borderColor: '#86ACD8' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#0E51A2' }}>
              Maximum Amount (₹)
            </label>
            <input
              type="number"
              value={tempMaxAmount}
              onChange={(e) => setTempMaxAmount(e.target.value)}
              placeholder="No limit"
              min="0"
              className="w-full px-3 py-2 rounded-lg border-2 text-sm"
              style={{ borderColor: '#86ACD8' }}
            />
          </div>
        </div>
      </FilterPopup>

      {/* Category Popup */}
      <FilterPopup
        isOpen={activePopup === 'category'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('category')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.category}
        title="Category"
      >
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
          {walletData?.categories?.map((category: any) => (
            <label
              key={category.categoryCode}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50"
            >
              <input
                type="checkbox"
                checked={tempCategories.includes(category.categoryCode)}
                onChange={() => toggleTempCategory(category.categoryCode)}
                className="w-4 h-4 rounded border-2 cursor-pointer"
                style={{ borderColor: '#86ACD8', accentColor: '#0F5FDC' }}
              />
              <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </FilterPopup>

      {/* Service Type Popup */}
      <FilterPopup
        isOpen={activePopup === 'serviceType'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('serviceType')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.serviceType}
        title="Service Type"
      >
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
          {availableServiceTypes.map((serviceType) => (
            <label
              key={serviceType}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50"
            >
              <input
                type="checkbox"
                checked={tempServiceTypes.includes(serviceType)}
                onChange={() => toggleTempServiceType(serviceType)}
                className="w-4 h-4 rounded border-2 cursor-pointer"
                style={{ borderColor: '#86ACD8', accentColor: '#0F5FDC' }}
              />
              <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                {serviceType}
              </span>
            </label>
          ))}
        </div>
      </FilterPopup>

      {/* Sort By Popup */}
      <FilterPopup
        isOpen={activePopup === 'sortBy'}
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('sortBy')}
        onCancel={cancelPopup}
        anchorEl={anchorElements.sortBy}
        title="Sort By"
      >
        <div className="flex flex-col gap-4">
          {/* Sort Field */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#0E51A2' }}>
              Sort Field
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50">
                <input
                  type="radio"
                  checked={tempSortBy === 'date'}
                  onChange={() => setTempSortBy('date')}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: '#0F5FDC' }}
                />
                <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                  Date
                </span>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50">
                <input
                  type="radio"
                  checked={tempSortBy === 'amount'}
                  onChange={() => setTempSortBy('amount')}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: '#0F5FDC' }}
                />
                <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                  Amount
                </span>
              </label>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#0E51A2' }}>
              Sort Order
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50">
                <input
                  type="radio"
                  checked={tempSortOrder === 'desc'}
                  onChange={() => setTempSortOrder('desc')}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: '#0F5FDC' }}
                />
                <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                  Newest First (Descending)
                </span>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-blue-50">
                <input
                  type="radio"
                  checked={tempSortOrder === 'asc'}
                  onChange={() => setTempSortOrder('asc')}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: '#0F5FDC' }}
                />
                <span className="text-sm font-medium" style={{ color: '#0E51A2' }}>
                  Oldest First (Ascending)
                </span>
              </label>
            </div>
          </div>
        </div>
      </FilterPopup>
    </div>
  )
}
