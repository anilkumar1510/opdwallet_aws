'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PaymentProcessor from '@/components/PaymentProcessor'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'

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
        router.push('/member/bookings?tab=vision')
        return
      }

      if (bookingData.paymentStatus === 'COMPLETED') {
        alert('Payment has already been completed')
        router.push('/member/bookings?tab=vision')
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
      router.push('/member/bookings?tab=vision')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (transaction: any) => {
    console.log('[VisionPayment] Payment successful, processing vision booking...')

    try {
      // Call the process-payment endpoint to complete the booking
      const response = await fetch(`/api/vision-bookings/${bookingId}/process-payment`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to complete booking')
      }

      const result = await response.json()
      console.log('[VisionPayment] Booking processed:', result)

      // Check if external payment is required (copay/OOP)
      if (result.paymentRequired && result.booking.paymentId) {
        // Redirect to payment gateway for copay/OOP
        router.push(`/member/payments/${result.booking.paymentId}?redirect=/member/bookings?tab=vision`)
        return
      }

      // Wallet-only payment completed
      alert('Payment completed successfully!')
      router.push('/member/bookings?tab=vision')
    } catch (error) {
      console.error('[VisionPayment] Error completing booking:', error)
      alert(error.message || 'Failed to complete booking. Please try again.')
    }
  }

  const handlePaymentFailure = (error: string) => {
    console.error('[VisionPayment] Payment failed:', error)
    alert(`Payment failed: ${error}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!booking || !paymentBreakdown) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Payment for Vision Service"
        subtitle="Complete your payment for the appointment"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8">
        {/* Booking Summary */}
        <DetailCard variant="primary" className="mb-6">
          <h2 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>Booking Details</h2>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Patient:</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>{booking.patientName}</span>
            </div>
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>{booking.serviceName}</span>
            </div>
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Clinic:</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>{booking.clinicName}</span>
            </div>
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium" style={{ color: '#0E51A2' }}>
                {new Date(booking.appointmentDate).toLocaleDateString()} at {booking.appointmentTime}
              </span>
            </div>
            <div className="flex justify-between text-xs lg:text-sm">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-mono text-xs" style={{ color: '#0F5FDC' }}>{booking.bookingId}</span>
            </div>
          </div>
        </DetailCard>

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
              serviceTransactionLimit: paymentBreakdown.serviceTransactionLimit || 0,
              insuranceEligibleAmount: paymentBreakdown.insuranceEligibleAmount,
              insurancePayment: paymentBreakdown.insurancePayment,
              excessAmount: paymentBreakdown.excessAmount,
              wasLimitApplied: paymentBreakdown.serviceTransactionLimit > 0 &&
                               paymentBreakdown.serviceTransactionLimit < paymentBreakdown.insuranceEligibleAmount,
              copayAmount: paymentBreakdown.copayAmount,
              walletDebitAmount: paymentBreakdown.walletDebitAmount,
              totalMemberPayment: paymentBreakdown.totalMemberPayment
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}
      </div>
    </div>
  )
}

export default function VisionPaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <VisionPaymentContent />
    </Suspense>
  )
}
