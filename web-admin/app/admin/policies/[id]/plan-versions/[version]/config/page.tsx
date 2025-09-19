'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'
import BenefitsTab from './tabs/BenefitsTab'
import WalletTab from './tabs/WalletTab'
import CoverageTab from './tabs/CoverageTab'
import ReadinessPanel from '@/components/plan-versions/ReadinessPanel'
import EffectiveConfigPreview from '@/components/plan-versions/EffectiveConfigPreview'

interface Policy {
  _id: string
  policyNumber: string
  name: string
}

interface PlanVersion {
  planVersion: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  effectiveFrom: string
  effectiveTo?: string
}

export default function PlanVersionConfigPage() {
  const params = useParams()
  const router = useRouter()
  const { id: policyId, version } = params as { id: string; version: string }

  const [policy, setPolicy] = useState<Policy | null>(null)
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null)
  const [activeTab, setActiveTab] = useState<'benefits' | 'wallet' | 'coverage'>('benefits')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [configData, setConfigData] = useState<any>({
    benefits: null,
    wallet: null,
    coverage: null
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Add refresh trigger

  useEffect(() => {
    fetchData()
  }, [policyId, version])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch policy details
      const policyResponse = await apiFetch(`/api/policies/${policyId}`)
      if (!policyResponse.ok) throw new Error('Failed to fetch policy')
      const policyData = await policyResponse.json()
      setPolicy(policyData)

      // Fetch plan version details
      const versionsResponse = await apiFetch(`/api/admin/policies/${policyId}/plan-versions`)
      if (!versionsResponse.ok) throw new Error('Failed to fetch plan versions')
      const versionsData = await versionsResponse.json()

      // Handle both array and nested data structures
      const versions = Array.isArray(versionsData) ? versionsData : (versionsData.data || versionsData.planVersions || [])

      const currentVersion = versions.find(
        (v: PlanVersion) => v.planVersion === parseInt(version)
      )
      if (!currentVersion) throw new Error('Plan version not found')
      setPlanVersion(currentVersion)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = (tab: 'benefits' | 'wallet' | 'coverage', data: any) => {
    console.log(`📥 PARENT RECEIVED UPDATE FROM ${tab.toUpperCase()} TAB:`, {
      tab,
      data,
      dataType: typeof data,
      dataKeys: Object.keys(data || {}),
      dataStringified: JSON.stringify(data)
    })

    setConfigData(prev => {
      const newData = {
        ...prev,
        [tab]: data
      }
      console.log('📦 Updated configData state:', newData)
      return newData
    })
    setHasChanges(true)
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${version}/publish`,
        {
          method: 'POST'
        }
      )

      if (!response.ok) {
        const error = await response.json()
        if (error.readinessResponse) {
          // Show detailed readiness errors
          const failedChecks = error.failedChecks || []
          alert(`Cannot publish: \n${failedChecks.join('\n')}`)
        } else {
          throw new Error(error.message || 'Failed to publish')
        }
        return
      }

      alert('Plan version published successfully!')

      // Refresh the page to update status
      await fetchData()
    } catch (err) {
      console.error('Publish error:', err)
      alert(err instanceof Error ? err.message : 'Failed to publish version')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setIsSaving(true)

      console.log('=== SAVE BUTTON CLICKED ===')
      console.log('Active tab:', activeTab)
      console.log('Config data state:', configData)

      // Always save the current data regardless of tracking changes
      let dataToSave = configData[activeTab]

      console.log('Raw data for active tab:', dataToSave)
      console.log('Type of dataToSave:', typeof dataToSave)

      if (activeTab === 'wallet') {
        // If no data has been collected, use empty object
        if (!dataToSave) {
          console.log('No data to save, using empty object')
          dataToSave = {}
        }

        console.log('=== CHECKING EACH FIELD ===')

        // Debug each field
        console.log('totalAnnualAmount:', {
          value: dataToSave.totalAnnualAmount,
          type: typeof dataToSave.totalAnnualAmount,
          isNumber: typeof dataToSave.totalAnnualAmount === 'number',
          isPositive: dataToSave.totalAnnualAmount >= 0,
          willInclude: typeof dataToSave.totalAnnualAmount === 'number' && dataToSave.totalAnnualAmount >= 0
        })

        console.log('perClaimLimit:', {
          value: dataToSave.perClaimLimit,
          type: typeof dataToSave.perClaimLimit,
          isNumber: typeof dataToSave.perClaimLimit === 'number',
          isPositive: dataToSave.perClaimLimit >= 0,
          willInclude: typeof dataToSave.perClaimLimit === 'number' && dataToSave.perClaimLimit >= 0
        })

        console.log('copay:', {
          exists: !!dataToSave.copay,
          value: dataToSave.copay?.value,
          mode: dataToSave.copay?.mode,
          valueType: typeof dataToSave.copay?.value,
          isValidValue: typeof dataToSave.copay?.value === 'number' && dataToSave.copay?.value >= 0,
          willInclude: dataToSave.copay && typeof dataToSave.copay.value === 'number' && dataToSave.copay.value >= 0
        })

        console.log('partialPaymentEnabled:', {
          value: dataToSave.partialPaymentEnabled,
          type: typeof dataToSave.partialPaymentEnabled,
          isBoolean: typeof dataToSave.partialPaymentEnabled === 'boolean',
          willInclude: typeof dataToSave.partialPaymentEnabled === 'boolean'
        })

        console.log('topUpAllowed:', {
          value: dataToSave.topUpAllowed,
          type: typeof dataToSave.topUpAllowed,
          isBoolean: typeof dataToSave.topUpAllowed === 'boolean',
          willInclude: typeof dataToSave.topUpAllowed === 'boolean'
        })

        console.log('carryForward:', {
          exists: !!dataToSave.carryForward,
          enabled: dataToSave.carryForward?.enabled,
          enabledType: typeof dataToSave.carryForward?.enabled,
          percent: dataToSave.carryForward?.percent,
          percentType: typeof dataToSave.carryForward?.percent,
          months: dataToSave.carryForward?.months,
          monthsType: typeof dataToSave.carryForward?.months,
          willInclude: dataToSave.carryForward && typeof dataToSave.carryForward.enabled === 'boolean'
        })

        console.log('notes:', {
          value: dataToSave.notes,
          type: typeof dataToSave.notes,
          trimmed: dataToSave.notes?.trim?.(),
          willInclude: typeof dataToSave.notes === 'string' && dataToSave.notes.trim()
        })

        // Clean the wallet data before sending
        const cleanedData: any = {}

        // Only include numeric fields if they have valid positive numbers
        if (typeof dataToSave.totalAnnualAmount === 'number' && dataToSave.totalAnnualAmount >= 0) {
          cleanedData.totalAnnualAmount = dataToSave.totalAnnualAmount
          console.log('✅ Including totalAnnualAmount:', dataToSave.totalAnnualAmount)
        } else {
          console.log('❌ Excluding totalAnnualAmount')
        }

        if (typeof dataToSave.perClaimLimit === 'number' && dataToSave.perClaimLimit >= 0) {
          cleanedData.perClaimLimit = dataToSave.perClaimLimit
          console.log('✅ Including perClaimLimit:', dataToSave.perClaimLimit)
        } else {
          console.log('❌ Excluding perClaimLimit')
        }

        // Handle copay - only include if it has a valid value
        if (dataToSave.copay && typeof dataToSave.copay.value === 'number' && dataToSave.copay.value >= 0) {
          cleanedData.copay = {
            mode: dataToSave.copay.mode || 'PERCENT',
            value: dataToSave.copay.value
          }
          console.log('✅ Including copay:', cleanedData.copay)
        } else {
          console.log('❌ Excluding copay')
        }

        // Boolean fields - only include if explicitly set
        if (typeof dataToSave.partialPaymentEnabled === 'boolean') {
          cleanedData.partialPaymentEnabled = dataToSave.partialPaymentEnabled
          console.log('✅ Including partialPaymentEnabled:', dataToSave.partialPaymentEnabled)
        } else {
          console.log('❌ Excluding partialPaymentEnabled')
        }

        if (typeof dataToSave.topUpAllowed === 'boolean') {
          cleanedData.topUpAllowed = dataToSave.topUpAllowed
          console.log('✅ Including topUpAllowed:', dataToSave.topUpAllowed)
        } else {
          console.log('❌ Excluding topUpAllowed')
        }

        // Carry forward - handle carefully
        if (dataToSave.carryForward && typeof dataToSave.carryForward.enabled === 'boolean') {
          cleanedData.carryForward = {
            enabled: dataToSave.carryForward.enabled
          }
          console.log('✅ Including carryForward.enabled:', dataToSave.carryForward.enabled)

          if (dataToSave.carryForward.enabled) {
            if (typeof dataToSave.carryForward.percent === 'number' && dataToSave.carryForward.percent >= 0) {
              cleanedData.carryForward.percent = dataToSave.carryForward.percent
              console.log('✅ Including carryForward.percent:', dataToSave.carryForward.percent)
            } else {
              console.log('❌ Excluding carryForward.percent')
            }
            if (typeof dataToSave.carryForward.months === 'number' && dataToSave.carryForward.months > 0) {
              cleanedData.carryForward.months = dataToSave.carryForward.months
              console.log('✅ Including carryForward.months:', dataToSave.carryForward.months)
            } else {
              console.log('❌ Excluding carryForward.months')
            }
          }
        } else {
          console.log('❌ Excluding carryForward')
        }

        // Include notes only if it's a non-empty string
        if (typeof dataToSave.notes === 'string' && dataToSave.notes.trim()) {
          cleanedData.notes = dataToSave.notes.trim()
          console.log('✅ Including notes:', cleanedData.notes)
        } else {
          console.log('❌ Excluding notes')
        }

        console.log('=== FINAL DATA ===')
        console.log('Final cleaned data:', cleanedData)
        console.log('JSON stringified:', JSON.stringify(cleanedData))

        const walletResponse = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${version}/wallet-rules`,
          {
            method: 'PUT',
            body: JSON.stringify(cleanedData)
          }
        )
        if (!walletResponse.ok) {
          const error = await walletResponse.text()
          throw new Error(`Failed to save wallet rules: ${error}`)
        }
      } else if (activeTab === 'benefits' && dataToSave) {
        const benefitsResponse = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${version}/benefit-components`,
          {
            method: 'PUT',
            body: JSON.stringify(dataToSave)
          }
        )
        if (!benefitsResponse.ok) {
          const error = await benefitsResponse.text()
          throw new Error(`Failed to save benefits: ${error}`)
        }
      } else if (activeTab === 'coverage' && dataToSave) {
        const coverageResponse = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${version}/coverage`,
          {
            method: 'PUT',
            body: JSON.stringify(dataToSave)
          }
        )
        if (!coverageResponse.ok) {
          const error = await coverageResponse.text()
          throw new Error(`Failed to save coverage: ${error}`)
        }
      } else {
        // If no data collected via onUpdate, inform user
        alert('Please make changes before saving or switch tabs to refresh.')
        setIsSaving(false)
        return
      }

      // Add telemetry
      console.info(`[TELEMETRY] PUT ${activeTab} success at:`, new Date().toISOString())

      alert('Changes saved successfully!')
      setHasChanges(false)

      // Trigger refresh of ReadinessPanel and EffectiveConfigPreview
      console.info(`[TELEMETRY] Triggering refresh at:`, new Date().toISOString())
      setRefreshKey(prev => prev + 1)

    } catch (err) {
      console.error('Save error:', err)
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (error || !policy || !planVersion) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load data'}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'benefits', label: 'Benefits', component: BenefitsTab },
    { id: 'wallet', label: 'Wallet', component: WalletTab },
    { id: 'coverage', label: 'Coverage', component: CoverageTab },
  ]

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || BenefitsTab

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/policies/${policyId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Plan Version {planVersion.planVersion} Configuration
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {policy.name} ({policy.policyNumber})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  planVersion.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-800'
                    : planVersion.status === 'DRAFT'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {planVersion.status}
              </span>
              {planVersion.status === 'DRAFT' && (
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Readiness Panel - Only show for DRAFT versions */}
        {planVersion.status === 'DRAFT' && (
          <div className="mb-6">
            <ReadinessPanel
              key={`readiness-${refreshKey}`}
              policyId={policyId}
              planVersion={parseInt(version)}
              onPublishClick={handlePublish}
              isPublishing={isPublishing}
            />
          </div>
        )}

        {/* Config Preview Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showPreview ? 'Hide Effective Config Preview' : 'Show Effective Config Preview'}
          </button>
        </div>

        {/* Effective Config Preview */}
        {showPreview && (
          <div className="mb-6">
            <EffectiveConfigPreview
              key={`preview-${refreshKey}`}
              policyId={policyId}
              planVersion={parseInt(version)}
            />
          </div>
        )}

        {/* Tab Content */}
        <ActiveTabComponent
          policyId={policyId}
          planVersion={parseInt(version)}
          isEditable={planVersion.status === 'DRAFT'}
          onUpdate={(data: any) => handleConfigUpdate(activeTab, data)}
        />
      </div>
    </div>
  )
}