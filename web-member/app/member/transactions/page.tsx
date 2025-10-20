'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

type TransactionType = 'debit' | 'credit' | 'refund'
type TransactionCategory = 'consultation' | 'pharmacy' | 'diagnostic' | 'preventive' | 'vision' | 'wellness' | 'reimbursement' | 'wallet_credit'
type SortField = 'date' | 'amount' | 'type' | 'category'
type SortOrder = 'asc' | 'desc'

interface Transaction {
  id: string
  transactionId: string
  date: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  provider?: string
  status: 'completed' | 'pending' | 'failed'
  balance: number
  receiptUrl?: string
  claimId?: string
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'all'>('all')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [dataView, setDataView] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')

  const itemsPerPage = 15

  // Mock data - in real app, this would come from API
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      transactionId: 'TXN-2024-001',
      date: '2024-01-15T10:30:00Z',
      description: 'Dr. Sharma - Cardiology Consultation',
      amount: -2500,
      type: 'debit',
      category: 'consultation',
      provider: 'Dr. Sharma Clinic',
      status: 'completed',
      balance: 47500,
      receiptUrl: '/receipts/txn-001.pdf',
      claimId: 'CLM-2024-001'
    },
    {
      id: '2',
      transactionId: 'TXN-2024-002',
      date: '2024-01-14T15:45:00Z',
      description: 'Wallet Credit - Employer Contribution',
      amount: 10000,
      type: 'credit',
      category: 'wallet_credit',
      status: 'completed',
      balance: 50000
    },
    {
      id: '3',
      transactionId: 'TXN-2024-003',
      date: '2024-01-12T09:20:00Z',
      description: 'Apollo Pharmacy - Prescribed Medications',
      amount: -850,
      type: 'debit',
      category: 'pharmacy',
      provider: 'Apollo Pharmacy',
      status: 'completed',
      balance: 40000,
      receiptUrl: '/receipts/txn-003.pdf'
    },
    {
      id: '4',
      transactionId: 'TXN-2024-004',
      date: '2024-01-11T14:15:00Z',
      description: 'Claim Reimbursement - Blood Test',
      amount: 1200,
      type: 'credit',
      category: 'reimbursement',
      provider: 'PathLab Diagnostics',
      status: 'completed',
      balance: 40850,
      claimId: 'CLM-2024-003'
    },
    {
      id: '5',
      transactionId: 'TXN-2024-005',
      date: '2024-01-10T11:30:00Z',
      description: 'PathLab Diagnostics - Blood Panel',
      amount: -3200,
      type: 'debit',
      category: 'diagnostic',
      provider: 'PathLab Diagnostics',
      status: 'completed',
      balance: 39650,
      receiptUrl: '/receipts/txn-005.pdf'
    },
    {
      id: '6',
      transactionId: 'TXN-2024-006',
      date: '2024-01-08T16:00:00Z',
      description: 'Dr. Patel - Dermatology Consultation',
      amount: -1800,
      type: 'debit',
      category: 'consultation',
      provider: 'Dr. Patel Clinic',
      status: 'completed',
      balance: 42850,
      receiptUrl: '/receipts/txn-006.pdf'
    },
    {
      id: '7',
      transactionId: 'TXN-2024-007',
      date: '2024-01-05T08:45:00Z',
      description: 'Annual Health Checkup',
      amount: -5000,
      type: 'debit',
      category: 'preventive',
      provider: 'City Health Center',
      status: 'completed',
      balance: 44650,
      receiptUrl: '/receipts/txn-007.pdf'
    },
    {
      id: '8',
      transactionId: 'TXN-2024-008',
      date: '2024-01-03T12:20:00Z',
      description: 'MedPlus - OTC Medications',
      amount: -1200,
      type: 'debit',
      category: 'pharmacy',
      provider: 'MedPlus',
      status: 'completed',
      balance: 49650,
      receiptUrl: '/receipts/txn-008.pdf'
    },
    {
      id: '9',
      transactionId: 'TXN-2024-009',
      date: '2024-01-02T13:10:00Z',
      description: 'Refund - Cancelled Appointment',
      amount: 1500,
      type: 'refund',
      category: 'consultation',
      provider: 'Dr. Kumar Clinic',
      status: 'completed',
      balance: 50850
    },
    {
      id: '10',
      transactionId: 'TXN-2024-010',
      date: '2024-01-01T00:00:00Z',
      description: 'Monthly Wallet Credit',
      amount: 25000,
      type: 'credit',
      category: 'wallet_credit',
      status: 'completed',
      balance: 49350
    }
  ]

  // Filter helper functions
  const matchesSearchQuery = (transaction: Transaction): boolean => {
    const query = searchQuery.toLowerCase()
    return transaction.description.toLowerCase().includes(query) ||
           transaction.transactionId.toLowerCase().includes(query) ||
           (transaction.provider?.toLowerCase().includes(query) || false)
  }

  const matchesFilters = (transaction: Transaction): boolean => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    return matchesType && matchesCategory
  }

  const getDaysBackFromRange = (): number => {
    switch (dateRange) {
      case 'last_7_days': return 7
      case 'last_30_days': return 30
      case 'last_90_days': return 90
      case 'this_year': return 365
      default: return 0
    }
  }

  const matchesDateRange = (transaction: Transaction): boolean => {
    if (dateRange === 'all') return true

    const transactionDate = new Date(transaction.date)

    if (dateRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return transactionDate >= start && transactionDate <= end
    }

    const daysBack = getDaysBackFromRange()
    if (daysBack > 0) {
      const today = new Date()
      const cutoffDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000)
      return transactionDate >= cutoffDate
    }

    return true
  }

  const getSortValue = (transaction: Transaction, field: SortField): any => {
    switch (field) {
      case 'date':
        return new Date(transaction.date)
      case 'amount':
        return Math.abs(transaction.amount)
      case 'type':
        return transaction.type
      case 'category':
        return transaction.category
      default:
        return null
    }
  }

  const compareSortValues = (aValue: any, bValue: any): number => {
    if (aValue === null || bValue === null) return 0

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  }

  // Filter and sort transactions
  const filteredAndSortedTransactions = mockTransactions
    .filter(transaction =>
      matchesSearchQuery(transaction) &&
      matchesFilters(transaction) &&
      matchesDateRange(transaction)
    )
    .sort((a, b) => {
      const aValue = getSortValue(a, sortField)
      const bValue = getSortValue(b, sortField)
      return compareSortValues(aValue, bValue)
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Helper for table column rendering
  const isColumnSortable = (columnKey: string): boolean => {
    return !['transaction', 'balance', 'actions'].includes(columnKey)
  }

  const handleColumnClick = (column: { key: string; sortable: boolean }) => {
    if (column.sortable && isColumnSortable(column.key)) {
      handleSort(column.key as SortField)
    }
  }

  const shouldShowSortIcon = (column: { key: string; sortable: boolean }): boolean => {
    return column.sortable && isColumnSortable(column.key)
  }

  // Helper for table cell padding based on data view
  const getCellPaddingClass = (): string => {
    switch (dataView) {
      case 'compact': return 'py-2'
      case 'spacious': return 'py-5'
      default: return 'py-3'
    }
  }

  const getCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case 'consultation':
        return <BuildingOffice2Icon className="h-4 w-4" />
      case 'pharmacy':
        return <ShoppingBagIcon className="h-4 w-4" />
      case 'diagnostic':
        return <BeakerIcon className="h-4 w-4" />
      case 'preventive':
        return <HeartIcon className="h-4 w-4" />
      case 'vision':
        return <EyeIcon className="h-4 w-4" />
      case 'wellness':
        return <HeartIcon className="h-4 w-4" />
      case 'reimbursement':
        return <ReceiptRefundIcon className="h-4 w-4" />
      case 'wallet_credit':
        return <CreditCardIcon className="h-4 w-4" />
      default:
        return <BanknotesIcon className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: TransactionCategory) => {
    switch (category) {
      case 'consultation':
        return 'bg-blue-100 text-blue-700'
      case 'pharmacy':
        return 'bg-green-100 text-green-700'
      case 'diagnostic':
        return 'bg-purple-100 text-purple-700'
      case 'preventive':
        return 'bg-amber-100 text-amber-700'
      case 'vision':
        return 'bg-pink-100 text-pink-700'
      case 'wellness':
        return 'bg-indigo-100 text-indigo-700'
      case 'reimbursement':
        return 'bg-emerald-100 text-emerald-700'
      case 'wallet_credit':
        return 'bg-brand-100 text-brand-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const exportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting transaction data...')
  }

  const downloadStatement = () => {
    // In a real app, this would generate and download a PDF statement
    console.log('Downloading statement...')
  }

  // Calculate totals
  const totalDebits = filteredAndSortedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalCredits = filteredAndSortedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900">Transaction History</h1>
            <p className="text-ink-500 mt-1">View your complete transaction record and download statements</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={downloadStatement}
              className="btn-secondary"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download Statement
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <ArrowUpIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-700">₹{totalCredits.toLocaleString()}</p>
                <p className="text-xs text-green-600">Total Credits</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <ArrowDownIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-red-700">₹{totalDebits.toLocaleString()}</p>
                <p className="text-xs text-red-600">Total Debits</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-700">₹{(totalCredits - totalDebits).toLocaleString()}</p>
                <p className="text-xs text-blue-600">Net Change</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200">
          <div className="p-4">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-brand-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-brand-700">₹50,000</p>
                <p className="text-xs text-brand-600">Current Balance</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="mb-6" noPadding>
        <div className="p-4 border-b border-surface-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-border rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                />
              </div>

              {/* Quick Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 bg-surface border border-surface-border rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
              >
                <option value="all">All Time</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center px-3 py-2 border border-surface-border rounded-lg text-sm hover:bg-surface-alt"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
              {/* Data Density - Desktop Only */}
              <div className="hidden xl:flex items-center gap-2">
                <span className="text-xs text-ink-500">Density:</span>
                <select
                  value={dataView}
                  onChange={(e) => setDataView(e.target.value as 'compact' | 'comfortable' | 'spacious')}
                  className="px-2 py-1 bg-surface border border-surface-border rounded text-xs"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="hidden sm:flex items-center px-3 py-2 border border-surface-border rounded-lg text-sm hover:bg-surface-alt"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-surface-alt border-b border-surface-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Transaction Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="debit">Debits</option>
                  <option value="credit">Credits</option>
                  <option value="refund">Refunds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | 'all')}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="consultation">Consultation</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="preventive">Preventive</option>
                  <option value="reimbursement">Reimbursement</option>
                  <option value="wallet_credit">Wallet Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Amount Range</label>
                <select className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm">
                  <option>All Amounts</option>
                  <option>Under ₹1,000</option>
                  <option>₹1,000 - ₹5,000</option>
                  <option>₹5,000 - ₹10,000</option>
                  <option>Above ₹10,000</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Provider</label>
                <input
                  type="text"
                  placeholder="Provider name..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                />
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Transactions Table */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-alt border-b border-surface-border">
              <tr>
                {[
                  { key: 'date', label: 'Date & Time', sortable: true },
                  { key: 'transaction', label: 'Transaction', sortable: false },
                  { key: 'category', label: 'Category', sortable: true },
                  { key: 'amount', label: 'Amount', sortable: true },
                  { key: 'balance', label: 'Balance', sortable: false },
                  { key: 'actions', label: 'Actions', sortable: false }
                ].map((column) => {
                  const cellPadding = getCellPaddingClass()
                  return (
                    <th
                      key={column.key}
                      className={`px-6 ${cellPadding} text-left text-xs font-semibold text-ink-600 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-surface' : ''
                      }`}
                      onClick={() => handleColumnClick(column)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {shouldShowSortIcon(column) && (
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {paginatedTransactions.map((transaction) => {
                const cellPadding = getCellPaddingClass()
                return (
                  <tr key={transaction.id} className="hover:bg-surface-alt transition-colors">
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <div>
                        <p className="font-medium text-ink-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-ink-500">
                          {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <div>
                        <p className="font-medium text-ink-900">{transaction.description}</p>
                        <p className="text-xs text-ink-500">{transaction.transactionId}</p>
                        {transaction.provider && (
                          <p className="text-xs text-ink-500">{transaction.provider}</p>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                        {getCategoryIcon(transaction.category)}
                        <span className="ml-1 capitalize">{transaction.category.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <div className="flex items-center">
                        {transaction.amount > 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`font-semibold ${transaction.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {transaction.amount > 0 ? '+' : ''}₹{transaction.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <p className="font-medium text-ink-900">₹{transaction.balance.toLocaleString()}</p>
                    </td>
                    <td className={`px-6 ${cellPadding} text-sm`}>
                      <div className="flex items-center gap-2">
                        {transaction.receiptUrl && (
                          <button
                            onClick={() => window.open(transaction.receiptUrl, '_blank')}
                            className="text-brand-600 hover:text-brand-700 font-medium"
                            title="View Receipt"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                        )}
                        {transaction.claimId && (
                          <Link
                            href={`/member/claims/${transaction.claimId}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            title="View Claim"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-ink-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2)
              return page <= totalPages ? (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded text-sm ${
                    currentPage === page
                      ? 'bg-brand-600 text-white'
                      : 'border border-surface-border hover:bg-surface-alt'
                  }`}
                >
                  {page}
                </button>
              ) : null
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-alt"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedTransactions.length === 0 && (
        <Card className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-ink-400 mb-4" />
          <h3 className="text-lg font-medium text-ink-900 mb-2">No transactions found</h3>
          <p className="text-ink-500 mb-6">Try adjusting your search or filters to find transactions.</p>
        </Card>
      )}
    </div>
  )
}