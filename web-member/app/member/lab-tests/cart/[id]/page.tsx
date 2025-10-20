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

export default function CartDetailPage() {
  const router = useRouter()
  const params = useParams()
  const cartId = params.id as string

  const [cart, setCart] = useState<Cart | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pincode, setPincode] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchingVendors, setSearchingVendors] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/member/lab/carts/${cartId}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch cart')

      const data = await response.json()
      setCart(data.data)
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }, [cartId])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleSearchVendors = async () => {
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode')
      return
    }

    setSearchingVendors(true)

    try {
      const response = await fetch(`/api/member/lab/vendors/available?pincode=${pincode}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch vendors')

      const data = await response.json()
      setVendors(data.data || [])

      if (data.data.length === 0) {
        alert('No vendors available for this pincode')
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      alert('Failed to fetch vendors')
    } finally {
      setSearchingVendors(false)
    }
  }

  const handleSelectVendor = (vendor: Vendor) => {
    // Navigate to vendor details/booking page
    router.push(`/member/lab-tests/cart/${cartId}/vendor/${vendor.vendorId}`)
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
    <div className="min-h-screen bg-gray-50">
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
        {/* Tests in Cart */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Tests ({cart.items.length})
          </h3>
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

        {/* Pincode Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Find Lab Partners</h3>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearchVendors}
              disabled={searchingVendors}
              className="px-6 py-3 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
              style={!searchingVendors ? { backgroundColor: '#0a529f' } : undefined}
              onMouseEnter={(e) => !searchingVendors && (e.currentTarget.style.backgroundColor = '#084080')}
              onMouseLeave={(e) => !searchingVendors && (e.currentTarget.style.backgroundColor = '#0a529f')}
            >
              {searchingVendors ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Available Vendors */}
        {vendors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Available Lab Partners ({vendors.length})
            </h3>
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectVendor(vendor)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectVendor(vendor)
                    }
                  }}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-mono">{vendor.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    {vendor.homeCollection && (
                      <span className="text-green-600">✓ Home Collection</span>
                    )}
                    {vendor.centerVisit && (
                      <span className="text-green-600">✓ Center Visit</span>
                    )}
                  </div>
                  <button
                    className="mt-3 w-full py-2 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#0a529f' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                  >
                    View Pricing & Book
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {vendors.length === 0 && pincode && !searchingVendors && (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <MapPinIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">Enter your pincode to find lab partners</p>
          </div>
        )}
      </div>
    </div>
  )
}
