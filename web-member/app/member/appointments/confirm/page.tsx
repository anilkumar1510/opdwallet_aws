'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BanknotesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import PaymentProcessor from '@/components/PaymentProcessor'

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
    router.push('/member/appointments')
  }

  const handleBackToDashboard = () => {
    console.log('[ConfirmAppointment] Navigating to dashboard')
    router.push('/member')
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been booked and is awaiting confirmation
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-600 mb-1">Appointment ID</div>
            <div className="text-xl font-bold" style={{ color: '#0a529f' }}>{appointmentId}</div>
          </div>

          <div className="space-y-3 text-left mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-gray-600">Doctor</div>
                <div className="font-medium text-gray-900">{doctorName}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-gray-600">Date</div>
                <div className="font-medium text-gray-900">{formatDate(appointmentDate || '')}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-gray-600">Time</div>
                <div className="font-medium text-gray-900">{timeSlot}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleViewAppointments}
              className="w-full py-3 px-4 text-white rounded-xl font-medium transition-colors"
              style={{ backgroundColor: '#0a529f' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
            >
              View Appointments
            </button>
            <button
              onClick={handleBackToDashboard}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Confirm Appointment</h1>
              <p className="text-sm text-gray-600">Review your booking details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Doctor Details</h3>
          <div className="flex items-start space-x-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <UserIcon className="h-8 w-8" style={{ color: '#0a529f' }} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{doctorName}</div>
              <div className="text-sm text-gray-600">{specialty}</div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-start space-x-3 text-sm">
              <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{clinicName}</div>
                <div className="text-gray-600">{clinicAddress}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Patient</span>
              </div>
              <span className="font-medium text-gray-900">{patientName}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Date</span>
              </div>
              <span className="font-medium text-gray-900">{formatDate(appointmentDate || '')}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Time</span>
              </div>
              <span className="font-medium text-gray-900">{timeSlot}</span>
            </div>
          </div>
        </div>

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
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
            <span className="ml-2 text-gray-600">Loading payment details...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfirmAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <ConfirmAppointmentContent />
    </Suspense>
  )
}