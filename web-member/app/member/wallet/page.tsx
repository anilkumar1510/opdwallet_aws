'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HeartIcon,
  EyeIcon,
  BeakerIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function WalletPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const walletCategories = [
    {
      id: 'consultation',
      name: 'Consultations',
      icon: DocumentTextIcon,
      limit: '₹30,000',
      used: '₹12,000',
      percentage: 40,
      color: 'bg-blue-600',
      transactions: 8
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      icon: BeakerIcon,
      limit: '₹20,000',
      used: '₹5,500',
      percentage: 27.5,
      color: 'bg-green-600',
      transactions: 15
    },
    {
      id: 'diagnostic',
      name: 'Diagnostics',
      icon: HeartIcon,
      limit: '₹25,000',
      used: '₹8,000',
      percentage: 32,
      color: 'bg-purple-600',
      transactions: 6
    },
    {
      id: 'preventive',
      name: 'Preventive Care',
      icon: ShieldCheckIcon,
      limit: '₹15,000',
      used: '₹2,000',
      percentage: 13.3,
      color: 'bg-amber-600',
      transactions: 2
    },
    {
      id: 'vision',
      name: 'Vision & Dental',
      icon: EyeIcon,
      limit: '₹10,000',
      used: '₹3,500',
      percentage: 35,
      color: 'bg-pink-600',
      transactions: 3
    },
    {
      id: 'wellness',
      name: 'Wellness',
      icon: SparklesIcon,
      limit: '₹10,000',
      used: '₹1,500',
      percentage: 15,
      color: 'bg-indigo-600',
      transactions: 5
    }
  ]

  const recentTransactions = [
    { id: 1, type: 'consultation', description: 'Dr. Sharma - Consultation', amount: -1500, date: '10 Jan 2024', status: 'completed' },
    { id: 2, type: 'reimbursement', description: 'Claim Approved #12345', amount: 3000, date: '9 Jan 2024', status: 'credited' },
    { id: 3, type: 'pharmacy', description: 'Apollo Pharmacy - Medicines', amount: -750, date: '8 Jan 2024', status: 'completed' },
    { id: 4, type: 'diagnostic', description: 'PathLab - Blood Test', amount: -2000, date: '7 Jan 2024', status: 'completed' },
    { id: 5, type: 'preventive', description: 'Annual Health Checkup', amount: -5000, date: '5 Jan 2024', status: 'completed' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink-900">OPD Wallet</h1>
        <p className="text-sm sm:text-base text-ink-500 mt-1">Manage your healthcare benefits and track expenses</p>
      </div>

      {/* Desktop Layout: Balance & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Balance Card - Spans 2 columns on desktop */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-semibold">Total Balance</span>
                <div className="flex items-center text-green-300">
                  <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">+12% this month</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6">
                <div>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold flex items-center">
                    <CurrencyRupeeIcon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mr-1 sm:mr-2" />
                    <span className="truncate">1,67,500</span>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-100 mt-1 sm:mt-2">of ₹2,00,000 limit</p>
                </div>
                <div className="flex items-center justify-end sm:justify-center">
                  <div className="relative">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full bg-brand-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold">84%</p>
                        <p className="text-xs text-brand-100">Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 pt-4 sm:pt-6 border-t border-brand-500">
                <div className="text-center">
                  <p className="text-brand-100 text-xs sm:text-sm">Used</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold truncate">₹32.5K</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-100 text-xs sm:text-sm">Pending</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold truncate">₹5K</p>
                </div>
                <div className="text-center">
                  <p className="text-brand-100 text-xs sm:text-sm">Savings</p>
                  <p className="text-sm sm:text-lg lg:text-2xl font-semibold truncate">₹8.5K</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="p-4 text-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">15</p>
              <p className="text-sm text-blue-600">Active Claims</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="p-4 text-center">
              <BeakerIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">₹12,000</p>
              <p className="text-sm text-green-600">This Month</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="p-4 text-center">
              <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">3</p>
              <p className="text-sm text-purple-600">Upcoming</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Category Cards - Enhanced desktop layout */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-ink-900">Benefit Categories</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/member/claims/new" className="btn-primary text-sm sm:text-base">
              <DocumentTextIcon className="h-4 w-4 mr-1 sm:mr-2" />
              New Claim
            </Link>
            <Link href="/member/transactions" className="btn-secondary text-sm sm:text-base">
              <span className="hidden sm:inline">View All</span> Transactions
            </Link>
          </div>
        </div>

        {/* Desktop: 2 columns layout with enhanced cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {walletCategories.map((category) => (
            <Card key={category.id} className="group cursor-pointer hover:shadow-soft hover:border-brand-200 transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${category.color} p-3 rounded-xl group-hover:scale-105 transition-transform`}>
                    <category.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-ink-500 bg-surface-alt px-2 py-1 rounded-full">
                      {category.transactions} transactions
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-ink-900 mb-1 group-hover:text-brand-700 transition-colors">{category.name}</h3>
                    <p className="text-xs text-ink-500">Limit: {category.limit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ink-900">{category.used}</p>
                    <p className="text-xs text-ink-500">Used</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-500">Usage Progress</span>
                    <span className="font-medium text-ink-700">{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${category.color} h-3 rounded-full transition-all duration-500 group-hover:opacity-90`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      category.percentage > 80 ? 'bg-red-500' :
                      category.percentage > 50 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-xs text-ink-500">
                      {category.percentage > 80 ? 'High usage' :
                       category.percentage > 50 ? 'Medium usage' :
                       'Low usage'}
                    </span>
                  </div>
                  <Link
                    href={`/member/wallet/${category.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center group-hover:translate-x-1 transition-transform"
                  >
                    View details
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions - Enhanced for desktop */}
      <Card title="Recent Transactions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTransactions.slice(0, 6).map((transaction) => (
            <div key={transaction.id} className="p-4 bg-surface-alt rounded-xl hover:bg-surface transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900 group-hover:text-brand-700 transition-colors">{transaction.description}</p>
                  <p className="text-xs text-ink-500 mt-1">{transaction.date}</p>
                </div>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  transaction.status === 'completed' ? 'bg-green-500' :
                  transaction.status === 'credited' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  transaction.status === 'credited' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {transaction.status}
                </span>
                <p className={`text-lg font-semibold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-surface-border">
          <div className="flex items-center gap-4">
            <Link href="/member/transactions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all transactions →
            </Link>
            <Link href="/member/claims" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View claims →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-ink-600 hover:text-ink-900 flex items-center">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </Card>

      {/* Mobile-first FAB for adding expense */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <Link
          href="/member/claims/new"
          className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors"
        >
          <DocumentTextIcon className="h-6 w-6" />
        </Link>
      </div>
    </div>
  )
}