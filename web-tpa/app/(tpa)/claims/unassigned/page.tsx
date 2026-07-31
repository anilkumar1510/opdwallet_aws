'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { useRoleGuard } from '@/lib/hooks/useRoleGuard'

interface Claim {
  _id: string
  claimId: string
  userId: {
    name: { fullName: string }
    memberId: string
  }
  memberName: string
  category: string
  providerName: string
  billAmount: number
  status: string
  submittedAt: string
}

interface TPAUser {
  _id: string
  name: { fullName?: string; firstName?: string; lastName?: string }
  email: string
  role: string
  currentWorkload?: number
  totalReviewed?: number
  approvalRate?: number
}

interface DistributionRow {
  userId: string
  name: string
  email: string
  assigned: number
  previousWorkload: number
  newWorkload: number
}

interface AutoAssignResult {
  message: string
  assignedCount: number
  totalCandidates: number
  distribution: DistributionRow[]
  failed: Array<{ claimId: string; reason: string }>
}

type AutoAssignStrategy = 'BALANCED' | 'ROUND_ROBIN'
type AutoAssignScope = 'ALL' | 'LISTED'

// Mirrors the maxClaims default on POST /api/tpa/claims/auto-assign
const AUTO_ASSIGN_MAX_PER_RUN = 200
// How many unassigned claims to pull into the queue view at once
const CLAIMS_PAGE_SIZE = 100

// Not every internal user record carries name.fullName, so fall back before rendering
const displayName = (user: TPAUser) =>
  user.name?.fullName ||
  [user.name?.firstName, user.name?.lastName].filter(Boolean).join(' ') ||
  user.email

