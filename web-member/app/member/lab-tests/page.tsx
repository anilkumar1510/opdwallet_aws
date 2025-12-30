'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentPlusIcon,
  FolderOpenIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import ServiceDescriptionCard from '@/components/ServiceDescriptionCard'
import PrescriptionSelectorModal from '@/components/PrescriptionSelectorModal'
import PrescriptionConfirmationModal from '@/components/PrescriptionConfirmationModal'

interface Prescription {
  prescriptionId: string
  fileName: string
  status: string
  uploadedAt: string
  cartId?: string
}

interface Cart {
  cartId: string
  items: Array<{
    serviceName: string
  }>
  status: string
  createdAt: string
}

interface SelectedPrescription {
  _id: string
  prescriptionId: string
  type: 'digital' | 'pdf'
}

export default function LabTestsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const [showSelectorModal, setShowSelectorModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [submittingPrescription, setSubmittingPrescription] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch prescriptions
      const prescriptionsRes = await fetch('/api/member/lab/prescriptions', {
        credentials: 'include',
      })
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json()
        setPrescriptions(prescriptionsData.data || [])
      }

      // Fetch active carts
      const cartsRes = await fetch('/api/member/lab/carts', {
        credentials: 'include',
      })
      if (cartsRes.ok) {
        const cartsData = await cartsRes.json()
        setCarts(cartsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrescriptionSelect = async (prescription: SelectedPrescription) => {
    setShowSelectorModal(false)
    setSubmittingPrescription(true)
    setShowConfirmationModal(true)

    try {
      // Submit the existing prescription for lab services
      const response = await fetch('/api/member/lab/prescriptions/submit-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          healthRecordId: prescription._id,
          patientId: 'current', // Will be determined by backend
          patientName: 'Current Member', // Will be determined by backend
          patientRelationship: 'Self',
          pincode: '', // Will be determined by backend
          prescriptionDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        // Refresh the prescriptions list
        await fetchData()
      } else {
        console.error('Failed to submit prescription')
      }
    } catch (error) {
      console.error('Error submitting prescription:', error)
    } finally {
      setSubmittingPrescription(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'text-yellow-600 bg-yellow-100'
      case 'DIGITIZING':
        return 'text-blue-600 bg-blue-100'
      case 'DIGITIZED':
        return 'text-green-600 bg-green-100'
      case 'CREATED':
        return 'text-blue-600 bg-blue-100'
      case 'REVIEWED':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Lab Tests</h1>
          <p className="text-sm text-gray-600 mt-1">Book lab tests with ease</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Service Description */}
        <ServiceDescriptionCard type="lab" />

        {/* Prescription Options */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Get Started</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upload New Prescription */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push('/member/lab-tests/upload')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push('/member/lab-tests/upload')
                }
              }}
              className="rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all"
              style={{ backgroundImage: 'linear-gradient(to right, #0a529f, #084080)' }}
            >
              <DocumentPlusIcon className="h-8 w-8 mb-3" />
              <h4 className="font-semibold mb-1">Upload New Prescription</h4>
              <p className="text-sm" style={{ color: '#d4e5f5' }}>
                Upload a new prescription from your device
              </p>
            </div>

            {/* Use Existing Prescription */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowSelectorModal(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setShowSelectorModal(true)
                }
              }}
              className="rounded-xl p-5 border-2 cursor-pointer hover:shadow-lg transition-all"
              style={{ borderColor: '#0a529f' }}
            >
              <FolderOpenIcon className="h-8 w-8 mb-3" style={{ color: '#0a529f' }} />
              <h4 className="font-semibold mb-1 text-gray-900">Use Existing Prescription</h4>
              <p className="text-sm text-gray-600">
                Select from your health records
              </p>
            </div>
          </div>
        </div>

        {/* Active Carts */}
        {carts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Your Carts ({carts.length})
              </h3>
            </div>

            <div className="space-y-3">
              {carts.map((cart) => (
                <div
                  key={cart.cartId}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/member/bookings?tab=lab`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/member/bookings?tab=lab`)
                    }
                  }}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {cart.items.length} test{cart.items.length > 1 ? 's' : ''} added
                      </p>
                      <p className="text-sm text-gray-600">
                        Cart ID: {cart.cartId}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(cart.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cart.status)}`}>
                        {cart.status}
                      </span>
                      <button className="mt-2 text-sm font-medium" style={{ color: '#0a529f' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#084080'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#0a529f'}
                      >
                        Review Cart →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Prescriptions</h3>
            </div>

            <div className="space-y-3">
              {prescriptions.slice(0, 5).map((prescription) => (
                <div
                  key={prescription.prescriptionId}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* File Name */}
                      <p className="font-medium text-gray-900">{prescription.fileName}</p>

                      {/* Doctor Name and Date (if from health record) */}
                      {prescription.doctorName && (
                        <p className="text-sm text-gray-600 mt-1">
                          Dr. {prescription.doctorName}
                          {prescription.prescriptionDate && (
                            <> • {new Date(prescription.prescriptionDate).toLocaleDateString()}</>
                          )}
                        </p>
                      )}

                      {/* Lab Tests Included */}
                      {prescription.labTests && prescription.labTests.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Tests Included:</p>
                          <div className="flex flex-wrap gap-1">
                            {prescription.labTests.map((test: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                {test.testName || test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Date and Time */}
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>

                        {/* Order Created Badge */}
                        {prescription.hasOrder && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Lab Order Created
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-2 ml-2">
                      {prescription.status === 'DIGITIZING' && (
                        <ClockIcon className="h-5 w-5" style={{ color: '#0a529f' }} />
                      )}
                      {prescription.status === 'DIGITIZED' && prescription.cartId && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {prescription.status === 'DIGITIZED' && prescription.cartId && (
                    <button
                      onClick={() => router.push(`/member/bookings?tab=lab`)}
                      className="mt-3 w-full py-2 text-white rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#0a529f' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                    >
                      Review Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Orders Link */}
        <button
          onClick={() => router.push('/member/bookings?tab=lab')}
          className="w-full py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          View Lab Bookings
        </button>
      </div>

      {/* Modals */}
      <PrescriptionSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
        onSelect={handlePrescriptionSelect}
        serviceType="lab"
      />

      <PrescriptionConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        serviceType="lab"
        loading={submittingPrescription}
      />
    </div>
  )
}
