'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { HomeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

interface CartItem {
  serviceId: string
  serviceName: string
  serviceCode: string
  category: string
}

interface Cart {
  cartId: string
  items: CartItem[]
  status: string
  prescriptionId: string
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  contactInfo: {
    phone: string
    address: string
  }
  homeCollection: boolean
  centerVisit: boolean
}

interface Pricing {
  serviceId: string
  serviceName: string
  actualPrice: number
  discountedPrice: number
}

interface Slot {
  _id: string
  slotId: string
  date: string
  timeSlot: string
  startTime: string
  endTime: string
  maxBookings: number
  currentBookings: number
  isActive: boolean
}

export default function VendorBookingPage() {
  const router = useRouter()
  const params = useParams()
  const cartId = params.id as string
  const vendorId = params.vendorId as string

  const [cart, setCart] = useState<Cart | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'CENTER_VISIT'>('HOME_COLLECTION')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch cart
      const cartRes = await fetch(`/api/member/lab/carts/${cartId}`, {
        credentials: 'include',
      })
      if (!cartRes.ok) throw new Error('Failed to fetch cart')
      const cartData = await cartRes.json()
      setCart(cartData.data)

      // Fetch vendor
      const vendorRes = await fetch(`/api/admin/lab/vendors`, {
        credentials: 'include',
      })
      if (!vendorRes.ok) throw new Error('Failed to fetch vendor')
      const vendorData = await vendorRes.json()
      const selectedVendor = vendorData.data.find((v: Vendor) => v.vendorId === vendorId)
      setVendor(selectedVendor)

      // Fetch pricing for cart items
      const pricingRes = await fetch(`/api/member/lab/vendors/${vendorId}/pricing`, {
        credentials: 'include',
      })
      if (!pricingRes.ok) throw new Error('Failed to fetch pricing')
      const pricingData = await pricingRes.json()

      // Filter pricing to only include cart items
      const cartServiceIds = cartData.data.items.map((item: CartItem) => item.serviceId)
      const filteredPricing = pricingData.data
        .filter((p: any) => cartServiceIds.includes(p.serviceId))
        .map((p: any) => ({
          serviceId: p.serviceId,
          serviceName: cartData.data.items.find((item: CartItem) => item.serviceId === p.serviceId)?.serviceName || '',
          actualPrice: p.actualPrice,
          discountedPrice: p.discountedPrice,
        }))
      setPricing(filteredPricing)

      // Fetch available slots for next 7 days
      const today = new Date()
      const slotsRes = await fetch(
        `/api/member/lab/vendors/${vendorId}/slots?date=${today.toISOString().split('T')[0]}`,
        { credentials: 'include' }
      )
      if (!slotsRes.ok) throw new Error('Failed to fetch slots')
      const slotsData = await slotsRes.json()
      setSlots(slotsData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to fetch booking details')
    } finally {
      setLoading(false)
    }
  }, [cartId, vendorId])

  const calculateTotal = () => {
    const subtotal = pricing.reduce((sum, item) => sum + item.discountedPrice, 0)
    const homeCollectionCharges = collectionType === 'HOME_COLLECTION' ? 50 : 0
    return {
      subtotal,
      homeCollectionCharges,
      total: subtotal + homeCollectionCharges,
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot')
      return
    }

    if (collectionType === 'HOME_COLLECTION') {
      if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
        alert('Please fill in all required address fields')
        return
      }
      if (address.pincode.length !== 6) {
        alert('Please enter a valid 6-digit pincode')
        return
      }
      if (address.phone.length !== 10) {
        alert('Please enter a valid 10-digit phone number')
        return
      }
    }

    setSubmitting(true)

    try {
      const selectedSlotData = slots.find((s) => s._id === selectedSlot)

      const orderData = {
        cartId,
        vendorId: vendor?._id,
        collectionType,
        collectionAddress: collectionType === 'HOME_COLLECTION' ? address : undefined,
        collectionDate: selectedSlotData?.date,
        collectionTime: selectedSlotData?.timeSlot,
        slotId: selectedSlot,
      }

      const response = await fetch('/api/member/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      })

      if (!response.ok) throw new Error('Failed to place order')

      const data = await response.json()
      alert('Order placed successfully!')
      router.push(`/member/lab-tests/orders/${data.data.orderId}`)
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!cart || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <p className="text-sm lg:text-base text-gray-500">Cart or vendor not found</p>
      </div>
    )
  }

  const { subtotal, homeCollectionCharges, total } = calculateTotal()

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Book Lab Tests"
        subtitle={vendor.name}
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Tests & Pricing */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-5" style={{ color: '#0E51A2' }}>Tests & Pricing</h3>
          <div className="space-y-3">
            {pricing.map((item, index) => (
              <DetailCard
                key={index}
                variant="secondary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{item.serviceName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs lg:text-sm text-gray-500 line-through">₹{item.actualPrice}</p>
                    <p className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>₹{item.discountedPrice}</p>
                  </div>
                </div>
              </DetailCard>
            ))}
          </div>
        </DetailCard>

        {/* Collection Type */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-5" style={{ color: '#0E51A2' }}>Collection Type</h3>
          <div className="space-y-3">
            {vendor.homeCollection && (
              <label
                className="flex items-center p-4 lg:p-5 border-2 rounded-xl cursor-pointer transition-all"
                style={collectionType === 'HOME_COLLECTION' ? { borderColor: '#0F5FDC', background: '#EFF4FF' } : { borderColor: '#86ACD8' }}
              >
                <input
                  type="radio"
                  name="collectionType"
                  value="HOME_COLLECTION"
                  checked={collectionType === 'HOME_COLLECTION'}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="mr-3"
                />
                <HomeIcon className="h-6 w-6 lg:h-7 lg:w-7 mr-3" style={{ color: '#0F5FDC' }} />
                <div className="flex-1">
                  <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>Home Collection</p>
                  <p className="text-xs lg:text-sm text-gray-600">Sample collected at your doorstep</p>
                </div>
                <p className="text-xs lg:text-sm text-gray-600">+₹50</p>
              </label>
            )}
            {vendor.centerVisit && (
              <label
                className="flex items-center p-4 lg:p-5 border-2 rounded-xl cursor-pointer transition-all"
                style={collectionType === 'CENTER_VISIT' ? { borderColor: '#0F5FDC', background: '#EFF4FF' } : { borderColor: '#86ACD8' }}
              >
                <input
                  type="radio"
                  name="collectionType"
                  value="CENTER_VISIT"
                  checked={collectionType === 'CENTER_VISIT'}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="mr-3"
                />
                <BuildingOfficeIcon className="h-6 w-6 lg:h-7 lg:w-7 mr-3" style={{ color: '#0F5FDC' }} />
                <div className="flex-1">
                  <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>Visit Center</p>
                  <p className="text-xs lg:text-sm text-gray-600">Visit lab center for sample collection</p>
                </div>
                <p className="text-xs lg:text-sm font-medium" style={{ color: '#25A425' }}>Free</p>
              </label>
            )}
          </div>
        </DetailCard>

        {/* Address (if home collection) */}
        {collectionType === 'HOME_COLLECTION' && (
          <DetailCard variant="primary">
            <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-5" style={{ color: '#0E51A2' }}>Collection Address</h3>
            <div className="space-y-3 lg:space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="w-full px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                style={{ borderColor: '#86ACD8' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                style={{ borderColor: '#86ACD8' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              />
              <input
                type="text"
                placeholder="Address Line 1 *"
                value={address.addressLine1}
                onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                className="w-full px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                style={{ borderColor: '#86ACD8' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={address.addressLine2}
                onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                className="w-full px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                style={{ borderColor: '#86ACD8' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              />
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <input
                  type="text"
                  placeholder="City *"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: '#86ACD8' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: '#86ACD8' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                />
              </div>
              <input
                type="text"
                placeholder="Pincode *"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full px-4 py-3 lg:py-4 text-sm lg:text-base border-2 rounded-xl focus:outline-none transition-colors"
                style={{ borderColor: '#86ACD8' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              />
            </div>
          </DetailCard>
        )}

        {/* Time Slots */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-5" style={{ color: '#0E51A2' }}>Select Time Slot</h3>
          {slots.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <p className="text-sm lg:text-base text-gray-600">No slots available</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">Please contact support</p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {slots.map((slot) => (
                <label
                  key={slot._id}
                  className={`flex items-center justify-between p-3 lg:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    slot.currentBookings >= slot.maxBookings ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  style={selectedSlot === slot._id ? { borderColor: '#0F5FDC', background: '#EFF4FF' } : { borderColor: '#86ACD8' }}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="slot"
                      value={slot._id}
                      checked={selectedSlot === slot._id}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      disabled={slot.currentBookings >= slot.maxBookings}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>
                        {new Date(slot.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600">{slot.timeSlot}</p>
                    </div>
                  </div>
                  {slot.currentBookings >= slot.maxBookings ? (
                    <span className="text-xs font-medium" style={{ color: '#E53535' }}>Full</span>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: '#25A425' }}>
                      {slot.maxBookings - slot.currentBookings} slots left
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </DetailCard>

        {/* Price Summary */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4 lg:mb-5" style={{ color: '#0E51A2' }}>Price Summary</h3>
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center justify-between text-xs lg:text-sm text-gray-600">
              <span>Tests Subtotal</span>
              <span className="font-medium">₹{subtotal}</span>
            </div>
            {collectionType === 'HOME_COLLECTION' && (
              <div className="flex items-center justify-between text-xs lg:text-sm text-gray-600">
                <span>Home Collection Charges</span>
                <span className="font-medium">₹{homeCollectionCharges}</span>
              </div>
            )}
            <div className="pt-2 lg:pt-3 border-t" style={{ borderColor: '#86ACD8' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm lg:text-base font-semibold" style={{ color: '#0E51A2' }}>Total Amount</span>
                <span className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>₹{total}</span>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Place Order Button */}
        <CTAButton
          onClick={handlePlaceOrder}
          disabled={submitting || !selectedSlot}
          variant="primary"
          fullWidth
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
              Placing Order...
            </span>
          ) : (
            'Place Order'
          )}
        </CTAButton>
      </div>
    </div>
  )
}
