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
      console.log('[SelectPatient] Fetching user data')
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[SelectPatient] User data received:', { userId: data._id, name: data.name })
      setUser(data)

      const patientsList: Patient[] = []

      patientsList.push({
        id: data._id,
        name: `${data.name.firstName} ${data.name.lastName}`,
        relationship: 'Self',
        age: calculateAge(data.dob),
        gender: data.gender || 'Not specified'
      })

      if (data.relationships && data.relationships.length > 0) {
        console.log('[SelectPatient] Found relationships:', data.relationships.length)
        data.relationships.forEach((rel: any) => {
          if (rel.relatedUser) {
            patientsList.push({
              id: rel.relatedUser._id,
              name: `${rel.relatedUser.name.firstName} ${rel.relatedUser.name.lastName}`,
              relationship: rel.relationship,
              age: calculateAge(rel.relatedUser.dob),
              gender: rel.relatedUser.gender || 'Not specified'
            })
          }
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
                  ? 'border-2 border-blue-600 shadow-md'
                  : 'border-2 border-transparent shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  selectedPatient?.id === patient.id
                    ? 'bg-blue-600'
                    : 'bg-blue-100'
                }`}>
                  <UserIcon className={`h-6 w-6 ${
                    selectedPatient?.id === patient.id
                      ? 'text-white'
                      : 'text-blue-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{patient.name}</span>
                    {patient.relationship === 'Self' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
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
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedPatient}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            selectedPatient
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
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
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    }>
      <SelectPatientContent />
    </Suspense>
  )
}