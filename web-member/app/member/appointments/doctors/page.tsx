'use client'

import React, { useState, useEffect, Suspense, useMemo, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  FunnelIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline'

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
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">{clinic.name}</div>
            {clinic.distanceText && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 ml-2">
                📏 {clinic.distanceText}
              </span>
            )}
          </div>
          <div className="flex items-start space-x-1 text-sm text-gray-600 mt-1">
            <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{clinic.address}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-sm">
          <span className="text-gray-600">Consultation: </span>
          <span className="font-semibold" style={{ color: '#0a529f' }}>₹{clinic.consultationFee}</span>
        </div>
        <button
          onClick={onBookAppointment}
          className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#0a529f' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
        >
          Book Appointment
        </button>
      </div>
    </div>
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
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start space-x-4 mb-4">
        {doctor.profilePhoto ? (
          <img
            src={`http://localhost:4000${doctor.profilePhoto}`}
            alt={doctor.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
          />
        ) : (
          <div className="p-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#e6f0fa' }}>
            <UserIcon className="h-8 w-8" style={{ color: '#0a529f' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
          <p className="text-sm text-gray-600">{doctor.qualifications}</p>
          <p className="text-sm text-gray-600">{doctor.experience} years experience</p>
          <div className="flex items-center space-x-1 mt-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
            <span className="text-sm text-gray-600">({doctor.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {doctor.clinics && doctor.clinics.length > 0 ? (
          doctor.clinics.map((clinic, index) => (
            <ClinicCard
              key={index}
              clinic={clinic}
              onBookAppointment={() => onBookAppointment(doctor, clinic)}
            />
          ))
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">No clinic locations available</p>
          </div>
        )}
      </div>
    </div>
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

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId, pincode])

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

  const fetchDoctors = async () => {
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

      const data = await response.json()
      console.log('[Doctors] Doctors received:', { count: data.length })

      // Validate and ensure each doctor has clinics array
      const validatedData = data.map((doctor: Doctor) => ({
        ...doctor,
        clinics: doctor.clinics || []
      }))

      setDoctors(validatedData)

      const uniqueCities = Array.from(
        new Set(
          validatedData.flatMap((doctor: Doctor) =>
            doctor.clinics?.map((clinic) => clinic.city) || []
          ).filter(Boolean)
        )
      ).sort()
      setCities(uniqueCities as string[])
      console.log('[Doctors] Available cities:', uniqueCities)
    } catch (error) {
      console.error('[Doctors] Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleCitySelect = useCallback(async (city: any) => {
    setSearchingCity(true)
    setLocationError('')
    setCitySearch(city.display_name)
    setShowCitySuggestions(false)

    try {
      console.log('[Doctors] Selected city:', city)

      // Use the coordinates from the selected city
      const latitude = parseFloat(city.lat)
      const longitude = parseFloat(city.lon)

      // Call reverse geocoding to get pincode
      const response = await fetch(
        `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Failed to get location details')
      }

      const data = await response.json()
      console.log('[Doctors] City geocoded:', data)

      if (data.pincode) {
        setPincode(data.pincode)
        const locationText = [data.city, data.state].filter(Boolean).join(', ')
        setLocationName(locationText)

        // Save to localStorage
        localStorage.setItem('userPincode', data.pincode)
        localStorage.setItem('userLocation', locationText)

        setShowCityInput(false)
        setCitySearch('')
      } else {
        setLocationError('Could not find pincode for this location')
      }
    } catch (error) {
      console.error('[Doctors] City selection error:', error)
      setLocationError('Failed to get location details')
    } finally {
      setSearchingCity(false)
    }
  }, [])

  // Debounced city search
  useEffect(() => {
    if (citySearch.trim().length < 2) return

    const timer = setTimeout(async () => {
      setSearchingCity(true)
      try {
        console.log('[Doctors] Searching for city:', citySearch)

        // Use Nominatim search API directly
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch + ', India')}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'OPDWallet/1.0'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to search cities')
        }

        const data = await response.json()
        console.log('[Doctors] City search results:', data)

        setCitySuggestions(data)
        setShowCitySuggestions(data.length > 0)
      } catch (error) {
        console.error('[Doctors] City search error:', error)
        setLocationError('Failed to search cities')
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Select Doctor</h1>
              <p className="text-sm text-gray-600">{specialtyName}</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                📍 Filter by Location
              </label>
              {pincode && (
                <button
                  onClick={handleClearPincode}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: '#e6f0fa', color: '#0a529f' }}
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#0a529f' }}
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={fetchingLocation}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                    style={{ backgroundColor: '#0a529f' }}
                    onMouseEnter={(e) => !fetchingLocation && (e.currentTarget.style.backgroundColor = '#084080')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                  >
                    {fetchingLocation ? (
                      <span className="flex items-center">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                        Locating...
                      </span>
                    ) : (
                      '📍 Use Current'
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setShowCityInput(true)}
                  className="text-xs underline"
                  style={{ color: '#0a529f' }}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#0a529f' }}
                    autoFocus
                  />
                  {searchingCity && (
                    <div className="absolute right-3 top-3">
                      <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0a529f' }}></div>
                    </div>
                  )}

                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((city, index) => (
                        <button
                          key={index}
                          onClick={() => handleCitySelect(city)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-sm text-gray-900">
                            {city.address?.city || city.address?.town || city.address?.village || city.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {city.display_name}
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
                  className="text-xs underline"
                  style={{ color: '#0a529f' }}
                >
                  Back to pincode entry
                </button>
              </div>
            )}

            {locationName && (
              <p className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                ✓ {locationName}
              </p>
            )}

            {locationError && (
              <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {locationError}
              </p>
            )}

            {pincode.length > 0 && pincode.length < 6 && !locationError && (
              <p className="text-xs text-gray-500 mt-1">
                {6 - pincode.length} more digit(s) required
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search doctors..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFilters}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              <span className="text-sm">Filters</span>
            </button>

            {selectedCity && (
              <button
                onClick={handleClearCity}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: '#e6f0fa', color: '#0a529f' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4e5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e6f0fa'}
              >
                {selectedCity} ×
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="mb-2 text-sm font-medium text-gray-700">Filter by City</div>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityClick(city)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      city === selectedCity
                        ? 'text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    style={city === selectedCity ? { backgroundColor: '#0a529f' } : undefined}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="space-y-4">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <DoctorsContent />
    </Suspense>
  )
}