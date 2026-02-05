'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  UserIcon,
  WalletIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import TopupWalletModal from '@/components/operations/TopupWalletModal'
import { apiFetch } from '@/lib/api'

interface MemberDetails {
  user: any
  wallet: any
  rawWallet: any
  assignments: any[]
  transactions: any[]
  dependents: any[]
  isPrimaryMember: boolean
  topUpAllowed: boolean
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [details, setDetails] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTopupModal, setShowTopupModal] = useState(false)

  const fetchMemberDetails = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`/api/ops/members/${memberId}`)
      if (response.ok) {
        const data = await response.json()
        setDetails(data)
      }
    } catch (error) {
      console.error('Error fetching member details:', error)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    fetchMemberDetails()
  }, [memberId, fetchMemberDetails])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Member Not Found</h3>
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:text-green-700"
        >
          Go Back
        </button>
      </div>
    )
  }

  const { user, wallet, rawWallet, assignments, transactions, dependents, isPrimaryMember, topUpAllowed } = details

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name?.fullName || (user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : 'N/A')}
            </h1>
            <p className="text-gray-500 mt-1">
              Member ID: {user.memberId} • UHID: {user.uhid}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMemberDetails}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          {rawWallet && topUpAllowed && (
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <BanknotesIcon className="h-5 w-5" />
              <span>Top-up Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Info for Dependents */}
      {!isPrimaryMember && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Dependent Member</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a dependent member with an individual wallet. Top-ups will be credited to this member&apos;s wallet only.
                {user.primaryMemberId && ` Primary Member ID: ${user.primaryMemberId}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <UserIcon className="h-6 w-6 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Member Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="text-sm font-medium text-gray-900">
              {user.name?.fullName || (user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : 'N/A')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-900">{user.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Relationship</p>
            <p className="text-sm font-medium text-gray-900">{user.relationship}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900">{user.status}</p>
          </div>
          {user.dob && (
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(user.dob)}</p>
            </div>
          )}
          {user.gender && (
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="text-sm font-medium text-gray-900">{user.gender}</p>
            </div>
          )}
          {user.corporateName && (
            <div>
              <p className="text-xs text-gray-500">Corporate</p>
              <p className="text-sm font-medium text-gray-900">{user.corporateName}</p>
            </div>
          )}
          {user.employeeId && (
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="text-sm font-medium text-gray-900">{user.employeeId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Summary */}
      {wallet && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <WalletIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Wallet Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium">Total Allocated</p>
              <p className="text-2xl font-bold text-blue-900">₹{wallet.totalBalance.allocated?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium">Current Balance</p>
              <p className="text-2xl font-bold text-green-900">₹{wallet.totalBalance.current?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-orange-600 font-medium">Total Consumed</p>
              <p className="text-2xl font-bold text-orange-900">₹{wallet.totalBalance.consumed?.toLocaleString() || 0}</p>
            </div>
          </div>

          {wallet.categories && wallet.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Category-wise Balance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {wallet.categories.map((category: any) => (
                  <div key={category._id || category.name} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{category.name}</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <p className="text-lg font-bold text-gray-900">₹{category.available?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">/ ₹{category.total?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet Transactions */}
      {transactions && transactions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Wallet Transactions</h2>
            <p className="text-sm text-gray-500 mt-1">Last 50 transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((txn: any) => (
                  <tr key={txn._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{txn.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          txn.type === 'CREDIT' || txn.type === 'ADJUSTMENT'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-sm font-bold ${
                          txn.type === 'CREDIT' || txn.type === 'ADJUSTMENT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {txn.type === 'CREDIT' || txn.type === 'ADJUSTMENT' ? '+' : '-'}₹{txn.amount?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{txn.serviceType || 'N/A'}</div>
                      {txn.serviceProvider && (
                        <div className="text-xs text-gray-500">{txn.serviceProvider}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(txn.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">{txn.notes || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dependents */}
      {dependents && dependents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dependents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dependents.map((dep: any) => (
              <div key={dep._id} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {dep.name.fullName || `${dep.name.firstName} ${dep.name.lastName}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dep.memberId} • {dep.relationship}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top-up Modal */}
      {showTopupModal && rawWallet && (
        <TopupWalletModal
          memberId={memberId}
          memberName={user.name?.fullName || (user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : 'N/A')}
          wallet={rawWallet}
          onClose={() => setShowTopupModal(false)}
          onSuccess={() => {
            setShowTopupModal(false)
            fetchMemberDetails()
          }}
        />
      )}
    </div>
  )
}
