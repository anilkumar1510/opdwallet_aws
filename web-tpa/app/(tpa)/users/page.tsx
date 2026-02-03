'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'
import { useRoleGuard } from '@/lib/hooks/useRoleGuard'

interface TPAUser {
  _id: string
  name: {
    fullName?: string
    firstName?: string
    lastName?: string
  }
  email: string
  role: string
  currentWorkload: number
  totalReviewed: number
  approvalRate: number
  isActive: boolean
}

export default function TPAUsersPage() {
  useRoleGuard(['TPA_ADMIN', 'SUPER_ADMIN'])

  const [users, setUsers] = useState<TPAUser[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/tpa/users')

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      } else {
        console.error('Failed to fetch TPA users')
      }
    } catch (error) {
      console.error('Error fetching TPA users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWorkloadColor = (workload: number) => {
    if (workload === 0) return 'text-gray-500'
    if (workload < 5) return 'text-green-600'
    if (workload < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getApprovalRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUserDisplayName = (user: TPAUser) => {
    return user.name.fullName || `${user.name.firstName} ${user.name.lastName}` || 'Unknown User'
  }

  const getRoleBadge = (role: string) => {
    if (role === 'TPA_ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <UserGroupIcon className="h-3 w-3 mr-1" />
        User
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TPA Users</h1>
          <p className="text-gray-500 mt-1">
            {total} TPA user{total !== 1 ? 's' : ''} managing claims
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* User creation is handled by the admin portal */}
          <button
            onClick={fetchUsers}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Workload</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.reduce((sum, u) => sum + u.currentWorkload, 0)}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reviewed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.reduce((sum, u) => sum + u.totalReviewed, 0)}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.length > 0
                  ? Math.round(
                      users.reduce((sum, u) => sum + u.approvalRate, 0) / users.length
                    )
                  : 0}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Workload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reviewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No TPA users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <EnvelopeIcon className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-2xl font-bold ${getWorkloadColor(
                            user.currentWorkload
                          )}`}
                        >
                          {user.currentWorkload}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">claims</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {user.totalReviewed}
                      </div>
                      <div className="text-xs text-gray-500">lifetime</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-lg font-bold ${getApprovalRateColor(
                            user.approvalRate
                          )}`}
                        >
                          {user.approvalRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/claims/assigned?assignedTo=${user._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Claims
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workload Distribution */}
      {users.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Workload Distribution
          </h2>
          <div className="space-y-4">
            {users.map((user) => {
              const maxWorkload = Math.max(...users.map((u) => u.currentWorkload), 1)
              const percentage = (user.currentWorkload / maxWorkload) * 100

              return (
                <div key={user._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {getUserDisplayName(user)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {user.currentWorkload} claims
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        user.currentWorkload === 0
                          ? 'bg-gray-400'
                          : user.currentWorkload < 5
                          ? 'bg-green-500'
                          : user.currentWorkload < 10
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
