'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

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

  const doctorId = searchParams.get('doctorId')
  const doctorName = searchParams.get('doctorName')
  const specialty = searchParams.get('specialty')
  const clinicId = searchParams.get('clinicId')
  const clinicName = searchParams.get('clinicName')
  const clinicAddress = searchParams.get('clinicAddress')
  const consultationFee = searchParams.get('consultationFee')

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

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

  const fetchUserData = async () => {
    try {
      console.log('[SelectPatient] Fetching user data with dependents')
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[SelectPatient] Profile data received:', {
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
        console.log('[SelectPatient] Found dependents:', data.dependents.length)
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

      console.log('[SelectPatient] Total patients available:', patientsList.length)
      setPatients(patientsList)
    } catch (error) {
      console.error('[SelectPatient] Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    console.log('[SelectPatient] Patient selected:', {
      patientId: patient.id,
      patientName: patient.name,
      relationship: patient.relationship
    })
    setSelectedPatient(patient)
  }

  const handleContinue = () => {
    if (!selectedPatient) return

    console.log('[SelectPatient] Continuing to slot selection', {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId,
      clinicId
    })

    const params = new URLSearchParams({
      doctorId: doctorId || '',
      doctorName: doctorName || '',
      specialty: specialty || '',
      clinicId: clinicId || '',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || '',
      consultationFee: consultationFee || '',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name
    })

    router.push(`/member/appointments/select-slot?${params.toString()}`)
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
              <h1 className="text-xl font-semibold text-gray-900">Select Patient</h1>
              <p className="text-sm text-gray-600">Choose who the appointment is for</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <div className="space-y-3 mb-6">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handlePatientSelect(patient)}
              className={`w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all ${
                selectedPatient?.id === patient.id
                  ? 'border-2 shadow-md'
                  : 'border-2 border-transparent shadow-sm hover:shadow-md'
              }`}
              style={selectedPatient?.id === patient.id ? { borderColor: '#0a529f' } : undefined}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full" style={{
                  backgroundColor: selectedPatient?.id === patient.id ? '#0a529f' : '#e6f0fa'
                }}>
                  <UserIcon className="h-6 w-6" style={{
                    color: selectedPatient?.id === patient.id ? 'white' : '#0a529f'
                  }} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{patient.name}</span>
                    {patient.relationship === 'Self' && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e6f0fa', color: '#0a529f' }}>
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.relationship} • {patient.age} years • {patient.gender}
                  </div>
                </div>
              </div>
              {selectedPatient?.id === patient.id && (
                <CheckCircleIcon className="h-6 w-6" style={{ color: '#0a529f' }} />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedPatient}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            selectedPatient
              ? 'text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          style={selectedPatient ? { backgroundColor: '#0a529f' } : undefined}
          onMouseEnter={(e) => selectedPatient && (e.currentTarget.style.backgroundColor = '#084080')}
          onMouseLeave={(e) => selectedPatient && (e.currentTarget.style.backgroundColor = '#0a529f')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function SelectPatientPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <SelectPatientContent />
    </Suspense>
  )
}