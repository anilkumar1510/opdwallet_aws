'use client'

import { useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BeakerIcon,
  HeartIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

interface AHCOrder {
  _id: string
  orderId: string
  packageName: string
  patientName: string

  // Lab details
  labOrder: {
    vendorName: string
    collectionDate: string
    collectionTime: string
    collectionType: 'HOME_COLLECTION' | 'CENTER_VISIT'
    collectionAddress?: {
      fullName: string
      phone: string
      addressLine1: string
      addressLine2?: string
      city: string
      state: string
      pincode: string
    }
    items: Array<{
      serviceName: string
      discountedPrice: number
    }>
    totalDiscountedPrice: number
    homeCollectionCharges: number
    reports: Array<{
      fileName: string
      originalName: string
      filePath: string
      uploadedAt: string
    }>
    completedAt?: string
  }

  // Diagnostic details
  diagnosticOrder?: {
    vendorName: string
    appointmentDate: string
    appointmentTime: string
    items: Array<{
      serviceName: string
      discountedPrice: number
    }>
    totalDiscountedPrice: number
    reports: Array<{
      fileName: string
      originalName: string
      filePath: string
      uploadedAt: string
    }>
    completedAt?: string
  }

  // Payment details
  finalAmount: number
  copayAmount: number
  walletDeduction: number
  totalHomeCollectionCharges: number

  // Status
  status: 'PLACED' | 'CONFIRMED' | 'LAB_COMPLETED' | 'DIAGNOSTIC_COMPLETED' | 'COMPLETED' | 'CANCELLED'

  // Timestamps
  placedAt: string
  confirmedAt?: string
  completedAt?: string
  cancelledAt?: string
}

interface AHCOrderCardProps {
  order: AHCOrder
  onViewLabReport?: (reportPath: string, orderId: string) => void
  onViewDiagnosticReport?: (reportPath: string, orderId: string) => void
}

export function AHCOrderCard({ order, onViewLabReport, onViewDiagnosticReport }: AHCOrderCardProps) {
  // Auto-expand sections if reports are available
  const hasLabReportsAvailable = order.labOrder.reports && order.labOrder.reports.length > 0
  const hasDiagnosticReportsAvailable = order.diagnosticOrder?.reports && order.diagnosticOrder.reports.length > 0

  const [isLabExpanded, setIsLabExpanded] = useState(hasLabReportsAvailable)
  const [isDiagnosticExpanded, setIsDiagnosticExpanded] = useState(hasDiagnosticReportsAvailable)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800'
      case 'LAB_COMPLETED':
      case 'DIAGNOSTIC_COMPLETED':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'Pending Collection'
      case 'CONFIRMED':
        return 'Collection Complete'
      case 'LAB_COMPLETED':
        return 'Lab Completed'
      case 'DIAGNOSTIC_COMPLETED':
        return 'Diagnostic Completed'
      case 'COMPLETED':
        return 'Completed'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return status
    }
  }

  const hasLabReports = order.labOrder.reports && order.labOrder.reports.length > 0
  const hasDiagnosticReports = order.diagnosticOrder?.reports && order.diagnosticOrder.reports.length > 0

  // Check if sections should be displayed
  const hasLabTests = order.labOrder.items && order.labOrder.items.length > 0
  const hasDiagnosticTests = order.diagnosticOrder?.items && order.diagnosticOrder.items.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#0E51A2' }}>
              {order.packageName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Order ID: {order.orderId}</p>
            <p className="text-sm text-gray-600">Patient: {order.patientName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
        <p className="text-xs text-gray-500">Booked on {formatDate(order.placedAt)}</p>
      </div>

      {/* Lab Tests Section - Only show if there are lab tests */}
      {hasLabTests && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsLabExpanded(!isLabExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <BeakerIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">Lab Tests</h4>
                  {hasLabReports && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                      Report Available
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {order.labOrder.items.length} test{order.labOrder.items.length > 1 ? 's' : ''} • {order.labOrder.vendorName}
                </p>
              </div>
            </div>
            {isLabExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {isLabExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-600">Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(order.labOrder.collectionDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-600">Time</div>
                    <div className="text-sm font-medium text-gray-900">{order.labOrder.collectionTime}</div>
                  </div>
                </div>
              </div>

              {/* Collection Type */}
              <div className="flex items-center gap-2">
                {order.labOrder.collectionType === 'HOME_COLLECTION' ? (
                  <HomeIcon className="w-4 h-4 text-gray-500" />
                ) : (
                  <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <div className="text-xs text-gray-600">Collection Type</div>
                  <div className="text-sm font-medium text-gray-900">
                    {order.labOrder.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Center Visit'}
                  </div>
                </div>
              </div>

              {/* Address for Home Collection */}
              {order.labOrder.collectionType === 'HOME_COLLECTION' && order.labOrder.collectionAddress && (
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Collection Address</div>
                    <div className="text-sm text-gray-900">
                      <div>{order.labOrder.collectionAddress.fullName} • {order.labOrder.collectionAddress.phone}</div>
                      <div>{order.labOrder.collectionAddress.addressLine1}</div>
                      {order.labOrder.collectionAddress.addressLine2 && (
                        <div>{order.labOrder.collectionAddress.addressLine2}</div>
                      )}
                      <div>
                        {order.labOrder.collectionAddress.city}, {order.labOrder.collectionAddress.state} -{' '}
                        {order.labOrder.collectionAddress.pincode}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tests */}
              <div>
                <div className="text-xs text-gray-600 mb-1">Tests Included</div>
                <div className="space-y-1">
                  {order.labOrder.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-700">{item.serviceName}</span>
                      <span className="text-gray-900 font-medium">₹{item.discountedPrice}</span>
                    </div>
                  ))}
                  {order.labOrder.items.length > 3 && (
                    <div className="text-xs text-gray-500 italic">+{order.labOrder.items.length - 3} more tests</div>
                  )}
                </div>
              </div>

              {/* Lab Reports */}
              {hasLabReports && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Lab Reports</div>
                  <div className="space-y-2">
                    {order.labOrder.reports.map((report, index) => (
                      <button
                        key={index}
                        onClick={() => onViewLabReport?.(report.filePath, order.orderId)}
                        className="w-full flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <DocumentArrowDownIcon className="w-4 h-4 text-green-600" />
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-900">{report.originalName}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded on {formatDate(report.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-green-600 font-medium">View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Tests Section - Only show if there are diagnostic tests */}
      {hasDiagnosticTests && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsDiagnosticExpanded(!isDiagnosticExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <HeartIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">Diagnostic Tests</h4>
                  {hasDiagnosticReports && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                      Report Available
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {order.diagnosticOrder.items.length} test{order.diagnosticOrder.items.length > 1 ? 's' : ''} •{' '}
                  {order.diagnosticOrder.vendorName}
                </p>
              </div>
            </div>
            {isDiagnosticExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {isDiagnosticExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-600">Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(order.diagnosticOrder.appointmentDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-600">Time</div>
                    <div className="text-sm font-medium text-gray-900">{order.diagnosticOrder.appointmentTime}</div>
                  </div>
                </div>
              </div>

              {/* Visit Type */}
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-600">Visit Type</div>
                  <div className="text-sm font-medium text-gray-900">Center Visit</div>
                </div>
              </div>

              {/* Tests */}
              <div>
                <div className="text-xs text-gray-600 mb-1">Tests Included</div>
                <div className="space-y-1">
                  {order.diagnosticOrder.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-700">{item.serviceName}</span>
                      <span className="text-gray-900 font-medium">₹{item.discountedPrice}</span>
                    </div>
                  ))}
                  {order.diagnosticOrder.items.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{order.diagnosticOrder.items.length - 3} more tests
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic Reports */}
              {hasDiagnosticReports && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Diagnostic Reports</div>
                  <div className="space-y-2">
                    {order.diagnosticOrder.reports.map((report, index) => (
                      <button
                        key={index}
                        onClick={() => onViewDiagnosticReport?.(report.filePath, order.orderId)}
                        className="w-full flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <DocumentArrowDownIcon className="w-4 h-4 text-green-600" />
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-900">{report.originalName}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded on {formatDate(report.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-green-600 font-medium">View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Summary */}
      <div className="p-4 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Payment Summary</h4>
        <div className="space-y-1 text-xs">
          {hasLabTests && (
            <div className="flex justify-between">
              <span className="text-gray-600">Lab Tests</span>
              <span className="text-gray-900">₹{order.labOrder.totalDiscountedPrice.toLocaleString()}</span>
            </div>
          )}
          {hasDiagnosticTests && (
            <div className="flex justify-between">
              <span className="text-gray-600">Diagnostic Tests</span>
              <span className="text-gray-900">₹{order.diagnosticOrder.totalDiscountedPrice.toLocaleString()}</span>
            </div>
          )}
          {order.totalHomeCollectionCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Home Collection Charges</span>
              <span className="text-gray-900">₹{order.totalHomeCollectionCharges.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
            <span className="text-gray-900 font-medium">Total Amount</span>
            <span className="text-gray-900 font-medium">₹{order.finalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Wallet Deduction</span>
            <span>-₹{order.walletDeduction.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>Copay (Member Paid)</span>
            <span>₹{order.copayAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
