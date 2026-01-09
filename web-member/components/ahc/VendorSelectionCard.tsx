'use client'

import { BuildingStorefrontIcon, MapPinIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  pricing: Array<{
    serviceId: string
    serviceName: string
    serviceCode: string
    actualPrice: number
    discountedPrice: number
  }>
  totalActualPrice: number
  totalDiscountedPrice: number
  totalWithHomeCollection: number
}

interface VendorSelectionCardProps {
  vendor: Vendor
  isSelected: boolean
  onSelect: () => void
  showPricing?: boolean
}

export function VendorSelectionCard({ vendor, isSelected, onSelect, showPricing = true }: VendorSelectionCardProps) {
  return (
    <label
      className={`
        block rounded-xl border-2 p-4 cursor-pointer transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Radio Button */}
        <input
          type="radio"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
        />

        {/* Vendor Details */}
        <div className="flex-1">
          {/* Vendor Name */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#0E51A2' }} />
              <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
            </div>
            {isSelected && (
              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
          </div>

          {/* Vendor Code */}
          <div className="text-xs text-gray-500 mb-3">
            Code: {vendor.code}
          </div>

          {/* Services */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Includes {vendor.pricing.length} test{vendor.pricing.length > 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-1">
              {vendor.pricing.slice(0, 3).map((item) => (
                <span
                  key={item.serviceId}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                >
                  {item.serviceName}
                </span>
              ))}
              {vendor.pricing.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  +{vendor.pricing.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Pricing (if enabled) */}
          {showPricing && (
            <div className="rounded-lg p-3 border" style={{
              background: isSelected ? 'rgba(14, 81, 162, 0.05)' : '#f9fafb',
              borderColor: isSelected ? 'rgba(14, 81, 162, 0.2)' : '#e5e7eb'
            }}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-600">Total Price</div>
                  <div className="font-semibold text-gray-900">
                    ₹{vendor.totalDiscountedPrice.toLocaleString()}
                  </div>
                </div>
                {vendor.homeCollection && (
                  <div>
                    <div className="text-gray-600">Home Collection</div>
                    <div className="font-semibold text-gray-900">
                      {vendor.homeCollectionCharges > 0
                        ? `+₹${vendor.homeCollectionCharges}`
                        : 'Free'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collection Options */}
          <div className="mt-3 flex gap-2">
            {vendor.homeCollection && (
              <span className="px-2 py-1 text-xs rounded-md bg-green-100 text-green-700 font-medium">
                Home Collection Available
              </span>
            )}
            {vendor.centerVisit && (
              <span className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-700 font-medium">
                Center Visit Available
              </span>
            )}
          </div>
        </div>
      </div>
    </label>
  )
}
