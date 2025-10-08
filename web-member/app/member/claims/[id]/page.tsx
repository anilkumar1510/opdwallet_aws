'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import StatusTimeline from '@/components/StatusTimeline'
import TPANotesPanel from '@/components/TPANotesPanel'
import DocumentResubmissionForm from '@/components/DocumentResubmissionForm'

interface ClaimDocument {
  _id: string
  fileName: string
  filePath: string
  documentType: string
  uploadedAt: string
  notes?: string
}

interface Claim {
  _id: string
  claimId: string
  userId: string
  memberName: string
  patientName: string
  relationToMember: string
  treatmentDate: string
  category: string
  providerName: string
  providerLocation?: string
  billAmount: number
  billNumber?: string
  treatmentDescription?: string
  approvedAmount?: number
  status: string
  documents: ClaimDocument[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  rejectionReason?: string
  documentsRequested?: any[]
  requiredDocumentsList?: string[]
  documentsRequiredReason?: string
  createdAt: string
  updatedAt: string
  claimType?: string
  isUrgent?: boolean
  requiresPreAuth?: boolean
  preAuthNumber?: string
}

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResubmit, setShowResubmit] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchClaimDetails()
  }, [params.id])

  const fetchClaimDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/member/claims/${params.id}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setClaim(data.claim)
      } else {
        setError(data.message || 'Failed to load claim details')
      }
    } catch (err) {
      console.error('Error fetching claim:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canCancelClaim = () => {
    if (!claim) return false
    const nonCancellableStatuses = [
      'APPROVED',
      'PARTIALLY_APPROVED',
      'REJECTED',
      'CANCELLED',
      'PAYMENT_COMPLETED',
      'PAYMENT_PROCESSING',
    ]
    return !nonCancellableStatuses.includes(claim.status)
  }

  const handleCancelClaim = async () => {
    if (!claim) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/member/claims/${claim.claimId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by member' }),
      })

      if (response.ok) {
        setShowCancelConfirm(false)
        fetchClaimDetails() // Refresh claim details
        router.push('/member/claims') // Redirect to claims list
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to cancel claim')
      }
    } catch (err) {
      console.error('Error cancelling claim:', err)
      setError('Failed to cancel claim. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-red-600" />
      case 'CANCELLED':
        return <XCircleIcon className="h-6 w-6 text-gray-600" />
      case 'DOCUMENTS_REQUIRED':
        return <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />
      case 'UNDER_REVIEW':
      case 'ASSIGNED':
        return <ClockIcon className="h-6 w-6 text-yellow-600" />
      case 'PAYMENT_PENDING':
      case 'PAYMENT_PROCESSING':
        return <CurrencyRupeeIcon className="h-6 w-6 text-purple-600" />
      case 'PAYMENT_COMPLETED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      default:
        return <DocumentTextIcon className="h-6 w-6 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
      case 'PAYMENT_COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'DOCUMENTS_REQUIRED':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'UNDER_REVIEW':
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'PAYMENT_PENDING':
      case 'PAYMENT_PROCESSING':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const formatStatusName = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleResubmitSuccess = () => {
    setShowResubmit(false)
    // Refresh claim details
    fetchClaimDetails()
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !claim) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Claim</h3>
          <p className="text-gray-500 mb-6">{error || 'Claim not found'}</p>
          <button
            onClick={() => router.push('/member/claims')}
            className="btn-primary"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Claims
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/member/claims')}
          className="flex items-center text-ink-600 hover:text-ink-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Claims
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900">
              Claim {claim.claimId}
            </h1>
            <p className="text-ink-500 mt-1">
              Submitted on {formatDate(claim.submittedAt)}
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getStatusColor(claim.status)}`}>
              {getStatusIcon(claim.status)}
              <span className="ml-2 font-semibold">{formatStatusName(claim.status)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Claim Button */}
      {canCancelClaim() && (
        <div className="mb-6">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center"
          >
            <XCircleIcon className="h-5 w-5 mr-2" />
            Cancel Claim
          </button>
        </div>
      )}

      {/* Documents Required Alert */}
      {(claim.status === 'DOCUMENTS_REQUIRED' || claim.status === 'RESUBMISSION_REQUIRED') && (
        <div className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 mb-1">
                Additional Documents Required
              </h3>
              {claim.documentsRequiredReason && (
                <p className="text-sm text-orange-700 mb-2">
                  <strong>Reason:</strong> {claim.documentsRequiredReason}
                </p>
              )}
              {claim.requiredDocumentsList && claim.requiredDocumentsList.length > 0 && (
                <div className="text-sm text-orange-700 mb-3">
                  <strong>Required Documents:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {claim.requiredDocumentsList.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-orange-700 mb-3">
                Please upload the required documents to continue processing your claim.
              </p>
              <button
                onClick={() => setShowResubmit(true)}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Upload Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Claim Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Summary */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Claim Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Patient Name
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.patientName || claim.memberName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Relationship
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.relationToMember || 'SELF'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Treatment Date
                  </label>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm font-medium text-gray-900">{formatDate(claim.treatmentDate)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Bill Amount
                  </label>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(claim.billAmount)}</p>
                </div>
                {claim.approvedAmount !== undefined && claim.approvedAmount > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Approved Amount
                    </label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(claim.approvedAmount)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.category}</p>
                </div>
                {claim.billNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Bill Number
                    </label>
                    <p className="text-sm font-medium text-gray-900">{claim.billNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Treatment Details */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Provider & Treatment Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Provider Name
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.providerName}</p>
                </div>
                {claim.providerLocation && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Provider Location
                    </label>
                    <p className="text-sm font-medium text-gray-900">{claim.providerLocation}</p>
                  </div>
                )}
                {claim.treatmentDescription && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Treatment Description
                    </label>
                    <p className="text-sm font-medium text-gray-900">{claim.treatmentDescription}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Claim Type
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.claimType || 'REIMBURSEMENT'}</p>
                </div>
                {claim.isUrgent && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Priority
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Urgent
                    </span>
                  </div>
                )}
                {claim.requiresPreAuth && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Pre-Authorization
                    </label>
                    <p className="text-sm font-medium text-gray-900">{claim.preAuthNumber || 'Required'}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
            </div>
            <div className="p-6">
              {claim.documents && claim.documents.length > 0 ? (
                <div className="space-y-3">
                  {claim.documents.map((doc) => {
                    // Construct proper file URL
                    const fileUrl = `/api/member/claims/files/${claim.userId}/${doc.fileName}`

                    return (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.documentType}</p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                            {doc.notes && (
                              <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>
                            )}
                          </div>
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No documents uploaded yet</p>
              )}
            </div>
          </Card>

          {/* Status Timeline Component */}
          <StatusTimeline claimId={params.id} />

          {/* TPA Notes Component */}
          <TPANotesPanel claimId={params.id} />
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Claim Stats</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Documents</span>
                <span className="text-sm font-semibold text-gray-900">
                  {claim.documents?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Submitted</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(claim.submittedAt)}
                </span>
              </div>
              {claim.reviewedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Reviewed</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(claim.reviewedAt)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Need Help */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Need Help?</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600">
                If you have questions about your claim, our support team is here to help.
              </p>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call Support
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email Support
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Document Resubmission Modal */}
      {showResubmit && (
        <DocumentResubmissionForm
          claimId={params.id}
          claimNumber={claim.claimId}
          requiredDocuments={claim.documentsRequested}
          onSuccess={handleResubmitSuccess}
          onCancel={() => setShowResubmit(false)}
        />
      )}

      {/* Cancel Claim Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Cancel Claim</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to cancel this claim? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this claim..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelConfirm(false)
                  setCancelReason('')
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Claim
              </button>
              <button
                onClick={handleCancelClaim}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  'Cancel Claim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
