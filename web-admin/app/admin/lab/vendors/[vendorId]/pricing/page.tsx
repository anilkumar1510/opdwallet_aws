'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

interface LabService {
  _id: string
  serviceId: string
  code: string
  name: string
  category: string
}

interface Pricing {
  _id: string
  serviceId: string
  serviceName: string
  serviceCode: string
  actualPrice: number
  discountedPrice: number
  homeCollectionCharges?: number
  isActive: boolean
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
}

export default function VendorPricingPage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [pricingList, setPricingList] = useState<Pricing[]>([])
  const [services, setServices] = useState<LabService[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null)

  const [formData, setFormData] = useState({
    serviceId: '',
    actualPrice: 0,
    discountedPrice: 0,
    homeCollectionCharges: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch vendor
      const vendorRes = await fetch('/api/admin/lab/vendors', {
        credentials: 'include',
      })
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json()
        const foundVendor = vendorData.data.find((v: Vendor) => v.vendorId === vendorId)
        setVendor(foundVendor)
      }

      // Fetch pricing
      const pricingRes = await fetch(`/api/admin/lab/vendors/${vendorId}/pricing`, {
        credentials: 'include',
      })
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json()
        setPricingList(pricingData.data || [])
      }

      // Fetch all services
      const servicesRes = await fetch('/api/admin/lab/services', {
        credentials: 'include',
      })
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (pricing?: Pricing) => {
    if (pricing) {
      setEditingPricing(pricing)
      setFormData({
        serviceId: pricing.serviceId,
        actualPrice: pricing.actualPrice,
        discountedPrice: pricing.discountedPrice,
        homeCollectionCharges: pricing.homeCollectionCharges || 0,
      })
    } else {
      setEditingPricing(null)
      setFormData({
        serviceId: '',
        actualPrice: 0,
        discountedPrice: 0,
        homeCollectionCharges: 0,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPricing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.discountedPrice > formData.actualPrice) {
      toast.error('Discounted price cannot be greater than actual price')
      return
    }

    try {
      const url = editingPricing
        ? `/api/admin/lab/vendors/${vendorId}/pricing/${formData.serviceId}`
        : `/api/admin/lab/vendors/${vendorId}/pricing`

      const method = editingPricing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save pricing')

      const data = await response.json()
      toast.success(data.message || 'Pricing saved successfully')
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Error saving pricing:', error)
      toast.error('Failed to save pricing')
    }
  }

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s._id === serviceId || s.serviceId === serviceId)
    return service ? `${service.name} (${service.code})` : 'Unknown Service'
  }

  const getAvailableServices = () => {
    const pricedServiceIds = pricingList.map((p) => p.serviceId)
    return services.filter((s) => !pricedServiceIds.includes(s._id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Vendor Pricing</h1>
            <p className="text-sm text-gray-600">{vendor?.name || vendorId}</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Pricing
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {pricingList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No pricing configured yet</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add First Pricing
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discounted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Home Fee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pricingList.map((pricing) => {
                  const discount = Math.round(
                    ((pricing.actualPrice - pricing.discountedPrice) / pricing.actualPrice) * 100
                  )
                  return (
                    <tr key={pricing._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{pricing.serviceName}</p>
                        <p className="text-sm text-gray-600">{pricing.serviceCode}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-900">₹{pricing.actualPrice}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        ₹{pricing.discountedPrice}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        ₹{pricing.homeCollectionCharges || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {discount}% off
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenModal(pricing)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-blue-600 inline-flex"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPricing ? 'Edit Pricing' : 'Add Pricing'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  disabled={!!editingPricing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  required
                >
                  <option value="">Select Service</option>
                  {editingPricing ? (
                    <option value={editingPricing.serviceId}>
                      {getServiceName(editingPricing.serviceId)}
                    </option>
                  ) : (
                    getAvailableServices().map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name} ({service.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Price (MRP)
                </label>
                <input
                  type="number"
                  value={formData.actualPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, actualPrice: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discounted Price
                </label>
                <input
                  type="number"
                  value={formData.discountedPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, discountedPrice: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Collection Charges (Optional)
                </label>
                <input
                  type="number"
                  value={formData.homeCollectionCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, homeCollectionCharges: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingPricing ? 'Update' : 'Add'} Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
