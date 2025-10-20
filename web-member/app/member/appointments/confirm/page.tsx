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
  const [walletBalance, setWalletBalance] = useState(0)
  const [categoryName, setCategoryName] = useState('Consultation')
  const [useWallet, setUseWallet] = useState(true)
  const [loadingWallet, setLoadingWallet] = useState(true)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Fetch wallet balance on mount
  React.useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        console.log('💰 [FRONTEND] Fetching wallet balance...')
        const response = await fetch('/api/wallet/balance', {
          credentials: 'include',
        })

        console.log('📡 [FRONTEND] Response status:', response.status)
        console.log('📡 [FRONTEND] Response ok:', response.ok)

        if (response.ok) {
          const data = await response.json()
          console.log('✅ [FRONTEND] Full API response:', JSON.stringify(data, null, 2))
          console.log('📊 [FRONTEND] Categories array:', data.categories)
          console.log('📊 [FRONTEND] Categories length:', data.categories?.length)

          // Get CAT001 (consultation) balance - API returns 'categories' not 'balances'
          const consultationCategory = data.categories?.find((b: any) => b.categoryCode === 'CAT001')
          console.log('🔍 [FRONTEND] Found consultation category:', consultationCategory)

          const balance = consultationCategory?.available || 0
          const catName = consultationCategory?.name || 'Consultation'

          setWalletBalance(balance)
          setCategoryName(catName)

          console.log('💰 [FRONTEND] Final balance set:', balance)
          console.log('📋 [FRONTEND] Final category name:', catName)
        } else {
          const errorText = await response.text()
          console.warn('⚠️ [FRONTEND] Failed to fetch wallet balance. Status:', response.status)
          console.warn('⚠️ [FRONTEND] Error response:', errorText)
          setWalletBalance(0)
        }
      } catch (error) {
        console.error('❌ [FRONTEND] Error fetching wallet balance:', error)
        setWalletBalance(0)
      } finally {
        setLoadingWallet(false)
      }
    }

    fetchWalletBalance()
  }, [])

  // Calculate payment breakdown
  const consultationFeeNum = parseFloat(consultationFee || '0')
  const walletAmountToUse = useWallet ? Math.min(walletBalance, consultationFeeNum) : 0
  const amountToPay = consultationFeeNum - walletAmountToUse

  const handleConfirmBooking = async () => {
    console.log('🚀 [FRONTEND] ========== APPOINTMENT BOOKING START ==========')
    console.log('📥 [FRONTEND - INPUT] All URL parameters:', {
      doctorId,
      doctorName,
      specialty,
      clinicId,
      clinicName,
      clinicAddress,
      consultationFee,
      patientId,
      patientName,
      appointmentDate,
      timeSlot,
      slotId
    })

    setLoading(true)

    try {
      // Step 1: Fetch user data
      console.log('📋 [FRONTEND - STEP 1] Fetching user authentication data...')
      console.log('🔍 [FRONTEND] Calling: GET /api/auth/me')

      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      console.log('📄 [FRONTEND] Auth response status:', userResponse.status)
      console.log('📄 [FRONTEND] Auth response ok:', userResponse.ok)

      if (!userResponse.ok) {
        console.error('❌ [FRONTEND] Failed to fetch user data')
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('✅ [FRONTEND] User data retrieved:', JSON.stringify(userData, null, 2))
      console.log('👤 [FRONTEND] User ID:', userData._id)
      setUserId(userData._id)

      // Step 2: Prepare appointment data
      console.log('📋 [FRONTEND - STEP 2] Preparing appointment data...')
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
        consultationFee: parseFloat(consultationFee || '0'),
        useWallet: useWallet
      }

      console.log('📄 [FRONTEND] Appointment data prepared:', JSON.stringify(appointmentData, null, 2))
      console.log('💰 [FRONTEND] Consultation fee parsed:', appointmentData.consultationFee)
      console.log('💰 [FRONTEND] Consultation fee type:', typeof appointmentData.consultationFee)

      // Step 3: Create appointment
      console.log('📋 [FRONTEND - STEP 3] Creating appointment via API...')
      console.log('🔍 [FRONTEND] Calling: POST /api/appointments')
      console.log('📤 [FRONTEND] Request body:', JSON.stringify(appointmentData, null, 2))

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(appointmentData)
      })

      console.log('📄 [FRONTEND] API response status:', response.status)
      console.log('📄 [FRONTEND] API response ok:', response.ok)
      console.log('📄 [FRONTEND] API response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

      if (!response.ok) {
        console.error('❌ [FRONTEND] API returned error status:', response.status)
        let errorData
        try {
          errorData = await response.json()
          console.error('❌ [FRONTEND] Error response body:', JSON.stringify(errorData, null, 2))
        } catch (parseError) {
          console.error('❌ [FRONTEND] Could not parse error response:', parseError)
          const errorText = await response.text()
          console.error('❌ [FRONTEND] Raw error response:', errorText)
        }
        throw new Error(errorData?.message || 'Failed to create appointment')
      }

      const result = await response.json()
      console.log('✅ [FRONTEND] Appointment API call successful!')
      console.log('📥 [FRONTEND] API response data:', JSON.stringify(result, null, 2))

      // Step 4: Check payment requirements
      console.log('📋 [FRONTEND - STEP 4] Checking payment requirements...')
      console.log('💳 [FRONTEND] Payment required:', result.paymentRequired)
      console.log('💳 [FRONTEND] Payment ID:', result.paymentId)
      console.log('💳 [FRONTEND] Transaction ID:', result.transactionId)
      console.log('💳 [FRONTEND] Copay amount:', result.copayAmount)
      console.log('💳 [FRONTEND] Wallet debit amount:', result.walletDebitAmount)

      // Check if payment is required
      if (result.paymentRequired && result.paymentId) {
        console.log('💳 [FRONTEND] Payment is required - redirecting to payment page')
        const redirectUrl = encodeURIComponent('/member/appointments')
        const paymentUrl = `/member/payments/${result.paymentId}?redirect=${redirectUrl}`
        console.log('🔗 [FRONTEND] Redirecting to:', paymentUrl)
        router.push(paymentUrl)
        return
      }

      // If no payment required, show success
      console.log('✅ [FRONTEND] No payment required - showing success screen')
      const appointmentIdValue = result.appointment?.appointmentId || result.appointmentId
      console.log('🆔 [FRONTEND] Appointment ID:', appointmentIdValue)
      setAppointmentId(appointmentIdValue)
      setBookingSuccess(true)
      console.log('🎉 [FRONTEND] ========== APPOINTMENT BOOKING SUCCESS ==========')
    } catch (error: any) {
      console.error('❌ [FRONTEND] ========== ERROR OCCURRED ==========')
      console.error('❌ [FRONTEND - ERROR] Type:', error.constructor?.name || typeof error)
      console.error('❌ [FRONTEND - ERROR] Message:', error.message || String(error))
      console.error('❌ [FRONTEND - ERROR] Stack:', error.stack)
      console.error('❌ [FRONTEND - ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

      alert('Failed to book appointment. Please try again.\n\nError: ' + (error.message || String(error)))
    } finally {
      setLoading(false)
      console.log('🏁 [FRONTEND] Booking process finished (loading state set to false)')
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

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>

          {/* Wallet Balance Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Wallet Balance ({categoryName})</span>
              </div>
              {loadingWallet ? (
                <span className="text-sm text-blue-600">Loading...</span>
              ) : (
                <span className="text-sm font-bold text-blue-900">₹{walletBalance.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Use Wallet Checkbox */}
          {walletBalance > 0 && (
            <div className="mb-4 p-3 border border-gray-200 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
                  style={{ accentColor: '#0a529f' }}
                />
                <span className="text-sm text-gray-700">
                  Use wallet balance for this payment {useWallet && walletAmountToUse > 0 && (
                    <span className="font-semibold text-green-600">(₹{walletAmountToUse.toFixed(2)} will be used)</span>
                  )}
                </span>
              </label>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-medium text-gray-900">₹{consultationFee}</span>
            </div>

            {useWallet && walletAmountToUse > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Paid from Wallet</span>
                <span className="font-medium text-green-600">- ₹{walletAmountToUse.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {amountToPay > 0 ? 'Amount to Pay' : 'Total Paid'}
                </span>
              </div>
              <span className="text-xl font-bold" style={{ color: amountToPay === 0 ? '#16a34a' : '#0a529f' }}>
                ₹{amountToPay.toFixed(2)}
              </span>
            </div>
          </div>

          {amountToPay === 0 && useWallet && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-800">
                <strong>✓ Fully covered by wallet!</strong> No additional payment required.
              </p>
            </div>
          )}

          {amountToPay > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                {useWallet && walletAmountToUse > 0 ? (
                  <>
                    <strong>Note:</strong> ₹{walletAmountToUse.toFixed(2)} will be deducted from your wallet. You need to pay ₹{amountToPay.toFixed(2)} additionally.
                  </>
                ) : (
                  <>
                    <strong>Note:</strong> Payment will be collected for the consultation fee.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'text-white'
          }`}
          style={!loading ? { backgroundColor: '#0a529f' } : {}}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#084080' }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#0a529f' }}
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
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <ConfirmAppointmentContent />
    </Suspense>
  )
}