'use client'

import { useState } from 'react'
import RelationshipMasters from './components/RelationshipMasters'
import SpecialtiesMasters from './components/SpecialtiesMasters'

type Tab = 'relationships' | 'specialties'

export default function MastersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('relationships')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Master Data Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage relationship types and doctor specialties
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('relationships')}
            className={`${
              activeTab === 'relationships'
                ? 'border-yellow-400 text-yellow-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Relationship Masters
          </button>
          <button
            onClick={() => setActiveTab('specialties')}
            className={`${
              activeTab === 'specialties'
                ? 'border-yellow-400 text-yellow-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Specialties
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'relationships' && <RelationshipMasters />}
        {activeTab === 'specialties' && <SpecialtiesMasters />}
      </div>
    </div>
  )
}
