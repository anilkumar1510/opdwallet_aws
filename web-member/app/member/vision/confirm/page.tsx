'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircleIcon, EyeIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import IconCircle from '@/components/ui/IconCircle'

function ConfirmBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clinicId = searchParams.get('clinicId')
  const serviceCode = searchParams.get('serviceCode')
  const patientId = searchParams.get('patientId')
  const slotId = searchParams.get('slotId')
  const appointmentDate = searchParams.get('appointmentDate')
  const appointmentTime = searchParams.get('appointmentTime')

  const [loading, setLoading] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    if (!clinicId || !serviceCode || !patientId || !slotId || !appointmentDate || !appointmentTime) {
      router.push('/member/vision')
      return
    }
    fetchBookingData()
  }, [])

  const fetchBookingData = async () => {
    try {
      console.log('[VisionConfirm] Fetching booking details')
      setLoading(true)

      // Fetch clinic details
      const clinicResponse = await fetch(`/api/clinics/${clinicId}`, { credentials: 'include' })
      const clinicData = await clinicResponse.json()

      // Fetch service details
      const servicesResponse = await fetch(`/api/member/benefits/CAT007/services`, { credentials: 'include' })
      const servicesData = await servicesResponse.json()
      const service = servicesData.services?.find((s: any) => s.code === serviceCode)

      // Fetch patient details
      const profileResponse = await fetch('/api/member/profile', { credentials: 'include' })
      const profileData = await profileResponse.json()

      let patientInfo = null
      if (profileData.user._id === patientId) {
        patientInfo = {
          id: profileData.user._id,
          name: `${profileData.user.name.firstName} ${profileData.user.name.lastName}`,
          relationship: 'Self'
        }
      } else {
        const dependent = profileData.dependents?.find((d: any) => d._id === patientId)
        if (dependent) {
          patientInfo = {
            id: dependent._id,
            name: `${dependent.name.firstName} ${dependent.name.lastName}`,
            relationship: dependent.relationship || 'Family Member'
          }
        }
      }

      console.log('[VisionConfirm] Booking data loaded')

      setBookingData({
        clinic: clinicData,
        service: service,
        patient: patientInfo,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        slotId: slotId
      })

      setLoading(false)
    } catch (error) {
      console.error('[VisionConfirm] Error fetching booking data:', error)
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!bookingData) return

    try {
      console.log('[VisionConfirm] Creating booking without payment')
      setLoading(true)

      const response = await fetch('/api/vision-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientId: patientId,
          clinicId: clinicId,
          serviceCode: serviceCode,
          serviceName: bookingData.service?.name || 'Vision Service',
          slotId: slotId,
          price: bookingData.clinic?.servicePrice || 0,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create booking')
      }

      const result = await response.json()
      console.log('[VisionConfirm] Booking created:', result.bookingId)

      setBookingId(result.bookingId)
      setShowSuccessModal(true)

      // Redirect after 3 seconds
      setTimeout(() => router.push('/member/bookings'), 3000)

    } catch (error: any) {
      console.error('[VisionConfirm] Error creating booking:', error)
      alert('Failed to create booking: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Confirm Booking"
        subtitle="Review your appointment details"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8">
        {/* Booking Summary Card */}
        <DetailCard variant="primary" className="mb-6">
          <h2 className="text-base lg:text-lg font-semibold mb-4 lg:mb-6" style={{ color: '#0E51A2' }}>Appointment Summary</h2>

          {/* Service Info */}
          <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-start gap-3 lg:gap-4">
              <IconCircle icon={EyeIcon} size="md" />
              <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>{bookingData.service?.name}</h3>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">{bookingData.service?.description}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2 text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">
              <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
              Patient
            </div>
            <div className="ml-6 lg:ml-7">
              <p className="font-semibold text-sm lg:text-base" style={{ color: '#0E51A2' }}>{bookingData.patient?.name}</p>
              <p className="text-xs lg:text-sm text-gray-600">{bookingData.patient?.relationship}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2 text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">
              <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
              Date & Time
            </div>
            <div className="ml-6 lg:ml-7">
              <p className="font-semibold text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs lg:text-sm text-gray-600 flex items-center gap-2 mt-1">
                <ClockIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                {bookingData.appointmentTime}
              </p>
            </div>
          </div>

          {/* Clinic Info */}
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center gap-2 text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">
              <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: '#0F5FDC' }} />
              Clinic Location
            </div>
            <div className="ml-6 lg:ml-7">
              <p className="font-semibold text-sm lg:text-base" style={{ color: '#0E51A2' }}>{bookingData.clinic?.name}</p>
              <p className="text-xs lg:text-sm text-gray-600 mt-1">
                {bookingData.clinic?.address?.street || bookingData.clinic?.address?.line1}
              </p>
              <p className="text-xs lg:text-sm text-gray-600">
                {bookingData.clinic?.address?.city}, {bookingData.clinic?.address?.state} - {bookingData.clinic?.address?.pincode}
              </p>
              <p className="text-xs lg:text-sm text-gray-600 mt-1">Contact: {bookingData.clinic?.contactNumber}</p>
            </div>
          </div>

          {/* Service Fee (Informational) */}
          <DetailCard variant="secondary">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-sm font-medium text-gray-700">Service Fee</span>
              <span className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>₹{bookingData.clinic?.servicePrice || 0}</span>
            </div>
            <div className="mt-3 p-3 rounded-lg" style={{ background: '#FEF1E7', border: '1px solid #F9B376' }}>
              <p className="text-xs text-gray-700">
                Payment will be processed after your appointment is confirmed by our operations team
              </p>
            </div>
          </DetailCard>
        </DetailCard>

        {/* Confirm Button */}
        <div className="flex justify-end">
          <CTAButton
            onClick={handleConfirmBooking}
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </CTAButton>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <DetailCard variant="primary" className="max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#25A425' }}>
                <CheckCircleIcon className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2" style={{ color: '#0E51A2' }}>Booking Confirmed!</h3>
              <p className="text-sm lg:text-base text-gray-600 mb-4">
                Your vision service appointment has been booked successfully.
              </p>
              <DetailCard variant="secondary" className="mb-4">
                <p className="text-xs lg:text-sm text-gray-700 mb-1">
                  Booking ID
                </p>
                <p className="font-mono font-semibold text-sm lg:text-base" style={{ color: '#0F5FDC' }}>{bookingId}</p>
              </DetailCard>
              <div className="mb-4 p-3 rounded-lg" style={{ background: '#FEF1E7', border: '1px solid #F9B376' }}>
                <p className="text-xs lg:text-sm font-medium" style={{ color: '#E67E22' }}>Status: Pending Confirmation</p>
              </div>
              <p className="text-xs text-gray-500">
                Our operations team will confirm your appointment shortly. Payment will be processed after confirmation.
              </p>
            </div>
          </DetailCard>
        </div>
      )}
    </div>
  )
}

export default function ConfirmBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <ConfirmBookingContent />
    </Suspense>
  )
}
