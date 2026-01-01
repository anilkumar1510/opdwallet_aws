'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api/client'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import DetailCard from '@/components/ui/DetailCard'
import IconCircle from '@/components/ui/IconCircle'

interface Specialty {
  _id: string
  specialtyId: string
  code: string
  name: string
  description: string
  icon: string
  isActive: boolean
  displayOrder: number
}

export default function SpecialtiesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSpecialties()
  }, [])

  useEffect(() => {
    console.log('[Specialties] Search query changed:', searchQuery)
    if (searchQuery.trim() === '') {
      setFilteredSpecialties(specialties)
    } else {
      const filtered = specialties.filter((specialty) =>
        specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialty.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      console.log('[Specialties] Filtered results:', { count: filtered.length })
      setFilteredSpecialties(filtered)
    }
  }, [searchQuery, specialties])

  const fetchSpecialties = async () => {
    try {
      console.log('[Specialties] Fetching policy-filtered specialties from API')
      const response = await apiClient.get('/member/benefits/CAT001/specialties')

      const result = response.data
      const data = result.services || []
      console.log('[Specialties] Policy-filtered specialties received:', { count: data.length })
      setSpecialties(data)
      setFilteredSpecialties(data)
    } catch (error) {
      console.error('[Specialties] Error fetching specialties:', error)
      setSpecialties([])
      setFilteredSpecialties([])
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyClick = (specialty: Specialty) => {
    console.log('[Specialties] Specialty selected:', {
      specialtyId: specialty.specialtyId,
      name: specialty.name
    })
    router.push(`/member/appointments/doctors?specialtyId=${specialty.specialtyId}&specialtyName=${encodeURIComponent(specialty.name)}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div
          className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
        ></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Specialty"
        subtitle="Choose your medical specialty"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Search Bar */}
        <div className="mb-4 lg:mb-5">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: '#0F5FDC' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialties..."
              className="w-full pl-10 pr-4 py-3 lg:py-4 border rounded-xl focus:ring-2 focus:border-transparent text-sm lg:text-base"
              style={{ borderColor: '#86ACD8', outlineColor: '#0F5FDC' }}
            />
          </div>
        </div>

        {filteredSpecialties.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlassIcon}
            title={searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
            message={
              searchQuery.trim() === ''
                ? 'In-clinic consultation is not configured in your policy. Please contact your HR administrator.'
                : 'Try a different search term'
            }
          />
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {filteredSpecialties.map((specialty) => (
              <div
                key={specialty._id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="cursor-pointer"
              >
                <DetailCard variant="primary" className="hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between gap-3 lg:gap-4">
                    <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                          border: '1px solid #A4BFFE7A'
                        }}
                      >
                        <span className="text-lg lg:text-xl font-bold" style={{ color: '#0F5FDC' }}>
                          {specialty.name.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-sm lg:text-base truncate" style={{ color: '#0E51A2' }}>
                          {specialty.name}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600 line-clamp-1">
                          {specialty.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                  </div>
                </DetailCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}