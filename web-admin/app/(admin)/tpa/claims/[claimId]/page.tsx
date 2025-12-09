'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import ApprovalModal from '@/components/tpa/ApprovalModal'
import RejectionModal from '@/components/tpa/RejectionModal'
import RequestDocumentsModal from '@/components/tpa/RequestDocumentsModal'
import ReassignmentModal from '@/components/tpa/ReassignmentModal'
import DocumentPreviewModal from '@/components/tpa/DocumentPreviewModal'
import StatusUpdateModal from '@/components/tpa/StatusUpdateModal'

interface Claim {
  _id: string
  claimId: string
  userId: {
    _id: string
    name: { fullName: string }
    email: string
    memberId: string
    phone: string
  }
  memberName: string
  category: string
  serviceType: string
  treatmentDate: string
  providerName: string
  providerAddress: string
  billAmount: number
  cappedAmount?: number
  wasAutoCapped?: boolean
  perClaimLimitApplied?: number
  amountApproved?: number
  amountRejected?: number
  status: string
  assignedTo?: {
    _id: string
    name: { fullName: string }
    email: string
  }
  assignedToName?: string
  assignedBy?: {
    name: { fullName: string }
  }
  assignedAt?: string
  documents: Array<{
    type: string
    url: string
    uploadedAt: string
  }>
  documentsRequired?: Array<{
    documentType: string
    reason: string
    requestedBy: { name: { fullName: string } }
    requestedAt: string
  }>
  statusHistory: Array<{
    status: string
    changedBy: { name: { fullName: string } }
    changedByName: string
    changedByRole: string
    changedAt: string
    reason?: string
    notes?: string
  }>
  reviewHistory: Array<{
    action: string
    reviewedBy: { name: { fullName: string } }
    reviewedAt: string
    decision: string
    amountApproved?: number
    reason: string
    notes?: string
  }>
  reviewNotes?: string
  rejectionReason?: string
  submittedAt: string
  createdAt: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  UNASSIGNED: { bg: 'bg-red-100', text: 'text-red-700' },
  ASSIGNED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  UNDER_REVIEW: { bg: 'bg-orange-100', text: 'text-orange-700' },
  DOCUMENTS_REQUIRED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
  PARTIALLY_APPROVED: { bg: 'bg-teal-100', text: 'text-teal-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  PAYMENT_PENDING: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  PAYMENT_PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PAYMENT_COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
}

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.claimId as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showDocPreview, setShowDocPreview] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchClaim = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`/api/tpa/claims/${claimId}`)
      if (response.ok) {
        const data = await response.json()
        setClaim(data.claim)
      } else {
        console.error('Failed to fetch claim')
      }
    } catch (error) {
      console.error('Error fetching claim:', error)
    } finally {
      setLoading(false)
    }
  }, [claimId])

  const fetchCurrentUser = async () => {
    try {
      const response = await apiFetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    fetchClaim()
    fetchCurrentUser()
  }, [claimId, fetchClaim])

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canTakeAction = () => {
    if (!claim || !currentUser) return false

    // TPA_ADMIN can always take action
    if (currentUser.role === 'TPA_ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      return true
    }

    // TPA_USER can only take action if claim is assigned to them
    if (currentUser.role === 'TPA_USER') {
      return claim.assignedTo?._id === currentUser._id
    }

    return false
  }

  const canReassign = () => {
    if (!currentUser) return false
    return currentUser.role === 'TPA_ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Claim not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/tpa/claims"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{claim.claimId}</h1>
            <p className="text-gray-500 mt-1">
              Submitted on {formatDate(claim.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
              statusColors[claim.status]?.bg || 'bg-gray-100'
            } ${statusColors[claim.status]?.text || 'text-gray-700'}`}
          >
            {formatStatus(claim.status)}
          </span>
          <button
            onClick={fetchClaim}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Details */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Claim Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded">
                    {claim.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {claim.serviceType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Treatment Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(claim.treatmentDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill Amount</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ₹{claim.billAmount?.toLocaleString()}
                  </p>
                </div>
                {claim.wasAutoCapped && claim.cappedAmount && (
                  <div>
                    <p className="text-sm text-gray-500">Amount Submitted for Approval</p>
                    <div className="mt-1">
                      <p className="text-lg font-bold text-green-700">
                        ₹{claim.cappedAmount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Capped from ₹{claim.billAmount?.toLocaleString()} (Limit: ₹{claim.perClaimLimitApplied?.toLocaleString()})
                      </p>
                    </div>
                  </div>
                )}
                {!claim.wasAutoCapped && (
                  <div>
                    <p className="text-sm text-gray-500">Amount Submitted for Approval</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ₹{claim.billAmount?.toLocaleString()}
                    </p>
                  </div>
                )}
                {claim.amountApproved !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Amount Approved</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{claim.amountApproved?.toLocaleString()}
                    </p>
                  </div>
                )}
                {claim.amountRejected !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Amount Rejected</p>
                    <p className="text-lg font-bold text-red-600 mt-1">
                      ₹{claim.amountRejected?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Provider</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {claim.providerName}
                </p>
                {claim.providerAddress && (
                  <p className="text-sm text-gray-600 mt-1">{claim.providerAddress}</p>
                )}
              </div>

              {claim.reviewNotes && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Review Notes</p>
                  <p className="text-sm text-gray-900 mt-1">{claim.reviewNotes}</p>
                </div>
              )}

              {claim.rejectionReason && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-1">{claim.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Member Information */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Member Information</h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {claim.userId?.name?.fullName || claim.memberName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member ID</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {claim.userId?.memberId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm text-gray-900 mt-1">{claim.userId?.email}</p>
              </div>
              {claim.userId?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{claim.userId.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            </div>
            <div className="p-6">
              {claim.documents && claim.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {claim.documents.map((doc, index) => (
                    <button
                      key={index}
                      type="button"
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer w-full text-left"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setShowDocPreview(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.type || (doc as any).documentType || 'Document'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {(doc as any).fileName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDocument(doc)
                            setShowDocPreview(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Preview
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Required */}
          {claim.documentsRequired && claim.documentsRequired.length > 0 && (
            <div className="bg-purple-50 rounded-lg border border-purple-200">
              <div className="p-4 border-b border-purple-200">
                <h2 className="text-lg font-semibold text-purple-900">
                  Additional Documents Required
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {claim.documentsRequired.map((req, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {req.documentType}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{req.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Requested by {req.requestedBy.name.fullName} on{' '}
                      {formatDate(req.requestedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          {canTakeAction() && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
              <button
                onClick={() => setShowApprovalModal(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Approve Claim</span>
              </button>
              <button
                onClick={() => setShowRejectionModal(true)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <XCircleIcon className="h-4 w-4" />
                <span>Reject Claim</span>
              </button>
              <button
                onClick={() => setShowDocumentsModal(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Request Documents</span>
              </button>
              {canReassign() && (
                <>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Change Status</span>
                  </button>
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Reassign</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Assignment Info */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Assignment</h3>
            </div>
            <div className="p-4 space-y-3">
              {claim.assignedTo ? (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {claim.assignedToName || claim.assignedTo.name.fullName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {claim.assignedTo.email}
                    </p>
                  </div>
                  {claim.assignedBy && (
                    <div>
                      <p className="text-xs text-gray-500">Assigned By</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {claim.assignedBy.name.fullName}
                      </p>
                    </div>
                  )}
                  {claim.assignedAt && (
                    <div>
                      <p className="text-xs text-gray-500">Assigned On</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(claim.assignedAt)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Not assigned</p>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Status History</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {claim.statusHistory?.map((history, index) => (
                  <div key={index} className="relative pl-6 pb-4 last:pb-0">
                    {index !== claim.statusHistory.length - 1 && (
                      <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatStatus(history.status)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {history.changedByName} ({history.changedByRole})
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(history.changedAt)}
                      </p>
                      {history.reason && (
                        <p className="text-xs text-gray-600 mt-1">{history.reason}</p>
                      )}
                      {history.notes && (
                        <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review History */}
          {claim.reviewHistory && claim.reviewHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Review History</h3>
              </div>
              <div className="p-4 space-y-3">
                {claim.reviewHistory.map((review, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {review.action} - {review.decision}
                    </p>
                    {review.amountApproved !== undefined && (
                      <p className="text-sm text-green-600 mt-1">
                        Approved: ₹{review.amountApproved.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">{review.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {review.reviewedBy?.name?.fullName || (review as any).reviewedByName || 'Unknown'} on{' '}
                      {formatDate(review.reviewedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalModal
          claimId={claimId}
          billAmount={claim.wasAutoCapped && claim.cappedAmount ? claim.cappedAmount : claim.billAmount}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={fetchClaim}
        />
      )}

      {showRejectionModal && (
        <RejectionModal
          claimId={claimId}
          billAmount={claim.wasAutoCapped && claim.cappedAmount ? claim.cappedAmount : claim.billAmount}
          onClose={() => setShowRejectionModal(false)}
          onSuccess={fetchClaim}
        />
      )}

      {showDocumentsModal && (
        <RequestDocumentsModal
          claimId={claimId}
          onClose={() => setShowDocumentsModal(false)}
          onSuccess={fetchClaim}
        />
      )}

      {showReassignModal && (
        <ReassignmentModal
          claimId={claimId}
          currentAssignee={claim.assignedTo}
          onClose={() => setShowReassignModal(false)}
          onSuccess={fetchClaim}
        />
      )}

      {showDocPreview && selectedDocument && (
        <DocumentPreviewModal
          isOpen={showDocPreview}
          onClose={() => {
            setShowDocPreview(false)
            setSelectedDocument(null)
          }}
          document={selectedDocument}
          userId={typeof claim.userId === 'string' ? claim.userId : claim.userId?._id}
        />
      )}

      {showStatusModal && (
        <StatusUpdateModal
          claimId={claimId}
          currentStatus={claim.status}
          onClose={() => setShowStatusModal(false)}
          onSuccess={fetchClaim}
        />
      )}
    </div>
  )
}
