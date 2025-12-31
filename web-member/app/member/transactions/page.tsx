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
  WalletIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
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
import { motion } from 'framer-motion'

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
        fill: '#E8FFF5',
        stroke: '#046D40'
      },
      {
        name: 'Debits',
        count: filteredTransactions.filter(t => t.type === 'DEBIT').length,
        amount: totals.debits,
        fill: '#FFF2E7',
        stroke: '#CD6D19'
      },
      {
        name: 'Refunds',
        count: filteredTransactions.filter(t => t.type === 'REFUND').length,
        amount: filteredTransactions.filter(t => t.type === 'REFUND').reduce((sum, t) => sum + t.amount, 0),
        fill: '#F5EAFF',
        stroke: '#4A147B'
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

  const COLORS = [
    { fill: '#FFF2E7', stroke: '#CD6D19' },
    { fill: '#FFFAE7', stroke: '#AF8C02' },
    { fill: '#E8FFF5', stroke: '#046D40' },
    { fill: '#F5EAFF', stroke: '#4A147B' },
    { fill: '#EBEBEB', stroke: '#444444' },
    { fill: '#F4F9FF', stroke: '#013978' }
  ]

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7fc' }}>
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                Transaction History
              </h1>
              <p className="text-xs lg:text-sm text-gray-600">View your complete transaction record</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6"
        >
          {/* Current Balance */}
          <div className="rounded-2xl p-4 lg:p-5 border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <WalletIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
            </div>
            <div className="text-xs lg:text-sm text-gray-600 mb-1 font-medium">Current Balance</div>
            <div className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
              ₹{(walletBalance?.totalBalance?.current || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Total Credits */}
          <div className="rounded-2xl p-4 lg:p-5 border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ArrowUpIcon className="w-5 h-5" style={{ color: '#16a34a' }} />
              </div>
            </div>
            <div className="text-xs lg:text-sm text-gray-600 mb-1 font-medium">Total Credits</div>
            <div className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
              ₹{totals.credits.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Total Debits */}
          <div className="rounded-2xl p-4 lg:p-5 border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ArrowDownIcon className="w-5 h-5" style={{ color: '#ef4444' }} />
              </div>
            </div>
            <div className="text-xs lg:text-sm text-gray-600 mb-1 font-medium">Total Debits</div>
            <div className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
              ₹{totals.debits.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Net Change */}
          <div className="rounded-2xl p-4 lg:p-5 border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <BanknotesIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
            </div>
            <div className="text-xs lg:text-sm text-gray-600 mb-1 font-medium">Net Change</div>
            <div className="text-xl lg:text-2xl font-bold" style={{ color: totals.net >= 0 ? '#16a34a' : '#ef4444' }}>
              {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
            </div>
          </div>
        </motion.div>

        {/* Analytics Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg lg:text-xl font-bold mb-4 px-1" style={{ color: '#0E51A2' }}>
            Analytics Overview
          </h2>

          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-3 min-w-max">
              {/* Chart 1: Transaction Volume by Type */}
              <div className="rounded-2xl p-4 border-2 shadow-md w-[280px] flex-shrink-0" style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Transaction Volume</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData.typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', fontSize: '12px', backgroundColor: 'white' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} strokeWidth={2}>
                      {chartData.typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Daily Trend */}
              <div className="rounded-2xl p-4 border-2 shadow-md w-[280px] flex-shrink-0" style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#0E51A2' }}>7-Day Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', fontSize: '12px', backgroundColor: 'white' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="credits" fill="#E8FFF5" stroke="#046D40" strokeWidth={2} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="debits" fill="#FFF2E7" stroke="#CD6D19" strokeWidth={2} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 3: Category Distribution */}
              <div className="rounded-2xl p-4 border-2 shadow-md w-[280px] flex-shrink-0" style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Category Split</h3>
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
                      strokeWidth={2}
                    >
                      {chartData.categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length].fill}
                          stroke={COLORS[index % COLORS.length].stroke}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', fontSize: '12px', backgroundColor: 'white' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 4: Balance Trend */}
              <div className="rounded-2xl p-4 border-2 shadow-md w-[280px] flex-shrink-0" style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                borderColor: '#86ACD8'
              }}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Balance Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData.balanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', fontSize: '12px', backgroundColor: 'white' }}
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#4A147B"
                      strokeWidth={2}
                      dot={{ fill: '#F5EAFF', stroke: '#4A147B', strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: '#F5EAFF', stroke: '#4A147B', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-5">
            {/* Chart 1: Transaction Volume by Type */}
            <div className="rounded-2xl p-5 border-2 shadow-md" style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Transaction Volume</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', backgroundColor: 'white' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} strokeWidth={2}>
                    {chartData.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Daily Trend */}
            <div className="rounded-2xl p-5 border-2 shadow-md" style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#0E51A2' }}>7-Day Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', backgroundColor: 'white' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="credits" fill="#E8FFF5" stroke="#046D40" strokeWidth={2} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="debits" fill="#FFF2E7" stroke="#CD6D19" strokeWidth={2} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Category Distribution */}
            <div className="rounded-2xl p-5 border-2 shadow-md" style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Category Split</h3>
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
                    strokeWidth={2}
                  >
                    {chartData.categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length].fill}
                        stroke={COLORS[index % COLORS.length].stroke}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', backgroundColor: 'white' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 4: Balance Trend */}
            <div className="rounded-2xl p-5 border-2 shadow-md" style={{
              background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
              borderColor: '#86ACD8'
            }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Balance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.balanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '2px solid #86ACD8', backgroundColor: 'white' }}
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#4A147B"
                    strokeWidth={3}
                    dot={{ fill: '#F5EAFF', stroke: '#4A147B', strokeWidth: 2, r: 5 }}
                    activeDot={{ fill: '#F5EAFF', stroke: '#4A147B', strokeWidth: 2, r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl p-4 lg:p-5 border-2 shadow-md mb-6"
          style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}
        >
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID, description, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 bg-white/60 backdrop-blur-sm rounded-xl focus:bg-white focus:outline-none text-sm font-medium transition-all shadow-sm"
                style={{ borderColor: '#86ACD8', color: '#303030' }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/60 backdrop-blur-sm border-2 rounded-xl hover:bg-white transition-all text-sm font-semibold shadow-sm"
              style={{ borderColor: '#86ACD8', color: '#0E51A2' }}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="pt-4 border-t-2" style={{ borderColor: '#86ACD8' }}>
                <label className="block text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#0E51A2' }}>Transaction Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['ALL', 'CREDIT', 'DEBIT', 'REFUND'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                        typeFilter === type
                          ? 'text-white scale-105'
                          : 'bg-white/60 backdrop-blur-sm hover:bg-white border-2'
                      }`}
                      style={typeFilter === type ? { backgroundColor: '#0F5FDC' } : { borderColor: '#86ACD8', color: '#0E51A2' }}
                    >
                      {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl p-12 text-center border-2 shadow-md" style={{
              background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
              borderColor: '#86ACD8'
            }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <DocumentArrowDownIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0E51A2' }}>No transactions found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your search or filters to find transactions</p>
            </div>
          ) : (
            filteredTransactions.map((txn, index) => (
              <motion.div
                key={txn._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + (index * 0.05) }}
                className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                style={{
                  background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                  borderColor: '#86ACD8'
                }}
              >
                {/* Main Content */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Transaction Title */}
                    <h3 className="text-base lg:text-lg font-bold mb-1 truncate" style={{ color: '#0E51A2' }}>
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
                    <p className="text-xs text-gray-600 font-mono bg-white/60 backdrop-blur-sm inline-block px-3 py-1.5 rounded-lg shadow-sm">
                      {txn.transactionId}
                    </p>
                  </div>

                  {/* Amount Badge */}
                  <div
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-base lg:text-lg shadow-sm ${
                      txn.type === 'CREDIT'
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : txn.type === 'REFUND'
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        : 'bg-red-50 text-red-700 border-2 border-red-200'
                    }`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {txn.type === 'CREDIT' ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span>
                      {txn.type === 'CREDIT' || txn.type === 'REFUND' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 pt-4 border-t-2" style={{ borderColor: '#86ACD8' }}>
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm bg-white/60 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <CalendarIcon className="w-4 h-4" style={{ color: '#0F5FDC' }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date</p>
                      <p className="text-sm font-bold" style={{ color: '#303030' }}>{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm bg-white/60 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <ClockIcon className="w-4 h-4" style={{ color: '#0F5FDC' }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time</p>
                      <p className="text-sm font-bold" style={{ color: '#303030' }}>{formatTime(txn.createdAt)}</p>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {txn.categoryCode && (
                    <div className="ml-auto">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
                        <TagIcon className="w-4 h-4" style={{ color: '#0F5FDC' }} />
                        <p className="text-xs font-bold" style={{ color: '#0E51A2' }}>{getCategoryName(txn.categoryCode)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balance After Transaction */}
                {txn.newBalance && (
                  <div className="mt-4 pt-4 border-t-2" style={{ borderColor: '#86ACD8' }}>
                    <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm">
                      <span className="text-sm font-semibold text-gray-700">Balance After Transaction</span>
                      <span className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>₹{txn.newBalance.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Results Count */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 font-medium">
            Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </div>
        )}
      </div>

      {/* Scrollbar Hide Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
