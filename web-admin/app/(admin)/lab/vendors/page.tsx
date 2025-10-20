'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  PencilIcon,
  CurrencyRupeeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface LabVendor {
  _id: string
  vendorId: string
  name: string
  code: string
  contactInfo: {
    phone: string
    email: string
    address: string
  }
  serviceablePincodes: string[]
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  description?: string
  isActive: boolean
}

export default function LabVendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<LabVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<LabVendor | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    pincodes: '',
    homeCollection: true,
    centerVisit: true,
    homeCollectionCharges: 50,
    description: '',
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/lab/vendors')

      if (!response.ok) throw new Error('Failed to fetch vendors')

      const data = await response.json()
      setVendors(data.data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const pincodeArray = formData.pincodes
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p)

      const payload = {
        name: formData.name,
        code: formData.code,
        contactInfo: {
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        },
        serviceablePincodes: pincodeArray,
        homeCollection: formData.homeCollection,
        centerVisit: formData.centerVisit,
        homeCollectionCharges: formData.homeCollectionCharges,
        description: formData.description,
      }

      const url = editingVendor
        ? `/api/admin/lab/vendors/${editingVendor.vendorId}`
        : '/api/admin/lab/vendors'

      const method = editingVendor ? 'PATCH' : 'POST'

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save vendor')

      const data = await response.json()
      toast.success(data.message)

      setShowModal(false)
      setEditingVendor(null)
      resetForm()
      fetchVendors()
    } catch (error) {
      console.error('Error saving vendor:', error)
      toast.error('Failed to save vendor')
    }
  }

  const handleEdit = (vendor: LabVendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      code: vendor.code,
      phone: vendor.contactInfo.phone,
      email: vendor.contactInfo.email,
      address: vendor.contactInfo.address,
      pincodes: vendor.serviceablePincodes.join(', '),
      homeCollection: vendor.homeCollection,
      centerVisit: vendor.centerVisit,
      homeCollectionCharges: vendor.homeCollectionCharges || 50,
      description: vendor.description || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      pincodes: '',
      homeCollection: true,
      centerVisit: true,
      homeCollectionCharges: 50,
      description: '',
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Vendors</h1>
          <p className="text-sm text-gray-600 mt-1">Manage lab partner vendors</p>
        </div>
        <button
          onClick={() => {
            setEditingVendor(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No vendors found. Add your first vendor to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {vendors.map((vendor) => (
              <div key={vendor._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vendor.name}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {vendor.code}
                      </span>
                      {vendor.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>📞 {vendor.contactInfo.phone} | ✉️ {vendor.contactInfo.email}</p>
                      <p>📍 {vendor.contactInfo.address}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={vendor.homeCollection ? 'text-green-600' : 'text-gray-400'}>
                          {vendor.homeCollection ? '✓' : '✗'} Home Collection
                        </span>
                        <span className={vendor.centerVisit ? 'text-green-600' : 'text-gray-400'}>
                          {vendor.centerVisit ? '✓' : '✗'} Center Visit
                        </span>
                      </div>
                      <p className="mt-2">
                        <span className="font-medium">Pincodes:</span>{' '}
                        {vendor.serviceablePincodes.slice(0, 5).join(', ')}
                        {vendor.serviceablePincodes.length > 5 && (
                          <span className="text-gray-500">
                            {' '}+{vendor.serviceablePincodes.length - 5} more
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit vendor"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/lab/vendors/${vendor.vendorId}/pricing`)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Manage pricing"
                    >
                      <CurrencyRupeeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/lab/vendors/${vendor.vendorId}/slots`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Manage slots"
                    >
                      <ClockIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serviceable Pincodes * (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincodes}
                  onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                  placeholder="e.g., 110001, 110002, 110003"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.homeCollection}
                    onChange={(e) => setFormData({ ...formData, homeCollection: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Home Collection Available</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.centerVisit}
                    onChange={(e) => setFormData({ ...formData, centerVisit: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Center Visit Available</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Collection Charges (₹)
                </label>
                <input
                  type="number"
                  value={formData.homeCollectionCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, homeCollectionCharges: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVendor(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
