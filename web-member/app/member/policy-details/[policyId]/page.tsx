'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Policy Details
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'Policy information not available'}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </Card>
        </div>
      </div>
    )
  }

  const hasInclusions = policy.policyDescription?.inclusions && policy.policyDescription.inclusions.length > 0
  const hasExclusions = policy.policyDescription?.exclusions && policy.policyDescription.exclusions.length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Policy Details</h1>
              <p className="text-sm text-gray-600">{policy.policyName || 'Policy Information'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Policy Summary Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Policy Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Policy Number</span>
              <span className="font-medium text-gray-900">{policy.policyNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Corporate Name</span>
              <span className="font-medium text-gray-900">
                {policy.corporateName || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valid Till</span>
              <span className="font-medium text-gray-900">{policy.validTill}</span>
            </div>
          </div>
        </Card>

        {/* Inclusions Section */}
        {hasInclusions && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">What's Covered</h2>
            </div>

            <div className="space-y-6">
              {policy.policyDescription!.inclusions!.map((item, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.headline}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Exclusions Section */}
        {hasExclusions && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">What's Not Covered</h2>
            </div>

            <div className="space-y-6">
              {policy.policyDescription!.exclusions!.map((item, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.headline}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* No Description Available */}
        {!hasInclusions && !hasExclusions && (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Policy Description Not Available
            </h3>
            <p className="text-gray-600">
              Detailed policy inclusions and exclusions have not been configured yet.
              Please contact your administrator for more information.
            </p>
          </Card>
        )}

        {/* Extra padding at bottom */}
        <div className="h-8" />
      </div>
    </div>
  )
}
