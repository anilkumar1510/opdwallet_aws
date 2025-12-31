'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, MapPinIcon, HomeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!cart || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cart or vendor not found</p>
      </div>
    )
  }

  const { subtotal, homeCollectionCharges, total } = calculateTotal()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Book Lab Tests</h1>
            <p className="text-sm text-gray-600">{vendor.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Tests & Pricing */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Tests & Pricing</h3>
          <div className="space-y-3">
            {pricing.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.serviceName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 line-through">₹{item.actualPrice}</p>
                  <p className="text-lg font-bold text-gray-900">₹{item.discountedPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Type */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Collection Type</h3>
          <div className="space-y-3">
            {vendor.homeCollection && (
              <label
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  collectionType === 'HOME_COLLECTION'
                    ? 'bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={collectionType === 'HOME_COLLECTION' ? { borderColor: '#0a529f', backgroundColor: '#e6f0fa' } : undefined}
              >
                <input
                  type="radio"
                  name="collectionType"
                  value="HOME_COLLECTION"
                  checked={collectionType === 'HOME_COLLECTION'}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="mr-3"
                />
                <HomeIcon className="h-6 w-6 mr-3" style={{ color: '#0a529f' }} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Home Collection</p>
                  <p className="text-sm text-gray-600">Sample collected at your doorstep</p>
                </div>
                <p className="text-sm text-gray-600">+₹50</p>
              </label>
            )}
            {vendor.centerVisit && (
              <label
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  collectionType === 'CENTER_VISIT'
                    ? 'bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={collectionType === 'CENTER_VISIT' ? { borderColor: '#0a529f', backgroundColor: '#e6f0fa' } : undefined}
              >
                <input
                  type="radio"
                  name="collectionType"
                  value="CENTER_VISIT"
                  checked={collectionType === 'CENTER_VISIT'}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="mr-3"
                />
                <BuildingOfficeIcon className="h-6 w-6 mr-3" style={{ color: '#0a529f' }} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Visit Center</p>
                  <p className="text-sm text-gray-600">Visit lab center for sample collection</p>
                </div>
                <p className="text-sm text-green-600">Free</p>
              </label>
            )}
          </div>
        </div>

        {/* Address (if home collection) */}
        {collectionType === 'HOME_COLLECTION' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Collection Address</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Address Line 1 *"
                value={address.addressLine1}
                onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={address.addressLine2}
                onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City *"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="Pincode *"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Time Slots */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Select Time Slot</h3>
          {slots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No slots available</p>
              <p className="text-sm text-gray-500 mt-1">Please contact support</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <label
                  key={slot._id}
                  className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                    selectedSlot === slot._id
                      ? ''
                      : slot.currentBookings >= slot.maxBookings
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={selectedSlot === slot._id ? { borderColor: '#0a529f', backgroundColor: '#e6f0fa' } : undefined}
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
                      <p className="font-medium text-gray-900">
                        {new Date(slot.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{slot.timeSlot}</p>
                    </div>
                  </div>
                  {slot.currentBookings >= slot.maxBookings ? (
                    <span className="text-xs text-red-600 font-medium">Full</span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      {slot.maxBookings - slot.currentBookings} slots left
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-600">
              <span>Tests Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {collectionType === 'HOME_COLLECTION' && (
              <div className="flex items-center justify-between text-gray-600">
                <span>Home Collection Charges</span>
                <span>₹{homeCollectionCharges}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={submitting || !selectedSlot}
          className="w-full py-4 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          style={!submitting && selectedSlot ? { backgroundColor: '#0a529f' } : undefined}
          onMouseEnter={(e) => !submitting && selectedSlot && (e.currentTarget.style.backgroundColor = '#084080')}
          onMouseLeave={(e) => !submitting && selectedSlot && (e.currentTarget.style.backgroundColor = '#0a529f')}
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
              Placing Order...
            </span>
          ) : (
            'Place Order'
          )}
        </button>
      </div>
    </div>
  )
}
