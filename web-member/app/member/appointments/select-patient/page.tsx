'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useFamily } from '@/contexts/FamilyContext'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'
import IconCircle from '@/components/ui/IconCircle'

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

      // PRIVACY: Auto-select patient based on currently viewed profile
      if (viewingUserId && patientsList.length > 0) {
        const defaultPatient = patientsList.find(p => p.id === viewingUserId)
        if (defaultPatient) {
          setSelectedPatient(defaultPatient)
          console.log('[SelectPatient] Auto-selected patient from viewingUserId:', {
            patientId: defaultPatient.id,
            patientName: defaultPatient.name,
            viewingUserId
          })
        } else {
          console.log('[SelectPatient] viewingUserId not found in patients list:', viewingUserId)
        }
      } else {
        console.log('[SelectPatient] No auto-selection:', {
          hasViewingUserId: !!viewingUserId,
          patientsCount: patientsList.length
        })
      }
    } catch (error) {
      console.error('[SelectPatient] Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData, viewingUserId])

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Patient"
        subtitle="Choose who the appointment is for"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        <div className="space-y-3 lg:space-y-4 mb-6">
          {patients.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id
            return (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="w-full text-left"
              >
                <DetailCard
                  variant="primary"
                  className={`transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 shadow-lg'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                  style={isSelected ? { ringColor: '#0F5FDC' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                      {isSelected ? (
                        <div
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                        >
                          <UserIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                        </div>
                      ) : (
                        <IconCircle icon={UserIcon} size="md" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm lg:text-base mb-1 flex items-center gap-2" style={{ color: '#0E51A2' }}>
                          <span className="truncate">{patient.name}</span>
                          {patient.relationship === 'Self' && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)', color: '#0F5FDC' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600 truncate">
                          {patient.relationship} • {patient.age} years • {patient.gender}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircleIcon className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0" style={{ color: '#25A425' }} />
                    )}
                  </div>
                </DetailCard>
              </button>
            )
          })}
        </div>

        <CTAButton
          onClick={handleContinue}
          disabled={!selectedPatient}
          variant="primary"
          fullWidth
        >
          Continue
        </CTAButton>
      </div>
    </div>
  )
}

export default function SelectPatientPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f7f7fc' }}>
        <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    }>
      <SelectPatientContent />
    </Suspense>
  )
}