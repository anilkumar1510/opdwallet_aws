'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import IconCircle from '@/components/ui/IconCircle'
import EmptyState from '@/components/ui/EmptyState'

// API base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'

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

  const fetchDoctors = useCallback(async () => {
    try {
      console.log('[OnlineDoctors] Fetching online doctors for specialty:', specialtyId)
      const response = await fetch(`/api/doctors?specialtyId=${specialtyId}&type=ONLINE`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch doctors')
      }

      const responseData = await response.json()
      // Handle both pagination wrapper and flat array responses
      const data = responseData.data || responseData
      console.log('[OnlineDoctors] Doctors received:', { count: Array.isArray(data) ? data.length : 0 })
      setDoctors(Array.isArray(data) ? data : [])
      setFilteredDoctors(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[OnlineDoctors] Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }, [specialtyId])

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId, fetchDoctors])

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Doctor"
        subtitle={specialtyName || 'Online Consultation'}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors..."
              className="block w-full pl-10 pr-3 py-2 lg:py-3 border-2 rounded-xl text-sm lg:text-base focus:outline-none transition-all"
              style={{
                borderColor: '#86ACD8',
                background: '#FFFFFF'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0F5FDC'}
              onBlur={(e) => e.target.style.borderColor = '#86ACD8'}
            />
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all border-2"
              style={{
                borderColor: '#86ACD8',
                background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                color: '#0E51A2'
              }}
            >
              <FunnelIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => setShowAvailableNow(!showAvailableNow)}
              className="px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all border-2"
              style={
                showAvailableNow
                  ? { background: '#25A425', color: '#FFFFFF', borderColor: '#25A425' }
                  : {
                      borderColor: '#86ACD8',
                      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                      color: '#0E51A2'
                    }
              }
            >
              Available Now (5 mins)
            </button>
          </div>
        </div>
        {filteredDoctors.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No doctors found"
            message="Try adjusting your filters or search term"
          />
        ) : (
          <div className="space-y-4 lg:space-y-5">
            {filteredDoctors.map((doctor) => (
              <DetailCard key={doctor._id} variant="primary" className="shadow-md hover:shadow-lg transition-shadow">
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
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-base lg:text-lg" style={{ color: '#0E51A2' }}>
                        {doctor.name}
                      </h3>
                      {doctor.availableInMinutes !== null && (
                        <span
                          className="text-xs lg:text-sm px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 ml-2"
                          style={
                            doctor.availableInMinutes <= 5
                              ? { background: '#E8F5E9', color: '#25A425' }
                              : { background: '#F3F4F6', color: '#6B7280' }
                          }
                        >
                          <ClockIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="font-medium">{formatAvailability(doctor.availableInMinutes)}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{doctor.qualifications}</p>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2">{doctor.experienceYears} years experience</p>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-400 fill-current" />
                      <span className="text-sm lg:text-base font-medium text-gray-900">{doctor.rating}</span>
                      <span className="text-xs lg:text-sm text-gray-600">({doctor.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <DetailCard variant="secondary" className="mb-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm lg:text-base">
                      <span className="text-gray-600">Consultation: </span>
                      <span className="font-bold text-base lg:text-lg" style={{ color: '#25A425' }}>
                        ₹{doctor.consultationFee}
                      </span>
                    </div>
                    <CTAButton
                      onClick={() => handleSelectDoctor(doctor)}
                      variant="primary"
                    >
                      Select
                    </CTAButton>
                  </div>
                </DetailCard>
              </DetailCard>
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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <OnlineDoctorsContent />
    </Suspense>
  )
}