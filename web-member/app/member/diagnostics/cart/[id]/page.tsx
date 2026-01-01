'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MapPinIcon, BeakerIcon } from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import EmptyState from '@/components/ui/EmptyState'

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <p className="text-sm lg:text-base text-gray-500">Cart not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Your Cart"
        subtitle="Review tests and select diagnostic center"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-4xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Cart Info */}
        <DetailCard variant="primary">
          <div className="flex items-center justify-between mb-4 lg:mb-5">
            <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>
              Tests ({cart.items.length})
            </h3>
            {cart.pincode && (
              <div className="flex items-center text-xs lg:text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-1" style={{ color: '#0F5FDC' }} />
                <span>Pincode: {cart.pincode}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {cart.items.map((item, index) => (
              <DetailCard
                key={index}
                variant="secondary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{item.serviceName}</p>
                    <p className="text-xs lg:text-sm text-gray-600">{item.serviceCode}</p>
                    <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#EFF4FF', color: '#0F5FDC' }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              </DetailCard>
            ))}
          </div>
        </DetailCard>

        {/* Loading Vendors */}
        {loadingVendors && (
          <DetailCard variant="primary">
            <div className="text-center py-8 lg:py-12">
              <div className="h-12 w-12 lg:h-14 lg:w-14 mx-auto rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
              <p className="text-sm lg:text-base text-gray-600">Loading diagnostic centers...</p>
            </div>
          </DetailCard>
        )}

        {/* Available Vendors */}
        {!loadingVendors && vendors.length > 0 && (
          <div className="space-y-3 lg:space-y-4">
            <DetailCard variant="primary">
              <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: '#0E51A2' }}>
                Available Diagnostic Centers ({vendors.length})
              </h3>
              <p className="text-xs lg:text-sm text-gray-600">
                Compare prices and select your preferred diagnostic center
              </p>
            </DetailCard>

            {vendors.map((vendor, index) => (
              <DetailCard
                key={vendor._id}
                variant="primary"
              >
                <div className="flex items-start justify-between mb-3 lg:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base lg:text-lg font-bold" style={{ color: '#0E51A2' }}>{vendor.name}</h4>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded" style={{ background: '#25A425', color: 'white' }}>
                          BEST PRICE
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2">
                      <span className="font-mono">{vendor.code}</span>
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <DetailCard variant="secondary" className="mb-3 lg:mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs lg:text-sm text-gray-700 font-medium">Total Price:</span>
                    <div className="text-right">
                      <span className="text-xl lg:text-2xl font-bold" style={{ color: '#0E51A2' }}>
                        ₹{vendor.totalDiscountedPrice}
                      </span>
                      {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                        <span className="ml-2 text-xs lg:text-sm text-gray-500 line-through">
                          ₹{vendor.totalActualPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                    <p className="text-xs text-right font-medium" style={{ color: '#25A425' }}>
                      Save ₹{vendor.totalActualPrice - vendor.totalDiscountedPrice}
                    </p>
                  )}
                </DetailCard>

                {/* Features */}
                <div className="flex items-center space-x-3 lg:space-x-4 mb-3 lg:mb-4 text-xs lg:text-sm">
                  {vendor.homeCollection && (
                    <span className="flex items-center" style={{ color: '#25A425' }}>
                      <svg className="h-4 w-4 lg:h-5 lg:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Home Collection (+₹{vendor.homeCollectionCharges})
                    </span>
                  )}
                  {vendor.centerVisit && (
                    <span className="flex items-center" style={{ color: '#0F5FDC' }}>
                      <svg className="h-4 w-4 lg:h-5 lg:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Center Visit
                    </span>
                  )}
                </div>

                {/* Test Pricing Breakdown */}
                <div className="border-t pt-3 lg:pt-4 mb-3 lg:mb-4" style={{ borderColor: '#86ACD8' }}>
                  <p className="text-xs font-semibold text-gray-700 mb-2 lg:mb-3">Price Breakdown:</p>
                  <div className="space-y-1 lg:space-y-2">
                    {vendor.pricing.map((price, idx) => (
                      <div key={idx} className="flex justify-between text-xs lg:text-sm text-gray-600">
                        <span>{price.serviceName}</span>
                        <span className="font-medium" style={{ color: '#0E51A2' }}>₹{price.discountedPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <CTAButton
                  onClick={() => handleSelectVendor(vendor)}
                  variant="primary"
                  fullWidth
                >
                  Select & Book Slot
                </CTAButton>
              </DetailCard>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingVendors && vendors.length === 0 && (
          <EmptyState
            icon={BeakerIcon}
            title="No diagnostic centers available yet"
            message="Our team is processing your prescription. Diagnostic centers will appear here once available."
          />
        )}
      </div>
    </div>
  )
}
