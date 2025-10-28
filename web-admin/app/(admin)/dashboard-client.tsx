'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function AdminDashboardClient() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, policies: 0, assignments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, policiesRes] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/policies'),
      ])

      if (usersRes.ok && policiesRes.ok) {
        const usersData = await usersRes.json()
        const policiesData = await policiesRes.json()

        // Count active users as a proxy for assignments
        const activeUsers = usersData.data?.filter((u: any) => u.status === 'ACTIVE').length || 0
        const activePolicies = policiesData.data?.filter((p: any) => p.status === 'ACTIVE').length || 0

        setStats({
          users: usersData.total || 0,
          policies: policiesData.total || 0,
          assignments: activeUsers,
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      name: 'Manage Users',
      description: 'View, create, and manage user accounts',
      icon: '👥',
      path: '/users',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      name: 'Manage Policies',
      description: 'Create and manage insurance policies',
      icon: '📋',
      path: '/policies',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      name: 'Lab Diagnostics',
      description: 'Manage lab services, vendors, and pricing',
      icon: '🧪',
      path: '/lab',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200'
    },
    {
      name: 'Service Types',
      description: 'Define and manage service types and coverage',
      icon: '🏥',
      path: '/services',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{stats.users.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Active members in the system</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Policies</p>
              <p className="stat-value">{stats.policies.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Insurance policies available</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active Members</p>
              <p className="stat-value">{stats.assignments.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="stat-change-positive">
            <span>Currently active users</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={() => router.push(action.path)}
              className={`${action.color} card-hover text-left transition-all duration-200 border`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{action.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{action.name}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
