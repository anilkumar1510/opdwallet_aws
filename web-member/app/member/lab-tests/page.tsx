'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpTrayIcon,
  BeakerIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import PrescriptionSelectorModal from '@/components/PrescriptionSelectorModal'
import PrescriptionConfirmationModal from '@/components/PrescriptionConfirmationModal'
import PageHeader from '@/components/ui/PageHeader'

interface Prescription {
  prescriptionId: string
  fileName: string
  status: string
  uploadedAt: string
  cartId?: string
  doctorName?: string
  prescriptionDate?: string
  labTests?: Array<{ testName?: string } | string>
  hasOrder?: boolean
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

const HOW_IT_WORKS = [
  { title: 'Share the prescription', detail: 'PDF or a clear photo works.' },
  { title: 'Lab builds your cart', detail: 'Usually within 2 hours.' },
  { title: 'Pick a slot', detail: 'Paid from your OPD wallet.' },
]

const COVERED_TESTS = [
  'Complete Blood Count',
  'Thyroid',
  'Liver function',
  'Kidney function',
  'Blood sugar',
  'Lipid profile',
  'Vitamin D & B12',
]

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

    console.log('[LAB-TESTS-FRONTEND] Selected prescription:', prescription)
    console.log('[LAB-TESTS-FRONTEND] Prescription type:', prescription.type)

    try {
      const requestBody = {
        healthRecordId: prescription._id,
        prescriptionType: prescription.type.toUpperCase() as 'DIGITAL' | 'PDF',
        patientId: 'current', // Will be determined by backend
        patientName: 'Current Member', // Will be determined by backend
        patientRelationship: 'Self',
        pincode: '', // Will be determined by backend
        prescriptionDate: new Date().toISOString(),
      }

      console.log('[LAB-TESTS-FRONTEND] Request body:', requestBody)

      // Submit the existing prescription for lab services
      const response = await fetch('/api/member/lab/prescriptions/submit-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Lab Tests"
        subtitle="Book lab tests with ease"
        backHref="/member"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Hero — prescription to booking */}
        <section className="rounded-2xl bg-white p-5 lg:p-8 border border-[#EDF0F7] shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl lg:text-2xl font-bold leading-snug" style={{ color: '#0E51A2' }}>
                Turn a prescription into a booking
              </h2>
              <p className="mt-2 text-sm lg:text-[15px] leading-relaxed text-gray-600 max-w-md">
                Upload your doctor&apos;s prescription. The lab reads it, builds your cart,
                and you pick a slot — sample collection at home is included.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/member/lab-tests/upload')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm lg:text-[15px] font-semibold text-white transition-shadow hover:shadow-lg"
                  style={{ background: '#0F5FDC' }}
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Upload a prescription
                </button>

                <button
                  type="button"
                  onClick={() => setShowSelectorModal(true)}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm lg:text-[15px] font-semibold bg-white transition-colors hover:bg-[#F5F8FF]"
                  style={{ border: '1px solid #C9D8F0', color: '#0E51A2' }}
                >
                  Use a saved one
                </button>
              </div>
            </div>

            {/* Illustration slot — placeholder art, swap in final asset when ready */}
            <div
              aria-hidden="true"
              className="hidden lg:flex shrink-0 w-[280px] h-[160px] rounded-xl items-center justify-center text-center px-4"
              style={{
                border: '1px dashed #C9D8F0',
                background:
                  'repeating-linear-gradient(135deg, #F4F8FF 0px, #F4F8FF 6px, #FFFFFF 6px, #FFFFFF 12px)',
              }}
            >
              <div className="font-mono text-[11px] leading-5" style={{ color: '#8FA6C8' }}>
                <div>illustration</div>
                <div>prescription → lab → home visit</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {HOW_IT_WORKS.map((step, index) => (
            <section
              key={step.title}
              className="rounded-2xl bg-white p-4 lg:p-5 border border-[#EDF0F7] shadow-sm"
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: '#E7EFFB', color: '#1B5FC1' }}
              >
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm lg:text-[15px] font-semibold" style={{ color: '#0E51A2' }}>
                {step.title}
              </h3>
              <p className="mt-1 text-xs lg:text-sm text-gray-600">{step.detail}</p>
            </section>
          ))}
        </div>

        {/* Covered by your wallet */}
        <section className="rounded-2xl bg-white p-5 lg:p-6 border border-[#EDF0F7] shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: '#EAF1FB' }}
            >
              <BeakerIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>
                Covered by your wallet
              </h3>
              <p className="mt-0.5 text-xs lg:text-sm text-gray-600">
                Accurate, timely results from certified laboratories
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {COVERED_TESTS.map((test) => (
                  <span
                    key={test}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: '#EEF3FC', color: '#2A5A9E' }}
                  >
                    {test}
                  </span>
                ))}
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: '#F2F5FA', color: '#6B7C99' }}
                >
                  + 60 more
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Carts */}
        {carts.length > 0 && (
          <section className="rounded-2xl bg-white p-5 lg:p-6 border border-[#EDF0F7] shadow-sm">
            <h3 className="text-base lg:text-lg font-semibold flex items-center mb-4" style={{ color: '#0E51A2' }}>
              <ShoppingCartIcon className="h-5 w-5 lg:h-6 lg:w-6 mr-2" style={{ color: '#0F5FDC' }} />
              Your Carts ({carts.length})
            </h3>

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
                  className="rounded-xl p-4 hover:shadow-md cursor-pointer transition-all"
                  style={{ border: '1px solid #E1E9F5', background: '#FBFCFF' }}
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
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cart.status)}`}>
                        {cart.status}
                      </span>
                      <button className="text-xs lg:text-sm font-medium" style={{ color: '#0F5FDC' }}>
                        Review Cart →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <section className="rounded-2xl bg-white p-5 lg:p-6 border border-[#EDF0F7] shadow-sm">
            <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>
              Recent Prescriptions
            </h3>

            <div className="space-y-3">
              {prescriptions.slice(0, 2).map((prescription) => (
                <div
                  key={prescription.prescriptionId}
                  className="rounded-xl p-4"
                  style={{ border: '1px solid #E1E9F5', background: '#FBFCFF' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* File Name */}
                      <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{prescription.fileName}</p>

                      {/* Doctor Name and Date (if from health record) */}
                      {prescription.doctorName && (
                        <p className="text-xs lg:text-sm text-gray-600 mt-1">
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
                            {prescription.labTests.map((test, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{ background: '#EFF4FF', color: '#0F5FDC' }}
                              >
                                {typeof test === 'string' ? test : test.testName}
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
                        <ClockIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                      )}
                      {prescription.status === 'DIGITIZED' && prescription.cartId && (
                        <CheckCircleIcon className="h-5 w-5" style={{ color: '#25A425' }} />
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {prescription.status === 'DIGITIZED' && prescription.cartId && (
                    <button
                      type="button"
                      onClick={() => router.push(`/member/bookings?tab=lab`)}
                      className="mt-3 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-lg"
                      style={{ background: '#0F5FDC' }}
                    >
                      Review Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* View Orders Link */}
        <button
          type="button"
          onClick={() => router.push('/member/bookings?tab=lab')}
          className="w-full rounded-xl px-5 py-3 text-sm lg:text-[15px] font-semibold bg-white transition-colors hover:bg-[#F5F8FF]"
          style={{ border: '1px solid #C9D8F0', color: '#0E51A2' }}
        >
          View lab bookings
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
