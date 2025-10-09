'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface PaymentHistoryItem {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    memberId: string
    email: string
  }
  memberName: string
  category: string
  providerName: string
  billAmount: number
  approvedAmount: number
  paymentMode: string
  paymentReferenceNumber: string
  paymentDate: string
  paidByName: string
  paymentNotes?: string
  submittedAt: string
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchPaymentHistory()
  }, [paymentModeFilter, dateFrom, dateTo])

  const fetchPaymentHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (paymentModeFilter) params.append('paymentMode', paymentModeFilter)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/finance/payments/history?${params.toString()}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPayments(data.claims || [])
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const filteredPayments = payments.filter((payment) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        payment.claimId.toLowerCase().includes(query) ||
        payment.memberName.toLowerCase().includes(query) ||
        payment.userId?.memberId?.toLowerCase().includes(query) ||
        payment.paymentReferenceNumber.toLowerCase().includes(query)
      )
    }
    return true
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPaid = filteredPayments.reduce((sum, p) => sum + (p.approvedAmount || 0), 0)

  const paymentModes = ['BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'CASH']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/finance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-500 mt-1">
              {filteredPayments.length} completed payments • Total: ₹{totalPaid.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPaymentHistory}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            onClick={() => {
              // TODO: Implement export functionality
              alert('Export functionality to be implemented')
            }}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Claim ID, member, payment reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Modes</option>
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(paymentModeFilter || dateFrom || dateTo) && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {paymentModeFilter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Mode: {paymentModeFilter.replace('_', ' ')}
                <button
                  onClick={() => setPaymentModeFilter('')}
                  className="ml-1 text-blue-900 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                From: {formatDate(dateFrom)}
                <button
                  onClick={() => setDateFrom('')}
                  className="ml-1 text-blue-900 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
            {dateTo && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                To: {formatDate(dateTo)}
                <button
                  onClick={() => setDateTo('')}
                  className="ml-1 text-blue-900 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
            <p className="text-gray-500">
              {searchQuery || paymentModeFilter || dateFrom || dateTo
                ? 'No payments match your filters'
                : 'No payments have been completed yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {payment.claimId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.memberName}</div>
                      <div className="text-xs text-gray-500">
                        {payment.userId?.memberId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {payment.providerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-green-600">
                        ₹{payment.approvedAmount?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {payment.paymentMode?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.paidByName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-500">Claim ID: {selectedPayment.claimId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Claim Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Claim Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Member Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPayment.memberName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Member ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPayment.userId?.memberId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPayment.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPayment.providerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bill Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{selectedPayment.billAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-bold text-green-600">
                      ₹{selectedPayment.approvedAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Payment Mode</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPayment.paymentMode?.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Reference</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {selectedPayment.paymentReferenceNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedPayment.paymentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Processed By</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPayment.paidByName || 'N/A'}
                    </p>
                  </div>
                  {selectedPayment.paymentNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Payment Notes</p>
                      <p className="text-sm text-gray-900">{selectedPayment.paymentNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
