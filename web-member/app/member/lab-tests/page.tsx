'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DocumentPlusIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface Prescription {
  prescriptionId: string
  fileName: string
  status: string
  uploadedAt: string
  cartId?: string
}

interface Cart {
  cartId: string
  items: Array<{
    serviceName: string
  }>
  status: string
  createdAt: string
}

export default function LabTestsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch prescriptions
      const prescriptionsRes = await fetch('/api/member/lab/prescriptions', {
        credentials: 'include',
      })
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json()
        setPrescriptions(prescriptionsData.data || [])
      }

      // Fetch active carts
      const cartsRes = await fetch('/api/member/lab/carts/active', {
        credentials: 'include',
      })
      if (cartsRes.ok) {
        const cartsData = await cartsRes.json()
        setCarts(cartsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'text-yellow-600 bg-yellow-100'
      case 'DIGITIZING':
        return 'text-blue-600 bg-blue-100'
      case 'DIGITIZED':
        return 'text-green-600 bg-green-100'
      case 'CREATED':
        return 'text-blue-600 bg-blue-100'
      case 'REVIEWED':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Lab Tests</h1>
          <p className="text-sm text-gray-600 mt-1">Book lab tests & diagnostic services</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Upload Prescription Card */}
        <div
          onClick={() => router.push('/member/lab-tests/upload')}
          className="rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-shadow"
          style={{ backgroundImage: 'linear-gradient(to right, #0a529f, #084080)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Upload Prescription</h2>
              <p className="text-sm" style={{ color: '#d4e5f5' }}>
                Upload your prescription and we'll create a quote for you
              </p>
            </div>
            <DocumentPlusIcon className="h-12 w-12" />
          </div>
        </div>

        {/* Active Carts */}
        {carts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Your Carts ({carts.length})
              </h3>
            </div>

            <div className="space-y-3">
              {carts.map((cart) => (
                <div
                  key={cart.cartId}
                  onClick={() => router.push(`/member/lab-tests/cart/${cart.cartId}`)}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {cart.items.length} test{cart.items.length > 1 ? 's' : ''} added
                      </p>
                      <p className="text-sm text-gray-600">
                        Cart ID: {cart.cartId}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(cart.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cart.status)}`}>
                        {cart.status}
                      </span>
                      <button className="mt-2 text-sm font-medium" style={{ color: '#0a529f' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#084080'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#0a529f'}
                      >
                        Review Cart →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Prescriptions</h3>
            </div>

            <div className="space-y-3">
              {prescriptions.slice(0, 5).map((prescription) => (
                <div
                  key={prescription.prescriptionId}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{prescription.fileName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded: {formatDate(prescription.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                      {prescription.status === 'DIGITIZING' && (
                        <ClockIcon className="h-5 w-5" style={{ color: '#0a529f' }} />
                      )}
                      {prescription.status === 'DIGITIZED' && prescription.cartId && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  {prescription.status === 'DIGITIZED' && prescription.cartId && (
                    <button
                      onClick={() => router.push(`/member/lab-tests/cart/${prescription.cartId}`)}
                      className="mt-3 w-full py-2 text-white rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#0a529f' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                    >
                      Review Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Link */}
        <button
          onClick={() => router.push('/member/lab-tests/orders')}
          className="w-full py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          View My Orders
        </button>
      </div>
    </div>
  )
}
