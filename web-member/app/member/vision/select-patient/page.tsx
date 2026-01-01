'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
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
      console.log('[VisionPatientSelection] Fetching user data with dependents')
      const response = await fetch('/api/member/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      console.log('[VisionPatientSelection] Profile data received:', {
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
        console.log('[VisionPatientSelection] Found dependents:', data.dependents.length)
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

      console.log('[VisionPatientSelection] Total patients available:', patientsList.length)
      setPatients(patientsList)

      // Auto-select patient based on currently viewed profile
      if (viewingUserId) {
        const matchedPatient = patientsList.find(p => p.id === viewingUserId)
        if (matchedPatient) {
          console.log('[VisionPatientSelection] Auto-selected patient from viewing context:', matchedPatient.name)
          setSelectedPatient(matchedPatient)
        }
      } else if (patientsList.length > 0) {
        // Default to self
        console.log('[VisionPatientSelection] Auto-selected self as default')
        setSelectedPatient(patientsList[0])
      }

      setLoading(false)
    } catch (error) {
      console.error('[VisionPatientSelection] Error fetching user data:', error)
      setLoading(false)
    }
  }, [viewingUserId])

  useEffect(() => {
    if (!clinicId || !serviceCode) {
      router.push('/member/vision')
      return
    }
    fetchUserData()
  }, [clinicId, serviceCode, router, fetchUserData])

  const handleContinue = () => {
    if (!selectedPatient) return

    console.log('[VisionPatientSelection] Selected patient:', selectedPatient.id, selectedPatient.name)
    router.push(
      `/member/vision/select-slot?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${selectedPatient.id}`
    )
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
        subtitle="Who is this appointment for?"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">

        {/* Patients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">
          {patients.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id
            return (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="w-full text-left"
              >
                <DetailCard
                  variant="primary"
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 shadow-lg'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                  style={isSelected ? { ringColor: '#0F5FDC' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4">
                      {isSelected ? (
                        <div
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)',
                          }}
                        >
                          <UserIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                        </div>
                      ) : (
                        <IconCircle icon={UserIcon} size="md" />
                      )}
                      <div>
                        <h3 className="text-base lg:text-lg font-semibold" style={{ color: '#0E51A2' }}>
                          {patient.name}
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-600">{patient.relationship}</p>
                        <div className="flex gap-3 lg:gap-4 mt-1 lg:mt-2 text-xs lg:text-sm text-gray-500">
                          <span>{patient.age} years</span>
                          <span>{patient.gender}</span>
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

        {/* Continue Button */}
        <div className="flex justify-end">
          <CTAButton
            onClick={handleContinue}
            disabled={!selectedPatient}
            variant="primary"
          >
            Continue
          </CTAButton>
        </div>
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
