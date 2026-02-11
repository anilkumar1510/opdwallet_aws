'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface VaccinationService {
  _id: string
  serviceId: string
  name: string
  code: string
  vaccineType?: string
  manufacturer?: string
  dosesRequired?: number
  isActive: boolean
}

interface VaccinationServiceTabProps {
  categoryId: string
  categoryName: string
}

export function VaccinationServiceTab({ categoryId, categoryName }: VaccinationServiceTabProps) {
  const [services, setServices] = useState<VaccinationService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [categoryId])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/vaccination/services')

      if (response.ok) {
        const data = await response.json()
        setServices(data.data || [])
      } else {
        toast.error('Failed to fetch vaccination services')
      }
    } catch (error) {
      console.error('Error fetching vaccination services:', error)
      toast.error('Failed to fetch vaccination services')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (service: VaccinationService) => {
    const action = service.isActive ? 'deactivate' : 'activate'
    const previousState = service.isActive

    // Optimistic update
    setServices((prev) =>
      prev.map((s) =>
        s.serviceId === service.serviceId ? { ...s, isActive: !s.isActive } : s
      )
    )
    setTogglingId(service.serviceId)

    try {
      const response = await apiFetch(
        `/api/admin/vaccination/services/${service.serviceId}/${action}`,
        { method: 'PATCH' }
      )

      if (!response.ok) {
        // Revert on error
        setServices((prev) =>
          prev.map((s) =>
            s.serviceId === service.serviceId ? { ...s, isActive: previousState } : s
          )
        )
        throw new Error(`Failed to ${action} service`)
      }

      const data = await response.json()
      toast.success(data.message || `Service ${action}d successfully`)
    } catch (error) {
      console.error(`Error ${action}ing service:`, error)
      toast.error(`Failed to ${action} service`)
    } finally {
      setTogglingId(null)
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive)

    return matchesSearch && matchesStatus
  })

  const activeCount = services.filter((s) => s.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Vaccination Services</h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeCount} of {services.length} services active
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'No services found matching your criteria'
              : 'No vaccination services available'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vaccine Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {service.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.manufacturer && (
                        <p className="text-gray-500 text-xs">{service.manufacturer}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.vaccineType || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {service.dosesRequired || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleStatus(service)}
                        disabled={togglingId === service.serviceId}
                        id={`vaccination-service-${service.serviceId}`}
                      />
                      {togglingId === service.serviceId && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
