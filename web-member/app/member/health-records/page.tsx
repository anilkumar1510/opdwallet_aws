'use client'

import { useState } from 'react'
import { ArrowLeftIcon, DocumentTextIcon, CloudArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Card from '@/components/Card'

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState('prescriptions')
  const [searchTerm, setSearchTerm] = useState('')

  const prescriptions = [
    {
      id: 1,
      doctorName: 'Dr. Sharma',
      clinic: 'Apollo Clinic',
      date: '2024-01-15',
      diagnosis: 'Common Cold',
      medicines: ['Paracetamol 500mg', 'Vitamin C', 'Cough Syrup'],
      status: 'Active'
    },
    {
      id: 2,
      doctorName: 'Dr. Patel',
      clinic: 'Max Healthcare',
      date: '2023-12-20',
      diagnosis: 'Hypertension',
      medicines: ['Amlodipine 5mg', 'Aspirin 75mg'],
      status: 'Completed'
    },
    {
      id: 3,
      doctorName: 'Dr. Kumar',
      clinic: 'Fortis Hospital',
      date: '2023-11-10',
      diagnosis: 'Diabetes Type 2',
      medicines: ['Metformin 500mg', 'Glimepiride 1mg'],
      status: 'Active'
    }
  ]

  const bills = [
    {
      id: 1,
      billNumber: 'INV-2024-001',
      provider: 'Apollo Pharmacy',
      date: '2024-01-16',
      amount: '₹850',
      status: 'Paid',
      type: 'Pharmacy'
    },
    {
      id: 2,
      billNumber: 'INV-2024-002',
      provider: 'Dr. Sharma Consultation',
      date: '2024-01-15',
      amount: '₹500',
      status: 'Claimed',
      type: 'Consultation'
    },
    {
      id: 3,
      billNumber: 'INV-2023-156',
      provider: 'SRL Diagnostics',
      date: '2023-12-05',
      amount: '₹2,500',
      status: 'Pending',
      type: 'Lab Test'
    }
  ]

  const filteredPrescriptions = prescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clinic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBills = bills.filter(b =>
    b.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/member" className="mr-4">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Health Records</h1>
            </div>
            <button className="btn-primary text-sm">
              Upload Record
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prescriptions, bills, or providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'prescriptions'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'bills'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bills & Invoices
          </button>
        </div>

        {/* Content */}
        {activeTab === 'prescriptions' ? (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prescription.doctorName}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        prescription.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{prescription.clinic}</p>
                    <p className="text-sm text-gray-500 mb-3">{new Date(prescription.date).toLocaleDateString('en-IN')}</p>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                      <p className="text-sm text-gray-900">{prescription.diagnosis}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Medicines:</p>
                      <ul className="space-y-1">
                        {prescription.medicines.map((medicine, index) => (
                          <li key={index} className="text-sm text-gray-600">• {medicine}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button className="ml-4 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                    <CloudArrowDownIcon className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No prescriptions found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{bill.provider}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        bill.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : bill.status === 'Claimed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{bill.billNumber}</p>
                    <p className="text-sm text-gray-500 mb-2">{new Date(bill.date).toLocaleDateString('en-IN')}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{bill.type}</span>
                      <span className="text-lg font-bold text-brand-600">{bill.amount}</span>
                    </div>
                  </div>
                  <button className="ml-4 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                    <CloudArrowDownIcon className="h-5 w-5" />
                  </button>
                </div>
              </Card>
            ))}

            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bills found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}