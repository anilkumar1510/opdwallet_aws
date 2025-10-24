'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NewPolicyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    effectiveFrom: '',
    effectiveTo: '',
    ownerPayer: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        effectiveFrom: formData.effectiveFrom || undefined,
        effectiveTo: formData.effectiveTo || undefined,
        ownerPayer: formData.ownerPayer || undefined,
        description: formData.description || undefined,
      }

      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newPolicy = await response.json()
        toast.success('Policy created successfully')
        router.push(`/policies/${newPolicy._id}`)
      } else {
        const error = await response.json()
        console.error('Failed to create policy:', error)
        toast.error(`Failed to create policy: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating policy:', error)
      toast.error('Failed to create policy. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/policies')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">OPD Wallet Admin</h1>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/policies')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Policies
              </button>
              <span className="text-sm text-gray-600">/ New Policy</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Policy</h2>
          <p className="mt-1 text-sm text-gray-600">Configure a new insurance policy for the organization</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Form Sections */}
            <div className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Policy Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                      Policy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Premium Health Plan"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide a detailed description of the policy..."
                    />
                  </div>
                </div>
              </div>

              {/* Configuration Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-600">Set initial status for the policy</p>
                  </div>

                  {/* Owner/Payer */}
                  <div>
                    <label htmlFor="ownerPayer" className="block text-sm font-semibold text-gray-800 mb-2">
                      Owner/Payer
                    </label>
                    <select
                      id="ownerPayer"
                      name="ownerPayer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      value={formData.ownerPayer}
                      onChange={(e) => setFormData({ ...formData, ownerPayer: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="INSURER">Insurer</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-600">Who pays for this policy</p>
                  </div>
                </div>
              </div>

              {/* Validity Period Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Effective From */}
                  <div>
                    <label htmlFor="effectiveFrom" className="block text-sm font-semibold text-gray-800 mb-2">
                      Effective From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="effectiveFrom"
                      id="effectiveFrom"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.effectiveFrom}
                      onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-600">When the policy becomes effective</p>
                  </div>

                  {/* Effective To */}
                  <div>
                    <label htmlFor="effectiveTo" className="block text-sm font-semibold text-gray-800 mb-2">
                      Effective To
                    </label>
                    <input
                      type="date"
                      name="effectiveTo"
                      id="effectiveTo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.effectiveTo}
                      onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-600">Leave empty for ongoing policy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}