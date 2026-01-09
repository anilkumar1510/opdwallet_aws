'use client'

import { BeakerIcon, BuildingOfficeIcon, CalendarIcon, ClockIcon, MapPinIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BookingDetails {
  vendorName: string
  date: string
  time: string
  collectionType: string
  collectionAddress?: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
  }
  pricing: Array<{
    serviceName: string
    discountedPrice: number
  }>
  totalDiscountedPrice: number
  homeCollectionCharges: number
}

interface AHCBookingSummaryProps {
  packageName: string
  labBooking?: BookingDetails
  diagnosticBooking?: BookingDetails
  pricing: {
    labTotal: number
    diagnosticTotal: number
    homeCollectionCharges: number
    subtotal: number
    copayAmount: number
    walletDeduction: number
    finalPayable: number
  }
}

export function AHCBookingSummary({ packageName, labBooking, diagnosticBooking, pricing }: AHCBookingSummaryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Package Header */}
      <div className="rounded-xl p-4 border-2" style={{
        background: 'linear-gradient(243.73deg, rgba(144, 234, 169, 0.15) -12.23%, rgba(95, 161, 113, 0.15) 94.15%)',
        borderColor: 'rgba(95, 161, 113, 0.3)'
      }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#0E51A2' }}>
          {packageName}
        </h2>
        <p className="text-sm text-gray-600">Annual Health Check Package</p>
      </div>

      {/* Lab Booking Details - Only show if lab booking exists */}
      {labBooking && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <BeakerIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
            <h3 className="font-semibold text-gray-900">Lab Tests</h3>
          </div>

          <div className="space-y-3">
            {/* Vendor */}
            <div className="flex items-start gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">Lab Partner</div>
                <div className="text-sm font-medium text-gray-900">{labBooking.vendorName}</div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex gap-4">
              <div className="flex items-start gap-2 flex-1">
                <CalendarIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(labBooking.date)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 flex-1">
                <ClockIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Time</div>
                  <div className="text-sm font-medium text-gray-900">{labBooking.time}</div>
                </div>
              </div>
            </div>

            {/* Collection Type */}
            <div className="flex items-start gap-2">
            {labBooking.collectionType === 'HOME_COLLECTION' ? (
              <HomeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            ) : (
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-xs text-gray-600">Collection Type</div>
              <div className="text-sm font-medium text-gray-900">
                {labBooking.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Center Visit'}
              </div>
            </div>
          </div>

          {/* Address for Home Collection */}
          {labBooking.collectionType === 'HOME_COLLECTION' && labBooking.collectionAddress && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">Collection Address</div>
                <div className="text-sm text-gray-900">
                  <div>{labBooking.collectionAddress.fullName} • {labBooking.collectionAddress.phone}</div>
                  <div>{labBooking.collectionAddress.addressLine1}</div>
                  {labBooking.collectionAddress.addressLine2 && <div>{labBooking.collectionAddress.addressLine2}</div>}
                  <div>{labBooking.collectionAddress.city}, {labBooking.collectionAddress.state} - {labBooking.collectionAddress.pincode}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tests */}
          <div>
            <div className="text-xs text-gray-600 mb-1">{labBooking.pricing.length} Lab Test{labBooking.pricing.length > 1 ? 's' : ''}</div>
            <div className="space-y-1">
              {labBooking.pricing.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-700">{item.serviceName}</span>
                  <span className="text-gray-900 font-medium">₹{item.discountedPrice}</span>
                </div>
              ))}
              {labBooking.pricing.length > 3 && (
                <div className="text-xs text-gray-500 italic">+{labBooking.pricing.length - 3} more tests</div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Diagnostic Booking Details */}
      {diagnosticBooking && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <BeakerIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
            <h3 className="font-semibold text-gray-900">Diagnostic Tests</h3>
          </div>

          <div className="space-y-3">
            {/* Vendor */}
            <div className="flex items-start gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">Diagnostic Center</div>
                <div className="text-sm font-medium text-gray-900">{diagnosticBooking.vendorName}</div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex gap-4">
              <div className="flex items-start gap-2 flex-1">
                <CalendarIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(diagnosticBooking.date)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 flex-1">
                <ClockIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Time</div>
                  <div className="text-sm font-medium text-gray-900">{diagnosticBooking.time}</div>
                </div>
              </div>
            </div>

            {/* Collection Type */}
            <div className="flex items-start gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">Visit Type</div>
                <div className="text-sm font-medium text-gray-900">Center Visit</div>
              </div>
            </div>

            {/* Tests */}
            <div>
              <div className="text-xs text-gray-600 mb-1">{diagnosticBooking.pricing.length} Diagnostic Test{diagnosticBooking.pricing.length > 1 ? 's' : ''}</div>
              <div className="space-y-1">
                {diagnosticBooking.pricing.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-700">{item.serviceName}</span>
                    <span className="text-gray-900 font-medium">₹{item.discountedPrice}</span>
                  </div>
                ))}
                {diagnosticBooking.pricing.length > 3 && (
                  <div className="text-xs text-gray-500 italic">+{diagnosticBooking.pricing.length - 3} more tests</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Breakdown */}
      <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Lab Tests Total</span>
            <span className="text-gray-900 font-medium">₹{pricing.labTotal.toLocaleString()}</span>
          </div>

          {diagnosticBooking && (
            <div className="flex justify-between">
              <span className="text-gray-600">Diagnostic Tests Total</span>
              <span className="text-gray-900 font-medium">₹{pricing.diagnosticTotal.toLocaleString()}</span>
            </div>
          )}

          {pricing.homeCollectionCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Home Collection Charges</span>
              <span className="text-gray-900 font-medium">₹{pricing.homeCollectionCharges.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-gray-200 my-2"></div>

          <div className="flex justify-between font-medium">
            <span className="text-gray-900">Subtotal</span>
            <span className="text-gray-900">₹{pricing.subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>Wallet Deduction</span>
            <span>-₹{pricing.walletDeduction.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-orange-600">
            <span>Copay (Member Pays)</span>
            <span>₹{pricing.copayAmount.toLocaleString()}</span>
          </div>

          <div className="border-t-2 border-gray-300 my-2"></div>

          <div className="flex justify-between text-lg font-bold">
            <span style={{ color: '#0E51A2' }}>Amount to Pay</span>
            <span style={{ color: '#0E51A2' }}>₹{pricing.finalPayable.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="rounded-xl p-3 bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This is a one-time annual health check benefit.
          Once booked, you cannot book again in the same policy year.
        </p>
      </div>
    </div>
  )
}
