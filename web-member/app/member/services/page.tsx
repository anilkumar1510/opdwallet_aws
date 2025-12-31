'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  HomeIcon,
  WalletIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  BellIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CreditCardIcon,
  HeartIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

interface Service {
  name: string
  description: string
  href: string
  icon: any
  category: string
  badge?: string
}

const services: Service[] = [
  // Core Services
  {
    name: 'Dashboard',
    description: 'View your benefits overview and quick stats',
    href: '/member',
    icon: HomeIcon,
    category: 'Core'
  },
  {
    name: 'OPD Wallet',
    description: 'Check balance and transaction history',
    href: '/member/wallet',
    icon: WalletIcon,
    category: 'Core'
  },
  {
    name: 'Benefits',
    description: 'Explore all your healthcare benefits',
    href: '/member/benefits',
    icon: SparklesIcon,
    category: 'Core'
  },
  {
    name: 'Profile',
    description: 'View and edit your profile information',
    href: '/member/profile',
    icon: UserCircleIcon,
    category: 'Core'
  },

  // Claims & Reimbursements
  {
    name: 'Reimbursements',
    description: 'File and track reimbursement claims',
    href: '/member/reimbursements',
    icon: CurrencyDollarIcon,
    category: 'Claims'
  },
  {
    name: 'Claims History',
    description: 'View all your past claims',
    href: '/member/claims',
    icon: DocumentTextIcon,
    category: 'Claims'
  },
  {
    name: 'Submit New Claim',
    description: 'File a new reimbursement claim',
    href: '/member/claims/new',
    icon: CreditCardIcon,
    category: 'Claims',
    badge: 'Quick'
  },

  // Healthcare Services
  {
    name: 'In-Clinic Appointments',
    description: 'Schedule doctor appointments at clinics',
    href: '/member/appointments',
    icon: CalendarIcon,
    category: 'Healthcare'
  },
  {
    name: 'Online Consultations',
    description: 'Video consultation with doctors',
    href: '/member/online-consult',
    icon: VideoCameraIcon,
    category: 'Healthcare'
  },
  {
    name: 'Lab Tests',
    description: 'Book lab tests and view results',
    href: '/member/lab-tests',
    icon: BeakerIcon,
    category: 'Healthcare'
  },
  {
    name: 'Health Records',
    description: 'Access your medical records and prescriptions',
    href: '/member/health-records',
    icon: DocumentTextIcon,
    category: 'Healthcare'
  },
  {
    name: 'Bookings',
    description: 'View all your bookings and appointments',
    href: '/member/bookings',
    icon: ClipboardDocumentListIcon,
    category: 'Healthcare'
  },

  // Family & Account
  {
    name: 'Family Hub',
    description: 'Manage family members and dependents',
    href: '/member/family',
    icon: UsersIcon,
    category: 'Family'
  },
  {
    name: 'Add Family Member',
    description: 'Add a new dependent to your account',
    href: '/member/family/add',
    icon: UsersIcon,
    category: 'Family',
    badge: 'New'
  },

  // Transactions & Reports
  {
    name: 'Transactions',
    description: 'View all wallet transactions',
    href: '/member/transactions',
    icon: ChartBarIcon,
    category: 'Finance'
  },
  {
    name: 'Orders',
    description: 'Track all your orders and payments',
    href: '/member/orders',
    icon: ShoppingBagIcon,
    category: 'Finance'
  },

  // Support & Settings
  {
    name: 'Notifications',
    description: 'Manage your notification preferences',
    href: '/member/notifications',
    icon: BellIcon,
    category: 'Support'
  },
  {
    name: 'Help & Support',
    description: 'Get help and contact support',
    href: '/member/help',
    icon: QuestionMarkCircleIcon,
    category: 'Support'
  },
  {
    name: 'Settings',
    description: 'Manage your account settings',
    href: '/member/settings',
    icon: Cog6ToothIcon,
    category: 'Support'
  }
]

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))]

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">All Services</h1>
          <p className="text-sm text-gray-600">Browse and access all available services</p>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Category Filter */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-4 sm:p-6 pb-20">
        {Object.keys(groupedServices).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found matching your search.</p>
          </div>
        ) : (
          Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
              <div className="space-y-3">
                {categoryServices.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-brand-50 rounded-lg">
                          <service.icon className="h-6 w-6 text-brand-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            {service.badge && (
                              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        </div>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}