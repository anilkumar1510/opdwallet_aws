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
  consultationFee: number
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
          <div className="font-medium text-gray-900">{clinic.name}</div>
          <div className="flex items-start space-x-1 text-sm text-gray-600 mt-1">
            <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{clinic.address}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-sm">
          <span className="text-gray-600">Consultation: </span>
          <span className="font-semibold text-blue-600">₹{clinic.consultationFee}</span>
        </div>
        <button
          onClick={onBookAppointment}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
        <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
          <UserIcon className="h-8 w-8 text-blue-600" />
        </div>
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

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId])

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
      const response = await fetch(`/api/doctors?specialtyId=${specialtyId}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
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
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
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
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <DoctorsContent />
    </Suspense>
  )
}