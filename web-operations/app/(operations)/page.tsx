'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function OperationsDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
    pendingPrescriptions: 0,
    labOrdersPending: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Use the new combined dashboard stats endpoint
      const response = await apiFetch('/api/ops/members/dashboard/stats')

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Doctors</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Doctors</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeDoctors}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Confirmations</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingAppointments}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today&apos;s Appointments</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.todayAppointments}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Prescriptions</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingPrescriptions}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Lab Orders Pending</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.labOrdersPending}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => router.push('/doctors')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Doctors</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add, edit, and manage doctor profiles, clinics, and available time slots
          </p>
          <span className="text-green-600 font-medium">Go to Doctors →</span>
        </button>

        <button
          onClick={() => router.push('/appointments')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Appointments</h3>
          <p className="text-sm text-gray-600 mb-4">
            View, confirm, and manage patient appointments
          </p>
          <span className="text-green-600 font-medium">Go to Appointments →</span>
        </button>

        <button
          onClick={() => router.push('/lab/prescriptions')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lab Prescriptions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Digitize uploaded prescriptions and create lab test carts
          </p>
          <span className="text-green-600 font-medium">Go to Prescriptions →</span>
        </button>

        <button
          onClick={() => router.push('/lab/orders')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lab Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage lab orders, confirm, collect samples, and upload reports
          </p>
          <span className="text-green-600 font-medium">Go to Orders →</span>
        </button>
      </div>
    </div>
  )
}