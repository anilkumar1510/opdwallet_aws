'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AHCBookingSummary } from '@/components/ahc/AHCBookingSummary'
import PaymentProcessor from '@/components/PaymentProcessor'

interface AHCPackage {
  _id: string
  packageId: string
  name: string
}

interface BookingData {
  vendorId: string
  vendorName: string
  slotId: string
  date: string
  time: string
  collectionType: string
  collectionAddress?: any
  pricing: any[]
  totalDiscountedPrice: number
  homeCollectionCharges: number
}

export default function AHCPaymentPage() {
  console.log('===============================================')
  console.log('[AHC Payment] AHCPaymentPage component loading')
  console.log('[AHC Payment] Current URL:', window.location.href)
  console.log('===============================================')

  const router = useRouter()
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null)
  const [labBooking, setLabBooking] = useState<BookingData | null>(null)
  const [diagnosticBooking, setDiagnosticBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')

  useEffect(() => {
    console.log('[AHC Payment] useEffect triggered - calling loadBookingData and fetchUserData')
    loadBookingData()
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch user data')

      const userData = await response.json()
      setUserId(userData._id)

      // For AHC, typically booking for self
      setPatientId(userData._id)
      setPatientName(`${userData.name.firstName} ${userData.name.lastName}`)
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load user data')
    }
  }

  const loadBookingData = () => {
    try {
      // Get package from sessionStorage
      const packageData = sessionStorage.getItem('ahc_package')
      if (!packageData) {
        toast.error('Package information not found')
        router.push('/member/wellness')
        return
      }
      const packageInfo = JSON.parse(packageData)
      setAhcPackage(packageInfo)

      const packageHasLabTests = packageInfo.totalLabTests > 0
      const packageHasDiagnosticTests = packageInfo.totalDiagnosticTests > 0

      console.log('[AHC Payment] Package info:', JSON.stringify(packageInfo, null, 2))
      console.log('[AHC Payment] packageHasLabTests:', packageHasLabTests)
      console.log('[AHC Payment] packageHasDiagnosticTests:', packageHasDiagnosticTests)

      // Get lab booking (required if package has lab tests)
      const labData = sessionStorage.getItem('ahc_lab_booking')
      console.log('[AHC Payment] Lab booking data from sessionStorage:', labData)

      if (packageHasLabTests) {
        if (!labData) {
          console.log('[AHC Payment] Package has lab tests but no lab booking data found - redirecting to lab booking')
          toast.error('Lab booking information not found')
          router.push('/member/ahc/booking')
          return
        }
        setLabBooking(JSON.parse(labData))
      } else {
        console.log('[AHC Payment] Package has no lab tests - skipping lab booking requirement')
      }

      // Get diagnostic booking (required if package has diagnostic tests)
      const diagnosticData = sessionStorage.getItem('ahc_diagnostic_booking')
      console.log('[AHC Payment] Diagnostic booking data from sessionStorage:', diagnosticData)

      if (packageHasDiagnosticTests) {
        if (!diagnosticData) {
          console.log('[AHC Payment] Package has diagnostic tests but no diagnostic booking data found - redirecting to diagnostic booking')
          toast.error('Diagnostic booking information not found')
          router.push('/member/ahc/booking/diagnostic')
          return
        }
        setDiagnosticBooking(JSON.parse(diagnosticData))
      } else {
        console.log('[AHC Payment] Package has no diagnostic tests - skipping diagnostic booking requirement')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading booking data:', error)
      toast.error('Failed to load booking information')
      router.push('/member/wellness')
    }
  }

  const calculatePricing = () => {
    // Handle cases where lab or diagnostic booking might be null
    if (!labBooking && !diagnosticBooking) {
      return {
        labTotal: 0,
        diagnosticTotal: 0,
        homeCollectionCharges: 0,
        subtotal: 0,
        copayAmount: 0,
        walletDeduction: 0,
        finalPayable: 0,
      }
    }

    const labTotal = labBooking?.totalDiscountedPrice || 0
    const diagnosticTotal = diagnosticBooking?.totalDiscountedPrice || 0
    const homeCollectionCharges = (labBooking?.homeCollectionCharges || 0) + (diagnosticBooking?.homeCollectionCharges || 0)
    const subtotal = labTotal + diagnosticTotal + homeCollectionCharges

    // NOTE: Actual copay calculation will be done server-side
    // This is just for display purposes - using placeholder 20%
    const copayAmount = Math.round(subtotal * 0.2)
    const walletDeduction = subtotal - copayAmount
    const finalPayable = copayAmount

    return {
      labTotal,
      diagnosticTotal,
      homeCollectionCharges,
      subtotal,
      copayAmount,
      walletDeduction,
      finalPayable,
    }
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    console.log('[AHCPayment] Payment created successfully:', paymentId)

    if (!ahcPackage || (!labBooking && !diagnosticBooking)) {
      toast.error('Booking data not found')
      return
    }

    const pricing = calculatePricing()

    // Store complete booking data in sessionStorage as pendingBooking
    // This will be used by handleMarkAsPaid in payments/[paymentId]/page.tsx
    const pendingBooking = {
      serviceType: 'AHC',
      patientId: patientId,
      patientName: patientName,
      consultationFee: pricing.subtotal,
      serviceDetails: {
        packageId: ahcPackage.packageId,
        packageName: ahcPackage.name,
        labVendorId: labBooking?.vendorId,
        labVendorName: labBooking?.vendorName,
        labSlotId: labBooking?.slotId,
        labDate: labBooking?.date,
        labTime: labBooking?.time,
        labCollectionType: labBooking?.collectionType,
        labCollectionAddress: labBooking?.collectionAddress,
        diagnosticVendorId: diagnosticBooking?.vendorId,
        diagnosticVendorName: diagnosticBooking?.vendorName,
        diagnosticSlotId: diagnosticBooking?.slotId,
        diagnosticDate: diagnosticBooking?.date,
        diagnosticTime: diagnosticBooking?.time,
      },
    }

    sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking))

    console.log('[AHCPayment] Stored pendingBooking:', pendingBooking)

    // Navigate to payment page
    router.push(`/member/payments/${paymentId}?redirect=/member/bookings?tab=ahc`)
  }

  const handlePaymentFailure = (error: any) => {
    console.error('[AHCPayment] Payment failed:', error)
    toast.error('Payment failed. Please try again.')
  }

  if (loading || !ahcPackage || (!labBooking && !diagnosticBooking) || !userId || !patientId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7fc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const pricing = calculatePricing()

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={diagnosticBooking ? '/member/ahc/booking/diagnostic' : '/member/ahc/booking'}>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>Payment Summary</h1>
              <p className="text-xs lg:text-sm text-gray-600">
                Step {diagnosticBooking ? '3' : '2'} of {diagnosticBooking ? '3' : '2'}: Review & Pay
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[480px] mx-auto lg:max-w-3xl px-4 lg:px-6 py-6 space-y-6">
        {/* Booking Summary */}
        <AHCBookingSummary
          packageName={ahcPackage.name}
          labBooking={labBooking || undefined}
          diagnosticBooking={diagnosticBooking || undefined}
          pricing={pricing}
        />

        {/* Important Note */}
        <div className="rounded-xl p-4 border-2" style={{
          background: 'linear-gradient(243.73deg, rgba(255, 193, 7, 0.1) -12.23%, rgba(255, 152, 0, 0.1) 94.15%)',
          borderColor: 'rgba(255, 193, 7, 0.3)'
        }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Important Information</h3>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>This is a one-time annual health check benefit</li>
            <li>Once booked, you cannot cancel or modify the booking</li>
            <li>Please ensure all details are correct before proceeding</li>
            <li>Lab reports will be shared within 24-48 hours after sample collection</li>
            <li>Diagnostic reports will be available immediately after the tests</li>
          </ul>
        </div>

        {/* Payment Processor Component */}
        {userId && patientId && (
          <PaymentProcessor
            consultationFee={pricing.subtotal}
            userId={userId}
            patientId={patientId}
            patientName={patientName}
            serviceType="AHC"
            serviceDetails={{
              packageId: ahcPackage.packageId,
              packageName: ahcPackage.name,
              labVendorId: labBooking?.vendorId,
              labVendorName: labBooking?.vendorName,
              labSlotId: labBooking?.slotId,
              labDate: labBooking?.date,
              labTime: labBooking?.time,
              labCollectionType: labBooking?.collectionType,
              labCollectionAddress: labBooking?.collectionAddress,
              diagnosticVendorId: diagnosticBooking?.vendorId,
              diagnosticVendorName: diagnosticBooking?.vendorName,
              diagnosticSlotId: diagnosticBooking?.slotId,
              diagnosticDate: diagnosticBooking?.date,
              diagnosticTime: diagnosticBooking?.time,
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}
      </div>
    </div>
  )
}
