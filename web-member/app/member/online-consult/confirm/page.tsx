'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  UserIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import SlotSelectionModal from '@/components/SlotSelectionModal'

interface Relationship {
  _id: string
  name: string
  relation: string
  gender: string
  dateOfBirth: string
  relationshipId: string
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
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Relationship | null>(null)
  const [contactNumber, setContactNumber] = useState('')
  const [callPreference, setCallPreference] = useState<'VOICE' | 'VIDEO' | 'BOTH'>('BOTH')
  const [timeChoice, setTimeChoice] = useState<'NOW' | 'LATER'>('NOW')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [showSlotModal, setShowSlotModal] = useState(false)

  useEffect(() => {
    console.log('[OnlineConfirm] Params:', { doctorId, doctorName, specialty, availableInMinutes })
    fetchRelationships()
  }, [])

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[OnlineConfirm] User data:', data)

      const userName = typeof data.name === 'object'
        ? `${data.name.firstName || ''} ${data.name.lastName || ''}`.trim()
        : data.name || 'Unknown'

      console.log('[OnlineConfirm] Processed user name:', userName)

      const selfRelationship = {
        _id: 'self',
        name: userName,
        relation: 'Self',
        gender: data.gender || 'Other',
        dateOfBirth: data.dateOfBirth || data.dob || '',
        relationshipId: 'SELF'
      }

      const relationships = data.relationships || []
      console.log('[OnlineConfirm] Raw relationships:', relationships)

      const processedRelationships = relationships.map((rel: any) => ({
        ...rel,
        name: typeof rel.name === 'object'
          ? `${rel.name.firstName || ''} ${rel.name.lastName || ''}`.trim()
          : rel.name || 'Unknown'
      }))

      console.log('[OnlineConfirm] Processed relationships:', processedRelationships)

      const allRelationships = [selfRelationship, ...processedRelationships]
      console.log('[OnlineConfirm] All relationships:', allRelationships)

      setRelationships(allRelationships)
      setSelectedPatient(selfRelationship)
      setContactNumber(data.phone || data.mobileNumber || '')
    } catch (error) {
      console.error('[OnlineConfirm] Error fetching relationships:', error)
    } finally {
      setLoadingRelationships(false)
    }
  }

  const handleConfirmBooking = async () => {
    console.log('[OnlineConfirm] Starting booking process')
    console.log('[OnlineConfirm] Selected patient:', selectedPatient)
    console.log('[OnlineConfirm] Contact number:', contactNumber)
    console.log('[OnlineConfirm] Time choice:', timeChoice)

    if (!selectedPatient || !contactNumber) {
      alert('Please select patient and enter contact number')
      return
    }

    if (timeChoice === 'LATER' && (!selectedDate || !selectedTime)) {
      alert('Please select a time slot')
      return
    }

    setLoading(true)

    try {
      const appointmentDate = timeChoice === 'NOW'
        ? new Date().toISOString().split('T')[0]
        : selectedDate

      const appointmentTime = timeChoice === 'NOW'
        ? 'Immediate'
        : selectedTime

      console.log('[OnlineConfirm] Appointment date:', appointmentDate)
      console.log('[OnlineConfirm] Appointment time:', appointmentTime)

      const payload = {
        doctorId,
        doctorName,
        specialty,
        patientName: selectedPatient.name,
        patientId: selectedPatient.relationshipId,
        appointmentType: 'ONLINE',
        appointmentDate,
        timeSlot: appointmentTime,
        consultationFee: parseFloat(consultationFee),
        contactNumber,
        callPreference,
        clinicId: '',
        clinicName: '',
        clinicAddress: ''
      }

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

      const appointment = await response.json()
      console.log('[OnlineConfirm] Appointment created successfully:', appointment)

      router.push(`/member/appointments`)
    } catch (error) {
      console.error('[OnlineConfirm] Error creating appointment:', error)
      alert(`Failed to book appointment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleLater = () => {
    console.log('[OnlineConfirm] Schedule later clicked')
    setShowSlotModal(true)
  }

  const handleSlotSelected = (date: string, time: string) => {
    console.log('[OnlineConfirm] Slot selected:', { date, time })
    setSelectedDate(date)
    setSelectedTime(time)
    setTimeChoice('LATER')
  }

  if (loadingRelationships) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
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
              <UserIcon className="h-6 w-6 text-blue-600" />
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
            {relationships.map((rel) => (
              <button
                key={rel._id}
                onClick={() => setSelectedPatient(rel)}
                className={`w-full p-3 rounded-xl text-left transition-colors ${
                  selectedPatient?._id === rel._id
                    ? 'bg-blue-50 border-2 border-blue-600'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900">{rel.name}</div>
                <div className="text-sm text-gray-600">{rel.relation}</div>
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
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <PhoneIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Voice</div>
            </button>
            <button
              onClick={() => setCallPreference('VIDEO')}
              className={`p-3 rounded-xl border-2 transition-colors ${
                callPreference === 'VIDEO'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <VideoCameraIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Video</div>
            </button>
            <button
              onClick={() => setCallPreference('BOTH')}
              className={`p-3 rounded-xl border-2 transition-colors ${
                callPreference === 'BOTH'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
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
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ClockIcon className="h-6 w-6 mx-auto mb-1 text-gray-700" />
              <div className="text-sm font-medium text-gray-900">Consult Now</div>
              <div className="text-xs text-gray-600 mt-1">Immediate</div>
            </button>
            <button
              onClick={handleScheduleLater}
              className={`p-4 rounded-xl border-2 transition-colors ${
                timeChoice === 'LATER'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
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
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
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
            <span className="text-xl font-bold text-blue-600">₹{consultationFee}</span>
          </div>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={loading || !selectedPatient || !contactNumber}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
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
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <OnlineConfirmContent />
    </Suspense>
  )
}