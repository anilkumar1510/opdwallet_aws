'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BeakerIcon, CalendarIcon, ClockIcon, HomeIcon, BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import PaymentProcessor from '@/components/PaymentProcessor'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div className="text-center">
          <p className="text-sm lg:text-base text-gray-600 mb-4">Cart not found</p>
          <CTAButton
            onClick={() => router.push('/member/lab-tests')}
            variant="primary"
          >
            Go Back
          </CTAButton>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f7fc' }}>
        <DetailCard variant="primary" className="max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6" style={{ background: '#25A425' }}>
              <CheckCircleIcon className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Booking Confirmed!</h1>
            <p className="text-sm lg:text-base text-gray-600 mb-2">Order ID: {orderId}</p>
            <p className="text-xs lg:text-sm text-gray-500 mb-6">{selectedDate} at {selectedSlot?.timeSlot}</p>
            <CTAButton
              onClick={() => router.push('/member/bookings?tab=lab')}
              variant="primary"
              fullWidth
            >
              View Bookings
            </CTAButton>
          </div>
        </DetailCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Book Lab Tests"
        subtitle={`Cart ID: ${cart.cartId}`}
        onBack={() => router.back()}
        sticky
      />

      {/* Progress Steps */}
      <div className="bg-white border-b px-4 py-4" style={{ borderColor: '#86ACD8' }}>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className={`flex flex-col items-center ${step >= 1 ? '' : 'text-gray-400'}`} style={step >= 1 ? { color: '#0F5FDC' } : {}}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 text-sm lg:text-base font-semibold ${step >= 1 ? 'text-white' : ''}`} style={step >= 1 ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' } : { background: '#e5e7eb' }}>
              1
            </div>
            <span className="text-xs lg:text-sm">Vendor</span>
          </div>
          <div className={`flex-1 h-1 mx-2`} style={step >= 2 ? { background: '#0F5FDC' } : { background: '#e5e7eb' }}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? '' : 'text-gray-400'}`} style={step >= 2 ? { color: '#0F5FDC' } : {}}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 text-sm lg:text-base font-semibold ${step >= 2 ? 'text-white' : ''}`} style={step >= 2 ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' } : { background: '#e5e7eb' }}>
              2
            </div>
            <span className="text-xs lg:text-sm">Slot</span>
          </div>
          <div className={`flex-1 h-1 mx-2`} style={step >= 3 ? { background: '#0F5FDC' } : { background: '#e5e7eb' }}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? '' : 'text-gray-400'}`} style={step >= 3 ? { color: '#0F5FDC' } : {}}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 text-sm lg:text-base font-semibold ${step >= 3 ? 'text-white' : ''}`} style={step >= 3 ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' } : { background: '#e5e7eb' }}>
              3
            </div>
            <span className="text-xs lg:text-sm">Payment</span>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Tests Summary */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Tests in Cart</h3>
          <div className="space-y-2">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs lg:text-sm text-gray-600">
                <BeakerIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2" style={{ color: '#0F5FDC' }} />
                <span>{item.serviceName}</span>
              </div>
            ))}
          </div>
        </DetailCard>

        {/* Step 1: Vendor Selection */}
        {step === 1 && (
          <div className="space-y-4 lg:space-y-5">
            <h2 className="text-lg lg:text-xl font-semibold" style={{ color: '#0E51A2' }}>Select Lab Vendor</h2>

            {vendors.length === 0 ? (
              <DetailCard variant="primary">
                <div className="text-center py-8">
                  <p className="text-sm lg:text-base text-gray-600">No vendors assigned yet. Please wait for operations team to assign vendors.</p>
                </div>
              </DetailCard>
            ) : (
              vendors.map((vendor) => (
                <DetailCard
                  key={vendor._id}
                  variant="primary"
                >
                  <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>{vendor.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: '#EFF4FF', color: '#0F5FDC' }}>
                          {vendor.code}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                        ₹{vendor.totalDiscountedPrice}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#86ACD8' }}>
                    <div className="text-xs font-medium text-gray-700 mb-2">Test Pricing:</div>
                    {vendor.pricing.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs lg:text-sm text-gray-600 mb-1">
                        <span>{item.serviceName}</span>
                        <span className="font-medium" style={{ color: '#0E51A2' }}>₹{item.discountedPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 lg:mt-4">
                    <CTAButton
                      onClick={() => handleVendorSelect(vendor)}
                      variant="primary"
                      fullWidth
                    >
                      Select This Vendor
                    </CTAButton>
                  </div>
                </DetailCard>
              ))
            )}
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && selectedVendor && (
          <div className="space-y-4 lg:space-y-5">
            <button
              onClick={() => setStep(1)}
              className="text-xs lg:text-sm flex items-center mb-2"
              style={{ color: '#0F5FDC' }}
            >
              ← Change Vendor
            </button>

            <DetailCard variant="primary">
              <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Selected Vendor: {selectedVendor.name}</h3>

              {/* Collection Type */}
              <div className="mb-4 lg:mb-5">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">Collection Type</label>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <button
                    onClick={() => setCollectionType('IN_CLINIC')}
                    className="p-3 lg:p-4 rounded-lg border-2 transition-all"
                    style={collectionType === 'IN_CLINIC' ? { borderColor: '#0F5FDC', background: '#EFF4FF' } : { borderColor: '#86ACD8' }}
                  >
                    <BuildingOfficeIcon className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-1" style={{ color: '#0F5FDC' }} />
                    <div className="text-xs lg:text-sm font-medium" style={{ color: '#0E51A2' }}>Lab Visit</div>
                    <div className="text-xs text-gray-600">Visit lab for sample collection</div>
                  </button>
                  <button
                    onClick={() => setCollectionType('HOME_COLLECTION')}
                    className="p-3 lg:p-4 rounded-lg border-2 transition-all"
                    style={collectionType === 'HOME_COLLECTION' ? { borderColor: '#0F5FDC', background: '#EFF4FF' } : { borderColor: '#86ACD8' }}
                  >
                    <HomeIcon className="h-6 w-6 lg:h-7 lg:w-7 mx-auto mb-1" style={{ color: '#0F5FDC' }} />
                    <div className="text-xs lg:text-sm font-medium" style={{ color: '#0E51A2' }}>Home Collection</div>
                    <div className="text-xs text-gray-600">
                      Sample collected at home (+₹{selectedVendor.homeCollectionCharges || 100})
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-4 lg:mb-5">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot(null)
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 lg:py-3 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: '#86ACD8' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">Select Time Slot</label>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-6 text-sm lg:text-base text-gray-500">
                      No slots available for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                      {availableSlots.map((slot) => {
                        const isAvailable = slot.currentBookings < slot.maxBookings
                        return (
                          <button
                            key={slot.slotId}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={!isAvailable}
                            className={`p-3 lg:p-4 rounded-lg border-2 transition-all ${!isAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
                            style={
                              selectedSlot?.slotId === slot.slotId
                                ? { borderColor: '#0F5FDC', background: '#EFF4FF' }
                                : isAvailable
                                ? { borderColor: '#86ACD8' }
                                : { borderColor: '#e5e7eb', background: '#f3f4f6' }
                            }
                          >
                            <div className="flex items-center justify-center">
                              <ClockIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-1" style={{ color: '#0F5FDC' }} />
                              <span className="text-xs lg:text-sm font-medium" style={{ color: '#0E51A2' }}>{slot.timeSlot}</span>
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
            </DetailCard>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && selectedVendor && selectedSlot && (
          <div className="space-y-4 lg:space-y-5">
            <button
              onClick={() => setStep(2)}
              className="text-xs lg:text-sm flex items-center mb-2"
              style={{ color: '#0F5FDC' }}
            >
              ← Change Slot
            </button>

            {/* Booking Summary */}
            <DetailCard variant="primary">
              <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4" style={{ color: '#0E51A2' }}>Booking Summary</h3>

              <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium" style={{ color: '#0E51A2' }}>{selectedVendor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Type:</span>
                  <span className="font-medium" style={{ color: '#0E51A2' }}>
                    {collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium" style={{ color: '#0E51A2' }}>{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium" style={{ color: '#0E51A2' }}>{selectedSlot.timeSlot}</span>
                </div>
              </div>
            </DetailCard>

            {/* Payment Processor Component */}
            {validating && (
              <DetailCard variant="primary">
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
                  <span className="ml-2 text-sm lg:text-base text-gray-600">Validating order...</span>
                </div>
              </DetailCard>
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
              <DetailCard variant="primary">
                <div className="p-4 text-center" style={{ background: '#FEF1E7', border: '1px solid #F9B376', borderRadius: '12px' }}>
                  <p className="font-medium" style={{ color: '#E53535' }}>Unable to validate order</p>
                  <p className="text-xs lg:text-sm text-gray-600 mt-1">{validationResult.error || 'Please try again'}</p>
                </div>
              </DetailCard>
            )}

            {!validating && !userId && (
              <DetailCard variant="primary">
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
                  <span className="ml-2 text-sm lg:text-base text-gray-600">Loading payment details...</span>
                </div>
              </DetailCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
