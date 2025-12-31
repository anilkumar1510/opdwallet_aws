'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PaymentProcessor from '@/components/PaymentProcessor'
import { Card } from '@/components/ui/Card'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

function VisionPaymentContent() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null)

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      console.log('[VisionPayment] Fetching booking:', bookingId)

      // Get user ID first
      const userRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserId(userData._id)
      }

      // Get booking details
      const response = await fetch(`/api/vision-bookings/${bookingId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Booking not found')
      }

      const bookingData = await response.json()

      if (!bookingData.billGenerated) {
        alert('Bill has not been generated for this booking yet')
        router.push('/member/bookings')
        return
      }

      if (bookingData.paymentStatus === 'COMPLETED') {
        alert('Payment has already been completed')
        router.push('/member/bookings')
        return
      }

      // Verify breakdown data exists (should be calculated at bill generation time)
      if (
        bookingData.copayAmount === undefined ||
        bookingData.insurancePayment === undefined ||
        bookingData.totalMemberPayment === undefined ||
        bookingData.walletDebitAmount === undefined
      ) {
        throw new Error(
          'Payment breakdown not available. Please contact support or regenerate the bill.'
        )
      }

      console.log('[VisionPayment] Payment breakdown (from booking):', {
        billAmount: bookingData.billAmount,
        copayAmount: bookingData.copayAmount,
        insurancePayment: bookingData.insurancePayment,
        totalMemberPayment: bookingData.totalMemberPayment,
        walletDebitAmount: bookingData.walletDebitAmount,
      })

      setBooking(bookingData)

      // Construct payment breakdown from booking data (already calculated at bill generation)
      const breakdown = {
        billAmount: bookingData.billAmount,
        copayAmount: bookingData.copayAmount,
        insuranceEligibleAmount: bookingData.insuranceEligibleAmount,
        serviceTransactionLimit: bookingData.serviceTransactionLimit || 0,
        insurancePayment: bookingData.insurancePayment,
        excessAmount: bookingData.excessAmount,
        totalMemberPayment: bookingData.totalMemberPayment,
        walletDebitAmount: bookingData.walletDebitAmount,
      }

      setPaymentBreakdown(breakdown)

    } catch (error) {
      console.error('[VisionPayment] Error:', error)
      alert(error.message || 'Failed to load booking details')
      router.push('/member/bookings')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    console.log('[VisionPayment] Payment successful (wallet-only), completing booking...')

    // For wallet-only payments, just update booking status and generate invoice
    // PaymentProcessor already handled wallet debit and transaction creation
    try {
      await fetch(`/api/vision-bookings/${bookingId}/complete-wallet-payment`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('[VisionPayment] Error completing payment:', error)
    }

    alert('Payment completed successfully!')
    router.push('/member/bookings')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!booking || !paymentBreakdown) {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
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
          <h1 className="text-3xl font-bold text-gray-900">Payment for Vision Service</h1>
          <p className="text-gray-600 mt-2">Complete your payment for the appointment</p>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium">{booking.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{booking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clinic:</span>
                <span className="font-medium">{booking.clinicName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(booking.appointmentDate).toLocaleDateString()} at {booking.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-mono text-xs">{booking.bookingId}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Processor */}
        {userId && (
          <PaymentProcessor
            consultationFee={booking.billAmount}
            userId={userId}
            patientId={booking.patientId}
            patientName={booking.patientName}
            serviceType="VISION"
            bookingId={booking.bookingId}
            serviceDetails={{
              doctorName: booking.clinicName,
              clinicId: booking.clinicId,
              clinicName: booking.clinicName,
              serviceCode: booking.serviceCode,
              serviceName: booking.serviceName,
              slotId: booking.slotId,
              date: booking.appointmentDate,
              time: booking.appointmentTime
            }}
            serviceLimit={{
              serviceTransactionLimit: paymentBreakdown.serviceTransactionLimit,
              insuranceEligibleAmount: paymentBreakdown.insuranceEligibleAmount,
              insurancePayment: paymentBreakdown.insurancePayment,
              excessAmount: paymentBreakdown.excessAmount,
              wasLimitApplied: paymentBreakdown.serviceTransactionLimit < paymentBreakdown.insuranceEligibleAmount
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  )
}

export default function VisionPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <VisionPaymentContent />
    </Suspense>
  )
}
