'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND'

interface Transaction {
  _id: string
  transactionId: string
  userId: string
  type: TransactionType
  amount: number
  categoryCode: string
  categoryName?: string
  serviceType?: string
  serviceProvider?: string
  notes?: string
  createdAt: string
  processedAt?: string
  status: string
  previousBalance?: {
    total: number
    category: number
  }
  newBalance?: {
    total: number
    category: number
  }
  bookingId?: string
}

interface WalletBalance {
  totalBalance: {
    allocated: number
    current: number
    consumed: number
  }
  categories: Array<{
    categoryCode: string
    name: string
    allocated: number
    current: number
    consumed: number
  }>
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [transactionsRes, balanceRes] = await Promise.all([
        fetch('/api/wallet/transactions?limit=100', { credentials: 'include' }),
        fetch('/api/wallet/balance', { credentials: 'include' })
      ])

      if (!transactionsRes.ok || !balanceRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [transactionsData, balanceData] = await Promise.all([
        transactionsRes.json(),
        balanceRes.json()
      ])

      setTransactions(transactionsData.transactions || [])
      setWalletBalance(balanceData)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const matchesSearch = searchQuery === '' ||
        txn.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.serviceProvider?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === 'ALL' || txn.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [transactions, searchQuery, typeFilter])

  // Calculate totals
  const totals = useMemo(() => {
    const debits = filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0)

    const credits = filteredTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0)

    return { debits, credits, net: credits - debits }
  }, [filteredTransactions])

  // Helper function to get category name
  const getCategoryName = (categoryCode: string): string => {
    const category = walletBalance?.categories.find(c => c.categoryCode === categoryCode)
    return category?.name || categoryCode
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    // 1. Transaction Volume by Type
    const typeData = [
      {
        name: 'Credits',
        count: filteredTransactions.filter(t => t.type === 'CREDIT').length,
        amount: totals.credits,
        fill: '#22c55e'
      },
      {
        name: 'Debits',
        count: filteredTransactions.filter(t => t.type === 'DEBIT').length,
        amount: totals.debits,
        fill: '#ef4444'
      },
      {
        name: 'Refunds',
        count: filteredTransactions.filter(t => t.type === 'REFUND').length,
        amount: filteredTransactions.filter(t => t.type === 'REFUND').reduce((sum, t) => sum + t.amount, 0),
        fill: '#3b82f6'
      }
    ]

    // 2. Category Distribution
    const categoryMap = new Map<string, number>()
    filteredTransactions.forEach(txn => {
      if (txn.categoryCode) {
        const categoryName = getCategoryName(txn.categoryCode)
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + txn.amount)
      }
    })
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.abs(value)
    }))

    // 3. Daily Transaction Trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const dailyData = last7Days.map(date => {
      const dayTransactions = filteredTransactions.filter(txn =>
        txn.createdAt.startsWith(date)
      )
      return {
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        credits: dayTransactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0),
        debits: dayTransactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0)
      }
    })

    // 4. Balance Trend
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const balanceTrend = sortedTransactions.slice(-10).map((txn, index) => ({
      index: index + 1,
      balance: txn.newBalance?.total || 0,
      date: new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }))

    return { typeData, categoryData, dailyData, balanceTrend }
  }, [filteredTransactions, totals, walletBalance])

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-6 lg:px-6">
        <div className="max-w-[480px] mx-auto lg:max-w-6xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-gray-100 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-blue-100 text-sm">View your complete transaction record</p>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-6xl px-4 lg:px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {/* Current Balance */}
          <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-quickLink-border shadow-sm">
            <div className="text-xs lg:text-sm text-white/90 mb-1">Current Balance</div>
            <div className="text-xl lg:text-2xl font-bold text-white">
              ₹{(walletBalance?.totalBalance?.current || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Total Credits */}
          <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-quickLink-border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpIcon className="w-4 h-4 text-white" />
              <div className="text-xs lg:text-sm text-white/90">Credits</div>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-white">
              ₹{totals.credits.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Total Debits */}
          <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-quickLink-border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownIcon className="w-4 h-4 text-white" />
              <div className="text-xs lg:text-sm text-white/90">Debits</div>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-white">
              ₹{totals.debits.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Net Change */}
          <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-quickLink-border shadow-sm">
            <div className="text-xs lg:text-sm text-white/90 mb-1">Net Change</div>
            <div className="text-xl lg:text-2xl font-bold text-white">
              {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-6">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 px-1">Analytics Overview</h2>

          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              {/* Chart 1: Transaction Volume by Type */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm w-[280px] flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Transaction Volume</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData.typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {chartData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Daily Trend */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm w-[280px] flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">7-Day Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="credits" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="debits" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 3: Category Distribution */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm w-[280px] flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Category Split</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 4: Balance Trend */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm w-[280px] flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Balance Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData.balanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '12px' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Scroll Indicator */}
            <div className="flex justify-center gap-1 mt-3">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span>Swipe to view all charts</span>
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Chart 1: Transaction Volume by Type */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Transaction Volume</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Daily Trend */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">7-Day Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="credits" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="debits" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Category Distribution */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Category Split</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 4: Balance Trend */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Balance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.balanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #e5e7eb' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, description, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-lg focus:border-brand-500 focus:bg-white focus:outline-none text-sm text-gray-900 placeholder:text-gray-500 transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="pt-4 border-t-2 border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Transaction Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['ALL', 'CREDIT', 'DEBIT', 'REFUND'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        typeFilter === type
                          ? 'bg-brand-600 text-white shadow-md scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                    >
                      {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl lg:rounded-2xl p-12 text-center border-2 border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentArrowDownIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters to find transactions</p>
            </div>
          ) : (
            filteredTransactions.map((txn) => (
              <div
                key={txn._id}
                className="bg-white rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 hover:border-brand-400 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Main Content */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Transaction Title */}
                    <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-1 truncate">
                      {txn.notes || `${txn.serviceType || 'Transaction'}`}
                    </h3>

                    {/* Provider */}
                    {txn.serviceProvider && (
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {txn.serviceProvider}
                      </p>
                    )}

                    {/* Transaction ID */}
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 inline-block px-2 py-1 rounded">
                      {txn.transactionId}
                    </p>
                  </div>

                  {/* Amount Badge */}
                  <div
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-base lg:text-lg shadow-sm ${
                      txn.type === 'CREDIT'
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : txn.type === 'REFUND'
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        : 'bg-red-50 text-red-700 border-2 border-red-200'
                    }`}
                  >
                    {txn.type === 'CREDIT' ? (
                      <ArrowUpIcon className="w-5 h-5" />
                    ) : (
                      <ArrowDownIcon className="w-5 h-5" />
                    )}
                    <span>
                      {txn.type === 'CREDIT' || txn.type === 'REFUND' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 pt-4 border-t-2 border-gray-100">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time</p>
                      <p className="text-sm font-semibold text-gray-900">{formatTime(txn.createdAt)}</p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {txn.categoryCode && (
                    <div className="ml-auto">
                      <div className="px-3 py-1.5 bg-brand-50 border-2 border-brand-200 rounded-lg">
                        <p className="text-xs font-bold text-brand-700">{getCategoryName(txn.categoryCode)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balance After Transaction */}
                {txn.newBalance && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-100">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700">Balance After Transaction</span>
                      <span className="text-base lg:text-lg font-bold text-gray-900">₹{txn.newBalance.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {filteredTransactions.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </div>
        )}
      </div>
    </div>
  )
}
