'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useFamily } from '@/contexts/FamilyContext'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import IconCircle from '@/components/ui/IconCircle'
import CTAButton from '@/components/ui/CTAButton'

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
          style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
        ></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Select Patient"
        subtitle="Who is this appointment for?"
      />

      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Patients Grid */}
        <div className="grid grid-cols-1 gap-4 lg:gap-5 mb-6">
          {patients.map((patient) => (
            <DetailCard
              key={patient.id}
              variant={selectedPatient?.id === patient.id ? 'secondary' : 'primary'}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 lg:gap-4 flex-1 min-w-0">
                  <IconCircle icon={UserIcon} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base lg:text-lg font-semibold truncate"
                      style={{ color: '#0E51A2' }}
                    >
                      {patient.name}
                    </h3>
                    <p className="text-sm lg:text-base text-gray-600">{patient.relationship}</p>
                    <div className="flex gap-3 lg:gap-4 mt-2 text-xs lg:text-sm text-gray-500">
                      <span>{patient.age} years</span>
                      <span>{patient.gender}</span>
                    </div>
                  </div>
                </div>
                {selectedPatient?.id === patient.id && (
                  <CheckCircleIcon
                    className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0"
                    style={{ color: '#25A425' }}
                  />
                )}
              </div>
            </DetailCard>
          ))}
        </div>

        {/* Continue Button */}
        <CTAButton
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={!selectedPatient}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 lg:h-14 lg:w-14 border-4 border-t-transparent"
          style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}
        ></div>
      </div>
    }>
      <SelectPatientContent />
    </Suspense>
  )
}
