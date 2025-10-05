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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const handleConfirmBooking = async () => {
    console.log('[ConfirmAppointment] Confirming booking', {
      doctorId,
      patientId,
      appointmentDate,
      timeSlot
    })

    setLoading(true)

    try {
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('[ConfirmAppointment] User ID retrieved:', userData._id)
      setUserId(userData._id)

      const appointmentData = {
        userId: userData._id,
        patientName: patientName,
        patientId: patientId,
        doctorId: doctorId,
        doctorName: doctorName,
        specialty: specialty,
        slotId: slotId || `${doctorId}_${clinicId}_${appointmentDate}_${timeSlot}`,
        clinicId: clinicId,
        clinicName: clinicName,
        clinicAddress: clinicAddress,
        appointmentType: 'IN_CLINIC',
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        consultationFee: parseFloat(consultationFee || '0')
      }

      console.log('[ConfirmAppointment] Creating appointment with data:', appointmentData)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[ConfirmAppointment] API Error:', errorData)
        throw new Error(errorData.message || 'Failed to create appointment')
      }

      const result = await response.json()
      console.log('[ConfirmAppointment] Appointment created successfully:', {
        appointmentId: result.appointmentId
      })

      setAppointmentId(result.appointmentId)
      setBookingSuccess(true)
    } catch (error) {
      console.error('[ConfirmAppointment] Error creating appointment:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
            <div className="text-xl font-bold text-blue-600">{appointmentId}</div>
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
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
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
              <UserIcon className="h-8 w-8 text-blue-600" />
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

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-medium text-gray-900">₹{consultationFee}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium text-gray-900">₹0</span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Total Amount</span>
              </div>
              <span className="text-xl font-bold text-blue-600">₹{consultationFee}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Payment will be processed at the clinic. This is a mock payment for demonstration purposes.
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Booking...' : 'Confirm & Book Appointment'}
        </button>
      </div>
    </div>
  )
}

export default function ConfirmAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <ConfirmAppointmentContent />
    </Suspense>
  )
}