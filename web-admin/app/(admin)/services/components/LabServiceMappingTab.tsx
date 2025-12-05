'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

interface LabServiceWithMapping {
  _id: string
  serviceId: string
  code: string
  name: string
  description?: string
  category: string
  sampleType?: string
  preparationInstructions?: string
  isActive: boolean
  displayOrder?: number
  isEnabledForCategory: boolean
}

interface LabServiceMappingTabProps {
  categoryId: string
  categoryName: string
}

export function LabServiceMappingTab({ categoryId, categoryName }: LabServiceMappingTabProps) {
  const [labServices, setLabServices] = useState<LabServiceWithMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  useEffect(() => {
    fetchLabServices()
  }, [categoryId])

  const fetchLabServices = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/categories/${categoryId}/lab-services`)
      if (response.ok) {
        const data = await response.json()
        setLabServices(data)
      } else {
        toast.error('Failed to fetch lab services')
      }
    } catch (error) {
      console.error('Error fetching lab services:', error)
      toast.error('Failed to fetch lab services')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (labServiceId: string, newValue: boolean) => {
    setToggleLoading(labServiceId)

    // Optimistic update
    setLabServices((prev) =>
      prev.map((s) =>
        s._id === labServiceId
          ? { ...s, isEnabledForCategory: newValue }
          : s
      )
    )

    try {
      const response = await apiFetch(
        `/api/categories/${categoryId}/lab-services/${labServiceId}/toggle`,
        {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: newValue }),
        }
      )

      if (response.ok) {
        toast.success(
          newValue
            ? 'Lab service enabled for this category'
            : 'Lab service disabled for this category'
        )
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update lab service')
        // Revert on error
        await fetchLabServices()
      }
    } catch (error) {
      console.error('Error toggling lab service:', error)
      toast.error('Failed to update lab service. Please try again.')
      // Revert on error
      await fetchLabServices()
    } finally {
      setToggleLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  if (labServices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Lab Services Available
          </h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Please add lab services in the Lab Services section first before assigning them to categories.
          </p>
        </div>
      </div>
    )
  }

  // Filter services by category
  const categories = ['ALL', 'PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'ENDOSCOPY', 'OTHER']
  const filteredServices = selectedCategory === 'ALL'
    ? labServices
    : labServices.filter(s => s.category === selectedCategory)

  const enabledCount = filteredServices.filter(s => s.isEnabledForCategory).length

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lab Service Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Toggle lab services to assign them to {categoryName}
        </p>

        {/* Category Filter */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredServices.map((service) => (
          <div
            key={service._id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {service.name}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {service.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {service.code}
                  {service.description && ` • ${service.description}`}
                </p>
                {service.sampleType && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sample: {service.sampleType}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <Switch
                checked={service.isEnabledForCategory}
                onCheckedChange={(checked) => handleToggle(service._id, checked)}
                disabled={toggleLoading === service._id}
                id={`lab-service-${service._id}`}
              />
              {toggleLoading === service._id && (
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"
                  aria-label="Saving..."
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {enabledCount} of {filteredServices.length} services enabled
          {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
        </p>
      </div>
    </div>
  )
}
