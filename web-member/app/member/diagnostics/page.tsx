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
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

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

export default function DiagnosticsPage() {
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
      const prescriptionsRes = await fetch('/api/member/diagnostics/prescriptions', {
        credentials: 'include',
      })
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json()
        setPrescriptions(prescriptionsData.data || [])
      }

      // Fetch active carts
      const cartsRes = await fetch('/api/member/diagnostics/carts', {
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
      // Submit the existing prescription for diagnostic services
      const response = await fetch('/api/member/diagnostics/prescriptions/submit-existing', {
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
        return { background: '#FEF1E7', color: '#E67E22' }
      case 'DIGITIZING':
        return { background: '#EFF4FF', color: '#0F5FDC' }
      case 'DIGITIZED':
        return { background: '#E8F5E9', color: '#25A425' }
      case 'CREATED':
        return { background: '#EFF4FF', color: '#0F5FDC' }
      case 'REVIEWED':
        return { background: '#E8F5E9', color: '#25A425' }
      default:
        return { background: '#f3f4f6', color: '#6b7280' }
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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Diagnostic Services"
        subtitle="Book diagnostic imaging & tests"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Service Description */}
        <ServiceDescriptionCard type="diagnostic" />

        {/* Prescription Options */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Get Started</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {/* Upload New Prescription */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push('/member/diagnostics/upload')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push('/member/diagnostics/upload')
                }
              }}
              className="rounded-xl p-4 lg:p-5 cursor-pointer hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
            >
              <DocumentPlusIcon className="h-7 w-7 lg:h-8 lg:w-8 mb-2 lg:mb-3 text-white" />
              <h4 className="text-sm lg:text-base font-semibold mb-1 text-white">Upload New Prescription</h4>
              <p className="text-xs lg:text-sm text-white opacity-90">
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
              className="rounded-xl p-4 lg:p-5 border-2 cursor-pointer hover:shadow-lg transition-all"
              style={{ borderColor: '#86ACD8' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
            >
              <FolderOpenIcon className="h-7 w-7 lg:h-8 lg:w-8 mb-2 lg:mb-3" style={{ color: '#0F5FDC' }} />
              <h4 className="text-sm lg:text-base font-semibold mb-1" style={{ color: '#0E51A2' }}>Use Existing Prescription</h4>
              <p className="text-xs lg:text-sm text-gray-600">
                Select from your health records
              </p>
            </div>
          </div>
        </DetailCard>

        {/* Active Carts */}
        {carts.length > 0 && (
          <DetailCard variant="primary">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold flex items-center" style={{ color: '#0E51A2' }}>
                <ShoppingCartIcon className="h-5 w-5 lg:h-6 lg:w-6 mr-2" style={{ color: '#0F5FDC' }} />
                Your Carts ({carts.length})
              </h3>
            </div>

            <div className="space-y-3">
              {carts.map((cart) => (
                <DetailCard
                  key={cart.cartId}
                  variant="secondary"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/member/bookings?tab=diagnostic`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(`/member/bookings?tab=diagnostic`)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>
                          {cart.items.length} test{cart.items.length > 1 ? 's' : ''} added
                        </p>
                        <p className="text-xs lg:text-sm text-gray-600">
                          Cart ID: {cart.cartId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {formatDate(cart.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={getStatusColor(cart.status)}
                        >
                          {cart.status}
                        </span>
                        <button className="mt-2 text-xs lg:text-sm font-medium" style={{ color: '#0F5FDC' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#0E51A2'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#0F5FDC'}
                        >
                          Review Cart →
                        </button>
                      </div>
                    </div>
                  </div>
                </DetailCard>
              ))}
            </div>
          </DetailCard>
        )}

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <DetailCard variant="primary">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>Recent Prescriptions</h3>
            </div>

            <div className="space-y-3">
              {prescriptions.slice(0, 5).map((prescription) => (
                <DetailCard
                  key={prescription.prescriptionId}
                  variant="secondary"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{prescription.fileName}</p>
                      <p className="text-xs lg:text-sm text-gray-500 mt-1">
                        Uploaded: {formatDate(prescription.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={getStatusColor(prescription.status)}
                      >
                        {prescription.status}
                      </span>
                      {prescription.status === 'DIGITIZING' && (
                        <ClockIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                      )}
                      {prescription.status === 'DIGITIZED' && prescription.cartId && (
                        <CheckCircleIcon className="h-5 w-5" style={{ color: '#25A425' }} />
                      )}
                    </div>
                  </div>
                  {prescription.status === 'DIGITIZED' && prescription.cartId && (
                    <div className="mt-3">
                      <CTAButton
                        onClick={() => router.push(`/member/bookings?tab=diagnostic`)}
                        variant="primary"
                        fullWidth
                      >
                        Review Cart
                      </CTAButton>
                    </div>
                  )}
                </DetailCard>
              ))}
            </div>
          </DetailCard>
        )}

        {/* View Orders Link */}
        <DetailCard variant="secondary">
          <CTAButton
            onClick={() => router.push('/member/bookings?tab=diagnostic')}
            variant="primary"
            fullWidth
          >
            View Diagnostic Bookings
          </CTAButton>
        </DetailCard>
      </div>

      {/* Modals */}
      <PrescriptionSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
        onSelect={handlePrescriptionSelect}
        serviceType="diagnostic"
      />

      <PrescriptionConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        serviceType="diagnostic"
        loading={submittingPrescription}
      />
    </div>
  )
}