export default function UnassignedClaimsPage() {
  useRoleGuard(['TPA_ADMIN', 'SUPER_ADMIN'])

  const [claims, setClaims] = useState<Claim[]>([])
  const [totalUnassigned, setTotalUnassigned] = useState(0)
  const [tpaUsers, setTpaUsers] = useState<TPAUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningClaim, setAssigningClaim] = useState(false)

  // Auto-assign state
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [availableUserIds, setAvailableUserIds] = useState<string[]>([])
  const [strategy, setStrategy] = useState<AutoAssignStrategy>('BALANCED')
  const [scope, setScope] = useState<AutoAssignScope>('ALL')
  const [autoAssignNotes, setAutoAssignNotes] = useState('')
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [autoAssignResult, setAutoAssignResult] = useState<AutoAssignResult | null>(null)

  useEffect(() => {
    fetchUnassignedClaims()
    fetchTPAUsers()
  }, [])

  const fetchUnassignedClaims = async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`/api/tpa/claims/unassigned?limit=${CLAIMS_PAGE_SIZE}`)
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
        setTotalUnassigned(data.total ?? (data.claims || []).length)
      }
    } catch (error) {
      console.error('Error fetching unassigned claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTPAUsers = async () => {
    try {
      const response = await apiFetch('/api/tpa/users')
      if (response.ok) {
        const data = await response.json()
        setTpaUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching TPA users:', error)
    }
  }

  const handleAssignClick = (claimId: string) => {
    setSelectedClaim(claimId)
    setSelectedUser('')
    setAssignmentNotes('')
    setShowAssignModal(true)
  }

  // Error bodies are not always JSON (a routing 404 returns an HTML page), so parsing has
  // to tolerate that; getErrorMessage then unwraps the API's nested message shape.
  const readErrorMessage = async (response: Response, fallback: string) => {
    const error = await response.json().catch(() => null)
    return getErrorMessage(error) || `${fallback} (${response.status})`
  }

  const handleAssign = async () => {
    if (!selectedClaim || !selectedUser) return

    setAssigningClaim(true)
    try {
      const response = await apiFetch(`/api/tpa/claims/${selectedClaim}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          assignedTo: selectedUser,
          notes: assignmentNotes,
        }),
      })

      if (response.ok) {
        toast.success('Claim assigned successfully')
        // Remove assigned claim from list
        setClaims(claims.filter((c) => c.claimId !== selectedClaim))
        setTotalUnassigned((count) => Math.max(0, count - 1))
        setShowAssignModal(false)
        setSelectedClaim(null)
        setSelectedUser('')
        setAssignmentNotes('')
        fetchTPAUsers()
      } else {
        toast.error(await readErrorMessage(response, 'Failed to assign claim'))
      }
    } catch (error) {
      console.error('Error assigning claim:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setAssigningClaim(false)
    }
  }

  const handleAutoAssignClick = () => {
    // Start with everyone available - the admin unticks whoever is out
    setAvailableUserIds(tpaUsers.map((user) => user._id))
    setStrategy('BALANCED')
    setScope('ALL')
    setAutoAssignNotes('')
    setAutoAssignResult(null)
    setShowAutoAssignModal(true)
  }

  const toggleAvailableUser = (userId: string) => {
    setAvailableUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    )
  }

  // How many claims this run will actually touch
  const claimsInScope = useMemo(() => {
    const count = scope === 'ALL' ? totalUnassigned : claims.length
    return Math.min(count, AUTO_ASSIGN_MAX_PER_RUN)
  }, [scope, totalUnassigned, claims.length])

  // Same allocation the API runs, so the preview matches the outcome: repeatedly hand the
  // next claim to whoever has the lowest projected load, ties going to the earlier user.
  const previewDistribution = useMemo(() => {
    const selected = tpaUsers.filter((user) => availableUserIds.includes(user._id))
    if (selected.length === 0) return []

    const projected = new Map(
      selected.map((user) => [user._id, strategy === 'BALANCED' ? user.currentWorkload || 0 : 0])
    )
    const assigned = new Map(selected.map((user) => [user._id, 0]))

    for (let i = 0; i < claimsInScope; i++) {
      let targetId = selected[0]._id
      for (const user of selected) {
        if ((projected.get(user._id) ?? 0) < (projected.get(targetId) ?? 0)) {
          targetId = user._id
        }
      }
      projected.set(targetId, (projected.get(targetId) ?? 0) + 1)
      assigned.set(targetId, (assigned.get(targetId) ?? 0) + 1)
    }

    return selected.map((user) => ({
      user,
      willGet: assigned.get(user._id) ?? 0,
      newWorkload: (user.currentWorkload || 0) + (assigned.get(user._id) ?? 0),
    }))
  }, [tpaUsers, availableUserIds, strategy, claimsInScope])

  const handleAutoAssign = async () => {
    if (availableUserIds.length === 0 || claimsInScope === 0) return

    setAutoAssigning(true)
    try {
      const response = await apiFetch('/api/tpa/claims/auto-assign', {
        method: 'POST',
        body: JSON.stringify({
          assigneeIds: availableUserIds,
          strategy,
          // Scoping to the listed claims keeps the run to exactly what the admin can see
          ...(scope === 'LISTED' ? { claimIds: claims.map((claim) => claim.claimId) } : {}),
          ...(autoAssignNotes ? { notes: autoAssignNotes } : {}),
        }),
      })

      if (response.ok) {
        const result: AutoAssignResult = await response.json()
        setAutoAssignResult(result)

        if (result.assignedCount > 0) {
          toast.success(result.message)
        } else {
          toast.info(result.message)
        }
        if (result.failed?.length) {
          toast.error(`${result.failed.length} claim(s) could not be assigned`)
        }

        // Pull fresh queue + workloads so the page reflects what just happened
        fetchUnassignedClaims()
        fetchTPAUsers()
      } else {
        toast.error(await readErrorMessage(response, 'Failed to auto-assign claims'))
      }
    } catch (error) {
      console.error('Error auto-assigning claims:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setAutoAssigning(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/claims"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unassigned Claims</h1>
            <p className="text-gray-500 mt-1">
              {totalUnassigned} claims waiting for assignment
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoAssignClick}
            disabled={totalUnassigned === 0 || tpaUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BoltIcon className="h-5 w-5" />
            <span>Auto-Assign</span>
          </button>
          <button
            onClick={fetchUnassignedClaims}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <UserPlusIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Action Required</h3>
            <p className="text-sm text-red-700 mt-1">
              These claims need to be assigned to TPA users for review. Assign them individually, or use Auto-Assign to spread them across the users who are available today.
            </p>
          </div>
        </div>
      </div>

      {/* Claims Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Unassigned Claims</h3>
          <p className="text-gray-500">All claims have been assigned to TPA users</p>
        </div>
      ) : (
        <>
          {totalUnassigned > claims.length && (
            <p className="text-sm text-gray-500">
              Showing the {claims.length} oldest of {totalUnassigned} unassigned claims.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claims.map((claim) => (
              <div
                key={claim._id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/claims/${claim.claimId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {claim.claimId}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(claim.submittedAt)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                    Unassigned
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Member</p>
                    <p className="text-sm font-medium text-gray-900">{claim.memberName}</p>
                    <p className="text-xs text-gray-500">{claim.userId?.memberId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm text-gray-900 truncate">{claim.providerName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {claim.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{claim.billAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleAssignClick(claim.claimId)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Assign to TPA User</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assign Claim</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim ID
                </label>
                <input
                  type="text"
                  value={selectedClaim || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to TPA User *
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a TPA user...</option>
                  {tpaUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {displayName(user)} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add notes about this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedUser || assigningClaim}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {assigningClaim ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  'Assign Claim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assign Modal */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BoltIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {autoAssignResult ? 'Auto-Assign Complete' : 'Auto-Assign Claims'}
                </h3>
              </div>
              <button
                onClick={() => setShowAutoAssignModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {autoAssignResult ? (
              /* Result view */
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="ml-3 text-sm text-green-800">{autoAssignResult.message}</p>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">TPA User</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-700">Assigned</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-700">Workload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {autoAssignResult.distribution.map((row) => (
                        <tr key={row.userId}>
                          <td className="px-4 py-2">
                            <p className="text-gray-900">{row.name}</p>
                            <p className="text-xs text-gray-500">{row.email}</p>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">
                            +{row.assigned}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            {row.previousWorkload} → {row.newWorkload}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {autoAssignResult.failed?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      {autoAssignResult.failed.length} claim(s) could not be assigned
                    </h4>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {autoAssignResult.failed.map((item) => (
                        <li key={item.claimId}>
                          {item.claimId} - {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setShowAutoAssignModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Configuration view */
              <div className="space-y-5">
                {/* Available users */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available TPA Users *
                    </label>
                    <button
                      onClick={() =>
                        setAvailableUserIds(
                          availableUserIds.length === tpaUsers.length
                            ? []
                            : tpaUsers.map((user) => user._id)
                        )
                      }
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {availableUserIds.length === tpaUsers.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Untick anyone who is on leave or otherwise unavailable - claims only go to the users left ticked.
                  </p>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-56 overflow-y-auto">
                    {tpaUsers.map((user) => {
                      const isAvailable = availableUserIds.includes(user._id)
                      return (
                        <label
                          key={user._id}
                          className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={() => toggleAvailableUser(user._id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {displayName(user)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <span className="ml-3 text-xs text-gray-600 whitespace-nowrap">
                            {user.currentWorkload ?? 0} open
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claims to distribute
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setScope('ALL')}
                      className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                        scope === 'ALL'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block font-medium">All unassigned</span>
                      <span className="block text-xs mt-0.5">{totalUnassigned} claims</span>
                    </button>
                    <button
                      onClick={() => setScope('LISTED')}
                      className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                        scope === 'LISTED'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block font-medium">Only claims shown</span>
                      <span className="block text-xs mt-0.5">{claims.length} claims</span>
                    </button>
                  </div>
                  {scope === 'ALL' && totalUnassigned > AUTO_ASSIGN_MAX_PER_RUN && (
                    <p className="text-xs text-amber-700 mt-2">
                      A single run assigns at most {AUTO_ASSIGN_MAX_PER_RUN} claims (oldest first). Run it again for the rest.
                    </p>
                  )}
                </div>

                {/* Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStrategy('BALANCED')}
                      className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                        strategy === 'BALANCED'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block font-medium">Balance workload</span>
                      <span className="block text-xs mt-0.5">Level out open claims per user</span>
                    </button>
                    <button
                      onClick={() => setStrategy('ROUND_ROBIN')}
                      className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                        strategy === 'ROUND_ROBIN'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block font-medium">Split evenly</span>
                      <span className="block text-xs mt-0.5">Ignore existing workload</span>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  {availableUserIds.length === 0 ? (
                    <p className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-3">
                      Select at least one available TPA user.
                    </p>
                  ) : claimsInScope === 0 ? (
                    <p className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-3">
                      There are no unassigned claims in this scope.
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {previewDistribution.map(({ user, willGet, newWorkload }) => (
                        <div key={user._id} className="flex items-center justify-between px-4 py-2">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">{displayName(user)}</p>
                            <p className="text-xs text-gray-500">
                              {user.currentWorkload ?? 0} open → {newWorkload} after
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">
                            +{willGet}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    value={autoAssignNotes}
                    onChange={(e) => setAutoAssignNotes(e.target.value)}
                    placeholder="Recorded on every claim in this batch..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => setShowAutoAssignModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAutoAssign}
                    disabled={availableUserIds.length === 0 || claimsInScope === 0 || autoAssigning}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {autoAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      `Assign ${claimsInScope} claim${claimsInScope === 1 ? '' : 's'}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
