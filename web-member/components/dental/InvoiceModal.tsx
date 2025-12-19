'use client'

import React from 'react'
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    bookingId: string
    patientName: string
    serviceName: string
    serviceCode: string
    clinicName: string
    clinicAddress: {
      street?: string
      line1?: string
      city: string
      state: string
      pincode: string
    }
    clinicContact: string
    appointmentDate: string
    appointmentTime: string
    billAmount: number
    copayAmount: number
    insurancePayment: number
    excessAmount: number
    walletDebitAmount: number
    totalMemberPayment: number
    paymentMethod: string
    paymentStatus: string
    invoiceId?: string
    invoiceGenerated?: boolean
  } | null
}

export default function InvoiceModal({ isOpen, onClose, booking }: InvoiceModalProps) {
  if (!isOpen || !booking) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleDownloadInvoice = async () => {
    try {
      console.log('[InvoiceModal] Downloading invoice for:', booking.bookingId)

      // Fetch the PDF from the backend
      const response = await fetch(`/api/dental-bookings/${booking.bookingId}/invoice`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to download invoice' }))
        throw new Error(error.message || 'Failed to download invoice')
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `Invoice-${booking.invoiceId || booking.bookingId}.pdf`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('[InvoiceModal] Invoice downloaded successfully')
    } catch (error) {
      console.error('[InvoiceModal] Error downloading invoice:', error)
      alert('Failed to download invoice: ' + (error as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Dental Service Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="text-center pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Invoice ID</div>
            <div className="text-lg font-semibold text-gray-900">
              {booking.invoiceId || 'INV-' + booking.bookingId}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Booking ID: {booking.bookingId}
            </div>
          </div>

          {/* Service Provider & Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Provider */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Service Provider</div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="font-medium text-gray-900">{booking.clinicName}</div>
                <div>
                  {booking.clinicAddress.street || booking.clinicAddress.line1}
                </div>
                <div>
                  {booking.clinicAddress.city}, {booking.clinicAddress.state} - {booking.clinicAddress.pincode}
                </div>
                <div>Contact: {booking.clinicContact || 'N/A'}</div>
              </div>
            </div>

            {/* Patient Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Patient Details</div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">Name:</span> {booking.patientName}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Appointment Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Service:</span>{' '}
                <span className="text-gray-600">{booking.serviceName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Service Code:</span>{' '}
                <span className="text-gray-600">{booking.serviceCode}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>{' '}
                <span className="text-gray-600">{formatDate(booking.appointmentDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time:</span>{' '}
                <span className="text-gray-600">{booking.appointmentTime}</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-700">Payment Breakdown</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Bill Amount</span>
                <span className="font-medium text-gray-900">₹{booking.billAmount.toFixed(2)}</span>
              </div>

              {booking.copayAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Copay Amount</span>
                  <span className="font-medium text-gray-900">₹{booking.copayAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Insurance Coverage (Wallet)</span>
                <span className="font-medium text-green-600">-₹{booking.insurancePayment.toFixed(2)}</span>
              </div>

              {booking.excessAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Excess Amount (Beyond Limit)</span>
                  <span className="font-medium text-gray-900">₹{booking.excessAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Member Payment</span>
                  <span className="font-semibold text-green-600 text-lg">
                    ₹{booking.totalMemberPayment.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{booking.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${
                    booking.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-center text-gray-500 pt-4 border-t border-gray-100">
            This is a system-generated invoice for dental services.
            <br />
            For queries, contact the clinic.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={handleDownloadInvoice}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
