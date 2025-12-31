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

  const getCategoryName = (categoryCode: string): string => {
    const category = walletBalance?.categories.find(c => c.categoryCode === categoryCode)
    return category?.name || categoryCode
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Search and Filters */}
        <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 border-2 border-quickLink-border mb-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-white/20 bg-white/10 rounded-lg focus:border-white/40 focus:outline-none text-sm text-white placeholder:text-white/60"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border-2 border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium text-white"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="pt-3 border-t-2 border-white/20">
                <label className="block text-xs font-semibold text-white mb-2">Transaction Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['ALL', 'CREDIT', 'DEBIT', 'REFUND'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        typeFilter === type
                          ? 'bg-white text-brand-600'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-8 text-center border-2 border-quickLink-border">
              <div className="text-white/60 mb-3">
                <DocumentArrowDownIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
              <p className="text-white/75 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredTransactions.map((txn) => (
              <div
                key={txn._id}
                className="bg-quickLink-blue rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-quickLink-border hover:border-blue-400 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">
                        {txn.notes || `${txn.serviceType || 'Transaction'}`}
                      </h3>
                    </div>
                    {txn.serviceProvider && (
                      <p className="text-sm text-white/90 mb-1">{txn.serviceProvider}</p>
                    )}
                    <p className="text-xs text-white/75">{txn.transactionId}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-base ${
                      txn.type === 'CREDIT'
                        ? 'bg-green-100 text-green-700'
                        : txn.type === 'REFUND'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {txn.type === 'CREDIT' ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                    <span>
                      {txn.type === 'CREDIT' || txn.type === 'REFUND' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <div className="flex items-center gap-4 text-xs text-white/90">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(txn.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Time:</span>
                      <span>{formatTime(txn.createdAt)}</span>
                    </div>
                  </div>
                  {txn.categoryCode && (
                    <div className="text-xs font-semibold text-white bg-white/20 px-2 py-1 rounded">
                      {getCategoryName(txn.categoryCode)}
                    </div>
                  )}
                </div>

                {txn.newBalance && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/90">Balance After Transaction</span>
                      <span className="font-bold text-white">₹{txn.newBalance.total.toLocaleString('en-IN')}</span>
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
