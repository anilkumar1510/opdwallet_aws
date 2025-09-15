'use client'

import { useFamily } from '@/contexts/FamilyContext'
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  category: 'consultation' | 'medicine' | 'diagnostic' | 'refund' | 'recharge'
}

export function MemberWalletCard() {
  const { activeMember } = useFamily()

  // Sample transaction data - would come from API in real app
  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'debit',
      amount: 250,
      description: 'Online Consultation - Dr. Smith',
      date: '2024-01-15',
      category: 'consultation'
    },
    {
      id: '2',
      type: 'debit',
      amount: 180,
      description: 'Medicine Purchase',
      date: '2024-01-14',
      category: 'medicine'
    },
    {
      id: '3',
      type: 'credit',
      amount: 500,
      description: 'Wallet Recharge',
      date: '2024-01-12',
      category: 'recharge'
    }
  ]

  const getTransactionIcon = (category: Transaction['category']) => {
    switch (category) {
      case 'consultation':
        return <CreditCardIcon className="h-4 w-4" />
      case 'medicine':
        return <BanknotesIcon className="h-4 w-4" />
      case 'diagnostic':
        return <CreditCardIcon className="h-4 w-4" />
      case 'refund':
        return <ArrowUpIcon className="h-4 w-4" />
      case 'recharge':
        return <ArrowDownIcon className="h-4 w-4" />
      default:
        return <WalletIcon className="h-4 w-4" />
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with member info */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-white/20 text-white font-semibold flex items-center justify-center text-lg">
              {getInitials(activeMember.name)}
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-lg">{activeMember.name}</h3>
              <p className="text-teal-100 text-sm">{activeMember.relationship} • {activeMember.memberId}</p>
            </div>
          </div>
          <WalletIcon className="h-6 w-6 text-teal-100" />
        </div>

        <div className="text-center">
          <p className="text-teal-100 text-sm">Available Balance</p>
          <p className="text-3xl font-bold">₹{(activeMember.walletBalance || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
            <ArrowDownIcon className="h-5 w-5 text-teal-600 mr-2" />
            <span className="text-teal-700 font-medium">Add Money</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <CreditCardIcon className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-gray-700 font-medium">Pay Bills</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Recent Transactions</h4>
        <div className="space-y-3">
          {recentTransactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {getTransactionIcon(transaction.category)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 px-4 py-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium">
          View All Transactions
        </button>
      </div>
    </div>
  )
}

// Compact version for use in lists or smaller spaces
export function MemberWalletCardCompact() {
  const { activeMember } = useFamily()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white/20 text-white font-semibold flex items-center justify-center text-sm">
            {getInitials(activeMember.name)}
          </div>
          <span className="ml-2 font-medium text-sm">{activeMember.name}</span>
        </div>
        <WalletIcon className="h-5 w-5 text-teal-100" />
      </div>

      <div className="text-center">
        <p className="text-teal-100 text-xs">Wallet Balance</p>
        <p className="text-xl font-bold">₹{(activeMember.walletBalance || 0).toLocaleString()}</p>
      </div>

      <div className="flex space-x-2 mt-3">
        <button className="flex-1 py-2 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors">
          Add Money
        </button>
        <button className="flex-1 py-2 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors">
          Pay
        </button>
      </div>
    </div>
  )
}