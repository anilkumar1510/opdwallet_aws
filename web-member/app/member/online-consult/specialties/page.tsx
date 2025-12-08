'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api/client'

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
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Select Specialty</h1>
              <p className="text-sm text-gray-600">Choose medical specialty</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialties..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {filteredSpecialties.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">💻</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
            </h3>
            <p className="text-gray-600">
              {searchQuery.trim() === ''
                ? 'Online consultation is not configured in your policy. Please contact your HR administrator.'
                : 'Try adjusting your search term'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredSpecialties.map((specialty) => (
              <button
                key={specialty._id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl font-semibold" style={{ color: '#0a529f' }}>{specialty.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{specialty.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}