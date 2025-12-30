'use client'

import { BeakerIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ServiceDescriptionCardProps {
  type: 'lab' | 'diagnostic'
}

export default function ServiceDescriptionCard({ type }: ServiceDescriptionCardProps) {
  const labServices = [
    'Complete Blood Count (CBC)',
    'Thyroid Function Tests',
    'Liver Function Tests',
    'Kidney Function Tests',
    'Blood Sugar Tests',
    'Lipid Profile',
    'Vitamin D & B12',
    'And many more...'
  ]

  const diagnosticServices = [
    'CT Scan',
    'MRI Scan',
    'X-Ray',
    'Ultrasound',
    'ECG',
    'Mammography',
    'PET Scan',
    'And many more...'
  ]

  const isLab = type === 'lab'
  const services = isLab ? labServices : diagnosticServices

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: '#e8f2fc' }}
        >
          {isLab ? (
            <BeakerIcon className="h-8 w-8" style={{ color: '#0a529f' }} />
          ) : (
            <DocumentMagnifyingGlassIcon className="h-8 w-8" style={{ color: '#0a529f' }} />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isLab ? 'Available Lab Tests' : 'Available Diagnostic Services'}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isLab
              ? 'Get accurate and timely lab test results from certified laboratories'
              : 'Access advanced diagnostic imaging services from certified centers'}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {services.map((service, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: '#0a529f' }}
                />
                <span className="text-sm text-gray-700">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
