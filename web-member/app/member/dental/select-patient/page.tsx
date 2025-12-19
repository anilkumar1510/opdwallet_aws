'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeftIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useFamily } from '@/contexts/FamilyContext'
import { Card } from '@/components/ui/Card'

interface Patient {
  id: string
  name: string
  relationship: string
  age: number
  gender: string
}

function SelectPatientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewingUserId } = useFamily()

  const clinicId = searchParams.get('clinicId')
  const serviceCode = searchParams.get('serviceCode')

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const fetchUserData = useCallback(async () => {
    try {
      console.log('[DentalPatientSelection] Fetching user data with dependents')
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[DentalPatientSelection] Profile data received:', {
        userId: data.user?._id,
        name: data.user?.name,
        dependentsCount: data.dependents?.length || 0
      })

      setUser(data.user)

      const patientsList: Patient[] = []

      // Add primary user (self)
      if (data.user) {
        patientsList.push({
          id: data.user._id,
          name: `${data.user.name.firstName} ${data.user.name.lastName}`,
          relationship: 'Self',
          age: calculateAge(data.user.dob),
          gender: data.user.gender || 'Not specified'
        })
      }

      // Add dependents
      if (data.dependents && data.dependents.length > 0) {
        console.log('[DentalPatientSelection] Found dependents:', data.dependents.length)
        data.dependents.forEach((dependent: any) => {
          patientsList.push({
            id: dependent._id,
            name: `${dependent.name.firstName} ${dependent.name.lastName}`,
            relationship: dependent.relationship || 'Family Member',
            age: calculateAge(dependent.dob),
            gender: dependent.gender || 'Not specified'
          })
        })
      }

      console.log('[DentalPatientSelection] Total patients available:', patientsList.length)
      setPatients(patientsList)

      // Auto-select patient based on currently viewed profile
      if (viewingUserId) {
        const matchedPatient = patientsList.find(p => p.id === viewingUserId)
        if (matchedPatient) {
          console.log('[DentalPatientSelection] Auto-selected patient from viewing context:', matchedPatient.name)
          setSelectedPatient(matchedPatient)
        }
      } else if (patientsList.length > 0) {
        // Default to self
        console.log('[DentalPatientSelection] Auto-selected self as default')
        setSelectedPatient(patientsList[0])
      }

      setLoading(false)
    } catch (error) {
      console.error('[DentalPatientSelection] Error fetching user data:', error)
      setLoading(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    if (!clinicId || !serviceCode) {
      router.push('/member/dental')
      return
    }
    fetchUserData()
  }, [clinicId, serviceCode, router, fetchUserData])

  const handleContinue = () => {
    if (!selectedPatient) return

    console.log('[DentalPatientSelection] Selected patient:', selectedPatient.id, selectedPatient.name)
    router.push(
      `/member/dental/select-slot?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${selectedPatient.id}`
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Select Patient</h1>
          <p className="text-gray-600 mt-2">Who is this appointment for?</p>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {patients.map((patient) => (
            <Card
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`cursor-pointer transition-all ${
                selectedPatient?.id === patient.id
                  ? 'ring-2 ring-purple-600 bg-purple-50'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.relationship}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>{patient.age} years</span>
                        <span>{patient.gender}</span>
                      </div>
                    </div>
                  </div>
                  {selectedPatient?.id === patient.id && (
                    <CheckCircleIcon className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedPatient}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelectPatientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    }>
      <SelectPatientContent />
    </Suspense>
  )
}
