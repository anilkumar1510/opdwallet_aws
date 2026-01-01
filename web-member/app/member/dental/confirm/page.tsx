'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserIcon, CalendarIcon, ClockIcon, MapPinIcon, BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PaymentProcessor from '@/components/PaymentProcessor'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import IconCircle from '@/components/ui/IconCircle'
import CTAButton from '@/components/ui/CTAButton'

function ConfirmDentalBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clinicId = searchParams.get('clinicId')
  const serviceCode = searchParams.get('serviceCode')
  const patientId = searchParams.get('patientId')
  const slotId = searchParams.get('slotId')
  const appointmentDate = searchParams.get('appointmentDate')
  const appointmentTime = searchParams.get('appointmentTime')

  const [loading, setLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [userId, setUserId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validating, setValidating] = useState(false)
  const [service, setService] = useState<any>(null)
  const [clinic, setClinic] = useState<any>(null)
  const [price, setPrice] = useState(0)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user
        const userRes = await fetch('/api/auth/me', { credentials: 'include' })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserId(userData._id)
        }

        // Fetch patient profile to get name
        if (patientId) {
          const profileRes = await fetch('/api/member/profile', { credentials: 'include' })
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // Check if patient is self or dependent
            if (profileData.user?._id === patientId) {
              setPatientName(`${profileData.user.name.firstName} ${profileData.user.name.lastName}`)
            } else {
              const dependent = profileData.dependents?.find((d: any) => d._id === patientId)
              if (dependent) {
                setPatientName(`${dependent.name.firstName} ${dependent.name.lastName}`)
              }
            }
          }
        }

        // Fetch service details
        const servicesRes = await fetch('/api/member/benefits/CAT006/services', { credentials: 'include' })
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          const foundService = servicesData.services?.find((s: any) => s.code === serviceCode)
          setService(foundService)
        }

        // Fetch clinic details
        const clinicsRes = await fetch(`/api/dental-bookings/clinics?serviceCode=${serviceCode}`, { credentials: 'include' })
        if (clinicsRes.ok) {
          const clinicsData = await clinicsRes.json()
          const foundClinic = clinicsData.clinics?.find((c: any) => c.clinicId === clinicId)
          setClinic(foundClinic)
          setPrice(foundClinic?.servicePrice || 0)
        }
      } catch (error) {
        console.error('[DentalConfirm] Error fetching data:', error)
      }
    }

    fetchData()
  }, [serviceCode, clinicId, patientId])

  // Validate booking
  useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !patientId || !price || !slotId) return

      console.log('[DentalConfirm] Validating booking...')
      setValidating(true)
      try {
        const response = await fetch('/api/dental-bookings/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            patientId,
            clinicId,
            serviceCode,
            slotId,
            price
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[DentalConfirm] Validation result:', data)
          setValidationResult(data)
        }
      } catch (error) {
        console.error('[DentalConfirm] Error validating booking:', error)
      } finally {
        setValidating(false)
      }
    }

    validateBooking()
  }, [userId, patientId, price, slotId, clinicId, serviceCode])

  const handlePaymentSuccess = async (transaction: any) => {
    console.log('[DentalConfirm] Payment successful, creating booking')
    setLoading(true)

    try {
      const bookingData = {
        patientId,
        clinicId,
        serviceCode,
        serviceName: service?.name || '',
        slotId,
        price,
        appointmentDate,
        appointmentTime,
        paymentAlreadyProcessed: true  // Indicate that PaymentProcessor already handled payment
      }

      console.log('[DentalConfirm] Creating booking with payment already processed')

      const response = await fetch('/api/dental-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      const booking = await response.json()
      console.log('[DentalConfirm] Booking created successfully:', booking)

      setBookingId(booking.bookingId)
      setBookingSuccess(true)
    } catch (error) {
      console.error('[DentalConfirm] Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f7fc' }}>
        <div className="max-w-[480px] w-full">
          <DetailCard variant="primary">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <IconCircle icon={CheckCircleIcon} size="lg" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>
                Booking Confirmed!
              </h1>
              <p className="text-sm lg:text-base text-gray-600 mb-2">Booking ID: {bookingId}</p>
              <p className="text-xs lg:text-sm text-gray-500 mb-6">
                {formatDate(appointmentDate || '')} at {appointmentTime}
              </p>
              <CTAButton
                variant="success"
                fullWidth
                onClick={() => router.push('/member/bookings')}
              >
                View Bookings
              </CTAButton>
            </div>
          </DetailCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Confirm Dental Booking"
        subtitle="Review your booking details"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Service Details */}
        <DetailCard variant="primary" className="mb-4 lg:mb-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>
            Service Details
          </h3>
          <div className="flex items-start gap-3 lg:gap-4 mb-4">
            <IconCircle icon={BanknotesIcon} size="md" />
            <div className="flex-1">
              <div className="font-semibold text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                {service?.name || 'Dental Service'}
              </div>
              <div className="text-xs lg:text-sm text-gray-600">{service?.description || ''}</div>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: '#F7DCAF' }}>
            <div className="flex items-start gap-3 text-sm lg:text-base">
              <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F5FDC' }} />
              <div>
                <div className="font-medium" style={{ color: '#0E51A2' }}>
                  {clinic?.clinicName}
                </div>
                <div className="text-gray-600">{clinic?.address?.city}</div>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Appointment Details */}
        <DetailCard variant="secondary" className="mb-4 lg:mb-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>
            Appointment Details
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base">
                <UserIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Patient</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                {patientName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base">
                <CalendarIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Date</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                {formatDate(appointmentDate || '')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base">
                <ClockIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Time</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                {appointmentTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-sm lg:text-base">
                <BanknotesIcon className="h-5 w-5" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Service Fee</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#25A425' }}>
                ₹{price}
              </span>
            </div>
          </div>
        </DetailCard>

        {/* Payment Processor Component */}
        {userId && patientId && (
          <PaymentProcessor
            consultationFee={price}
            userId={userId}
            patientId={patientId}
            patientName={patientName}
            serviceType="DENTAL"
            serviceDetails={{
              doctorName: clinic?.clinicName || 'Dental Service',
              clinicId: clinicId || '',
              clinicName: clinic?.clinicName || '',
              serviceCode: serviceCode || '',
              serviceName: service?.name || '',
              slotId: slotId || '',
              date: appointmentDate || '',
              time: appointmentTime || ''
            }}
            serviceLimit={validationResult?.breakdown?.serviceTransactionLimit ? {
              serviceTransactionLimit: validationResult.breakdown.serviceTransactionLimit,
              insuranceEligibleAmount: validationResult.breakdown.insuranceEligibleAmount,
              insurancePayment: validationResult.breakdown.insurancePayment,
              excessAmount: validationResult.breakdown.excessAmount,
              wasLimitApplied: true
            } : undefined}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={(error) => {
              console.error('[DentalConfirm] Payment failed:', error)
              alert('Payment failed. Please try again.')
            }}
          />
        )}

        {!userId && (
          <div className="flex items-center justify-center py-8 gap-3">
            <div
              className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
            ></div>
            <span className="text-sm lg:text-base text-gray-600">Loading payment details...</span>
          </div>
        )}
      </div>
    </div>
  )
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ConfirmDentalBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
          style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
        ></div>
      </div>
    }>
      <ConfirmDentalBookingContent />
    </Suspense>
  )
}
