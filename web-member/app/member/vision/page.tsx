'use client'

import { useState, useEffect } from 'react'
import { EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import EmptyState from '@/components/ui/EmptyState'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Vision Services"
        subtitle="Browse and book vision care services"
        backHref="/member"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {error && (
          <div className="mb-6 p-4 lg:p-5 rounded-xl border-2" style={{ background: '#FEF1E7', borderColor: '#F9B376' }}>
            <p className="text-sm lg:text-base font-medium" style={{ color: '#E53535' }}>{error}</p>
          </div>
        )}

        {services.length === 0 ? (
          <EmptyState
            icon={EyeIcon}
            title="No Vision Services Available"
            message="No vision services are currently assigned to your policy. Please contact your administrator for more information."
          />
        ) : (
          <>
            {/* Search Bar */}
            {services.length > 3 && (
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 lg:h-6 lg:w-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vision services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 lg:py-4 border-2 rounded-xl text-sm lg:text-base focus:outline-none transition-all"
                    style={{ borderColor: '#86ACD8', background: '#FFFFFF' }}
                    onFocus={(e) => e.target.style.borderColor = '#0F5FDC'}
                    onBlur={(e) => e.target.style.borderColor = '#86ACD8'}
                  />
                </div>
              </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              {filteredServices.map((service) => (
                <DetailCard key={service.code} variant="primary" className="shadow-md hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-base lg:text-lg font-semibold mb-2" style={{ color: '#0E51A2' }}>
                      {service.name}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  <CTAButton
                    onClick={() => handleBookService(service.code)}
                    variant="primary"
                    fullWidth
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
