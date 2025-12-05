'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

interface SpecialtyWithMapping {
  _id: string
  specialtyId: string
  code: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  displayOrder?: number
  isEnabledForCategory: boolean
}

interface SpecialtyMappingTabProps {
  categoryId: string
  categoryName: string
}

export function SpecialtyMappingTab({ categoryId, categoryName }: SpecialtyMappingTabProps) {
  const [specialties, setSpecialties] = useState<SpecialtyWithMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSpecialties()
  }, [categoryId])

  const fetchSpecialties = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/categories/${categoryId}/specialties`)
      if (response.ok) {
        const data = await response.json()
        setSpecialties(data)
      } else {
        toast.error('Failed to fetch specialties')
      }
    } catch (error) {
      console.error('Error fetching specialties:', error)
      toast.error('Failed to fetch specialties')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (specialtyId: string, newValue: boolean) => {
    setToggleLoading(specialtyId)
    try {
      const response = await apiFetch(
        `/api/categories/${categoryId}/specialties/${specialtyId}/toggle`,
        {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: newValue }),
        }
      )

      if (response.ok) {
        // Optimistic update
        setSpecialties((prev) =>
          prev.map((s) =>
            s._id === specialtyId
              ? { ...s, isEnabledForCategory: newValue }
              : s
          )
        )
        toast.success(
          newValue
            ? 'Specialty enabled for this category'
            : 'Specialty disabled for this category'
        )
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update specialty')
      }
    } catch (error) {
      console.error('Error toggling specialty:', error)
      toast.error('Failed to update specialty. Please try again.')
      // Revert on error
      await fetchSpecialties()
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

  if (specialties.length === 0) {
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
            No Specialties Available
          </h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Please add specialties in the Masters section first before assigning them to categories.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Specialty Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Toggle specialties to assign them to {categoryName}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {specialties.map((specialty) => (
          <div
            key={specialty._id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {specialty.icon && (
                <span className="text-2xl" aria-label={`${specialty.name} icon`}>
                  {specialty.icon}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {specialty.name}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  {specialty.code}
                  {specialty.description && ` • ${specialty.description}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <Switch
                checked={specialty.isEnabledForCategory}
                onCheckedChange={(checked) => handleToggle(specialty._id, checked)}
                disabled={toggleLoading === specialty._id}
                id={`specialty-${specialty._id}`}
              />
              {toggleLoading === specialty._id && (
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"
                  aria-label="Saving..."
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
