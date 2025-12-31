'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, MapPinIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline'

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
  pincode: string
  selectedVendorIds: string[]
}

interface VendorPricing {
  serviceId: string
  serviceName: string
  serviceCode: string
  actualPrice: number
  discountedPrice: number
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  pricing: VendorPricing[]
  totalActualPrice: number
  totalDiscountedPrice: number
  totalWithHomeCollection: number
}

export default function CartDetailPage() {
  const router = useRouter()
  const params = useParams()
  const cartId = params.id as string

  const [cart, setCart] = useState<Cart | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVendors, setLoadingVendors] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/member/lab/carts/${cartId}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch cart')

      const data = await response.json()
      setCart(data.data)

      // Auto-fetch vendors after cart is loaded
      fetchVendors()
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [cartId])

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true)
      const response = await fetch(`/api/member/lab/carts/${cartId}/vendors`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch vendors')

      const data = await response.json()
      setVendors(data.data || [])

      if (data.data.length === 0 && data.message) {
        console.log(data.message)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      alert('Failed to fetch vendors')
    } finally {
      setLoadingVendors(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleSelectVendor = (vendor: Vendor) => {
    // Navigate to vendor details/booking page
    router.push(`/member/diagnostics/cart/${cartId}/vendor/${vendor.vendorId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cart not found</p>
      </div>
    )
  }

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
            <h1 className="text-xl font-semibold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-600">Review tests and select lab</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Cart Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Tests ({cart.items.length})
            </h3>
            {cart.pincode && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>Pincode: {cart.pincode}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {cart.items.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.serviceName}</p>
                    <p className="text-sm text-gray-600">{item.serviceCode}</p>
                    <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#e6f0fa', color: '#0a529f' }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Vendors */}
        {loadingVendors && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="h-12 w-12 mx-auto rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600">Loading lab partners...</p>
          </div>
        )}

        {/* Available Vendors */}
        {!loadingVendors && vendors.length > 0 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Available Lab Partners ({vendors.length})
              </h3>
              <p className="text-sm text-gray-600">
                Compare prices and select your preferred lab partner
              </p>
            </div>

            {vendors.map((vendor, index) => (
              <div
                key={vendor._id}
                className="bg-white rounded-2xl shadow-sm p-4 border-2 transition-colors hover:border-blue-300"
                style={{ borderColor: index === 0 ? '#0a529f' : '#e5e7eb' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg text-gray-900">{vendor.name}</h4>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          BEST PRICE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-mono">{vendor.code}</span>
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#e6f0fa' }}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">Total Price:</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold" style={{ color: '#0a529f' }}>
                        ₹{vendor.totalDiscountedPrice}
                      </span>
                      {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ₹{vendor.totalActualPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                    <p className="text-xs text-right text-green-600 font-medium">
                      Save ₹{vendor.totalActualPrice - vendor.totalDiscountedPrice}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="flex items-center space-x-3 mb-3 text-sm">
                  {vendor.homeCollection && (
                    <span className="flex items-center text-green-600">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Home Collection (+₹{vendor.homeCollectionCharges})
                    </span>
                  )}
                  {vendor.centerVisit && (
                    <span className="flex items-center text-blue-600">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Center Visit
                    </span>
                  )}
                </div>

                {/* Test Pricing Breakdown */}
                <div className="border-t border-gray-200 pt-3 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Price Breakdown:</p>
                  <div className="space-y-1">
                    {vendor.pricing.map((price, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-600">
                        <span>{price.serviceName}</span>
                        <span className="font-medium">₹{price.discountedPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={() => handleSelectVendor(vendor)}
                  className="w-full py-3 text-white rounded-xl font-semibold transition-colors"
                  style={{ backgroundColor: '#0a529f' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                >
                  Select & Book Slot
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingVendors && vendors.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <MapPinIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium mb-2">No lab partners available yet</p>
            <p className="text-sm text-gray-500">
              Our team is processing your prescription. Lab partners will appear here once available.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
