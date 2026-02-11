'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BeakerIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface VaccinationStats {
  services: number
  vendors: number
  totalPricing: number
  activeSlots: number
}

export default function VaccinationDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<VaccinationStats>({
    services: 0,
    vendors: 0,
    totalPricing: 0,
    activeSlots: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch services
      const servicesRes = await apiFetch('/api/admin/vaccination/services')

      // Fetch vendors
      const vendorsRes = await apiFetch('/api/admin/vaccination/vendors')

      if (servicesRes.ok && vendorsRes.ok) {
        const servicesData = await servicesRes.json()
        const vendorsData = await vendorsRes.json()

        setStats({
          services: servicesData.data?.length || 0,
          vendors: vendorsData.data?.length || 0,
          totalPricing: 0,
          activeSlots: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching vaccination stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      name: 'Vaccination Services',
      description: 'Manage vaccination services and vaccines',
      icon: BeakerIcon,
      path: '/vaccination/services',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      stats: `${stats.services} services`,
    },
    {
      name: 'Master Vaccines',
      description: 'Manage master vaccine catalog and parameters',
      icon: ClipboardDocumentListIcon,
      path: '/vaccination/master-tests',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      stats: 'Vaccine catalog',
    },
    {
      name: 'Vaccination Vendors',
      description: 'Manage vaccination centers, pricing, and slots',
      icon: BuildingStorefrontIcon,
      path: '/vaccination/vendors',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      stats: `${stats.vendors} vendors`,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Vaccination Services</p>
              <p className="stat-value">{stats.services}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BeakerIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Available vaccine services</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Vaccination Vendors</p>
              <p className="stat-value">{stats.vendors}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BuildingStorefrontIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Partner vaccination centers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Service Pricing</p>
              <p className="stat-value">{stats.totalPricing}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Configured pricing entries</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active Slots</p>
              <p className="stat-value">{stats.activeSlots}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Available booking slots</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccination Management</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.name}
                onClick={() => router.push(action.path)}
                className={`${action.color} card-hover text-left transition-all duration-200 border p-6 rounded-xl`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{action.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                    <p className="text-xs font-medium text-gray-700">{action.stats}</p>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vaccination Overview</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong className="text-gray-900">Vaccination Services:</strong> Manage the catalog of available
            vaccination services including vaccines, doses, and schedules.
          </p>
          <p>
            <strong className="text-gray-900">Vaccination Vendors:</strong> Configure partner vaccination centers with
            service areas (pincodes), pricing for each vaccine, and available
            time slots for appointments. Note: Vaccination is center visit only - no home collection available.
          </p>
          <p>
            <strong className="text-gray-900">Workflow:</strong> Members select vaccines → Book appointments at
            vaccination centers → Receive vaccinations at the center.
          </p>
        </div>
      </div>
    </div>
  )
}
