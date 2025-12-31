'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPinIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'

interface Clinic {
  clinicId: string
  clinicName: string
  address: {
    street?: string
    line1?: string
    city: string
    state: string
    pincode: string
  }
  contactNumber: string
  servicePrice: number
  availableSlots: number
}

export default function VisionClinicsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceCode = searchParams.get('serviceCode')

  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pincode, setPincode] = useState('')
  const [searchedPincode, setSearchedPincode] = useState('')
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    if (!serviceCode) {
      router.push('/member/vision')
    }
  }, [serviceCode, router])

  const detectLocation = async () => {
    console.log('[VisionClinics] Detecting location via Google Maps')
    setDetectingLocation(true)
    setError('')

    try {
      // Get user's current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords
      console.log('[VisionClinics] Location detected:', { latitude, longitude })

      // Use Google Maps Geocoding API to get pincode
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      const geocodeResponse = await fetch(geocodeUrl)
      const geocodeData = await geocodeResponse.json()

      console.log('[VisionClinics] Geocode response:', geocodeData)

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        // Extract pincode from address components
        const addressComponents = geocodeData.results[0].address_components
        const pincodeComponent = addressComponents.find((component: any) =>
          component.types.includes('postal_code')
        )

        if (pincodeComponent) {
          const detectedPincode = pincodeComponent.long_name
          console.log('[VisionClinics] Pincode detected:', detectedPincode)
          setPincode(detectedPincode)
          searchClinics(detectedPincode)
        } else {
          setError('Could not detect pincode from your location')
        }
      } else {
        setError('Failed to detect location. Please enter pincode manually.')
      }
    } catch (err: any) {
      console.error('[VisionClinics] Location detection error:', err)
      if (err.code === 1) {
        setError('Location access denied. Please enter pincode manually.')
      } else if (err.code === 2) {
        setError('Location unavailable. Please enter pincode manually.')
      } else if (err.code === 3) {
        setError('Location detection timeout. Please enter pincode manually.')
      } else {
        setError('Failed to detect location. Please enter pincode manually.')
      }
    } finally {
      setDetectingLocation(false)
    }
  }

  const searchClinics = async (searchPincode: string) => {
    if (!searchPincode || !serviceCode) {
      setError('Please enter a pincode')
      return
    }

    console.log('[VisionClinics] Searching clinics for pincode:', searchPincode, 'service:', serviceCode)
    setLoading(true)
    setError('')
    setSearchedPincode(searchPincode)

    try {
      const response = await fetch(
        `/api/vision-bookings/clinics?serviceCode=${serviceCode}&pincode=${searchPincode}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('[VisionClinics] Clinics found:', data.clinics?.length || 0)
        setClinics(data.clinics || [])

        if (data.clinics.length === 0) {
          setError(`No clinics found offering this service in pincode ${searchPincode}`)
        }
      } else {
        console.error('[VisionClinics] Failed to fetch clinics:', response.status)
        setError('Failed to load clinics. Please try again.')
      }
    } catch (err) {
      console.error('[VisionClinics] Error fetching clinics:', err)
      setError('Failed to load clinics. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClinic = (clinicId: string) => {
    console.log('[VisionClinics] Selected clinic:', clinicId)
    router.push(
      `/member/vision/select-patient?clinicId=${clinicId}&serviceCode=${serviceCode}`
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-flex items-center gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Find Vision Clinics</h1>
          <p className="text-gray-600 mt-2">Search for clinics near you</p>
        </div>

        {/* Location Search Card */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Location</h2>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Manual Pincode Entry */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Pincode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 110001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchClinics(pincode)
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => searchClinics(pincode)}
                    disabled={loading || !pincode}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Search
                  </button>
                </div>
              </div>

              {/* OR Divider */}
              <div className="flex items-center justify-center md:py-8">
                <span className="text-gray-500 font-medium">OR</span>
              </div>

              {/* Auto-detect Location */}
              <div className="flex-1 flex flex-col justify-end">
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation || loading}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MapPinIcon className="h-5 w-5" />
                  {detectingLocation ? 'Detecting...' : 'Use My Location'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Automatically detect your location
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Clinics List */}
        {!loading && searchedPincode && clinics.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Clinics in {searchedPincode} ({clinics.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {clinics.map((clinic) => (
                <Card key={clinic.clinicId} className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Clinic Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {clinic.clinicName}
                    </h3>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                      <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>{clinic.address.street || clinic.address.line1}</p>
                        <p>
                          {clinic.address.city}, {clinic.address.state} - {clinic.address.pincode}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Contact:</span> {clinic.contactNumber}
                    </div>

                    {/* Price and Availability */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-lg font-semibold text-gray-900">₹{clinic.servicePrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Available Slots</p>
                        <p className="text-lg font-semibold text-green-600">{clinic.availableSlots}</p>
                      </div>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={() => handleSelectClinic(clinic.clinicId)}
                      disabled={clinic.availableSlots === 0}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {clinic.availableSlots > 0 ? 'Select Clinic' : 'No Slots Available'}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searchedPincode && (
          <Card className="text-center py-16">
            <div className="flex flex-col items-center">
              <MapPinIcon className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Search for Clinics</h2>
              <p className="text-gray-600 max-w-md">
                Enter your pincode or use auto-detect to find vision clinics near you
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
