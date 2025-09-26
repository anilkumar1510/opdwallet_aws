'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PolicyTable from './_components/PolicyTable'
import { PolicyListResponse, PolicyQueryParams } from './_lib/types'
import { fetchPolicies } from './_lib/api'
import { parseQueryParams, buildQueryString, getDefaultParams } from './_lib/query'
import { apiFetch } from '@/lib/api'

export default function PoliciesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [policies, setPolicies] = useState<PolicyListResponse>({
    data: [],
    items: [],
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Parse query params from URL
  const queryParams: PolicyQueryParams = {
    ...getDefaultParams(),
    ...parseQueryParams(new URLSearchParams(searchParams.toString()))
  }

  // Check auth and role on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Fetch policies when query params change
  useEffect(() => {
    if (currentUser) {
      loadPolicies()
    }
  }, [searchParams, currentUser])

  const checkAuth = async () => {
    console.log('[DEBUG PoliciesPage] checkAuth called')
    try {
      console.log('[DEBUG PoliciesPage] Fetching /api/auth/me...')
      const response = await apiFetch('/api/auth/me')
      console.log('[DEBUG PoliciesPage] Auth response status:', response.status)
      console.log('[DEBUG PoliciesPage] Auth response ok:', response.ok)

      if (response.ok) {
        const userData = await response.json()
        console.log('[DEBUG PoliciesPage] User data:', userData)
        console.log('[DEBUG PoliciesPage] User role:', userData.role)

        // Check RBAC - only ADMIN and SUPER_ADMIN can access
        if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
          console.error('[DEBUG PoliciesPage] Access denied for role:', userData.role)
          setError('Access denied. Admin privileges required.')
          return
        }

        console.log('[DEBUG PoliciesPage] User authorized, setting currentUser')
        setCurrentUser(userData)
      } else {
        console.error('[DEBUG PoliciesPage] Auth failed, redirecting to /')
        router.push('/')
      }
    } catch (error) {
      console.error('[DEBUG PoliciesPage] Auth error:', error)
      router.push('/')
    }
  }

  const loadPolicies = async () => {
    console.log('[DEBUG PoliciesPage] loadPolicies called')
    console.log('[DEBUG PoliciesPage] currentUser:', currentUser)
    console.log('[DEBUG PoliciesPage] queryParams:', queryParams)

    try {
      setLoading(true)
      setError(null)
      console.log('[DEBUG PoliciesPage] Calling fetchPolicies...')
      const data = await fetchPolicies(queryParams)
      console.log('[DEBUG PoliciesPage] Received data:', data)
      setPolicies(data)
      console.log('[DEBUG PoliciesPage] State updated with policies')
    } catch (err) {
      console.error('[DEBUG PoliciesPage] Error in loadPolicies:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load policies'
      console.error('[DEBUG PoliciesPage] Setting error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('[DEBUG PoliciesPage] Loading set to false')
    }
  }

  const handleParamsChange = useCallback((newParams: PolicyQueryParams) => {
    const queryString = buildQueryString(newParams)
    router.push(`/admin/policies${queryString ? `?${queryString}` : ''}`)
  }, [router])

  const handlePageChange = (newPage: number) => {
    handleParamsChange({ ...queryParams, page: newPage })
  }

  // RBAC error state
  if (error === 'Access denied. Admin privileges required.') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md">
          <div className="p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You need administrator privileges to access this page.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(policies.total / (queryParams.pageSize || 20))
  const currentPage = queryParams.page || 1

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
          <button
            onClick={() => router.push('/admin/policies/new')}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Policy
          </button>
        )}
      </div>

      {/* Result Count */}
      {!loading && policies.total > 0 && (
        <div className="text-sm text-gray-600" role="status" aria-live="polite">
          Showing {((currentPage - 1) * (queryParams.pageSize || 20)) + 1} to{' '}
          {Math.min(currentPage * (queryParams.pageSize || 20), policies.total)} of{' '}
          {policies.total} policies
          {totalPages > 1 && `, page ${currentPage} of ${totalPages}`}
        </div>
      )}


      {/* Table */}
      <PolicyTable
        policies={policies.data}
        loading={loading}
        error={error}
        params={queryParams}
        total={policies.total}
        currentUserRole={currentUser?.role}
        onRefresh={loadPolicies}
      />

      {/* Pagination */}
      {!loading && policies.total > (queryParams.pageSize || 20) && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn-ghost"
              aria-label="Previous page"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="hidden sm:flex space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={pageNum === currentPage ? 'btn-primary px-3 py-1' : 'btn-ghost px-3 py-1'}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn-ghost"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}