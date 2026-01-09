'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, HomeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { VendorSelectionCard } from '@/components/ahc/VendorSelectionCard'
import { AHCSlotSelector } from '@/components/ahc/AHCSlotSelector'

interface AHCPackage {
  _id: string
  packageId: string
  name: string
  totalLabTests: number
  totalDiagnosticTests: number
}

interface Vendor {
  _id: string
  vendorId: string
  name: string
  code: string
  homeCollection: boolean
  centerVisit: boolean
  homeCollectionCharges: number
  pricing: any[]
  totalActualPrice: number
  totalDiscountedPrice: number
  totalWithHomeCollection: number
}

interface CollectionAddress {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  pincode: string
  city: string
  state: string
}

export default function AHCLabBookingPage() {
  const router = useRouter()
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null)
  const [pincode, setPincode] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'CENTER_VISIT'>('CENTER_VISIT')
  const [collectionAddress, setCollectionAddress] = useState<CollectionAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: '',
  })
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Get package from sessionStorage
      const packageData = sessionStorage.getItem('ahc_package')
      console.log('[AHC Booking] Package from sessionStorage:', packageData)

      if (packageData) {
        setAhcPackage(JSON.parse(packageData))
      } else {
        toast.error('Package information not found')
        router.push('/member/wellness')
        return
      }

      // Fetch user profile to get pincode
      console.log('[AHC Booking] Fetching user profile...')
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' })
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userData = await userResponse.json()
      console.log('[AHC Booking] User data received:', JSON.stringify(userData, null, 2))

      // Try to get pincode from user.address first, then from address document
      let userPincode = null

      // Check if user has address object with pincode
      if (userData.address && userData.address.pincode) {
        userPincode = userData.address.pincode
        console.log('[AHC Booking] Pincode from user.address:', userPincode)
      }
      // Check if userData has pincode at root level
      else if (userData.pincode) {
        userPincode = userData.pincode
        console.log('[AHC Booking] Pincode from user.pincode:', userPincode)
      }
      // Check if there's an Address document populated
      else if (userData.Address && userData.Address.pincode) {
        userPincode = userData.Address.pincode
        console.log('[AHC Booking] Pincode from user.Address:', userPincode)
      }

      console.log('[AHC Booking] Final pincode:', userPincode)

      if (!userPincode) {
        console.error('[AHC Booking] No pincode found in user data')
        toast.error('No pincode found in your profile. Please update your profile.')
        setLoading(false)
        return
      }

      setPincode(userPincode)
      setCollectionAddress({
        fullName: `${userData.name?.firstName || ''} ${userData.name?.lastName || ''}`.trim(),
        phone: userData.phone || userData.mobile || '',
        addressLine1: userData.address?.line1 || userData.address?.addressLine1 || '',
        addressLine2: userData.address?.line2 || userData.address?.addressLine2 || '',
        pincode: userPincode,
        city: userData.address?.city || '',
        state: userData.address?.state || '',
      })

      console.log('[AHC Booking] Calling fetchVendorsWithPincode with pincode:', userPincode)
      // Auto-fetch vendors with user's pincode
      await fetchVendorsWithPincode(userPincode)
    } catch (error) {
      console.error('[AHC Booking] Error loading initial data:', error)
      toast.error('Failed to load booking information')
      setLoading(false)
    }
  }

  const fetchVendorsWithPincode = async (pincodeValue: string) => {
    try {
      setLoading(true)
      const url = `/api/member/ahc/vendors/lab?pincode=${pincodeValue}`
      console.log('[AHC Booking] Fetching vendors from:', url)

      const response = await fetch(url, {
        credentials: 'include'
      })

      console.log('[AHC Booking] Vendors API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AHC Booking] Vendors API error:', errorText)
        throw new Error('Failed to fetch vendors')
      }

      const data = await response.json()
      console.log('[AHC Booking] Vendors API response data:', data)
      setVendors(data.data || [])

      if (data.data && data.data.length === 0) {
        console.log('[AHC Booking] No vendors found for pincode:', pincodeValue)
        toast.info('No vendors available in your area')
      } else {
        console.log('[AHC Booking] Found vendors:', data.data?.length)
      }
    } catch (error) {
      console.error('[AHC Booking] Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }


  const selectedVendor = vendors.find((v) => v.vendorId === selectedVendorId)

  const canProceed = selectedVendorId && selectedSlotId && (collectionType === 'CENTER_VISIT' || (
    collectionAddress.fullName &&
    collectionAddress.phone &&
    collectionAddress.addressLine1 &&
    collectionAddress.city &&
    collectionAddress.state
  ))

  const handleProceed = () => {
    if (!canProceed || !selectedVendor) return

    // Store lab booking data in sessionStorage
    const labBookingData = {
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      slotId: selectedSlotId,
      date: selectedDate,
      time: selectedTime,
      collectionType,
      collectionAddress: collectionType === 'HOME_COLLECTION' ? collectionAddress : undefined,
      pricing: selectedVendor.pricing,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: collectionType === 'HOME_COLLECTION' ? selectedVendor.homeCollectionCharges : 0,
    }

    sessionStorage.setItem('ahc_lab_booking', JSON.stringify(labBookingData))

    // Navigate to diagnostic booking or payment
    if (ahcPackage && ahcPackage.totalDiagnosticTests > 0) {
      router.push('/member/ahc/booking/diagnostic')
    } else {
      router.push('/member/ahc/booking/payment')
    }
  }

  if (!ahcPackage && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/member/wellness">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Book Lab Tests</h1>
              <p className="text-xs lg:text-sm text-gray-600">Step 1 of {ahcPackage.totalDiagnosticTests > 0 ? '3' : '2'}: Select Lab Vendor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-3xl px-4 lg:px-6 py-6 space-y-6">
        {/* Package Summary */}
        <div className="rounded-xl p-4 bg-white border border-gray-200">
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#0E51A2' }}>
            {ahcPackage.name}
          </h2>
          <p className="text-xs text-gray-600">
            {ahcPackage.totalLabTests} Lab Test{ahcPackage.totalLabTests > 1 ? 's' : ''} included
          </p>
          {pincode && (
            <p className="text-xs text-gray-500 mt-2">
              Showing vendors for pincode: <span className="font-medium">{pincode}</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Vendors List */}
        {!loading && vendors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Available Vendors ({vendors.length})
            </h3>
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <VendorSelectionCard
                  key={vendor.vendorId}
                  vendor={vendor}
                  isSelected={selectedVendorId === vendor.vendorId}
                  onSelect={() => setSelectedVendorId(vendor.vendorId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Vendors Found */}
        {!loading && vendors.length === 0 && pincode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-700">
              No vendors available in your area for pincode <span className="font-semibold">{pincode}</span>.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Please contact support or try again later.
            </p>
          </div>
        )}

        {/* Collection Type Selection */}
        {selectedVendor && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Collection Type</h3>

            <div className="space-y-2">
              {selectedVendor.centerVisit && (
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${collectionType === 'CENTER_VISIT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}>
                  <input
                    type="radio"
                    name="collectionType"
                    value="CENTER_VISIT"
                    checked={collectionType === 'CENTER_VISIT'}
                    onChange={() => setCollectionType('CENTER_VISIT')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <BuildingOfficeIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Visit Center</div>
                    <div className="text-xs text-gray-600">Visit the lab center for sample collection</div>
                  </div>
                </label>
              )}

              {selectedVendor.homeCollection && (
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${collectionType === 'HOME_COLLECTION' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}>
                  <input
                    type="radio"
                    name="collectionType"
                    value="HOME_COLLECTION"
                    checked={collectionType === 'HOME_COLLECTION'}
                    onChange={() => setCollectionType('HOME_COLLECTION')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <HomeIcon className="w-5 h-5" style={{ color: '#0E51A2' }} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Home Collection</div>
                    <div className="text-xs text-gray-600">
                      Sample collection at your home
                      {selectedVendor.homeCollectionCharges > 0 && ` (+₹${selectedVendor.homeCollectionCharges})`}
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Home Collection Address Form */}
        {selectedVendor && collectionType === 'HOME_COLLECTION' && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Collection Address</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={collectionAddress.fullName}
                  onChange={(e) => setCollectionAddress({ ...collectionAddress, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={collectionAddress.phone}
                  onChange={(e) => setCollectionAddress({ ...collectionAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={collectionAddress.addressLine1}
                  onChange={(e) => setCollectionAddress({ ...collectionAddress, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="House/Flat No, Building Name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={collectionAddress.addressLine2}
                  onChange={(e) => setCollectionAddress({ ...collectionAddress, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street, Locality"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={collectionAddress.city}
                    onChange={(e) => setCollectionAddress({ ...collectionAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={collectionAddress.state}
                    onChange={(e) => setCollectionAddress({ ...collectionAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slot Selection */}
        {selectedVendor && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Date & Time</h3>
            <AHCSlotSelector
              vendorId={selectedVendor.vendorId}
              vendorType="lab"
              pincode={pincode}
              onSlotSelect={(slotId, date, time) => {
                setSelectedSlotId(slotId)
                setSelectedDate(date)
                setSelectedTime(time)
              }}
              selectedSlotId={selectedSlotId || undefined}
            />
          </div>
        )}

        {/* Proceed Button */}
        {selectedVendor && (
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#0E51A2' }}
          >
            {ahcPackage.totalDiagnosticTests > 0 ? 'Proceed to Diagnostic Booking' : 'Proceed to Payment'}
          </button>
        )}
      </div>
    </div>
  )
}
