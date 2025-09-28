'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

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
      console.log('[Specialties] Fetching specialties from API')
      const response = await fetch('/api/specialties', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch specialties')
      }

      const data = await response.json()
      console.log('[Specialties] Specialties received:', { count: data.length })
      setSpecialties(data)
      setFilteredSpecialties(data)
    } catch (error) {
      console.error('[Specialties] Error fetching specialties:', error)
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
            <h1 className="text-xl font-semibold text-gray-900">Select Specialty</h1>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No specialties found</h3>
            <p className="text-gray-600">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSpecialties.map((specialty) => (
              <button
                key={specialty._id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">{specialty.name.charAt(0)}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{specialty.name}</div>
                    <div className="text-sm text-gray-600">{specialty.description}</div>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}