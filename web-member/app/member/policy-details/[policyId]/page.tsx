'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface PolicyDescriptionEntry {
  headline: string
  description: string
}

interface PolicyData {
  policyNumber: string
  policyName: string
  corporateName: string
  validTill: string
  policyDescription?: {
    inclusions?: PolicyDescriptionEntry[]
    exclusions?: PolicyDescriptionEntry[]
  }
}

export default function PolicyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const policyId = params.policyId as string

  const [policy, setPolicy] = useState<PolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPolicyDetails()
  }, [policyId])

  const fetchPolicyDetails = async () => {
    try {
      setLoading(true)

      // Fetch policy data with current plan config
      const response = await fetch(`/api/policies/${policyId}/current`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch policy details')
      }

      const data = await response.json()
      setPolicy(data)
    } catch (err: any) {
      console.error('Error fetching policy details:', err)
      setError(err.message || 'Failed to load policy details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7fc' }}>
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: '#f7f7fc' }}>
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-2xl p-8 text-center shadow-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#303030' }}>
              Unable to Load Policy Details
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Policy information not available'}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
              style={{ backgroundColor: '#0F5FDC' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasInclusions = policy.policyDescription?.inclusions && policy.policyDescription.inclusions.length > 0
  const hasExclusions = policy.policyDescription?.exclusions && policy.policyDescription.exclusions.length > 0

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                Policy Details
              </h1>
              <p className="text-xs lg:text-sm text-gray-600">{policy.policyName || 'Policy Information'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-6 space-y-5">
        {/* Policy Summary Card with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-6 shadow-md border-2"
          style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}
        >
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <ShieldCheckIcon className="w-6 h-6" style={{ color: '#0E51A2' }} />
            </div>
            <h2 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
              Policy Summary
            </h2>
          </div>

          {/* Policy Details */}
          <div className="space-y-4">
            {/* Policy Number */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <DocumentTextIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-1">Policy Number</p>
                <p className="text-sm lg:text-base font-bold truncate" style={{ color: '#0E51A2' }}>
                  {policy.policyNumber}
                </p>
              </div>
            </div>

            {/* Corporate Name */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <BuildingOfficeIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-1">Corporate Name</p>
                <p className="text-sm lg:text-base font-bold truncate" style={{ color: '#0E51A2' }}>
                  {policy.corporateName || 'N/A'}
                </p>
              </div>
            </div>

            {/* Valid Till */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <CalendarIcon className="w-5 h-5" style={{ color: '#0F5FDC' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-1">Valid Till</p>
                <p className="text-sm lg:text-base font-bold truncate" style={{ color: '#0E51A2' }}>
                  {policy.validTill}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inclusions Section */}
        {hasInclusions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl p-5 lg:p-6 shadow-md border-2"
            style={{
              background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
              borderColor: '#86ACD8'
            }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircleIcon className="h-6 w-6" style={{ color: '#16a34a' }} />
              </div>
              <h2 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                What's Covered
              </h2>
            </div>

            {/* Inclusion Items */}
            <div className="space-y-4">
              {policy.policyDescription!.inclusions!.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm"
                >
                  <h3 className="text-base lg:text-lg font-bold mb-2" style={{ color: '#0E51A2' }}>
                    {item.headline}
                  </h3>
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Exclusions Section */}
        {hasExclusions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-2xl p-5 lg:p-6 shadow-md border-2"
            style={{
              background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
              borderColor: '#86ACD8'
            }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <XCircleIcon className="h-6 w-6" style={{ color: '#ef4444' }} />
              </div>
              <h2 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                What's Not Covered
              </h2>
            </div>

            {/* Exclusion Items */}
            <div className="space-y-4">
              {policy.policyDescription!.exclusions!.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm"
                >
                  <h3 className="text-base lg:text-lg font-bold mb-2" style={{ color: '#0E51A2' }}>
                    {item.headline}
                  </h3>
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Description Available */}
        {!hasInclusions && !hasExclusions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-2xl p-8 text-center shadow-md border-2 border-gray-200"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#303030' }}>
              Policy Description Not Available
            </h3>
            <p className="text-gray-600">
              Detailed policy inclusions and exclusions have not been configured yet.
              Please contact your administrator for more information.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
