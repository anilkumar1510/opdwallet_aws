'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface AhcPackage {
  _id: string
  packageId: string
  name: string
  effectiveFrom: string
  effectiveTo: string
  labServiceIds: string[]
  diagnosticServiceIds: string[]
  isActive: boolean
}

interface AhcPackageSelectorProps {
  selectedPackageId: string | null
  onPackageSelect: (packageId: string | null) => void
  disabled?: boolean
}

export function AhcPackageSelector({
  selectedPackageId,
  onPackageSelect,
  disabled = false,
}: AhcPackageSelectorProps) {
  const [packages, setPackages] = useState<AhcPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAhcPackages()
  }, [])

  const fetchAhcPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiFetch('/api/admin/ahc/packages')

      if (!response.ok) {
        throw new Error('Failed to fetch AHC packages')
      }

      const result = await response.json()
      const allPackages = result.data || []

      // Filter: Only active packages within validity period
      const now = new Date()
      const validPackages = allPackages.filter((pkg: AhcPackage) => {
        if (!pkg.isActive) return false

        const effectiveFrom = new Date(pkg.effectiveFrom)
        const effectiveTo = new Date(pkg.effectiveTo)

        return now >= effectiveFrom && now <= effectiveTo
      })

      setPackages(validPackages)
    } catch (err: any) {
      console.error('Error fetching AHC packages:', err)
      setError(err.message || 'Failed to load AHC packages')
      toast.error('Failed to load AHC packages')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTotalTestsCount = (pkg: AhcPackage) => {
    return (pkg.labServiceIds?.length || 0) + (pkg.diagnosticServiceIds?.length || 0)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-sm text-gray-600">Loading AHC packages...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
            <button
              onClick={fetchAhcPackages}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>No valid AHC packages available.</strong>
            <p className="mt-1">
              Please create an active AHC package with a valid date range in the{' '}
              <a href="/admin/ahc" className="text-blue-600 hover:text-blue-800 underline">
                AHC Master
              </a>{' '}
              section before configuring wellness benefits.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Select AHC Package
        </h4>
        <p className="text-xs text-gray-600">
          Choose one Annual Health Check package to include in this wellness benefit. Only active packages with valid dates are shown.
        </p>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <strong>Note:</strong> Only ONE AHC package can be selected per policy.
            The package includes predefined lab and diagnostic tests that members can access as part of their wellness benefit.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.packageId
          const testsCount = getTotalTestsCount(pkg)

          return (
            <label
              key={pkg.packageId}
              className={`
                flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="ahc-package"
                value={pkg.packageId}
                checked={isSelected}
                onChange={() => !disabled && onPackageSelect(pkg.packageId)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />

              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {pkg.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Package ID: {pkg.packageId}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium">Validity:</span>
                    <span className="ml-1">
                      {formatDate(pkg.effectiveFrom)} - {formatDate(pkg.effectiveTo)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Tests:</span>
                    <span className="ml-1">{testsCount} total</span>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  {pkg.labServiceIds.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {pkg.labServiceIds.length} Lab Test{pkg.labServiceIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {pkg.diagnosticServiceIds.length > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      {pkg.diagnosticServiceIds.length} Diagnostic Test{pkg.diagnosticServiceIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {selectedPackageId && (
        <div className="mt-3">
          <button
            onClick={() => onPackageSelect(null)}
            disabled={disabled}
            className="text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  )
}
