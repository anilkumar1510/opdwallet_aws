'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Your online consultation has been booked and is awaiting confirmation
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
              <div className="font-medium text-gray-900">{formatDate(appointmentDate)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-gray-600">Time</div>
              <div className="font-medium text-gray-900">{appointmentTime}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-gray-600">Contact Number</div>
              <div className="font-medium text-gray-900">{contactNumber}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            {callPreference === 'VOICE' && <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
            {callPreference === 'VIDEO' && <VideoCameraIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
            {callPreference === 'BOTH' && <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
            <div>
              <div className="text-gray-600">Call Preference</div>
              <div className="font-medium text-gray-900">
                {callPreference === 'BOTH' ? 'Voice & Video' : callPreference.charAt(0) + callPreference.slice(1).toLowerCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onViewAppointments}
            className="w-full py-3 px-4 text-white rounded-xl font-medium transition-colors"
            style={{ backgroundColor: '#0a529f' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
          >
            View Online Consultations
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
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

  // Helper function to set initial form data from user
  const setInitialFormData = (userData: any, selfMember: FamilyMember) => {
    setLoggedInUserId(userData._id)
    setFamilyMembers(prev => [...prev])
    setSelectedPatient(selfMember)
    setContactNumber(userData.phone || userData.mobileNumber || '')
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
      setInitialFormData(data.user, selfMember)
    } catch (error) {
      console.error('[OnlineConfirm] Error fetching family members:', error)
    } finally {
      setLoadingRelationships(false)
    }
  }, [])

  useEffect(() => {
    console.log('[OnlineConfirm] Params:', { doctorId, doctorName, specialty, availableInMinutes })
    fetchRelationships()
  }, [doctorId, doctorName, specialty, availableInMinutes, fetchRelationships])

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPaymentStep(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Payment & Confirmation</h1>
                <p className="text-sm text-gray-600">Complete payment to confirm booking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-4">
          {/* Booking Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserIcon className="h-6 w-6" style={{ color: '#0a529f' }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{doctorName}</h4>
                  <p className="text-sm text-gray-600">{specialty}</p>
                  <p className="text-sm text-gray-500 mt-1">Online Consultation</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient</span>
                  <span className="font-medium text-gray-900">
                    {selectedPatient.name} {!selectedPatient.isPrimary && `(${selectedPatient.relation})`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium text-gray-900">
                    {timeChoice === 'NOW' ? 'Immediate' : `${selectedDate} at ${selectedTime}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contact</span>
                  <span className="font-medium text-gray-900">{contactNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Preference</span>
                  <span className="font-medium text-gray-900">
                    {callPreference === 'BOTH' ? 'Voice & Video' : callPreference.charAt(0) + callPreference.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
              contactNumber: contactNumber
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-semibold text-gray-900">Confirm Booking</h1>
              <p className="text-sm text-gray-600">Review and confirm details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Doctor Details</h3>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserIcon className="h-6 w-6" style={{ color: '#0a529f' }} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{doctorName}</h4>
              <p className="text-sm text-gray-600">{specialty}</p>
              {availableInMinutes !== null && availableInMinutes <= 5 && (
                <span className="inline-flex items-center space-x-1 text-xs text-green-600 mt-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>Available {availableInMinutes === 0 ? 'now' : `in ${availableInMinutes} mins`}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Select Patient</h3>
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <button
                key={member._id}
                onClick={() => setSelectedPatient(member)}
                className={`w-full p-3 rounded-xl text-left transition-colors ${
                  selectedPatient?._id === member._id
                    ? 'bg-blue-50 border-2'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                style={selectedPatient?._id === member._id ? { borderColor: '#0a529f' } : {}}
              >
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-600">
                  {member.relation}{member.isPrimary && ' (You)'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Number</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Doctor will call you on this number</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Call Preference</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCallPreference('VOICE')}
              className={`p-3 rounded-xl border-2 transition-colors ${
                callPreference === 'VOICE'
                  ? 'bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={callPreference === 'VOICE' ? { borderColor: '#0a529f' } : {}}
            >
              <PhoneIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Voice</div>
            </button>
            <button
              onClick={() => setCallPreference('VIDEO')}
              className={`p-3 rounded-xl border-2 transition-colors ${
                callPreference === 'VIDEO'
                  ? 'bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={callPreference === 'VIDEO' ? { borderColor: '#0a529f' } : {}}
            >
              <VideoCameraIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Video</div>
            </button>
            <button
              onClick={() => setCallPreference('BOTH')}
              className={`p-3 rounded-xl border-2 transition-colors ${
                callPreference === 'BOTH'
                  ? 'bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={callPreference === 'BOTH' ? { borderColor: '#0a529f' } : {}}
            >
              <div className="text-sm font-medium text-gray-900 mb-1">Both</div>
              <div className="text-xs text-gray-600">Voice & Video</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">When do you want to consult?</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setTimeChoice('NOW')}
              className={`p-4 rounded-xl border-2 transition-colors ${
                timeChoice === 'NOW'
                  ? 'bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={timeChoice === 'NOW' ? { borderColor: '#0a529f' } : {}}
            >
              <ClockIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Consult Now</div>
              <div className="text-xs text-gray-600 mt-1">Immediate</div>
            </button>
            <button
              onClick={handleScheduleLater}
              className={`p-4 rounded-xl border-2 transition-colors ${
                timeChoice === 'LATER'
                  ? 'bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={timeChoice === 'LATER' ? { borderColor: '#0a529f' } : {}}
            >
              <CalendarIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Schedule Later</div>
              <div className="text-xs text-gray-600 mt-1">Choose time</div>
            </button>
          </div>

          {timeChoice === 'LATER' && selectedDate && selectedTime && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="text-sm text-gray-600">Selected Time:</div>
              <div className="font-semibold text-gray-900">{selectedDate} at {selectedTime}</div>
              <button
                onClick={handleScheduleLater}
                className="text-sm mt-1"
                style={{ color: '#0a529f' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#084080'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#0a529f'}
              >
                Change slot
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="font-semibold text-gray-900">₹{consultationFee}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Platform Fee</span>
            <span className="font-semibold text-gray-900">₹0</span>
          </div>
          <div className="border-t border-gray-200 my-3"></div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total Amount</span>
            <span className="text-xl font-bold" style={{ color: '#0a529f' }}>₹{consultationFee}</span>
          </div>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={loading || !selectedPatient || !contactNumber}
          className="w-full py-4 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center"
          style={!(loading || !selectedPatient || !contactNumber) ? { backgroundColor: '#0a529f' } : {}}
          onMouseEnter={(e) => { if (!(loading || !selectedPatient || !contactNumber)) e.currentTarget.style.backgroundColor = '#084080' }}
          onMouseLeave={(e) => { if (!(loading || !selectedPatient || !contactNumber)) e.currentTarget.style.backgroundColor = '#0a529f' }}
        >
          <CreditCardIcon className="h-6 w-6 mr-2" />
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <OnlineConfirmContent />
    </Suspense>
  )
}