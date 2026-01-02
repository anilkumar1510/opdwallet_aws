'use client'

import { useEffect, useState } from 'react'
import { getDoctorProfile, Doctor } from '@/lib/api/auth'
import SignatureUpload from '@/components/SignatureUpload'
import {
  UserCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profile = await getDoctorProfile()
      setDoctor(profile)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-900">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile information and signature
          </p>
        </div>

        {/* Doctor Information Card */}
        {doctor && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Doctor Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="flex items-start space-x-3">
                <UserCircleIcon className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base text-gray-900 mt-1">{doctor.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base text-gray-900 mt-1">{doctor.email}</p>
                </div>
              </div>

              {/* Doctor ID */}
              <div className="flex items-start space-x-3">
                <IdentificationIcon className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Doctor ID</p>
                  <p className="text-base text-gray-900 mt-1">{doctor.doctorId}</p>
                </div>
              </div>

              {/* Specialty */}
              <div className="flex items-start space-x-3">
                <AcademicCapIcon className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Specialty</p>
                  <p className="text-base text-gray-900 mt-1">{doctor.specialty}</p>
                </div>
              </div>

              {/* Specializations */}
              {doctor.specializations && doctor.specializations.length > 0 && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <AcademicCapIcon className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specializations</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doctor.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Upload Card */}
        <SignatureUpload />
      </div>
    </div>
  )
}
