'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeftIcon, UserIcon, CalendarIcon, ClockIcon, MapPinIcon, BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PaymentProcessor from '@/components/PaymentProcessor'
import { Card } from '@/components/ui/Card'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-2">Booking ID: {bookingId}</p>
            <p className="text-sm text-gray-500 mb-6">{formatDate(appointmentDate || '')} at {appointmentTime}</p>
            <button
              onClick={() => router.push('/member/bookings')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
            >
              View Bookings
            </button>
          </div>
        </Card>
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
              <h1 className="text-xl font-semibold text-gray-900">Confirm Dental Booking</h1>
              <p className="text-sm text-gray-600">Review your booking details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Service Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Service Details</h3>
          <div className="flex items-start space-x-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{service?.name || 'Dental Service'}</div>
              <div className="text-sm text-gray-600">{service?.description || ''}</div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-start space-x-3 text-sm">
              <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{clinic?.clinicName}</div>
                <div className="text-gray-600">{clinic?.address?.city}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
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
              <span className="font-medium text-gray-900">{appointmentTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Service Fee</span>
              </div>
              <span className="font-medium text-gray-900">₹{price}</span>
            </div>
          </div>
        </div>

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
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            <span className="ml-2 text-gray-600">Loading payment details...</span>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div></div>}>
      <ConfirmDentalBookingContent />
    </Suspense>
  )
}
