'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface ReadinessCheck {
  key: string
  ok: boolean
  message?: string
  details?: any
}

interface ReadinessResponse {
  policyId: string
  planVersion: number
  status: 'READY' | 'BLOCKED'
  checks: ReadinessCheck[]
  generatedAt: string
}

interface ReadinessPanelProps {
  policyId: string
  planVersion: number
  onPublishClick?: () => void
  isPublishing?: boolean
}

export default function ReadinessPanel({
  policyId,
  planVersion,
  onPublishClick,
  isPublishing = false
}: ReadinessPanelProps) {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchReadiness = async () => {
    try {
      console.info(`[TELEMETRY] GET readiness start at:`, new Date().toISOString())
      setLoading(true)
      setError(null)

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/readiness`
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Readiness API error:', response.status, errorText)
        throw new Error(`Failed to check readiness: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.info(`[TELEMETRY] GET readiness end at:`, new Date().toISOString(), 'Status:', data.status)
      setReadiness(data)

      // Auto-expand if there are failures
      if (data.status === 'BLOCKED') {
        setExpanded(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReadiness()
  }, [policyId, planVersion])

  const getCheckIcon = (check: ReadinessCheck) => {
    if (check.ok) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }
    return <XCircleIcon className="h-5 w-5 text-red-500" />
  }

  const getCheckLabel = (key: string) => {
    const labels: Record<string, string> = {
      versionStatus: 'Version Status',
      dates: 'Date Validation',
      walletRules: 'Wallet Configuration',
      benefitComponents: 'Benefit Components',
      coverageMatrix: 'Coverage Matrix'
    }
    return labels[key] || key
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">Checking readiness...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    )
  }

  if (!readiness) {
    return null
  }

  const failedChecks = readiness.checks.filter(check => !check.ok)
  const passedChecks = readiness.checks.filter(check => check.ok)

  return (
    <div className={`rounded-lg shadow ${
      readiness.status === 'READY' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {readiness.status === 'READY' ? (
              <>
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Ready to Publish</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All {readiness.checks.length} checks passed
                  </p>
                </div>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Not Ready to Publish</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {failedChecks.length} of {readiness.checks.length} checks failed
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>

            <button
              onClick={fetchReadiness}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>

            {readiness.status === 'READY' && onPublishClick && (
              <button
                onClick={onPublishClick}
                disabled={isPublishing}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isPublishing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPublishing ? 'Publishing...' : 'Publish Version'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checks Details */}
      {expanded && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="space-y-3">
            {/* Failed checks first */}
            {failedChecks.length > 0 && (
              <>
                <div className="text-sm font-medium text-red-700 mb-2">Failed Checks</div>
                {failedChecks.map((check, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {getCheckIcon(check)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {getCheckLabel(check.key)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {check.message}
                      </div>
                      {check.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <pre>{JSON.stringify(check.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Passed checks */}
            {passedChecks.length > 0 && (
              <>
                {failedChecks.length > 0 && (
                  <div className="text-sm font-medium text-green-700 mb-2 mt-4">Passed Checks</div>
                )}
                {passedChecks.map((check, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {getCheckIcon(check)}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {getCheckLabel(check.key)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {check.message}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-2 text-xs text-gray-500">
            <InformationCircleIcon className="h-4 w-4" />
            <span>Last checked: {new Date(readiness.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}