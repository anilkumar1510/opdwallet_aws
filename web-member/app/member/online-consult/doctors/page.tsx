'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  StarIcon,
  ClockIcon
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
  experienceYears: number
  rating: number
  reviewCount: number
  clinics: ClinicLocation[]
  consultationFee: number
  availableInMinutes: number | null
}

function OnlineDoctorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const specialtyId = searchParams.get('specialtyId')
  const specialtyName = searchParams.get('specialtyName')

  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAvailableNow, setShowAvailableNow] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId])

  useEffect(() => {
    console.log('[OnlineDoctors] Filtering doctors:', { searchQuery, showAvailableNow })
    let filtered = doctors

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.qualifications.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (showAvailableNow) {
      filtered = filtered.filter((doctor) =>
        doctor.availableInMinutes !== null && doctor.availableInMinutes <= 5
      )
    }

    console.log('[OnlineDoctors] Filtered results:', { count: filtered.length })
    setFilteredDoctors(filtered)
  }, [searchQuery, showAvailableNow, doctors])

  const fetchDoctors = async () => {
    try {
      console.log('[OnlineDoctors] Fetching online doctors for specialty:', specialtyId)
      const response = await fetch(`/api/doctors?specialtyId=${specialtyId}&type=ONLINE`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch doctors')
      }

      const data = await response.json()
      console.log('[OnlineDoctors] Doctors received:', { count: data.length })
      setDoctors(data)
      setFilteredDoctors(data)
    } catch (error) {
      console.error('[OnlineDoctors] Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDoctor = (doctor: Doctor) => {
    console.log('[OnlineDoctors] Doctor selected:', {
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      availableInMinutes: doctor.availableInMinutes
    })
    const params = new URLSearchParams({
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      consultationFee: doctor.consultationFee.toString(),
      availableInMinutes: (doctor.availableInMinutes || 0).toString()
    })
    router.push(`/member/online-consult/confirm?${params.toString()}`)
  }

  const formatAvailability = (minutes: number | null) => {
    if (minutes === null) return null
    if (minutes === 0) return 'Available now'
    if (minutes <= 5) return `Available in ${minutes} min`
    return `Available in ${minutes} mins`
  }

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
              onClick={() => router.back()}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              <span className="text-sm">Filters</span>
            </button>

            <button
              onClick={() => setShowAvailableNow(!showAvailableNow)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                showAvailableNow
                  ? 'bg-green-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Available Now (5 mins)
            </button>
          </div>
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
              <div key={doctor._id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                      {doctor.availableInMinutes !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${
                          doctor.availableInMinutes <= 5
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatAvailability(doctor.availableInMinutes)}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{doctor.qualifications}</p>
                    <p className="text-sm text-gray-600">{doctor.experienceYears} years experience</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
                      <span className="text-sm text-gray-600">({doctor.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-600">Consultation: </span>
                      <span className="font-semibold text-blue-600">₹{doctor.consultationFee}</span>
                    </div>
                    <button
                      onClick={() => handleSelectDoctor(doctor)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnlineDoctorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <OnlineDoctorsContent />
    </Suspense>
  )
}