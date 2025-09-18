'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'
import BenefitsTab from './tabs/BenefitsTab'
import WalletTab from './tabs/WalletTab'
import CoverageTab from './tabs/CoverageTab'

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
    setConfigData(prev => ({
      ...prev,
      [tab]: data
    }))
    setHasChanges(true)
  }

  const handleSaveAll = async () => {
    try {
      setIsSaving(true)

      // Always save the current data regardless of tracking changes
      const dataToSave = configData[activeTab]

      if (activeTab === 'wallet' && dataToSave) {
        const walletResponse = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${version}/wallet-rules`,
          {
            method: 'PUT',
            body: JSON.stringify(dataToSave)
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

      alert('Changes saved successfully!')
      setHasChanges(false)

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