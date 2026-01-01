'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  UserIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import SlotSelectionModal from '@/components/SlotSelectionModal'
import { emitAppointmentEvent, AppointmentEvents } from '@/lib/appointmentEvents'
import PaymentProcessor from '@/components/PaymentProcessor'
import { createTransaction } from '@/lib/transactions'
import { useFamily } from '@/contexts/FamilyContext'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import IconCircle from '@/components/ui/IconCircle'

// Success screen component
function BookingSuccessScreen({
  appointmentId,
  doctorName,
  appointmentDate,
  appointmentTime,
  contactNumber,
  callPreference,
  onViewAppointments,
  onBackToDashboard
}: {
  appointmentId: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  contactNumber: string
  callPreference: 'VOICE' | 'VIDEO' | 'BOTH'
  onViewAppointments: () => void
  onBackToDashboard: () => void
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === new Date().toISOString().split('T')[0]) {
      return 'Today'
    }
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

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

          <h2 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>
            Booking Confirmed!
          </h2>
          <p className="text-sm lg:text-base text-gray-600 mb-6">
            Your online consultation has been booked and is awaiting confirmation
          </p>

          <DetailCard variant="secondary" className="mb-6">
            <div className="text-xs lg:text-sm text-gray-600 mb-1">Appointment ID</div>
            <div className="text-lg lg:text-xl font-bold" style={{ color: '#0F5FDC' }}>
              {appointmentId}
            </div>
          </DetailCard>

          <div className="space-y-3 lg:space-y-4 text-left mb-6">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-gray-600">Doctor</div>
                <div className="font-medium text-sm lg:text-base truncate" style={{ color: '#0E51A2' }}>
                  {doctorName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-gray-600">Date</div>
                <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                  {formatDate(appointmentDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-gray-600">Time</div>
                <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                  {appointmentTime}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-gray-600">Contact Number</div>
                <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                  {contactNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {callPreference === 'VOICE' && <PhoneIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />}
              {callPreference === 'VIDEO' && <VideoCameraIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />}
              {callPreference === 'BOTH' && <PhoneIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />}
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-gray-600">Call Preference</div>
                <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                  {callPreference === 'BOTH' ? 'Voice & Video' : callPreference.charAt(0) + callPreference.slice(1).toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <CTAButton
              onClick={onViewAppointments}
              variant="success"
              fullWidth
            >
              View Online Consultations
            </CTAButton>
            <button
              onClick={onBackToDashboard}
              className="w-full py-3 lg:py-4 px-4 rounded-xl font-semibold transition-all hover:shadow-md text-sm lg:text-base"
              style={{
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                color: '#0F5FDC'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

interface FamilyMember {
  _id: string
  userId: string  // MongoDB ObjectId for wallet operations
  name: string
  relation: string
  gender: string
  dateOfBirth: string
  isPrimary: boolean
}

function OnlineConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewingUserId } = useFamily()

  const doctorId = searchParams.get('doctorId') || ''
  const doctorName = searchParams.get('doctorName') || ''
  const specialty = searchParams.get('specialty') || ''
  const consultationFee = searchParams.get('consultationFee') || '0'
  const availableInMinutes = parseInt(searchParams.get('availableInMinutes') || '0')

  const [loading, setLoading] = useState(false)
  const [loadingRelationships, setLoadingRelationships] = useState(true)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedPatient, setSelectedPatient] = useState<FamilyMember | null>(null)
  const [loggedInUserId, setLoggedInUserId] = useState<string>('')
  const [contactNumber, setContactNumber] = useState('')
  const [callPreference, setCallPreference] = useState<'VOICE' | 'VIDEO' | 'BOTH'>('BOTH')
  const [timeChoice, setTimeChoice] = useState<'NOW' | 'LATER'>('NOW')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [appointmentId, setAppointmentId] = useState('')
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [paymentProcessed, setPaymentProcessed] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validating, setValidating] = useState(false)

  // Helper function to build self member
  const buildSelfMember = (userData: any): FamilyMember => ({
    _id: userData._id,
    userId: userData._id,
    name: `${userData.name.firstName} ${userData.name.lastName}`,
    relation: 'Self',
    gender: userData.gender || 'Other',
    dateOfBirth: userData.dob || '',
    isPrimary: true
  })

  // Helper function to build dependent members list
  const buildDependentMembers = (dependents: any[]): FamilyMember[] => {
    return (dependents || []).map((dep: any) => ({
      _id: dep._id,
      userId: dep._id,
      name: `${dep.name.firstName} ${dep.name.lastName}`,
      relation: dep.relationship || 'Family Member',
      gender: dep.gender || 'Other',
      dateOfBirth: dep.dob || '',
      isPrimary: false
    }))
  }

  const fetchRelationships = useCallback(async () => {
    try {
      console.log('[OnlineConfirm] Fetching family members from /api/member/profile')
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[OnlineConfirm] Profile data received:', {
        userId: data.user?._id,
        dependentsCount: data.dependents?.length || 0
      })

      // Process family data inline
      const selfMember = buildSelfMember(data.user)
      const dependentMembers = buildDependentMembers(data.dependents)
      const allMembers = [selfMember, ...dependentMembers]

      console.log('[OnlineConfirm] Total family members:', allMembers.length)

      setFamilyMembers(allMembers)
      setLoggedInUserId(data.user._id)
      setContactNumber(data.user.phone || data.user.mobileNumber || '')

      // PRIVACY: Auto-select patient based on currently viewed profile
      if (viewingUserId && allMembers.length > 0) {
        const defaultMember = allMembers.find(m => m.userId === viewingUserId)
        if (defaultMember) {
          setSelectedPatient(defaultMember)
          console.log('[OnlineConfirm] Auto-selected patient from viewingUserId:', {
            patientId: defaultMember.userId,
            patientName: defaultMember.name,
            viewingUserId
          })
        } else {
          // Fallback to self if viewingUserId not found
          setSelectedPatient(selfMember)
          console.log('[OnlineConfirm] viewingUserId not found in family members, fallback to self:', viewingUserId)
        }
      } else {
        // Fallback to self if no viewingUserId
        setSelectedPatient(selfMember)
        console.log('[OnlineConfirm] No viewingUserId, defaulting to self')
      }
    } catch (error) {
      console.error('[OnlineConfirm] Error fetching family members:', error)
    } finally {
      setLoadingRelationships(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    console.log('[OnlineConfirm] Params:', { doctorId, doctorName, specialty, availableInMinutes })
    fetchRelationships()
  }, [doctorId, doctorName, specialty, availableInMinutes, fetchRelationships, viewingUserId])

  // Validate booking and get payment breakdown with service limits
  React.useEffect(() => {
    const validateBooking = async () => {
      if (!loggedInUserId || !selectedPatient || !consultationFee || !specialty) {
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
            patientId: selectedPatient.userId,
            specialty,
            doctorId,
            consultationFee: parseFloat(consultationFee),
            appointmentType: 'ONLINE'
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[OnlineConfirm] Validation result:', data)
          setValidationResult(data)
        } else {
          console.error('[OnlineConfirm] Validation failed:', response.status)
        }
      } catch (error) {
        console.error('[OnlineConfirm] Error validating booking:', error)
      } finally {
        setValidating(false)
      }
    }

    validateBooking()
  }, [loggedInUserId, selectedPatient, specialty, consultationFee, doctorId])

  // Helper function to validate booking form
  const validateBookingForm = (): boolean => {
    if (!selectedPatient || !contactNumber) {
      alert('Please select patient and enter contact number')
      return false
    }

    if (timeChoice === 'LATER' && (!selectedDate || !selectedTime)) {
      alert('Please select a time slot')
      return false
    }

    return true
  }

  // Helper function to get appointment date and time
  const getAppointmentDateTime = () => {
    const appointmentDate = timeChoice === 'NOW'
      ? new Date().toISOString().split('T')[0]
      : selectedDate

    const appointmentTime = timeChoice === 'NOW'
      ? 'Immediate'
      : selectedTime

    return { appointmentDate, appointmentTime }
  }

  // Helper function to generate slot ID
  const generateSlotId = (appointmentDate: string, appointmentTime: string): string => {
    if (timeChoice === 'LATER' && selectedSlotId) {
      return selectedSlotId
    }
    return `${doctorId}_ONLINE_${appointmentDate}_${appointmentTime.replace(/[:\s]/g, '_')}`
  }

  // Helper function to build appointment payload
  const buildAppointmentPayload = (appointmentDate: string, appointmentTime: string) => {
    if (!selectedPatient) {
      throw new Error('No patient selected')
    }

    return {
      userId: loggedInUserId,
      patientId: selectedPatient.userId,
      doctorId,
      doctorName,
      specialty,
      patientName: selectedPatient.name,
      appointmentType: 'ONLINE',
      appointmentDate,
      timeSlot: appointmentTime,
      slotId: generateSlotId(appointmentDate, appointmentTime),
      consultationFee: parseFloat(consultationFee),
      contactNumber,
      callPreference,
      clinicId: '',
      clinicName: '',
      clinicAddress: ''
    }
  }

  // Helper function to create appointment via API
  const createAppointmentAPI = async (payload: any) => {
    console.log('[OnlineConfirm] Creating appointment with payload:', JSON.stringify(payload, null, 2))

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    console.log('[OnlineConfirm] API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[OnlineConfirm] API error response:', errorData)
      throw new Error(`Failed to create appointment: ${response.status} ${errorData}`)
    }

    return await response.json()
  }

  const handleConfirmBooking = async () => {
    console.log('[OnlineConfirm] Starting booking validation')
    console.log('[OnlineConfirm] Selected patient:', selectedPatient)
    console.log('[OnlineConfirm] Contact number:', contactNumber)
    console.log('[OnlineConfirm] Time choice:', timeChoice)

    if (!validateBookingForm()) {
      return
    }

    // Show payment step instead of directly creating appointment
    setShowPaymentStep(true)
  }

  const handlePaymentSuccess = async (transaction: any) => {
    console.log('[OnlineConfirm] Payment successful, creating appointment')

    try {
      const { appointmentDate, appointmentTime } = getAppointmentDateTime()
      const payload = buildAppointmentPayload(appointmentDate, appointmentTime)

      // Add transaction ID to payload
      const appointmentWithTransaction = {
        ...payload,
        transactionId: transaction.transactionId
      }

      const appointment = await createAppointmentAPI(appointmentWithTransaction)
      console.log('[OnlineConfirm] Appointment created successfully:', appointment)

      setAppointmentId(appointment.appointmentId)
      setTransactionId(transaction.transactionId)
      setPaymentProcessed(true)
      setBookingSuccess(true)

      // Emit appointment created event
      emitAppointmentEvent(AppointmentEvents.BOOKING_CREATED)
    } catch (error) {
      console.error('[OnlineConfirm] Error creating appointment after payment:', error)
      alert(`Payment successful but failed to book appointment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePaymentFailure = (error: string) => {
    console.error('[OnlineConfirm] Payment failed:', error)
    alert(`Payment failed: ${error}`)
    setShowPaymentStep(false)
  }

  const handleScheduleLater = () => {
    console.log('[OnlineConfirm] Schedule later clicked')
    setShowSlotModal(true)
  }

  const handleSlotSelected = (date: string, time: string, slotId: string) => {
    console.log('[OnlineConfirm] Slot selected:', { date, time, slotId })
    setSelectedDate(date)
    setSelectedTime(time)
    setSelectedSlotId(slotId)
    setTimeChoice('LATER')
  }

  const handleViewAppointments = () => {
    console.log('[OnlineConfirm] Navigating to online consultations list')
    router.push('/member/online-consult')
  }

  const handleBackToDashboard = () => {
    console.log('[OnlineConfirm] Navigating to dashboard')
    router.push('/member')
  }

  // Helper function to get success screen appointment details
  const getSuccessScreenDetails = () => {
    const appointmentDate = timeChoice === 'NOW'
      ? new Date().toISOString().split('T')[0]
      : selectedDate

    const appointmentTime = timeChoice === 'NOW'
      ? 'Immediate'
      : selectedTime

    return { appointmentDate, appointmentTime }
  }

  // Early return for loading state
  if (loadingRelationships) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  // Early return for success state
  if (bookingSuccess) {
    const { appointmentDate, appointmentTime } = getSuccessScreenDetails()

    return (
      <BookingSuccessScreen
        appointmentId={appointmentId}
        doctorName={doctorName}
        appointmentDate={appointmentDate}
        appointmentTime={appointmentTime}
        contactNumber={contactNumber}
        callPreference={callPreference}
        onViewAppointments={handleViewAppointments}
        onBackToDashboard={handleBackToDashboard}
      />
    )
  }

  // Show payment step
  if (showPaymentStep && selectedPatient && !paymentProcessed) {
    return (
      <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
        <PageHeader
          title="Payment & Confirmation"
          subtitle="Complete payment to confirm booking"
          onBack={() => setShowPaymentStep(false)}
        />

        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
          {/* Booking Summary */}
          <DetailCard variant="primary">
            <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
              Booking Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 lg:gap-4">
                <IconCircle icon={UserIcon} size="lg" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-base lg:text-lg truncate" style={{ color: '#0E51A2' }}>
                    {doctorName}
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-600">{specialty}</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">Online Consultation</p>
                </div>
              </div>

              <DetailCard variant="secondary" className="mb-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-600">Patient</span>
                    <span className="font-medium text-gray-900 truncate ml-2">
                      {selectedPatient.name} {!selectedPatient.isPrimary && `(${selectedPatient.relation})`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-medium text-gray-900 text-right ml-2">
                      {timeChoice === 'NOW' ? 'Immediate' : `${selectedDate} at ${selectedTime}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-600">Contact</span>
                    <span className="font-medium text-gray-900">{contactNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-gray-600">Preference</span>
                    <span className="font-medium text-gray-900">
                      {callPreference === 'BOTH' ? 'Voice & Video' : callPreference.charAt(0) + callPreference.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              </DetailCard>
            </div>
          </DetailCard>

          {/* Payment Component */}
          <PaymentProcessor
            consultationFee={parseFloat(consultationFee)}
            userId={loggedInUserId}
            patientId={selectedPatient.userId}
            patientName={selectedPatient.name}
            serviceType="ONLINE_CONSULTATION"
            serviceDetails={{
              doctorName: doctorName,
              doctorId: doctorId,
              date: timeChoice === 'NOW' ? new Date().toISOString().split('T')[0] : selectedDate,
              time: timeChoice === 'NOW' ? 'Immediate' : selectedTime,
              slotId: timeChoice === 'NOW'
                ? `${doctorId}_ONLINE_${new Date().toISOString().split('T')[0]}_Immediate`
                : selectedSlotId || `${doctorId}_ONLINE_${selectedDate}_${selectedTime}`,
              contactNumber: contactNumber,
              callPreference: callPreference
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Confirm Booking"
        subtitle="Review and confirm details"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        <DetailCard variant="primary">
          <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
            Doctor Details
          </h3>
          <div className="flex items-start gap-3 lg:gap-4">
            <IconCircle icon={UserIcon} size="lg" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base lg:text-lg truncate" style={{ color: '#0E51A2' }}>
                {doctorName}
              </h4>
              <p className="text-xs lg:text-sm text-gray-600 mb-1">{specialty}</p>
              {availableInMinutes !== null && availableInMinutes <= 5 && (
                <span
                  className="inline-flex items-center gap-1 text-xs lg:text-sm px-2 py-1 rounded-lg"
                  style={{ background: '#E8F5E9', color: '#25A425' }}
                >
                  <ClockIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="font-medium">
                    Available {availableInMinutes === 0 ? 'now' : `in ${availableInMinutes} mins`}
                  </span>
                </span>
              )}
            </div>
          </div>
        </DetailCard>

        <DetailCard variant="secondary">
          <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
            Select Patient
          </h3>
          <div className="space-y-2 lg:space-y-3">
            {familyMembers.map((member) => (
              <button
                key={member._id}
                onClick={() => setSelectedPatient(member)}
                className={`w-full p-3 lg:p-4 rounded-xl text-left transition-all border-2 ${
                  selectedPatient?._id === member._id
                    ? 'shadow-md'
                    : 'hover:shadow-sm'
                }`}
                style={
                  selectedPatient?._id === member._id
                    ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC', color: '#FFFFFF' }
                    : { background: '#FFFFFF', borderColor: '#86ACD8' }
                }
              >
                <div className="font-medium text-sm lg:text-base">{member.name}</div>
                <div
                  className="text-xs lg:text-sm mt-1"
                  style={{
                    color: selectedPatient?._id === member._id ? 'rgba(255, 255, 255, 0.8)' : '#6B7280'
                  }}
                >
                  {member.relation}{member.isPrimary && ' (You)'}
                </div>
              </button>
            ))}
          </div>
        </DetailCard>

        <DetailCard variant="secondary">
          <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
            Contact Number
          </h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
              className="block w-full pl-10 pr-3 py-3 lg:py-4 border-2 rounded-xl text-sm lg:text-base focus:outline-none transition-all"
              style={{ borderColor: '#86ACD8', background: '#FFFFFF' }}
              onFocus={(e) => e.target.style.borderColor = '#0F5FDC'}
              onBlur={(e) => e.target.style.borderColor = '#86ACD8'}
            />
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mt-2">
            Doctor will call you on this number
          </p>
        </DetailCard>

        <DetailCard variant="secondary">
          <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
            Call Preference
          </h3>
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            <button
              onClick={() => setCallPreference('VOICE')}
              className="p-3 lg:p-4 rounded-xl border-2 transition-all"
              style={
                callPreference === 'VOICE'
                  ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC' }
                  : { background: '#FFFFFF', borderColor: '#86ACD8' }
              }
            >
              <PhoneIcon
                className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-1"
                style={{ color: callPreference === 'VOICE' ? '#FFFFFF' : '#0E51A2' }}
              />
              <div
                className="text-xs lg:text-sm font-medium"
                style={{ color: callPreference === 'VOICE' ? '#FFFFFF' : '#0E51A2' }}
              >
                Voice
              </div>
            </button>
            <button
              onClick={() => setCallPreference('VIDEO')}
              className="p-3 lg:p-4 rounded-xl border-2 transition-all"
              style={
                callPreference === 'VIDEO'
                  ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC' }
                  : { background: '#FFFFFF', borderColor: '#86ACD8' }
              }
            >
              <VideoCameraIcon
                className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-1"
                style={{ color: callPreference === 'VIDEO' ? '#FFFFFF' : '#0E51A2' }}
              />
              <div
                className="text-xs lg:text-sm font-medium"
                style={{ color: callPreference === 'VIDEO' ? '#FFFFFF' : '#0E51A2' }}
              >
                Video
              </div>
            </button>
            <button
              onClick={() => setCallPreference('BOTH')}
              className="p-3 lg:p-4 rounded-xl border-2 transition-all"
              style={
                callPreference === 'BOTH'
                  ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC' }
                  : { background: '#FFFFFF', borderColor: '#86ACD8' }
              }
            >
              <div
                className="text-xs lg:text-sm font-medium mb-1"
                style={{ color: callPreference === 'BOTH' ? '#FFFFFF' : '#0E51A2' }}
              >
                Both
              </div>
              <div
                className="text-xs"
                style={{ color: callPreference === 'BOTH' ? 'rgba(255, 255, 255, 0.8)' : '#6B7280' }}
              >
                Voice & Video
              </div>
            </button>
          </div>
        </DetailCard>

        <DetailCard variant="secondary">
          <h3 className="font-semibold text-base lg:text-lg mb-4" style={{ color: '#0E51A2' }}>
            When do you want to consult?
          </h3>
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-3">
            <button
              onClick={() => setTimeChoice('NOW')}
              className="p-4 lg:p-5 rounded-xl border-2 transition-all"
              style={
                timeChoice === 'NOW'
                  ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC' }
                  : { background: '#FFFFFF', borderColor: '#86ACD8' }
              }
            >
              <ClockIcon
                className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-2"
                style={{ color: timeChoice === 'NOW' ? '#FFFFFF' : '#0E51A2' }}
              />
              <div
                className="text-sm lg:text-base font-medium"
                style={{ color: timeChoice === 'NOW' ? '#FFFFFF' : '#0E51A2' }}
              >
                Consult Now
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: timeChoice === 'NOW' ? 'rgba(255, 255, 255, 0.8)' : '#6B7280' }}
              >
                Immediate
              </div>
            </button>
            <button
              onClick={handleScheduleLater}
              className="p-4 lg:p-5 rounded-xl border-2 transition-all"
              style={
                timeChoice === 'LATER'
                  ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)', borderColor: '#0F5FDC' }
                  : { background: '#FFFFFF', borderColor: '#86ACD8' }
              }
            >
              <CalendarIcon
                className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-2"
                style={{ color: timeChoice === 'LATER' ? '#FFFFFF' : '#0E51A2' }}
              />
              <div
                className="text-sm lg:text-base font-medium"
                style={{ color: timeChoice === 'LATER' ? '#FFFFFF' : '#0E51A2' }}
              >
                Schedule Later
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: timeChoice === 'LATER' ? 'rgba(255, 255, 255, 0.8)' : '#6B7280' }}
              >
                Choose time
              </div>
            </button>
          </div>

          {timeChoice === 'LATER' && selectedDate && selectedTime && (
            <div className="rounded-xl p-3 lg:p-4 border-2" style={{ background: '#E8F5E9', borderColor: '#25A425' }}>
              <div className="text-xs lg:text-sm text-gray-600">Selected Time:</div>
              <div className="font-semibold text-sm lg:text-base mt-1" style={{ color: '#0E51A2' }}>
                {selectedDate} at {selectedTime}
              </div>
              <button
                onClick={handleScheduleLater}
                className="text-xs lg:text-sm mt-2 font-medium"
                style={{ color: '#0F5FDC' }}
              >
                Change slot
              </button>
            </div>
          )}
        </DetailCard>

        <DetailCard variant="primary">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm lg:text-base">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-semibold text-gray-900">₹{consultationFee}</span>
            </div>
            <div className="flex items-center justify-between text-sm lg:text-base">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-semibold text-gray-900">₹0</span>
            </div>
            <div className="border-t-2 my-3" style={{ borderColor: '#F7DCAF' }}></div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base lg:text-lg text-gray-900">Total Amount</span>
              <span className="text-xl lg:text-2xl font-bold" style={{ color: '#25A425' }}>
                ₹{consultationFee}
              </span>
            </div>
          </div>
        </DetailCard>

        <CTAButton
          onClick={handleConfirmBooking}
          disabled={loading || !selectedPatient || !contactNumber}
          variant="primary"
          fullWidth
          leftIcon={CreditCardIcon}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </CTAButton>
      </div>

      <SlotSelectionModal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        doctorId={doctorId}
        doctorName={doctorName}
        onSelectSlot={handleSlotSelected}
      />
    </div>
  )
}

export default function OnlineConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <OnlineConfirmContent />
    </Suspense>
  )
}