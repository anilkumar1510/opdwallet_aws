'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeftIcon, CheckCircleIcon, EyeIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!bookingData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Confirm Booking</h1>
          <p className="text-gray-600 mt-2">Review your appointment details</p>
        </div>

        {/* Booking Summary Card */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Summary</h2>

            {/* Service Info */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{bookingData.service?.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{bookingData.service?.description}</p>
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <UserIcon className="h-5 w-5" />
                Patient
              </div>
              <div className="ml-7">
                <p className="font-semibold text-gray-900">{bookingData.patient?.name}</p>
                <p className="text-sm text-gray-600">{bookingData.patient?.relationship}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <CalendarIcon className="h-5 w-5" />
                Date & Time
              </div>
              <div className="ml-7">
                <p className="font-semibold text-gray-900">
                  {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <ClockIcon className="h-4 w-4" />
                  {bookingData.appointmentTime}
                </p>
              </div>
            </div>

            {/* Clinic Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <MapPinIcon className="h-5 w-5" />
                Clinic Location
              </div>
              <div className="ml-7">
                <p className="font-semibold text-gray-900">{bookingData.clinic?.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {bookingData.clinic?.address?.street || bookingData.clinic?.address?.line1}
                </p>
                <p className="text-sm text-gray-600">
                  {bookingData.clinic?.address?.city}, {bookingData.clinic?.address?.state} - {bookingData.clinic?.address?.pincode}
                </p>
                <p className="text-sm text-gray-600 mt-1">Contact: {bookingData.clinic?.contactNumber}</p>
              </div>
            </div>

            {/* Service Fee (Informational) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Service Fee</span>
                <span className="text-lg font-bold text-gray-900">₹{bookingData.clinic?.servicePrice || 0}</span>
              </div>
              <p className="text-xs text-yellow-800 mt-2">
                Payment will be processed after your appointment is confirmed by our operations team
              </p>
            </div>
          </div>
        </Card>

        {/* Confirm Button */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="p-8 text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Your vision service appointment has been booked successfully.
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Booking ID: <span className="font-mono font-semibold">{bookingId}</span>
              </p>
              <p className="text-sm text-yellow-600 mb-2">
                Status: Pending Confirmation
              </p>
              <p className="text-xs text-gray-500">
                Our operations team will confirm your appointment shortly. Payment will be processed after confirmation.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function ConfirmBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <ConfirmBookingContent />
    </Suspense>
  )
}
