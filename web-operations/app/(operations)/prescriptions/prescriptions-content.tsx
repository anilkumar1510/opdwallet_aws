'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DocumentTextIcon, EyeIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface Prescription {
  _id: string
  prescriptionId: string
  userId: {
    name: string
    phone: string
  }
  patientName: string
  fileName: string
  filePath: string
  status: string
  serviceType: 'LAB' | 'DIAGNOSTIC'
  uploadedAt: string
  cartId?: string
}

export default function OpsPrescriptionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'lab' | 'diagnostic'>(
    (searchParams.get('tab') as 'lab' | 'diagnostic') || 'lab'
  )

  // Helper function to convert API filePath to absolute URL
  const getAbsoluteFilePath = (filePath: string, serviceType: 'LAB' | 'DIAGNOSTIC') => {
    if (!filePath) return ''

    // If filePath starts with 'uploads/', convert to '/operations/api/uploads/' to use the API route
    if (filePath.startsWith('uploads/')) {
      return `/operations/api/${filePath}`
    }
    // If it already starts with '/operations/', return as is
    if (filePath.startsWith('/operations/')) {
      return filePath
    }
    // If it starts with '/api/', prepend basePath
    if (filePath.startsWith('/api/')) {
      return `/operations${filePath}`
    }
    // If it starts with '/', prepend basePath
    if (filePath.startsWith('/')) {
      return `/operations${filePath}`
    }
    // Otherwise, prepend '/operations/api/'
    return `/operations/api/${filePath}`
  }

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellingPrescription, setCancellingPrescription] = useState(false)

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('serviceType', activeTab === 'lab' ? 'LAB' : 'DIAGNOSTIC')

      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/prescriptions/queue?${params}`
        : `/api/ops/diagnostics/prescriptions/queue?${params}`

      const response = await apiFetch(apiPath)

      if (!response.ok) throw new Error('Failed to fetch prescriptions')

      const data = await response.json()
      setPrescriptions(data.data || [])
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      toast.error('Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, activeTab])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  useEffect(() => {
    // Update URL when tab changes
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', activeTab)
    router.push(`/prescriptions?${params.toString()}`, { scroll: false })
  }, [activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'bg-yellow-100 text-yellow-800'
      case 'DIGITIZING':
        return 'bg-blue-100 text-blue-800'
      case 'DIGITIZED':
        return 'bg-green-100 text-green-800'
      case 'DELAYED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDigitize = (prescription: Prescription) => {
    const digitizePath = activeTab === 'lab'
      ? `/lab/prescriptions/${prescription.prescriptionId}/digitize`
      : `/diagnostics/prescriptions/${prescription.prescriptionId}/digitize`
    router.push(digitizePath)
  }

  const handleOpenCancelModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setShowCancelModal(true)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setCancelReason('')
  }

  const handleCancelPrescription = async () => {
    if (!selectedPrescription || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    if (cancelReason.trim().length < 10) {
      toast.error('Cancellation reason must be at least 10 characters')
      return
    }

    setCancellingPrescription(true)

    try {
      const apiPath = activeTab === 'lab'
        ? `/api/ops/lab/prescriptions/${selectedPrescription.prescriptionId}/cancel`
        : `/api/ops/diagnostics/prescriptions/${selectedPrescription.prescriptionId}/cancel`

      const response = await apiFetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel prescription')
      }

      toast.success('Prescription cancelled successfully')
      setShowCancelModal(false)
      setSelectedPrescription(null)
      setCancelReason('')

      // Refresh prescriptions list
      await fetchPrescriptions()
    } catch (error: any) {
      console.error('Error cancelling prescription:', error)
      toast.error(error.message || 'Failed to cancel prescription')
    } finally {
      setCancellingPrescription(false)
    }
  }

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lab')}
              className={`${
                activeTab === 'lab'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Lab Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`${
                activeTab === 'diagnostic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Diagnostic Prescriptions
            </button>
          </nav>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {activeTab === 'lab' ? 'Lab' : 'Diagnostic'} Prescriptions Queue
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Digitize uploaded {activeTab === 'lab' ? 'lab test' : 'diagnostic'} prescriptions
          </p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="DIGITIZING">Digitizing</option>
            <option value="DIGITIZED">Digitized</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No prescriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescription ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {prescription.prescriptionId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{prescription.patientName}</p>
                        <p className="text-gray-500 text-xs">{prescription.userId?.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(prescription.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPrescription(prescription)
                          setShowImageModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        title="View prescription"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>

                      {prescription.status !== 'DIGITIZED' && prescription.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleDigitize(prescription)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Digitize prescription"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-1" />
                          Digitize
                        </button>
                      )}

                      {prescription.status === 'UPLOADED' && (
                        <button
                          onClick={() => handleOpenCancelModal(prescription)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Cancel prescription"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showImageModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Prescription: {selectedPrescription.prescriptionId}
                </h3>
                <p className="text-sm text-gray-600">{selectedPrescription.patientName}</p>
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedPrescription(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6">
              {selectedPrescription.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getAbsoluteFilePath(selectedPrescription.filePath, selectedPrescription.serviceType)}
                  className="w-full h-[75vh] border-0"
                  title="Prescription PDF"
                />
              ) : (
                <img
                  src={getAbsoluteFilePath(selectedPrescription.filePath, selectedPrescription.serviceType)}
                  alt="Prescription"
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Prescription Modal */}
      {showCancelModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Prescription</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Prescription ID: {selectedPrescription.prescriptionId}
                </p>
              </div>
              <button
                onClick={handleCloseCancelModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This action cannot be undone. The prescription will be removed from the processing queue.
              </p>
            </div>

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason (minimum 10 characters)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {cancelReason.length}/500 characters (minimum 10)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseCancelModal}
                disabled={cancellingPrescription}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Prescription
              </button>
              <button
                onClick={handleCancelPrescription}
                disabled={cancellingPrescription || cancelReason.trim().length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingPrescription ? 'Cancelling...' : 'Cancel Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
