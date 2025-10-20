'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        router.push(`/policies/${newPolicy._id}`)
      } else {
        const error = await response.json()
        alert(`Failed to create policy: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Failed to create policy')
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Create New Policy
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure a new insurance policy for the organization.
                </p>
              </div>
            </div>

            <div className="mt-5 md:mt-0 md:col-span-2">
              <form onSubmit={handleSubmit}>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    {/* Policy Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Policy Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Premium Health Plan"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide a detailed description of the policy..."
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status *
                      </label>
                      <select
                        id="status"
                        name="status"
                        required
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>

                    {/* Effective Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="effectiveFrom" className="block text-sm font-medium text-gray-700">
                          Effective From *
                        </label>
                        <input
                          type="date"
                          name="effectiveFrom"
                          id="effectiveFrom"
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          value={formData.effectiveFrom}
                          onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor="effectiveTo" className="block text-sm font-medium text-gray-700">
                          Effective To
                        </label>
                        <input
                          type="date"
                          name="effectiveTo"
                          id="effectiveTo"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                          value={formData.effectiveTo}
                          onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Owner/Payer */}
                    <div>
                      <label htmlFor="ownerPayer" className="block text-sm font-medium text-gray-700">
                        Owner/Payer
                      </label>
                      <select
                        id="ownerPayer"
                        name="ownerPayer"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.ownerPayer}
                        onChange={(e) => setFormData({ ...formData, ownerPayer: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="CORPORATE">Corporate</option>
                        <option value="INSURER">Insurer</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Policy'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}