'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api/client'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import EmptyState from '@/components/ui/EmptyState'

interface Specialty {
  _id: string
  specialtyId: string
  code: string
  name: string
  description: string
}

export default function OnlineSpecialtiesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    console.log('[OnlineSpecialties] Fetching specialties')
    fetchSpecialties()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSpecialties(specialties)
    } else {
      const filtered = specialties.filter(
        (specialty) =>
          specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          specialty.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSpecialties(filtered)
    }
  }, [searchQuery, specialties])

  const fetchSpecialties = async () => {
    try {
      console.log('[OnlineSpecialties] Fetching policy-filtered specialties from API')
      const response = await apiClient.get('/member/benefits/CAT005/specialties')

      const result = response.data
      const data = result.services || []
      console.log('[OnlineSpecialties] Policy-filtered specialties received:', data.length)
      setSpecialties(data)
      setFilteredSpecialties(data)
    } catch (error) {
      console.error('[OnlineSpecialties] Error fetching specialties:', error)
      setSpecialties([])
      setFilteredSpecialties([])
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyClick = (specialty: Specialty) => {
    console.log('[OnlineSpecialties] Specialty selected:', specialty.specialtyId, specialty.name)
    router.push(`/member/online-consult/doctors?specialtyId=${specialty.specialtyId}&specialtyName=${encodeURIComponent(specialty.name)}`)
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
        title="Select Specialty"
        subtitle="Choose medical specialty"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialties..."
              className="block w-full pl-10 pr-3 py-2 lg:py-3 border-2 rounded-xl text-sm lg:text-base focus:outline-none transition-all"
              style={{
                borderColor: '#86ACD8',
                background: '#FFFFFF'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0F5FDC'}
              onBlur={(e) => e.target.style.borderColor = '#86ACD8'}
            />
          </div>
        </div>
        {filteredSpecialties.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlassIcon}
            title={searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
            message={searchQuery.trim() === ''
              ? 'Online consultation is not configured in your policy. Please contact your HR administrator.'
              : 'Try adjusting your search term'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:gap-4">
            {filteredSpecialties.map((specialty) => (
              <button
                key={specialty._id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="text-left"
              >
                <DetailCard variant="primary" className="shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                        border: '1px solid #A4BFFE7A',
                        boxShadow: '-2px 11px 46.1px 0px #0000000D'
                      }}
                    >
                      <span className="text-lg lg:text-xl font-semibold" style={{ color: '#0F5FDC' }}>
                        {specialty.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base lg:text-lg mb-1" style={{ color: '#0E51A2' }}>
                        {specialty.name}
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">
                        {specialty.description}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" style={{ color: '#0F5FDC' }} />
                  </div>
                </DetailCard>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}