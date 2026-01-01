'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

interface DentalService {
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

export default function DentalPage() {
  const router = useRouter()
  const [services, setServices] = useState<DentalService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDentalServices()
  }, [])

  const fetchDentalServices = async () => {
    try {
      console.log('[DentalServices] Loading assigned services')
      setLoading(true)

      const response = await fetch('/api/member/benefits/CAT006/services', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[DentalServices] Services fetched:', data.services?.length || 0)
        setServices(data.services || [])
      } else {
        console.error('[DentalServices] Failed to fetch services:', response.status)
        setError('Failed to load dental services')
      }
    } catch (err) {
      console.error('[DentalServices] Error fetching services:', err)
      setError('Failed to load dental services')
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBookService = (serviceCode: string) => {
    console.log('[DentalServices] Booking service:', serviceCode)
    router.push(`/member/dental/clinics?serviceCode=${serviceCode}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Dental Services"
        subtitle="Browse and book dental care services covered by your policy"
        backHref="/member"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {error && (
          <div
            className="mb-4 lg:mb-5 p-4 lg:p-5 rounded-xl text-sm lg:text-base"
            style={{ background: '#FEF1E7', border: '1px solid #F9B376' }}
          >
            <p style={{ color: '#E53535' }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
              style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
            ></div>
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={SparklesIcon}
            title="No Dental Services Available"
            message="No dental services are currently assigned to your policy. Please contact your administrator for more information."
          />
        ) : (
          <>
            {/* Search Bar */}
            {services.length > 3 && (
              <div className="mb-4 lg:mb-5">
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                    style={{ color: '#0F5FDC' }}
                  />
                  <input
                    type="text"
                    placeholder="Search dental services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 lg:py-4 border rounded-xl focus:ring-2 focus:border-transparent text-sm lg:text-base"
                    style={{ borderColor: '#86ACD8', outlineColor: '#0F5FDC' }}
                  />
                </div>
              </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 gap-4 lg:gap-5">
              {filteredServices.map((service) => (
                <DetailCard key={service.code} variant="primary">
                  {/* Service Header */}
                  <div className="mb-4">
                    <h3
                      className="text-base lg:text-lg font-semibold mb-2"
                      style={{ color: '#0E51A2' }}
                    >
                      {service.name}
                    </h3>
                    <p className="text-sm lg:text-base text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Coverage Info */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm lg:text-base">
                      <span className="text-gray-600">Coverage:</span>
                      <span
                        className="font-semibold"
                        style={{ color: '#25A425' }}
                      >
                        {service.coveragePercentage}%
                      </span>
                    </div>
                    {service.copayAmount > 0 && (
                      <div className="flex items-center justify-between text-sm lg:text-base">
                        <span className="text-gray-600">Co-pay:</span>
                        <span
                          className="font-semibold"
                          style={{ color: '#0E51A2' }}
                        >
                          ₹{service.copayAmount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <CTAButton
                    variant="primary"
                    fullWidth
                    onClick={() => handleBookService(service.code)}
                  >
                    Book Now
                  </CTAButton>
                </DetailCard>
              ))}
            </div>

            {filteredServices.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-sm lg:text-base text-gray-600">
                  No services match your search "{searchTerm}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
