'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PoliciesPage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies?limit=50', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }


  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          policy.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || policy.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search by name or policy number..."
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/policies/new')}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Policy
        </button>
      </div>

      {/* Policies Table */}
      <div className="table-container">
        {filteredPolicies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a4 4 0 01-4-4V9a4 4 0 014-4h10a4 4 0 014 4v8a4 4 0 01-4 4z" />
              </svg>
            </div>
            <h4 className="empty-state-title">No policies found</h4>
            <p className="empty-state-description">
              {searchTerm || filterStatus ? 'Try adjusting your search criteria.' : 'Get started by creating your first policy.'}
            </p>
            {!searchTerm && !filterStatus && (
              <button
                onClick={() => router.push('/admin/policies/new')}
                className="btn-primary mt-4"
              >
                Create Policy
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Effective Period</th>
                  <th className="hidden xl:table-cell">Owner/Payer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy._id}>
                    <td>
                      <div className="font-mono text-sm font-medium">
                        {policy.policyNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{policy.name}</div>
                      {policy.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs lg:max-w-none">
                          {policy.description.substring(0, 60)}...
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 lg:hidden">
                        {new Date(policy.effectiveFrom).toLocaleDateString()} - {policy.effectiveTo ? new Date(policy.effectiveTo).toLocaleDateString() : 'Ongoing'}
                      </div>
                    </td>
                    <td>
                      <span className={
                        policy.status === 'ACTIVE'
                          ? 'badge-success'
                          : policy.status === 'DRAFT'
                          ? 'badge-warning'
                          : 'badge-default'
                      }>
                        <span className={`status-dot mr-1 ${
                          policy.status === 'ACTIVE'
                            ? 'status-active'
                            : policy.status === 'DRAFT'
                            ? 'status-pending'
                            : 'status-inactive'
                        }`}></span>
                        {policy.status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(policy.effectiveFrom).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {policy.effectiveTo ? new Date(policy.effectiveTo).toLocaleDateString() : 'Ongoing'}
                      </div>
                    </td>
                    <td className="hidden xl:table-cell">
                      <div className="text-sm text-gray-900">
                        {policy.ownerPayer || 'Not specified'}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/admin/policies/${policy._id}`)}
                        className="btn-ghost p-1 text-xs"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}