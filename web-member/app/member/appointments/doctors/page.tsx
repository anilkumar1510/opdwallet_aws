'use client'

import React, { useState, useEffect, Suspense, useMemo, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  FunnelIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import EmptyState from '@/components/ui/EmptyState'

// API base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'

interface ClinicLocation {
  clinicId: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  consultationFee: number
  distance?: number
  distanceText?: string
}

interface Doctor {
  _id: string
  doctorId: string
  name: string
  profilePhoto: string
  specialtyId: string
  specialty: string
  qualifications: string
  experience: number
  rating: number
  reviewCount: number
  clinics: ClinicLocation[]
}

// Memoized ClinicCard component
const ClinicCard = memo(({
  clinic,
  onBookAppointment
}: {
  clinic: ClinicLocation
  onBookAppointment: () => void
}) => {
  return (
    <DetailCard variant="secondary" className="p-3 lg:p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>{clinic.name}</div>
            {clinic.distanceText && (
              <span className="text-xs font-medium px-2 py-1 rounded-full ml-2" style={{ background: '#25A425', color: 'white' }}>
                📏 {clinic.distanceText}
              </span>
            )}
          </div>
          <div className="flex items-start gap-1 text-xs lg:text-sm text-gray-600 mt-1">
            <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5 mt-0.5 flex-shrink-0" style={{ color: '#0F5FDC' }} />
            <span className="line-clamp-2">{clinic.address}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#86ACD8' }}>
        <div className="text-sm lg:text-base">
          <span className="text-gray-600">Consultation: </span>
          <span className="font-semibold" style={{ color: '#25A425' }}>₹{clinic.consultationFee}</span>
        </div>
        <CTAButton onClick={onBookAppointment} variant="primary" className="!px-4 !py-2 text-sm">
          Book Appointment
        </CTAButton>
      </div>
    </DetailCard>
  )
})

ClinicCard.displayName = 'ClinicCard'

// Memoized DoctorCard component
const DoctorCard = memo(({
  doctor,
  onBookAppointment
}: {
  doctor: Doctor
  onBookAppointment: (doctor: Doctor, clinic: ClinicLocation) => void
}) => {
  return (
    <DetailCard variant="primary" className="shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3 lg:gap-4 mb-4">
        {doctor.profilePhoto ? (
          <img
            src={`${API_BASE_URL}${doctor.profilePhoto}`}
            alt={doctor.name}
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover flex-shrink-0"
            style={{ border: '2px solid #A4BFFE7A' }}
          />
        ) : (
          <IconCircle icon={UserIcon} size="lg" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base lg:text-lg" style={{ color: '#0E51A2' }}>{doctor.name}</h3>
          <p className="text-xs lg:text-sm text-gray-600">{doctor.qualifications}</p>
          <p className="text-xs lg:text-sm text-gray-600">{doctor.experience} years experience</p>
          <div className="flex items-center gap-1 mt-1">
            <StarIcon className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-400 fill-current" />
            <span className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{doctor.rating}</span>
            <span className="text-xs lg:text-sm text-gray-600">({doctor.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {doctor.clinics && doctor.clinics.length > 0 ? (
          doctor.clinics.map((clinic, index) => (
            <ClinicCard
              key={index}
              clinic={clinic}
              onBookAppointment={() => onBookAppointment(doctor, clinic)}
            />
          ))
        ) : (
          <DetailCard variant="secondary" className="text-center py-4">
            <p className="text-sm lg:text-base text-gray-500">No clinic locations available</p>
          </DetailCard>
        )}
      </div>
    </DetailCard>
  )
})

DoctorCard.displayName = 'DoctorCard'

function DoctorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const specialtyId = searchParams.get('specialtyId')
  const specialtyName = searchParams.get('specialtyName')

  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [pincode, setPincode] = useState('')
  const [locationName, setLocationName] = useState('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [searchingCity, setSearchingCity] = useState(false)
  const [showCityInput, setShowCityInput] = useState(false)

  useEffect(() => {
    // Load saved pincode from localStorage
    const savedPincode = localStorage.getItem('userPincode')
    const savedLocation = localStorage.getItem('userLocation')
    if (savedPincode) setPincode(savedPincode)
    if (savedLocation) setLocationName(savedLocation)
  }, [])

  // Define fetchDoctors BEFORE the useEffect that uses it
  const fetchDoctors = useCallback(async () => {
    try {
      console.log('[Doctors] Fetching doctors for specialty:', specialtyId)

      // Build query string with pincode if available
      let queryString = `specialtyId=${specialtyId}`
      if (pincode && pincode.length === 6) {
        queryString += `&pincode=${pincode}`
        console.log('[Doctors] Adding pincode filter:', pincode)
      }

      const response = await fetch(`/api/doctors?${queryString}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch doctors')
      }

      const responseData = await response.json()
      // Handle both pagination wrapper and flat array responses
      const data = responseData.data || responseData
      console.log('[Doctors] Doctors received:', { count: Array.isArray(data) ? data.length : 0 })

      // Validate and ensure each doctor has clinics array
      const validatedData = Array.isArray(data) ? data.map((doctor: Doctor) => ({
        ...doctor,
        clinics: doctor.clinics || []
      })) : []

      setDoctors(validatedData)

      const uniqueCities = Array.from(
        new Set(
          validatedData.flatMap((doctor: Doctor) =>
            doctor.clinics?.map((clinic) => clinic.city) || []
          ).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b)))
      setCities(uniqueCities as string[])
      console.log('[Doctors] Available cities:', uniqueCities)
    } catch (error) {
      console.error('[Doctors] Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }, [specialtyId, pincode])

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId, fetchDoctors])

  // Memoized filtered doctors calculation
  const filteredDoctors = useMemo(() => {
    console.log('[Doctors] Filtering doctors:', { searchQuery, selectedCity })
    let filtered = doctors

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.qualifications.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCity !== '') {
      filtered = filtered.filter((doctor) =>
        doctor.clinics?.some((clinic) => clinic.city === selectedCity) || false
      )
    }

    console.log('[Doctors] Filtered results:', { count: filtered.length })
    return filtered
  }, [searchQuery, selectedCity, doctors])

  // Memoized event handlers
  const handleBookAppointment = useCallback((doctor: Doctor, clinic: ClinicLocation) => {
    console.log('[Doctors] Book appointment clicked:', {
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      clinicId: clinic.clinicId,
      clinicName: clinic.name
    })
    const params = new URLSearchParams({
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      clinicId: clinic.clinicId,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
      consultationFee: clinic.consultationFee.toString()
    })
    router.push(`/member/appointments/select-patient?${params.toString()}`)
  }, [router])

  const handleBackClick = useCallback(() => {
    router.back()
  }, [router])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  const handleClearCity = useCallback(() => {
    setSelectedCity('')
  }, [])

  const handleCityClick = useCallback((city: string) => {
    setSelectedCity(prev => city === prev ? '' : city)
    console.log('[Doctors] City filter changed:', city)
  }, [])

  const handlePincodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(value)

    // Save to localStorage when 6 digits
    if (value.length === 6) {
      localStorage.setItem('userPincode', value)
      console.log('[Doctors] Pincode saved:', value)
    }
  }, [])

  const handleClearPincode = useCallback(() => {
    setPincode('')
    setLocationName('')
    setLocationError('')
    localStorage.removeItem('userPincode')
    localStorage.removeItem('userLocation')
    console.log('[Doctors] Location cleared')
  }, [])

  const handleCitySearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCitySearch(value)
    setLocationError('')

    if (value.trim().length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      return
    }

    // Debounced search will be handled in useEffect
  }, [])

  const handleCitySelect = useCallback(async (location: any) => {
    setSearchingCity(true)
    setLocationError('')
    setShowCitySuggestions(false)

    try {
      console.log('[Doctors] Selected location (Google Maps):', location)

      // Google Maps autocomplete result already has everything we need!
      if (location.pincode) {
        setPincode(location.pincode)

        // Format location name
        const locationText = [location.city, location.state]
          .filter(Boolean)
          .join(', ')

        setLocationName(locationText)
        setCitySearch(location.formattedAddress || locationText)

        // Save to localStorage
        localStorage.setItem('userPincode', location.pincode)
        localStorage.setItem('userLocation', locationText)

        // Close city search input
        setShowCityInput(false)
        setCitySearch('')

        console.log('[Doctors] Location set:', {
          pincode: location.pincode,
          location: locationText
        })
      } else {
        setLocationError('Could not find pincode for this location')
      }
    } catch (error) {
      console.error('[Doctors] City selection error:', error)
      setLocationError('Failed to set location')
    } finally {
      setSearchingCity(false)
    }
  }, [])

  // Debounced city search - Using Google Maps API via backend
  useEffect(() => {
    if (citySearch.trim().length < 2) return

    const timer = setTimeout(async () => {
      setSearchingCity(true)
      try {
        console.log('[Doctors] Searching for city:', citySearch)

        // ✅ Google Maps API via backend autocomplete endpoint
        const response = await fetch(
          `/api/location/autocomplete?query=${encodeURIComponent(citySearch)}&limit=5`,
          { credentials: 'include' }
        )

        if (!response.ok) {
          throw new Error('Failed to search locations')
        }

        const data = await response.json()
        console.log('[Doctors] City search results (Google Maps):', data)

        setCitySuggestions(Array.isArray(data) ? data : [])
        setShowCitySuggestions(Array.isArray(data) && data.length > 0)
      } catch (error) {
        console.error('[Doctors] City search error:', error)
        setLocationError('Failed to search cities')
        setCitySuggestions([])
        setShowCitySuggestions(false)
      } finally {
        setSearchingCity(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [citySearch])

  const handleUseCurrentLocation = useCallback(async () => {
    setLocationError('')

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setFetchingLocation(true)
    console.log('[Doctors] Requesting current location...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          console.log('[Doctors] Location obtained:', { latitude, longitude })

          // Call reverse geocoding API to get pincode
          const response = await fetch(
            `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`,
            { credentials: 'include' }
          )

          if (!response.ok) {
            throw new Error('Failed to reverse geocode location')
          }

          const data = await response.json()
          console.log('[Doctors] Reverse geocoded:', data)

          if (data.pincode) {
            setPincode(data.pincode)
            const locationText = [data.city, data.state].filter(Boolean).join(', ')
            setLocationName(locationText)

            // Save to localStorage
            localStorage.setItem('userPincode', data.pincode)
            localStorage.setItem('userLocation', locationText)

            console.log('[Doctors] Location set:', { pincode: data.pincode, location: locationText })
          } else {
            setLocationError('Could not determine pincode for your location')
          }
        } catch (error) {
          console.error('[Doctors] Reverse geocoding error:', error)
          setLocationError('Failed to get location details')
        } finally {
          setFetchingLocation(false)
        }
      },
      (error) => {
        console.error('[Doctors] Geolocation error:', error)
        setFetchingLocation(false)

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out')
            break
          default:
            setLocationError('Failed to get your location')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [])

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
        title="Select Doctor"
        subtitle={specialtyName || 'Choose your doctor'}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="space-y-4 lg:space-y-5">
          <DetailCard variant="secondary" className="p-3 lg:p-4">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <label className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>
                📍 Filter by Location
              </label>
              {pincode && (
                <button
                  onClick={handleClearPincode}
                  className="text-xs lg:text-sm px-2 py-1 rounded font-medium"
                  style={{ background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)', color: '#0F5FDC' }}
                >
                  Clear
                </button>
              )}
            </div>

            {!showCityInput ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="Enter 6-digit pincode (e.g., 560001)"
                    maxLength={6}
                    className="flex-1 px-3 py-2 lg:py-3 border rounded-xl focus:ring-2 focus:border-transparent text-sm lg:text-base"
                    style={{ borderColor: '#86ACD8', outlineColor: '#0F5FDC' }}
                  />
                  <CTAButton
                    onClick={handleUseCurrentLocation}
                    disabled={fetchingLocation}
                    variant="primary"
                    className="!px-3 !py-2 lg:!py-3 whitespace-nowrap text-xs lg:text-sm"
                  >
                    {fetchingLocation ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        <span className="hidden sm:inline">Locating...</span>
                      </span>
                    ) : (
                      '📍 Use Current'
                    )}
                  </CTAButton>
                </div>
                <button
                  onClick={() => setShowCityInput(true)}
                  className="text-xs lg:text-sm underline font-medium"
                  style={{ color: '#0F5FDC' }}
                >
                  Or search by city name
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={handleCitySearchChange}
                    placeholder="Search city or area (e.g., Bangalore, Koramangala)"
                    className="w-full px-3 py-2 lg:py-3 border rounded-xl focus:ring-2 focus:border-transparent text-sm lg:text-base"
                    style={{ borderColor: '#86ACD8', outlineColor: '#0F5FDC' }}
                    autoFocus
                  />
                  {searchingCity && (
                    <div className="absolute right-3 top-3">
                      <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC' }}></div>
                    </div>
                  )}

                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ border: '2px solid #86ACD8' }}>
                      {citySuggestions.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleCitySelect(location)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0"
                          style={{ borderColor: '#F7DCAF' }}
                        >
                          <div className="font-medium text-sm lg:text-base" style={{ color: '#0E51A2' }}>
                            {location.city}
                            {location.pincode && ` - ${location.pincode}`}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500 line-clamp-1">
                            {location.formattedAddress}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowCityInput(false)
                    setCitySearch('')
                    setShowCitySuggestions(false)
                  }}
                  className="text-xs lg:text-sm underline font-medium"
                  style={{ color: '#0F5FDC' }}
                >
                  Back to pincode entry
                </button>
              </div>
            )}

            {locationName && (
              <p className="text-xs lg:text-sm font-medium px-2 py-1 rounded" style={{ color: '#25A425', background: '#f0fdf4' }}>
                ✓ {locationName}
              </p>
            )}

            {locationError && (
              <p className="text-xs lg:text-sm px-2 py-1 rounded" style={{ color: '#E53535', background: '#fef2f2' }}>
                {locationError}
              </p>
            )}

            {pincode.length > 0 && pincode.length < 6 && !locationError && (
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                {6 - pincode.length} more digit(s) required
              </p>
            )}
          </DetailCard>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#0F5FDC' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search doctors..."
              className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 border rounded-xl focus:ring-2 focus:border-transparent text-sm lg:text-base"
              style={{ borderColor: '#86ACD8', outlineColor: '#0F5FDC' }}
            />
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={handleToggleFilters}
              className="flex items-center gap-2 px-4 py-2 lg:py-3 border rounded-xl hover:shadow-md transition-shadow text-sm lg:text-base"
              style={{ borderColor: '#86ACD8', color: '#0E51A2' }}
            >
              <FunnelIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Filters</span>
            </button>

            {selectedCity && (
              <button
                onClick={handleClearCity}
                className="px-3 py-2 lg:py-3 rounded-xl text-sm lg:text-base font-medium"
                style={{ background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)', color: '#0F5FDC' }}
              >
                {selectedCity} ×
              </button>
            )}
          </div>

          {showFilters && (
            <DetailCard variant="secondary" className="p-3 lg:p-4">
              <div className="mb-3 text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>Filter by City</div>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityClick(city)}
                    className={`px-3 py-1.5 lg:py-2 rounded-full text-sm lg:text-base font-medium transition-all ${
                      city === selectedCity
                        ? 'text-white shadow-md'
                        : 'border hover:shadow-md'
                    }`}
                    style={
                      city === selectedCity
                        ? { background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }
                        : { borderColor: '#86ACD8', color: '#0E51A2', background: 'white' }
                    }
                  >
                    {city}
                  </button>
                ))}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Doctors List */}
        {filteredDoctors.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No doctors found"
            message="Try adjusting your filters or search term"
          />
        ) : (
          <div className="space-y-4 lg:space-y-5">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onBookAppointment={handleBookAppointment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <DoctorsContent />
    </Suspense>
  )
}