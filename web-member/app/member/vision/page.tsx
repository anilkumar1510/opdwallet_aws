'use client'

import { useState, useEffect } from 'react'
import { EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface VisionService {
  code: string
  name: string
  description: string
  priceRange: {
    min: number
    max: number
  }
  coveragePercentage: number
  copayAmount: number
}

export default function VisionPage() {
  const router = useRouter()
  const [services, setServices] = useState<VisionService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVisionServices()
  }, [])

  const fetchVisionServices = async () => {
    try {
      console.log('[VisionServices] Loading assigned services')
      setLoading(true)

      const response = await fetch('/api/member/benefits/CAT007/services', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[VisionServices] Services fetched:', data.services?.length || 0)
        setServices(data.services || [])
      } else {
        console.error('[VisionServices] Failed to fetch services:', response.status)
        setError('Failed to load vision services')
      }
    } catch (err) {
      console.error('[VisionServices] Error fetching services:', err)
      setError('Failed to load vision services')
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBookService = (serviceCode: string) => {
    console.log('[VisionServices] Booking service:', serviceCode)
    router.push(`/member/vision/clinics?serviceCode=${serviceCode}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/member" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Vision Services</h1>
          <p className="text-gray-600 mt-2">Browse and book vision care services covered by your policy</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : services.length === 0 ? (
          <Card className="text-center py-16">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <EyeIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Vision Services Available</h2>
              <p className="text-gray-600 max-w-md mb-6">
                No vision services are currently assigned to your policy. Please contact your administrator for more information.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Search Bar */}
            {services.length > 3 && (
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vision services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.code} className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Service Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* Coverage Info */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-semibold text-blue-600">
                          {service.coveragePercentage}%
                        </span>
                      </div>
                      {service.copayAmount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Co-pay:</span>
                          <span className="font-semibold text-gray-900">
                            ₹{service.copayAmount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => handleBookService(service.code)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Book Now
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {filteredServices.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-gray-600">No services match your search "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
