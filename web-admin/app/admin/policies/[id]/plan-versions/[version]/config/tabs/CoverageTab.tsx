import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface CoverageTabProps {
  policyId: string
  planVersion: number
  isEditable: boolean
}

interface CoverageRow {
  categoryId: string
  categoryName?: string
  serviceCode?: string
  serviceName?: string
  enabled: boolean
  notes?: string
}

interface Category {
  categoryId: string
  name: string
  isActive: boolean
}

interface Service {
  code: string
  serviceType: string
  category: string
  isActive: boolean
}

export default function CoverageTab({ policyId, planVersion, isEditable }: CoverageTabProps) {
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>([])
  const [filteredRows, setFilteredRows] = useState<CoverageRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)

  useEffect(() => {
    fetchData()
  }, [policyId, planVersion])

  useEffect(() => {
    applyFilters()
  }, [coverageRows, selectedCategory, searchQuery, showEnabledOnly])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const categoriesResponse = await apiFetch('/api/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.filter((c: Category) => c.isActive))
      }

      // Fetch services
      const servicesResponse = await apiFetch('/api/services')
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setServices(servicesData.filter((s: Service) => s.isActive))
      }

      // Fetch coverage matrix
      const coverageResponse = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage`
      )
      if (coverageResponse.ok) {
        const coverageData = await coverageResponse.json()
        const existingRows = coverageData.rows || []

        // Build complete matrix with all categories and services
        const completeMatrix = buildCompleteMatrix(existingRows)
        setCoverageRows(completeMatrix)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildCompleteMatrix = (existingRows: CoverageRow[]) => {
    const matrix: CoverageRow[] = []

    // Create a map of existing rows for quick lookup
    const existingMap = new Map<string, CoverageRow>()
    existingRows.forEach(row => {
      const key = `${row.categoryId}-${row.serviceCode || 'category'}`
      existingMap.set(key, row)
    })

    // Add category-level entries
    categories.forEach(category => {
      const key = `${category.categoryId}-category`
      const existing = existingMap.get(key)
      matrix.push({
        categoryId: category.categoryId,
        categoryName: category.name,
        enabled: existing?.enabled || false,
        notes: existing?.notes,
      })

      // Add service-level entries for this category
      services
        .filter(service => service.category === category.categoryId)
        .forEach(service => {
          const serviceKey = `${category.categoryId}-${service.code}`
          const existingService = existingMap.get(serviceKey)
          matrix.push({
            categoryId: category.categoryId,
            categoryName: category.name,
            serviceCode: service.code,
            serviceName: service.serviceType,
            enabled: existingService?.enabled || false,
            notes: existingService?.notes,
          })
        })
    })

    return matrix
  }

  const applyFilters = () => {
    let filtered = [...coverageRows]

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(row => row.categoryId === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(row =>
        row.categoryName?.toLowerCase().includes(query) ||
        row.serviceCode?.toLowerCase().includes(query) ||
        row.serviceName?.toLowerCase().includes(query)
      )
    }

    // Enabled only filter
    if (showEnabledOnly) {
      filtered = filtered.filter(row => row.enabled)
    }

    setFilteredRows(filtered)
  }

  const updateRow = (index: number, field: keyof CoverageRow, value: any) => {
    const updatedRows = [...coverageRows]
    const rowIndex = coverageRows.findIndex(
      r => r === filteredRows[index]
    )
    if (rowIndex !== -1) {
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [field]: value,
      }
      setCoverageRows(updatedRows)
    }
  }

  const saveCoverage = async () => {
    if (!isEditable) return

    try {
      setSaving(true)

      // Filter out rows that match default state (not enabled, no notes)
      const rowsToSave = coverageRows
        .filter(row => row.enabled || row.notes)
        .map(({ categoryId, serviceCode, enabled, notes }) => ({
          categoryId,
          serviceCode,
          enabled,
          notes,
        }))

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/coverage`,
        {
          method: 'PUT',
          body: JSON.stringify({ rows: rowsToSave }),
        }
      )

      if (!response.ok) throw new Error('Failed to save coverage matrix')

      // Show success message
      alert('Coverage matrix saved successfully')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save coverage matrix')
    } finally {
      setSaving(false)
    }
  }

  const toggleAllInCategory = (categoryId: string, enabled: boolean) => {
    const updatedRows = coverageRows.map(row =>
      row.categoryId === categoryId ? { ...row, enabled } : row
    )
    setCoverageRows(updatedRows)
  }

  if (loading) return <div>Loading coverage configuration...</div>

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium">Coverage Matrix</h2>
        <p className="text-sm text-gray-600 mt-1">
          Map categories and services availability for this plan version
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name} ({cat.categoryId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service code or name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showEnabledOnly}
                onChange={(e) => setShowEnabledOnly(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">Show enabled only</span>
            </label>
          </div>
        </div>

        {selectedCategory !== 'all' && isEditable && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => toggleAllInCategory(selectedCategory, true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Enable All in Category
            </button>
            <button
              onClick={() => toggleAllInCategory(selectedCategory, false)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Disable All in Category
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enabled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No services found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={`${row.categoryId}-${row.serviceCode || 'category'}`}
                    className={!row.serviceCode ? 'bg-gray-50 font-medium' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.categoryName} ({row.categoryId})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.serviceCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.serviceName || 'Category Level'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(checked) => updateRow(index, 'enabled', checked)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={(e) => updateRow(index, 'notes', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
                      placeholder="Add notes..."
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredRows.length} items • {filteredRows.filter(r => r.enabled).length} enabled
          </div>
          {isEditable && (
            <button
              onClick={saveCoverage}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Coverage Matrix'}
            </button>
          )}
        </div>

        {!isEditable && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            This plan version is not in DRAFT status and cannot be edited.
          </div>
        )}
      </div>
    </div>
  )
}