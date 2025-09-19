'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CATEGORY_KEYS, BENEFIT_TO_CATEGORY } from '@/lib/constants/coverage'

interface CoverageTabProps {
  policyId: string
  planVersion: number
  isEditable: boolean
}

interface ServiceCoverage {
  serviceCode: string
  serviceName: string
  categoryId: string
  enabled: boolean
  notes?: string
  isVirtual: boolean
}

interface CategoryCoverage {
  categoryId: string
  code: string
  name: string
  services: ServiceCoverage[]
  servicesCount: number
  enabledCount: number
}

interface CoverageMatrix {
  planVersionId: string
  categories: CategoryCoverage[]
  summary: {
    totalServices: number
    enabledServices: number
    disabledServices: number
  }
}

interface CategoryInfo {
  categoryId: string
  code: string
  name: string
  servicesCount: number
}

export default function CoverageTab({ policyId, planVersion, isEditable }: CoverageTabProps) {
  const [coverageData, setCoverageData] = useState<CoverageMatrix | null>(null)
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modifiedServices, setModifiedServices] = useState<Map<string, boolean>>(new Map())

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)

  useEffect(() => {
    fetchData()
  }, [policyId, planVersion])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      if (showEnabledOnly) params.append('enabledOnly', 'true')

      // Fetch coverage matrix with filters
      const coverageResponse = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage?${params}`
      )

      if (coverageResponse.ok) {
        const data = await coverageResponse.json()
        setCoverageData(data)
      }

      // Fetch categories for dropdown if needed
      if (selectedCategory === 'all' || categories.length === 0) {
        const categoriesResponse = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage/categories`
        )
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }
      }
    } catch (error) {
      console.error('Error fetching coverage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (categoryId: string, serviceCode: string, currentValue: boolean) => {
    if (!isEditable) return

    const key = `${categoryId}-${serviceCode}`
    const newModified = new Map(modifiedServices)
    newModified.set(key, !currentValue)
    setModifiedServices(newModified)

    // Update local state
    if (coverageData) {
      const updatedData = { ...coverageData }
      const category = updatedData.categories.find(c => c.categoryId === categoryId)
      if (category) {
        const service = category.services.find(s => s.serviceCode === serviceCode)
        if (service) {
          service.enabled = !currentValue
          // Update counts
          if (!currentValue) {
            category.enabledCount++
            updatedData.summary.enabledServices++
            updatedData.summary.disabledServices--
          } else {
            category.enabledCount--
            updatedData.summary.enabledServices--
            updatedData.summary.disabledServices++
          }
        }
      }
      setCoverageData(updatedData)
    }
  }

  const bulkToggleCategory = async (categoryId: string, enable: boolean) => {
    if (!isEditable) return

    try {
      setSaving(true)
      const endpoint = enable ? 'bulk-enable' : 'bulk-disable'
      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage/${endpoint}`,
        {
          method: 'POST',
          body: JSON.stringify({ categoryIds: [categoryId] }),
        }
      )

      if (!response.ok) throw new Error(`Failed to ${enable ? 'enable' : 'disable'} services`)

      // Refresh data
      await fetchData()
      setModifiedServices(new Map())
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} services:`, error)
    } finally {
      setSaving(false)
    }
  }

  const saveCoverage = async () => {
    if (!isEditable || modifiedServices.size === 0) return

    try {
      setSaving(true)

      // Build items array from modified services
      const items: Array<{
        categoryId: string
        serviceCode: string
        enabled: boolean
        notes?: string
      }> = []

      modifiedServices.forEach((enabled, key) => {
        const [categoryId, serviceCode] = key.split('-')
        items.push({ categoryId, serviceCode, enabled })
      })

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage`,
        {
          method: 'PATCH',
          body: JSON.stringify({ items }),
        }
      )

      if (!response.ok) throw new Error('Failed to save coverage matrix')

      // Clear modified state
      setModifiedServices(new Map())

      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Error saving coverage:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium mr-2">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              fetchData()
            }}
            className="px-3 py-1 border rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name} ({cat.servicesCount} services)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              fetchData()
            }}
            className="px-3 py-1 border rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={showEnabledOnly}
            onCheckedChange={(checked) => {
              setShowEnabledOnly(checked)
              fetchData()
            }}
          />
          <label className="text-sm">Show enabled only</label>
        </div>
      </div>

      {/* Summary */}
      {coverageData && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Coverage Summary</p>
              <p className="text-lg font-medium">
                {coverageData.summary.enabledServices} / {coverageData.summary.totalServices} services enabled
              </p>
            </div>
            {modifiedServices.size > 0 && isEditable && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setModifiedServices(new Map())
                    fetchData()
                  }}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCoverage}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : `Save Changes (${modifiedServices.size})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coverage Matrix */}
      {coverageData?.categories.map((category) => (
        <div key={category.categoryId} className="border rounded-lg overflow-hidden">
          {/* Category Header */}
          <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-gray-600">
                {category.enabledCount} / {category.servicesCount} services enabled
              </p>
            </div>
            {isEditable && (
              <div className="flex gap-2">
                <button
                  onClick={() => bulkToggleCategory(category.categoryId, true)}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  disabled={saving}
                >
                  Enable All
                </button>
                <button
                  onClick={() => bulkToggleCategory(category.categoryId, false)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  disabled={saving}
                >
                  Disable All
                </button>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="divide-y">
            {category.services.map((service) => {
              const key = `${category.categoryId}-${service.serviceCode}`
              const isModified = modifiedServices.has(key)
              const enabled = isModified
                ? modifiedServices.get(key)!
                : service.enabled

              return (
                <div
                  key={service.serviceCode}
                  className={`px-4 py-3 flex justify-between items-center ${
                    isModified ? 'bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={enabled}
                      onCheckedChange={() =>
                        toggleService(category.categoryId, service.serviceCode, service.enabled)
                      }
                      disabled={!isEditable}
                    />
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-gray-500">{service.serviceCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.isVirtual && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        Not configured
                      </span>
                    )}
                    {enabled ? (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {coverageData?.categories.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-gray-500">
            No services found matching your filters
          </p>
        </div>
      )}
    </div>
  )
}