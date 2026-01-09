'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
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

interface LabBooking {
  vendorName: string
  date: string
  time: string
  collectionType: string
  totalDiscountedPrice: number
  homeCollectionCharges: number
}

export default function AHCDiagnosticBookingPage() {
  const router = useRouter()
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null)
  const [labBooking, setLabBooking] = useState<LabBooking | null>(null)
  const [pincode, setPincode] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
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
      console.log('[AHC Diagnostic] Package from sessionStorage:', packageData)

      if (packageData) {
        setAhcPackage(JSON.parse(packageData))
      } else {
        toast.error('Package information not found')
        router.push('/member/wellness')
        return
      }

      // Get lab booking from sessionStorage (only required if package has lab tests)
      const labData = sessionStorage.getItem('ahc_lab_booking')
      console.log('[AHC Diagnostic] Lab booking from sessionStorage:', labData)

      const packageHasLabTests = JSON.parse(packageData).totalLabTests > 0

      if (packageHasLabTests) {
        // If package has lab tests, lab booking is required
        if (labData) {
          const labBookingData = JSON.parse(labData)
          setLabBooking(labBookingData)
        } else {
          toast.error('Lab booking information not found')
          router.push('/member/ahc/booking')
          return
        }
      } else {
        // If package has only diagnostic tests, lab booking is not required
        console.log('[AHC Diagnostic] Package has no lab tests, skipping lab booking check')
      }

      // Fetch user profile to get pincode
      console.log('[AHC Diagnostic] Fetching user profile...')
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' })
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userData = await userResponse.json()
      console.log('[AHC Diagnostic] User data received:', JSON.stringify(userData, null, 2))

      // Try to get pincode from user.address first, then from address document
      let userPincode = null

      // Check if user has address object with pincode
      if (userData.address && userData.address.pincode) {
        userPincode = userData.address.pincode
        console.log('[AHC Diagnostic] Pincode from user.address:', userPincode)
      }
      // Check if userData has pincode at root level
      else if (userData.pincode) {
        userPincode = userData.pincode
        console.log('[AHC Diagnostic] Pincode from user.pincode:', userPincode)
      }
      // Check if there's an Address document populated
      else if (userData.Address && userData.Address.pincode) {
        userPincode = userData.Address.pincode
        console.log('[AHC Diagnostic] Pincode from user.Address:', userPincode)
      }

      console.log('[AHC Diagnostic] Final pincode:', userPincode)

      if (!userPincode) {
        console.error('[AHC Diagnostic] No pincode found in user data')
        toast.error('No pincode found in your profile. Please update your profile.')
        setLoading(false)
        return
      }

      setPincode(userPincode)

      console.log('[AHC Diagnostic] Calling fetchVendorsWithPincode with pincode:', userPincode)
      // Auto-fetch vendors with user's pincode
      await fetchVendorsWithPincode(userPincode)
    } catch (error) {
      console.error('[AHC Diagnostic] Error loading initial data:', error)
      toast.error('Failed to load booking information')
      setLoading(false)
    }
  }

  const fetchVendorsWithPincode = async (pincodeValue: string) => {
    try {
      setLoading(true)
      const url = `/api/member/ahc/vendors/diagnostic?pincode=${pincodeValue}`
      console.log('[AHC Diagnostic] Fetching vendors from:', url)

      const response = await fetch(url, {
        credentials: 'include'
      })

      console.log('[AHC Diagnostic] Vendors API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AHC Diagnostic] Vendors API error:', errorText)
        throw new Error('Failed to fetch vendors')
      }

      const data = await response.json()
      console.log('[AHC Diagnostic] Vendors API response data:', data)
      setVendors(data.data || [])

      if (data.data && data.data.length === 0) {
        console.log('[AHC Diagnostic] No vendors found for pincode:', pincodeValue)
        toast.info('No diagnostic vendors available in your area')
      } else {
        console.log('[AHC Diagnostic] Found vendors:', data.data?.length)
      }
    } catch (error) {
      console.error('[AHC Diagnostic] Error fetching vendors:', error)
      toast.error('Failed to load diagnostic vendors')
    } finally {
      setLoading(false)
    }
  }

  const selectedVendor = vendors.find((v) => v.vendorId === selectedVendorId)

  const canProceed = selectedVendorId && selectedSlotId

  const handleProceed = () => {
    console.log('[AHC Diagnostic] handleProceed called')
    console.log('[AHC Diagnostic] canProceed:', canProceed)
    console.log('[AHC Diagnostic] selectedVendor:', selectedVendor)

    if (!canProceed || !selectedVendor) {
      console.log('[AHC Diagnostic] Returning early - canProceed or selectedVendor is missing')
      return
    }

    // Store diagnostic booking data in sessionStorage
    const diagnosticBookingData = {
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      slotId: selectedSlotId,
      date: selectedDate,
      time: selectedTime,
      collectionType: 'CENTER_VISIT', // Diagnostics always center visit
      pricing: selectedVendor.pricing,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: 0,
    }

    console.log('[AHC Diagnostic] Storing diagnostic booking data:', JSON.stringify(diagnosticBookingData, null, 2))
    sessionStorage.setItem('ahc_diagnostic_booking', JSON.stringify(diagnosticBookingData))

    // Navigate to payment
    console.log('[AHC Diagnostic] Navigating to payment page: /member/ahc/booking/payment')
    router.push('/member/ahc/booking/payment')
    console.log('[AHC Diagnostic] router.push called')
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
            <Link href="/member/ahc/booking">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Book Diagnostic Tests</h1>
              <p className="text-xs lg:text-sm text-gray-600">
                Step {labBooking ? '2' : '1'} of {labBooking ? '3' : '2'}: Select Diagnostic Vendor
              </p>
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
            {ahcPackage.totalDiagnosticTests} Diagnostic Test{ahcPackage.totalDiagnosticTests > 1 ? 's' : ''} included
          </p>
        </div>

        {/* Lab Booking Summary - Only show if lab booking exists */}
        {labBooking && (
          <div className="rounded-xl p-4 bg-green-50 border border-green-200">
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Lab Tests Booked</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {labBooking.vendorName} • {labBooking.date} • {labBooking.time}
                </p>
                <p className="text-xs text-gray-600">
                  {labBooking.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Center Visit'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pincode Display */}
        {pincode && (
          <div className="rounded-xl p-4 bg-white border border-gray-200">
            <p className="text-xs text-gray-500">
              Showing diagnostic centers for pincode: <span className="font-medium text-gray-900">{pincode}</span>
            </p>
          </div>
        )}

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
              Available Diagnostic Centers ({vendors.length})
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
              No diagnostic centers available in your area for pincode <span className="font-semibold">{pincode}</span>.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Please contact support or try again later.
            </p>
          </div>
        )}

        {/* Info Note */}
        {selectedVendor && (
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Diagnostic tests are always conducted at the center.
              Home collection is not available for diagnostic services.
            </p>
          </div>
        )}

        {/* Slot Selection */}
        {selectedVendor && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Date & Time</h3>
            <AHCSlotSelector
              vendorId={selectedVendor.vendorId}
              vendorType="diagnostic"
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
            Proceed to Payment
          </button>
        )}
      </div>
    </div>
  )
}
