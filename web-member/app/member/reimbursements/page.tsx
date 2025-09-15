'use client'

import { useState } from 'react'
import { Card } from '../../../components/Card'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  CurrencyDollarIcon,
  DocumentPlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function ReimbursementsPage() {
  const [activeTab, setActiveTab] = useState('claims')
  const [showNewClaim, setShowNewClaim] = useState(false)
  const [claimStep, setClaimStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Dummy data
  const claims = [
    {
      id: 'CLM-2024-001',
      date: '2024-01-15',
      type: 'OPD Consultation',
      provider: 'Apollo Clinic',
      amount: 1500,
      status: 'approved',
      approvedAmount: 1500,
      submittedOn: '2024-01-15',
      processedOn: '2024-01-17'
    },
    {
      id: 'CLM-2024-002',
      date: '2024-01-12',
      type: 'Lab Tests',
      provider: 'PathLab Diagnostics',
      amount: 3500,
      status: 'pending',
      submittedOn: '2024-01-12',
    },
    {
      id: 'CLM-2024-003',
      date: '2024-01-10',
      type: 'Pharmacy',
      provider: 'MedPlus',
      amount: 2300,
      status: 'processing',
      submittedOn: '2024-01-10',
    },
    {
      id: 'CLM-2024-004',
      date: '2024-01-08',
      type: 'Dental',
      provider: 'SmileCare Dental',
      amount: 5000,
      status: 'rejected',
      rejectionReason: 'Documents incomplete',
      submittedOn: '2024-01-08',
      processedOn: '2024-01-09'
    },
    {
      id: 'CLM-2024-005',
      date: '2024-01-05',
      type: 'Vision',
      provider: 'Eye Care Center',
      amount: 3000,
      status: 'approved',
      approvedAmount: 2800,
      submittedOn: '2024-01-05',
      processedOn: '2024-01-07'
    }
  ]

  const statistics = {
    totalClaimed: 15300,
    totalApproved: 7300,
    totalPending: 5800,
    totalRejected: 2200,
    successRate: 72
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          claim.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          claim.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || claim.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const renderClaimWizard = () => {
    const steps = [
      { number: 1, title: 'Select Type', completed: claimStep > 1 },
      { number: 2, title: 'Enter Details', completed: claimStep > 2 },
      { number: 3, title: 'Upload Documents', completed: claimStep > 3 },
      { number: 4, title: 'Review & Submit', completed: claimStep > 4 }
    ]

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Reimbursement Claim</h2>
              <button
                onClick={() => {
                  setShowNewClaim(false)
                  setClaimStep(1)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500 text-white' :
                      claimStep === step.number ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step.completed ? <CheckCircleIcon className="h-5 w-5" /> : step.number}
                    </div>
                    <p className={`ml-2 text-sm ${
                      claimStep === step.number ? 'font-semibold text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-12 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {claimStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Claim Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['OPD', 'IPD', 'Diagnostics', 'Pharmacy', 'Dental', 'Vision'].map((type) => (
                    <button
                      key={type}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{type}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {claimStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Claim Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                    <input type="text" placeholder="Hospital/Clinic name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Amount (₹)</label>
                    <input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                    <input type="text" placeholder="Invoice/Bill number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Description</label>
                  <textarea rows={3} placeholder="Brief description of treatment" className="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
                </div>
              </div>
            )}

            {claimStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <DocumentPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop files here or click to browse</p>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Choose Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG up to 5MB each</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Required Documents:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Original bills/invoices</li>
                    <li>• Prescription (if applicable)</li>
                    <li>• Diagnostic reports (if applicable)</li>
                    <li>• Discharge summary (for IPD)</li>
                  </ul>
                </div>
              </div>
            )}

            {claimStep === 4 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Claim Type:</span>
                    <span className="text-sm font-medium text-gray-900">OPD Consultation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Treatment Date:</span>
                    <span className="text-sm font-medium text-gray-900">2024-01-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Provider:</span>
                    <span className="text-sm font-medium text-gray-900">Apollo Clinic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bill Amount:</span>
                    <span className="text-sm font-medium text-gray-900">₹2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Documents:</span>
                    <span className="text-sm font-medium text-gray-900">3 files uploaded</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    By submitting this claim, you confirm that all information provided is accurate and complete.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                onClick={() => setClaimStep(Math.max(1, claimStep - 1))}
                className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                  claimStep === 1 ? 'invisible' : ''
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (claimStep === 4) {
                    setShowNewClaim(false)
                    setClaimStep(1)
                  } else {
                    setClaimStep(claimStep + 1)
                  }
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {claimStep === 4 ? 'Submit Claim' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
          <p className="text-gray-500 mt-1">Submit and track your reimbursement claims</p>
        </div>
        <button
          onClick={() => setShowNewClaim(true)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Claim
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Claimed</p>
              <p className="text-xl font-bold text-gray-900 mt-1">₹{statistics.totalClaimed.toLocaleString()}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-green-600 mt-1">₹{statistics.totalApproved.toLocaleString()}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">₹{statistics.totalPending.toLocaleString()}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-red-600 mt-1">₹{statistics.totalRejected.toLocaleString()}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{statistics.successRate}%</p>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-blue-300" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'claims'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Claims
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drafts'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Drafts (2)
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Claims List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Claim ID</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Provider</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="py-3 text-sm text-gray-600">{claim.type}</td>
                  <td className="py-3 text-sm text-gray-600">{claim.provider}</td>
                  <td className="py-3 text-sm text-gray-600">{claim.date}</td>
                  <td className="py-3 text-sm text-right font-medium text-gray-900">₹{claim.amount.toLocaleString()}</td>
                  <td className="py-3">
                    <StatusBadge status={claim.status} size="xs" />
                  </td>
                  <td className="py-3">
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Claim Wizard Modal */}
      {showNewClaim && renderClaimWizard()}
    </div>
  )
}