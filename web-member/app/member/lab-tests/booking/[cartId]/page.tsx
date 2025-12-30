'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, BeakerIcon, MapPinIcon, CalendarIcon, ClockIcon, HomeIcon, BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import PaymentProcessor from '@/components/PaymentProcessor'

interface LabCart {
  _id: string
  cartId: string
  userId: string
  patientId: string
  patientName: string
  prescriptionId: string
  items: Array<{
    serviceId: string
    serviceName: string
    serviceCode: string
  }>
  selectedVendorIds: string[]
  pincode: string
  status: string
}

interface LabVendor {
  _id: string
  vendorId: string
  name: string
  code: string
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  totalActualPrice: number
  totalDiscountedPrice: number
  totalWithHomeCollection: number
  pricing: Array<{
    serviceId: string
    serviceName: string
    serviceCode: string
    actualPrice: number
    discountedPrice: number
  }>
}

interface TimeSlot {
  slotId: string
  date: string
  timeSlot: string
  startTime: string
  endTime: string
  maxBookings: number
  currentBookings: number
  isActive: boolean
}

export default function LabBookingPage() {
  const router = useRouter()
  const params = useParams()
  const cartId = params.cartId as string

  const [cart, setCart] = useState<LabCart | null>(null)
  const [vendors, setVendors] = useState<LabVendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<LabVendor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [collectionType, setCollectionType] = useState<'IN_CLINIC' | 'HOME_COLLECTION'>('IN_CLINIC')
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: Vendor, 2: Slot, 3: Payment
  const [userId, setUserId] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    fetchCartAndVendors()
    fetchUser()
  }, [cartId])

  useEffect(() => {
    if (selectedVendor && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedVendor, selectedDate])

  useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !selectedVendor || !selectedSlot || !cart || step !== 3) {
        return
      }

      setValidating(true)
      setValidationResult(null)

      try {
        console.log('[LabBooking] Validating order...')
        const response = await apiClient.post('/member/lab/orders/validate', {
          patientId: userId, // Use actual userId instead of cart.patientId which might be "current"
          vendorId: selectedVendor.vendorId,
          cartId: cart.cartId,
          slotId: selectedSlot.slotId,
          totalAmount: getTotalAmount()
        })

        console.log('[LabBooking] Validation result:', response.data)
        setValidationResult(response.data)
      } catch (error: any) {
        console.error('[LabBooking] Validation error:', error)
        toast.error(error.response?.data?.message || 'Failed to validate order')
      } finally {
        setValidating(false)
      }
    }

    validateBooking()
  }, [step, userId, selectedVendor, selectedSlot, cart])

  const fetchCartAndVendors = async () => {
    try {
      setLoading(true)

      // Fetch cart details
      const cartResponse = await apiClient.get(`/member/lab/carts/${cartId}`)
      setCart(cartResponse.data.data)

      // Fetch assigned vendors for this cart
      const vendorsResponse = await apiClient.get(`/member/lab/carts/${cartId}/vendors`)
      setVendors(vendorsResponse.data.data || [])

      // Set today's date as default
      setSelectedDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me')
      setUserId(response.data._id)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !cart?.pincode) return

    try {
      const response = await apiClient.get(
        `/member/lab/vendors/${selectedVendor.vendorId}/slots?pincode=${cart.pincode}&date=${selectedDate}`
      )
      setAvailableSlots(response.data.data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load available slots')
    }
  }

  const getTotalAmount = () => {
    if (!selectedVendor) return 0
    const basePrice = selectedVendor.totalDiscountedPrice
    const homeCollectionCharge = collectionType === 'HOME_COLLECTION'
      ? (selectedVendor.homeCollectionCharges || 100)
      : 0
    return basePrice + homeCollectionCharge
  }

  const handleVendorSelect = (vendor: LabVendor) => {
    setSelectedVendor(vendor)
    setSelectedSlot(null)
    setStep(2)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep(3)
  }

  const handlePaymentSuccess = async (transaction: any) => {
    console.log('[LabBooking] Payment successful, creating order')

    try {
      const bookingData = {
        cartId: cart?.cartId,
        vendorId: selectedVendor?.vendorId,
        slotId: selectedSlot?.slotId,
        collectionType,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot?.timeSlot,
        paymentAlreadyProcessed: true,  // PaymentProcessor already handled payment
      }

      console.log('[LabBooking] Creating order with payment already processed')

      const response = await apiClient.post('/member/lab/orders', bookingData)
      console.log('[LabBooking] Order created successfully:', response.data)

      setOrderId(response.data.data.orderId)
      setBookingSuccess(true)
    } catch (error: any) {
      console.error('[LabBooking] Error creating order:', error)
      toast.error(error.response?.data?.message || 'Failed to create booking')
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f' }}></div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cart not found</p>
          <button
            onClick={() => router.push('/member/lab-tests')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#e8f5e9' }}>
            <CheckCircleIcon className="h-10 w-10" style={{ color: '#4caf50' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-2">Order ID: {orderId}</p>
          <p className="text-sm text-gray-500 mb-6">{selectedDate} at {selectedSlot?.timeSlot}</p>
          <button
            onClick={() => router.push('/member/bookings?tab=lab')}
            className="w-full py-3 text-white rounded-lg font-medium"
            style={{ backgroundColor: '#0a529f' }}
          >
            View Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Book Lab Tests</h1>
            <p className="text-sm text-gray-600">Cart ID: {cart.cartId}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-xs">Vendor</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-xs">Slot</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-xs">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Tests Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Tests in Cart</h3>
          <div className="space-y-1">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex items-center text-sm text-gray-600">
                <BeakerIcon className="h-4 w-4 mr-2" />
                <span>{item.serviceName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Vendor Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Lab Vendor</h2>

            {vendors.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-600">No vendors assigned yet. Please wait for operations team to assign vendors.</p>
              </div>
            ) : (
              vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
                  onClick={() => handleVendorSelect(vendor)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {vendor.code}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: '#0a529f' }}>
                        ₹{vendor.totalDiscountedPrice}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-600 mb-2">Test Pricing:</div>
                    {vendor.pricing.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{item.serviceName}</span>
                        <span>₹{item.discountedPrice}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full mt-3 py-2 text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#0a529f' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVendorSelect(vendor)
                    }}
                  >
                    Select This Vendor
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && selectedVendor && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-blue-600 flex items-center mb-2"
            >
              ← Change Vendor
            </button>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Selected Vendor: {selectedVendor.name}</h3>

              {/* Collection Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCollectionType('IN_CLINIC')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      collectionType === 'IN_CLINIC'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <BuildingOfficeIcon className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">Lab Visit</div>
                    <div className="text-xs text-gray-600">Visit lab for sample collection</div>
                  </button>
                  <button
                    onClick={() => setCollectionType('HOME_COLLECTION')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      collectionType === 'HOME_COLLECTION'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HomeIcon className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">Home Collection</div>
                    <div className="text-xs text-gray-600">
                      Sample collected at home (+₹{selectedVendor.homeCollectionCharges || 100})
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot(null)
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No slots available for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => {
                        const isAvailable = slot.currentBookings < slot.maxBookings
                        return (
                          <button
                            key={slot.slotId}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={!isAvailable}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedSlot?.slotId === slot.slotId
                                ? 'border-blue-600 bg-blue-50'
                                : isAvailable
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">{slot.timeSlot}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {isAvailable
                                ? `${slot.maxBookings - slot.currentBookings} slots available`
                                : 'Fully booked'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && selectedVendor && selectedSlot && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-blue-600 flex items-center mb-2"
            >
              ← Change Slot
            </button>

            {/* Booking Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{selectedVendor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Type:</span>
                  <span className="font-medium">
                    {collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedSlot.timeSlot}</span>
                </div>
              </div>
            </div>

            {/* Payment Processor Component */}
            {validating && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f' }}></div>
                <span className="ml-2 text-gray-600">Validating order...</span>
              </div>
            )}

            {!validating && userId && validationResult?.valid && (
              <PaymentProcessor
                consultationFee={getTotalAmount()}
                userId={userId}
                patientId={userId}
                patientName={cart.patientName}
                serviceType="LAB"
                serviceDetails={{
                  doctorName: selectedVendor.name || 'Lab Service',
                  clinicId: selectedVendor.vendorId || '',  // Used as vendorId in payment page
                  clinicName: selectedVendor.name || '',
                  serviceCode: `${cart.cartId}|${collectionType}`,  // Encode cartId|collectionType for payment page
                  serviceName: cart.items.map(i => i.serviceName).join(', '),
                  slotId: selectedSlot.slotId || '',
                  date: selectedDate || '',
                  time: selectedSlot.timeSlot || ''
                }}
                serviceLimit={validationResult.breakdown ? {
                  serviceTransactionLimit: validationResult.breakdown.serviceTransactionLimit,
                  insuranceEligibleAmount: validationResult.breakdown.insuranceEligibleAmount,
                  insurancePayment: validationResult.breakdown.insurancePayment,
                  excessAmount: validationResult.breakdown.excessAmount,
                  wasLimitApplied: true,
                  copayAmount: validationResult.breakdown.copayAmount,
                  walletBalance: validationResult.breakdown.walletBalance,
                  walletDebitAmount: validationResult.breakdown.walletDebitAmount,
                  totalMemberPayment: validationResult.breakdown.totalMemberPayment,
                } : undefined}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={(error) => {
                  console.error('[LabBooking] Payment failed:', error)
                  toast.error('Payment failed. Please try again.')
                }}
              />
            )}

            {!validating && validationResult && !validationResult.valid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800 font-medium">Unable to validate order</p>
                <p className="text-red-600 text-sm mt-1">{validationResult.error || 'Please try again'}</p>
              </div>
            )}

            {!validating && !userId && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f' }}></div>
                <span className="ml-2 text-gray-600">Loading payment details...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
