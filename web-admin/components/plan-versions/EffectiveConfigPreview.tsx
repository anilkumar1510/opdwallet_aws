'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface EffectiveConfig {
  policy: {
    policyId: string
    policyNumber: string
    policyName: string
    companyName: string
  }
  planVersion: {
    version: number
    status: string
    effectiveFrom: string
    effectiveTo?: string
  }
  wallet: {
    totalAnnualAmount: number
    perClaimLimit?: number
    copay?: {
      mode: 'PERCENT' | 'AMOUNT'
      value: number
    }
    partialPaymentEnabled: boolean
    carryForward?: {
      enabled: boolean
      percent?: number
      months?: number
    }
    topUpAllowed?: boolean
  } | null
  benefits: Record<string, any>
  coverage: Array<{
    categoryId: string
    serviceCode?: string
    enabled: boolean
    notes?: string
  }>
}

interface EffectiveConfigPreviewProps {
  policyId: string
  planVersion: number
}

export default function EffectiveConfigPreview({
  policyId,
  planVersion
}: EffectiveConfigPreviewProps) {
  const [config, setConfig] = useState<EffectiveConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    policy: true,
    wallet: true,
    benefits: true,
    coverage: false
  })

  const fetchEffectiveConfig = async () => {
    try {
      console.info(`[TELEMETRY] GET effective-config start at:`, new Date().toISOString())
      setLoading(true)
      setError(null)

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/effective-config`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch effective configuration')
      }

      const data = await response.json()
      console.info(`[TELEMETRY] GET effective-config end at:`, new Date().toISOString())
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEffectiveConfig()
  }, [policyId, planVersion])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBenefitLabel = (key: string) => {
    const labels: Record<string, string> = {
      consultation: 'Consultation',
      pharmacy: 'Pharmacy',
      diagnostics: 'Diagnostics',
      ahc: 'Annual Health Check',
      vaccination: 'Vaccination',
      dental: 'Dental',
      vision: 'Vision',
      wellness: 'Wellness'
    }
    return labels[key] || key
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">Loading configuration...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <XCircleIcon className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    )
  }

  if (!config) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Effective Configuration Preview
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This is the exact configuration members will see
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {expanded ? 'Collapse All' : 'Expand All'}
            </button>
            <button
              onClick={fetchEffectiveConfig}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-gray-200">
          {/* Policy Information */}
          <div className="p-6">
            <button
              onClick={() => toggleSection('policy')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4"
            >
              {expandedSections.policy ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <span>Policy Information</span>
            </button>

            {expandedSections.policy && (
              <div className="ml-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Policy Number:</span>
                  <span className="text-sm font-medium">{config.policy.policyNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Policy Name:</span>
                  <span className="text-sm font-medium">{config.policy.policyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company:</span>
                  <span className="text-sm font-medium">{config.policy.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-medium">
                    {config.planVersion.version} ({config.planVersion.status})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Effective Period:</span>
                  <span className="text-sm font-medium">
                    {formatDate(config.planVersion.effectiveFrom)}
                    {config.planVersion.effectiveTo && ` - ${formatDate(config.planVersion.effectiveTo)}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Configuration */}
          <div className="p-6">
            <button
              onClick={() => toggleSection('wallet')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4"
            >
              {expandedSections.wallet ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <span>Wallet Configuration</span>
            </button>

            {expandedSections.wallet && config.wallet && (
              <div className="ml-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Annual Amount:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(config.wallet.totalAnnualAmount)}
                  </span>
                </div>
                {config.wallet.perClaimLimit && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Per Claim Limit:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(config.wallet.perClaimLimit)}
                    </span>
                  </div>
                )}
                {config.wallet.copay && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Copay:</span>
                    <span className="text-sm font-medium">
                      {config.wallet.copay.mode === 'PERCENT'
                        ? `${config.wallet.copay.value}%`
                        : formatCurrency(config.wallet.copay.value)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Partial Payment:</span>
                  <span className="text-sm font-medium">
                    {config.wallet.partialPaymentEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {config.wallet.carryForward?.enabled && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Carry Forward:</span>
                    <span className="text-sm font-medium">
                      {config.wallet.carryForward.percent}% for {config.wallet.carryForward.months} months
                    </span>
                  </div>
                )}
                {config.wallet.topUpAllowed !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Top-up Allowed:</span>
                    <span className="text-sm font-medium">
                      {config.wallet.topUpAllowed ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {expandedSections.wallet && !config.wallet && (
              <div className="ml-6 text-sm text-gray-500">
                No wallet configuration found
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="p-6">
            <button
              onClick={() => toggleSection('benefits')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4"
            >
              {expandedSections.benefits ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <span>Benefit Components</span>
            </button>

            {expandedSections.benefits && (
              <div className="ml-6 space-y-3">
                {Object.entries(config.benefits).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {value?.enabled ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-sm text-gray-700">{getBenefitLabel(key)}</span>
                    </div>
                    {value?.enabled && (
                      <div className="text-sm text-gray-600">
                        {value.annualAmountLimit && (
                          <span className="mr-3">
                            Limit: {formatCurrency(value.annualAmountLimit)}
                          </span>
                        )}
                        {value.visitsLimit && (
                          <span>Visits: {value.visitsLimit}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coverage Matrix */}
          {config.coverage.length > 0 && (
            <div className="p-6">
              <button
                onClick={() => toggleSection('coverage')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4"
              >
                {expandedSections.coverage ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
                <span>Coverage Matrix ({config.coverage.filter(c => c.enabled).length} services)</span>
              </button>

              {expandedSections.coverage && (
                <div className="ml-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Category
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Service Code
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Enabled
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {config.coverage.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.categoryId}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {item.serviceCode || '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {item.enabled ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500 inline" />
                              ) : (
                                <XCircleIcon className="h-4 w-4 text-gray-300 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}