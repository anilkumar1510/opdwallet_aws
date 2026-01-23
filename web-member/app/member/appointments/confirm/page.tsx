'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BanknotesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import PaymentProcessor from '@/components/PaymentProcessor'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import IconCircle from '@/components/ui/IconCircle'

function ConfirmAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const doctorId = searchParams.get('doctorId')
  const doctorName = searchParams.get('doctorName')
  const specialty = searchParams.get('specialty')
  const clinicId = searchParams.get('clinicId')
  const clinicName = searchParams.get('clinicName')
  const clinicAddress = searchParams.get('clinicAddress')
  const consultationFee = searchParams.get('consultationFee')
  const patientId = searchParams.get('patientId')
  const patientName = searchParams.get('patientName')
  const appointmentDate = searchParams.get('appointmentDate')
  const timeSlot = searchParams.get('timeSlot')
  const slotId = searchParams.get('slotId')

  const [loading, setLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [appointmentId, setAppointmentId] = useState('')
  const [userId, setUserId] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validating, setValidating] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Fetch user data on mount
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const userData = await response.json()
          setUserId(userData._id)
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Error fetching user data:', error)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUserData()
  }, [])

  // Validate booking and get payment breakdown with service limits
  React.useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !patientId || !consultationFee) {
        return
      }

      setValidating(true)
      try {
        const response = await fetch('/api/appointments/validate-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patientId,
            specialty,
            doctorId,
            consultationFee: parseFloat(consultationFee),
            appointmentType: 'IN_CLINIC'
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[ConfirmAppointment] Validation result:', data)
          setValidationResult(data)
        } else {
          console.error('[ConfirmAppointment] Validation failed:', response.status)
        }
      } catch (error) {
        console.error('[ConfirmAppointment] Error validating booking:', error)
      } finally {
        setValidating(false)
      }
    }

    validateBooking()
  }, [userId, patientId, specialty, consultationFee])

  const handlePaymentSuccess = async (transaction: any) => {
    console.log('[InClinicConfirm] Payment successful, creating appointment')

    try {
      const appointmentData = {
        userId,
        patientName,
        patientId,
        doctorId,
        doctorName,
        specialty,
        slotId: slotId || `${doctorId}_${clinicId}_${appointmentDate}_${timeSlot}`,
        clinicId,
        clinicName,
        clinicAddress,
        appointmentType: 'IN_CLINIC',
        appointmentDate,
        timeSlot,
        consultationFee: parseFloat(consultationFee || '0'),
        transactionId: transaction.transactionId
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        throw new Error('Failed to create appointment')
      }

      const appointment = await response.json()
      console.log('[InClinicConfirm] Appointment created successfully:', appointment)

      setAppointmentId(appointment.appointmentId)
      setBookingSuccess(true)
    } catch (error) {
      console.error('[InClinicConfirm] Error creating appointment after payment:', error)
      alert(`Payment successful but failed to book appointment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePaymentFailure = (error: string) => {
    console.error('[InClinicConfirm] Payment failed:', error)
    alert(`Payment failed: ${error}`)
  }

  const handleViewAppointments = () => {
    console.log('[ConfirmAppointment] Navigating to appointments list')
    router.push('/member/bookings?tab=doctors')
  }

  const handleBackToDashboard = () => {
    console.log('[ConfirmAppointment] Navigating to dashboard')
    router.push('/member')
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f7fc' }}>
        <div className="max-w-[480px] w-full">
          <DetailCard variant="primary" className="text-center">
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center"
                style={{ background: '#25A425' }}
              >
                <CheckCircleIcon className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
              </div>
            </div>

            <h2 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Booking Confirmed!</h2>
            <p className="text-sm lg:text-base text-gray-600 mb-6">
              Your appointment has been booked and is awaiting confirmation
            </p>

            <DetailCard variant="secondary" className="mb-6">
              <div className="text-xs lg:text-sm text-gray-600 mb-1">Appointment ID</div>
              <div className="text-lg lg:text-xl font-bold" style={{ color: '#0F5FDC' }}>{appointmentId}</div>
            </DetailCard>

            <div className="space-y-3 lg:space-y-4 text-left mb-6">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs lg:text-sm text-gray-600">Doctor</div>
                  <div className="font-medium text-sm lg:text-base truncate" style={{ color: '#0E51A2' }}>{doctorName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs lg:text-sm text-gray-600">Date</div>
                  <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>{formatDate(appointmentDate || '')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs lg:text-sm text-gray-600">Time</div>
                  <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>{timeSlot}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <CTAButton
                onClick={handleViewAppointments}
                variant="success"
                fullWidth
              >
                View Appointments
              </CTAButton>
              <button
                onClick={handleBackToDashboard}
                className="w-full py-3 lg:py-4 px-4 rounded-xl font-semibold transition-all hover:shadow-md text-sm lg:text-base"
                style={{ background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)', color: '#0F5FDC' }}
              >
                Back to Dashboard
              </button>
            </div>
          </DetailCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Confirm Appointment"
        subtitle="Review your booking details"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <DetailCard variant="primary" className="mb-4 lg:mb-5">
          <h3 className="font-semibold text-sm lg:text-base mb-4" style={{ color: '#0E51A2' }}>Doctor Details</h3>
          <div className="flex items-start gap-3 lg:gap-4 mb-4">
            <IconCircle icon={UserIcon} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base lg:text-lg truncate" style={{ color: '#0E51A2' }}>{doctorName}</div>
              <div className="text-xs lg:text-sm text-gray-600">{specialty}</div>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: '#F7DCAF' }}>
            <div className="flex items-start gap-3 text-sm lg:text-base">
              <MapPinIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0 mt-0.5" style={{ color: '#0F5FDC' }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: '#0E51A2' }}>{clinicName}</div>
                <div className="text-gray-600 text-xs lg:text-sm">{clinicAddress}</div>
              </div>
            </div>
          </div>
        </DetailCard>

        <DetailCard variant="secondary" className="mb-4 lg:mb-5">
          <h3 className="font-semibold text-sm lg:text-base mb-4" style={{ color: '#0E51A2' }}>Appointment Details</h3>

          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                <UserIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Patient</span>
              </div>
              <span className="font-medium text-sm lg:text-base truncate ml-2" style={{ color: '#0E51A2' }}>{patientName}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Date</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>{formatDate(appointmentDate || '')}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
                <span className="text-gray-600">Time</span>
              </div>
              <span className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>{timeSlot}</span>
            </div>
          </div>
        </DetailCard>

        {/* Payment Processor Component */}
        {!loadingUser && userId && patientId && (
          <PaymentProcessor
            consultationFee={parseFloat(consultationFee || '0')}
            userId={userId}
            patientId={patientId}
            patientName={patientName || ''}
            serviceType="APPOINTMENT"
            serviceDetails={{
              doctorName: doctorName || '',
              doctorId,
              date: appointmentDate || '',
              time: timeSlot || '',
              clinicName: clinicName || ''
            }}
            serviceLimit={validationResult?.breakdown?.wasServiceLimitApplied ? {
              serviceTransactionLimit: validationResult.breakdown.serviceTransactionLimit,
              insuranceEligibleAmount: validationResult.breakdown.insuranceEligibleAmount,
              insurancePayment: validationResult.breakdown.insurancePayment,
              excessAmount: validationResult.breakdown.excessAmount,
              wasLimitApplied: validationResult.breakdown.wasServiceLimitApplied
            } : undefined}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}

        {loadingUser && (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
            <span className="text-sm lg:text-base text-gray-600">Loading payment details...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfirmAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <ConfirmAppointmentContent />
    </Suspense>
  )
}