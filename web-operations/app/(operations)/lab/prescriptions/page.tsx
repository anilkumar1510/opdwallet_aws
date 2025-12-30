'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentTextIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
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

export default function OpsLabPrescriptionsPage() {
  const router = useRouter()

  // Helper function to convert API filePath to absolute URL
  const getAbsoluteFilePath = (filePath: string) => {
    if (!filePath) return ''
    // If filePath starts with 'uploads/', convert to '/operations/lab/uploads/' to match rewrite rule
    if (filePath.startsWith('uploads/')) {
      return `/operations/lab/${filePath}`
    }
    // If it already starts with '/operations/', return as is
    if (filePath.startsWith('/operations/')) {
      return filePath
    }
    // If it starts with '/', prepend basePath
    if (filePath.startsWith('/')) {
      return `/operations${filePath}`
    }
    // Otherwise, prepend '/operations/lab/'
    return `/operations/lab/${filePath}`
  }

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (serviceTypeFilter) params.append('serviceType', serviceTypeFilter)

      const response = await apiFetch(`/api/ops/lab/prescriptions/queue?${params}`)

      if (!response.ok) throw new Error('Failed to fetch prescriptions')

      const data = await response.json()
      setPrescriptions(data.data || [])
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      toast.error('Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, serviceTypeFilter])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'LAB':
        return 'bg-purple-100 text-purple-800'
      case 'DIAGNOSTIC':
        return 'bg-cyan-100 text-cyan-800'
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions Queue</h1>
          <p className="text-sm text-gray-600 mt-1">Digitize uploaded prescriptions for Lab & Diagnostic services</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Services</option>
            <option value="LAB">Lab Tests</option>
            <option value="DIAGNOSTIC">Diagnostic</option>
          </select>
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
                    Service Type
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(prescription.serviceType)}`}>
                        {prescription.serviceType}
                      </span>
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
                      {prescription.status !== 'DIGITIZED' && (
                        <button
                          onClick={() => router.push(`/lab/prescriptions/${prescription.prescriptionId}/digitize`)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-1" />
                          {prescription.status === 'DIGITIZING' ? 'Continue' : 'Digitize'}
                        </button>
                      )}
                      {prescription.cartId && (
                        <button
                          onClick={() => router.push(`/ops/lab/carts/${prescription.cartId}`)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          View Cart
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

      {/* Image Modal */}
      {showImageModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold">Prescription: {selectedPrescription.prescriptionId}</h3>
                <p className="text-sm text-gray-600">Patient: {selectedPrescription.patientName}</p>
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedPrescription(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {selectedPrescription.fileName?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getAbsoluteFilePath(selectedPrescription.filePath)}
                  className="w-full h-[70vh] rounded-lg border border-gray-300"
                  title="Prescription PDF"
                />
              ) : (
                <img
                  src={getAbsoluteFilePath(selectedPrescription.filePath)}
                  alt="Prescription"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
