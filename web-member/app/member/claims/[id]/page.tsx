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
  patientName: string
  patientAge: number
  patientRelationship: string
  treatmentDate: string
  diagnosisCode: string
  diagnosis: string
  hospitalName: string
  doctorName: string
  treatmentType: string
  claimAmount: number
  approvedAmount?: number
  status: string
  documents: ClaimDocument[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  rejectionReason?: string
  documentsRequested?: Array<{ documentType: string; reason: string }>
  createdAt: string
  updatedAt: string
}

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResubmit, setShowResubmit] = useState(false)

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-red-600" />
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

      {/* Documents Required Alert */}
      {claim.status === 'DOCUMENTS_REQUIRED' && (
        <div className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-800 mb-1">
                Additional Documents Required
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Your claim reviewer has requested additional documents. Please upload them to continue processing your claim.
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
                  <p className="text-sm font-medium text-gray-900">{claim.patientName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Relationship
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.patientRelationship}</p>
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
                    Claim Amount
                  </label>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(claim.claimAmount)}</p>
                </div>
                {claim.approvedAmount !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Approved Amount
                    </label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(claim.approvedAmount)}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Treatment Details */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Treatment Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Hospital/Clinic
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.hospitalName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Doctor Name
                  </label>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm font-medium text-gray-900">{claim.doctorName}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Treatment Type
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.treatmentType}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Diagnosis
                  </label>
                  <p className="text-sm font-medium text-gray-900">{claim.diagnosis}</p>
                </div>
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
                  {claim.documents.map((doc) => (
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
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  ))}
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
    </div>
  )
}
