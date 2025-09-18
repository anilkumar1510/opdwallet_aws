'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Policy, PolicyStatus, PolicyQueryParams } from '../_lib/types'

interface PolicyTableProps {
  policies: Policy[]
  loading: boolean
  error?: string | null
  params: PolicyQueryParams
  total: number
  currentUserRole?: string
}

export default function PolicyTable({
  policies,
  loading,
  error,
  params,
  total,
  currentUserRole = 'ADMIN'
}: PolicyTableProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleCopyId = async (policy: Policy) => {
    try {
      await navigator.clipboard.writeText(`ID: ${policy._id}\nPolicy#: ${policy.policyNumber}`)
      setCopiedId(policy._id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusBadgeClass = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.ACTIVE:
        return 'badge-success'
      case PolicyStatus.DRAFT:
        return 'badge-warning'
      case PolicyStatus.INACTIVE:
      case PolicyStatus.EXPIRED:
        return 'badge-default'
      default:
        return 'badge-default'
    }
  }

  const getStatusDotClass = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.ACTIVE:
        return 'status-active'
      case PolicyStatus.DRAFT:
        return 'status-pending'
      case PolicyStatus.INACTIVE:
      case PolicyStatus.EXPIRED:
        return 'status-inactive'
      default:
        return 'status-inactive'
    }
  }

  const formatDate = (date: string | undefined | null) => {
    if (!date) return 'Ongoing'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const updated = new Date(date)
    const diffMs = now.getTime() - updated.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Policies</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a4 4 0 01-4-4V9a4 4 0 014-4h10a4 4 0 014 4v8a4 4 0 01-4 4z" />
            </svg>
          </div>
          <h4 className="empty-state-title">No policies found</h4>
          <p className="empty-state-description">
            {params.q || params.status || params.ownerPayer ?
              'Try adjusting your search criteria.' :
              'Get started by creating your first policy.'}
          </p>
          {!params.q && !params.status && !params.ownerPayer && (
            <button
              onClick={() => router.push('/admin/policies/new')}
              className="btn-primary mt-4"
            >
              Create Policy
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block table-container">
        <div className="overflow-x-auto">
          <table className="table" role="table" aria-label="Policies table">
            <thead>
              <tr role="row">
                <th role="columnheader" scope="col">Policy</th>
                <th role="columnheader" scope="col">Owner/Payer</th>
                <th role="columnheader" scope="col">Status</th>
                <th role="columnheader" scope="col">Validity</th>
                <th role="columnheader" scope="col">Current Version</th>
                <th role="columnheader" scope="col">Updated</th>
                <th role="columnheader" scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr
                  key={policy._id}
                  role="row"
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td role="cell">
                    <button
                      onClick={() => router.push(`/admin/policies/${policy._id}`)}
                      className="text-left hover:text-yellow-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{policy.name}</div>
                      <div className="font-mono text-sm text-gray-500">{policy.policyNumber}</div>
                    </button>
                  </td>
                  <td role="cell">
                    <div className="text-sm text-gray-900">{policy.ownerPayer}</div>
                    {policy.sponsorName && (
                      <div className="text-sm text-gray-500">{policy.sponsorName}</div>
                    )}
                  </td>
                  <td role="cell">
                    <span className={getStatusBadgeClass(policy.status)}>
                      <span className={`status-dot mr-1 ${getStatusDotClass(policy.status)}`}></span>
                      {policy.status}
                    </span>
                  </td>
                  <td role="cell">
                    <div className="text-sm text-gray-900">
                      {formatDate(policy.effectiveFrom)}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {formatDate(policy.effectiveTo)}
                    </div>
                  </td>
                  <td role="cell">
                    <span className="badge-default">
                      v{policy.currentPlanVersion}
                      <span className="ml-1 text-xs text-gray-500">Current</span>
                    </span>
                  </td>
                  <td role="cell">
                    <div
                      className="text-sm text-gray-900"
                      title={new Date(policy.updatedAt).toLocaleString()}
                    >
                      {formatRelativeTime(policy.updatedAt)}
                    </div>
                  </td>
                  <td role="cell">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => router.push(`/admin/policies/${policy._id}`)}
                        className="btn-ghost p-1 text-xs"
                        title="View Details"
                        aria-label={`View ${policy.name} details`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/admin/policies/${policy._id}#versions`)}
                        className="btn-ghost p-1 text-xs"
                        title="View Plan Versions"
                        aria-label={`View ${policy.name} versions`}
                      >
                        Versions
                      </button>
                      <button
                        onClick={() => router.push(`/admin/users?policyId=${policy._id}`)}
                        className="btn-ghost p-1 text-xs"
                        title="Assign Users"
                        aria-label={`Assign users to ${policy.name}`}
                      >
                        Assign
                      </button>

                      {/* More Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === policy._id ? null : policy._id)}
                          className="btn-ghost p-1"
                          aria-label="More actions"
                          aria-expanded={openMenuId === policy._id}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {openMenuId === policy._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            {policy.status !== PolicyStatus.EXPIRED && (
                              <button
                                onClick={() => {
                                  router.push(`/admin/policies/${policy._id}/edit`)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Policy
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleCopyId(policy)
                                setOpenMenuId(null)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              {copiedId === policy._id ? 'Copied!' : 'Copy ID'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {policies.map((policy) => (
          <div
            key={policy._id}
            className="card hover:shadow-md transition-shadow"
            onClick={() => router.push(`/admin/policies/${policy._id}`)}
            role="article"
            aria-label={`Policy ${policy.name}`}
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{policy.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-gray-500">{policy.policyNumber}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{policy.ownerPayer}</span>
                    <span className="text-gray-400">•</span>
                    <span className="badge-default text-xs">v{policy.currentPlanVersion}</span>
                  </div>
                </div>
                <span className={getStatusBadgeClass(policy.status)}>
                  <span className={`status-dot mr-1 ${getStatusDotClass(policy.status)}`}></span>
                  {policy.status}
                </span>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-600">
                {formatDate(policy.effectiveFrom)} → {formatDate(policy.effectiveTo)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/policies/${policy._id}`)
                  }}
                  className="btn-primary flex-1 text-sm"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/policies/${policy._id}#versions`)
                  }}
                  className="btn-ghost flex-1 text-sm"
                >
                  Versions
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/users?policyId=${policy._id}`)
                  }}
                  className="btn-ghost flex-1 text-sm"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}