'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Policy, PolicyStatus, PolicyQueryParams } from '../_lib/types'
import { apiFetch } from '@/lib/api'

interface PolicyTableProps {
  policies: Policy[]
  loading: boolean
  error?: string | null
  params: PolicyQueryParams
  total: number
  currentUserRole?: string
  onRefresh?: () => void
}

export default function PolicyTable({
  policies,
  loading,
  error,
  params,
  total,
  currentUserRole = 'ADMIN',
  onRefresh
}: PolicyTableProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null)

  const handleCopyId = async (policy: Policy) => {
    try {
      await navigator.clipboard.writeText(`ID: ${policy._id}\nPolicy#: ${policy.policyNumber}`)
      setCopiedId(policy._id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDeletePolicy = async (policy: Policy) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${policy.name}" (${policy.policyNumber})?\n\n` +
      `This action cannot be undone. The policy can only be deleted if it has no active user assignments.`
    )

    if (!confirmed) return

    try {
      setDeletingPolicyId(policy._id)
      const response = await apiFetch(`/api/policies/${policy._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Policy "${result.policyName}" deleted successfully`)
        setOpenMenuId(null)
        if (onRefresh) {
          onRefresh()
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete policy')
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setDeletingPolicyId(null)
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
            Get started by creating your first policy.
          </p>
          {(
            <button
              onClick={() => router.push('/policies/new')}
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
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full" role="table" aria-label="Policies table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr role="row">
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Policy</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Owner/Payer</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Validity</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Version</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Updated</th>
                <th role="columnheader" scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {policies.map((policy, index) => (
                <tr
                  key={policy._id}
                  role="row"
                  className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  onClick={() => router.push(`/policies/${policy._id}`)}
                >
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-gray-900">{policy.name}</div>
                      <div className="font-mono text-xs text-gray-600 mt-1">{policy.policyNumber}</div>
                    </div>
                  </td>
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{policy.ownerPayer}</div>
                    {policy.sponsorName && (
                      <div className="text-xs text-gray-600 mt-1">{policy.sponsorName}</div>
                    )}
                  </td>
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      policy.status === PolicyStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                      policy.status === PolicyStatus.DRAFT ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status}
                    </span>
                  </td>
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(policy.effectiveFrom)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      to {formatDate(policy.effectiveTo)}
                    </div>
                  </td>
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Configured
                    </span>
                  </td>
                  <td role="cell" className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium text-gray-700"
                      title={new Date(policy.updatedAt).toLocaleString()}
                    >
                      {formatRelativeTime(policy.updatedAt)}
                    </div>
                  </td>
                  <td role="cell">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/policies/${policy._id}#versions`)
                        }}
                        className="btn-ghost p-1 text-xs"
                        title="View Plan Versions"
                        aria-label={`View ${policy.name} versions`}
                      >
                        Versions
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/users?policyId=${policy._id}`)
                        }}
                        className="btn-ghost p-1 text-xs"
                        title="Assign Users"
                        aria-label={`Assign users to ${policy.name}`}
                      >
                        Assign
                      </button>

                      {/* More Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === policy._id ? null : policy._id)
                          }}
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
                                  router.push(`/policies/${policy._id}/edit`)
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
                            <button
                              onClick={() => handleDeletePolicy(policy)}
                              disabled={deletingPolicyId === policy._id}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {deletingPolicyId === policy._id ? 'Deleting...' : 'Delete Policy'}
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
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            onClick={() => router.push(`/policies/${policy._id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(`/policies/${policy._id}`)
              }
            }}
            role="article"
            tabIndex={0}
            aria-label={`Policy ${policy.name}`}
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-gray-700">{policy.policyNumber}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm font-medium text-gray-700">{policy.ownerPayer}</span>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Configured</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  policy.status === PolicyStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                  policy.status === PolicyStatus.DRAFT ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {policy.status}
                </span>
              </div>

              {/* Dates */}
              <div className="text-sm font-medium text-gray-700">
                {formatDate(policy.effectiveFrom)} → {formatDate(policy.effectiveTo)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/policies/${policy._id}#versions`)
                  }}
                  className="btn-primary flex-1 text-sm"
                >
                  Versions
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/users?policyId=${policy._id}`)
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