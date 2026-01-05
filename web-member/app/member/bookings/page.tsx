'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ChevronLeftIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton, { PrescriptionBadge } from '@/components/ViewPrescriptionButton'
import { emitAppointmentEvent, AppointmentEvents } from '@/lib/appointmentEvents'
import { useFamily } from '@/contexts/FamilyContext'
import InvoiceModal from '@/components/dental/InvoiceModal'

interface Appointment {
  _id: string
  appointmentId: string
  appointmentNumber: string
  patientName: string
  patientId: string
  doctorId: string
  doctorName: string
  specialty: string
  clinicName: string
  clinicAddress: string
  appointmentType: string
  appointmentDate: string
  timeSlot: string
  consultationFee: number
  status: string
  requestedAt: string
  createdAt: string
  hasPrescription?: boolean
  prescriptionId?: string
}

interface DentalBooking {
  _id: string
  bookingId: string
  patientName: string
  patientId: string
  serviceCode: string
  serviceName: string
  clinicId: string
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
  servicePrice: number
  billAmount: number
  copayAmount: number
  insurancePayment: number
  excessAmount: number
  walletDebitAmount: number
  totalMemberPayment: number
  paymentMethod: string
  paymentStatus: string  // PENDING, COMPLETED, FAILED, REFUNDED
  status: string  // PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
  bookedAt: string
  createdAt: string
  invoiceGenerated?: boolean
  invoiceId?: string
  invoicePath?: string
  invoiceFileName?: string
}

interface VisionBooking {
  _id: string
  bookingId: string
  patientName: string
  patientId: string
  serviceCode: string
  serviceName: string
  clinicId: string
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
  servicePrice: number
  billAmount: number
  copayAmount: number
  insurancePayment: number
  excessAmount: number
  walletDebitAmount: number
  totalMemberPayment: number
  paymentMethod: string
  paymentStatus: string
  status: string
  bookedAt: string
  createdAt: string
  billGenerated?: boolean
  billGeneratedAt?: string
  invoiceGenerated?: boolean
  invoiceId?: string
  invoicePath?: string
  invoiceFileName?: string
}

export default function BookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewingUserId } = useFamily()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'doctors')
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [dentalBookings, setDentalBookings] = useState<DentalBooking[]>([])
  const [upcomingDentalBookings, setUpcomingDentalBookings] = useState<DentalBooking[]>([])
  const [pastDentalBookings, setPastDentalBookings] = useState<DentalBooking[]>([])
  const [visionBookings, setVisionBookings] = useState<VisionBooking[]>([])
  const [upcomingVisionBookings, setUpcomingVisionBookings] = useState<VisionBooking[]>([])
  const [pastVisionBookings, setPastVisionBookings] = useState<VisionBooking[]>([])
  const [labCarts, setLabCarts] = useState<any[]>([])
  const [labOrders, setLabOrders] = useState<any[]>([])
  const [diagnosticCarts, setDiagnosticCarts] = useState<any[]>([])
  const [diagnosticOrders, setDiagnosticOrders] = useState<any[]>([])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<DentalBooking | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReportUrl, setSelectedReportUrl] = useState<string>('')
  const [reportOrderId, setReportOrderId] = useState<string>('')

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchAppointments()
    fetchDentalBookings()
    fetchVisionBookings()
    fetchLabCarts()
    fetchLabOrders()
    fetchDiagnosticCarts()
    fetchDiagnosticOrders()
  }, [viewingUserId])

  const fetchAppointments = async () => {
    try {
      console.log('[Bookings] Fetching user data')
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('[Bookings] User ID:', userData._id)

      // PRIVACY: Use viewingUserId to fetch appointments for the active profile
      const targetUserId = viewingUserId || userData._id
      console.log('[Bookings] Fetching all appointments for profile:', { targetUserId, viewingUserId })

      // Fetch all appointments (both IN_CLINIC and ONLINE)
      console.log('[Bookings] Fetching all appointments')
      const response = await fetch(`/api/appointments/user/${targetUserId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      console.log('[Bookings] Appointments received:', data.length)

      // Sort appointments by date (newest first)
      const sortedAppointments = data.sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`)
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`)
        return dateB.getTime() - dateA.getTime()
      })

      // Split into upcoming and past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming: Appointment[] = []
      const past: Appointment[] = []

      sortedAppointments.forEach((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate)
        appointmentDate.setHours(0, 0, 0, 0)

        if (appointmentDate >= today) {
          upcoming.push(appointment)
        } else {
          past.push(appointment)
        }
      })

      // Sort upcoming appointments in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`)
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`)
        return dateA.getTime() - dateB.getTime()
      })

      setAppointments(sortedAppointments)
      setUpcomingAppointments(upcoming)
      setPastAppointments(past)
    } catch (error) {
      console.error('[Bookings] Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDentalBookings = async () => {
    try {
      console.log('[DentalBookings] Fetching user data')
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('[DentalBookings] User ID:', userData._id)

      // PRIVACY: Use viewingUserId to fetch bookings for the active profile
      const targetUserId = viewingUserId || userData._id
      console.log('[DentalBookings] Fetching dental bookings for profile:', { targetUserId, viewingUserId })

      const response = await fetch(`/api/dental-bookings/user/${targetUserId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[DentalBookings] No dental bookings found or error fetching')
        setDentalBookings([])
        setUpcomingDentalBookings([])
        setPastDentalBookings([])
        return
      }

      const data = await response.json()
      console.log('[DentalBookings] Dental bookings received:', data.length)
      console.log('[DentalBookings] Bookings data:', data.map((b: DentalBooking) => ({
        bookingId: b.bookingId,
        status: b.status,
        invoiceGenerated: b.invoiceGenerated,
        invoiceId: b.invoiceId
      })))

      // Sort bookings by date (newest first)
      const sortedBookings = data.sort((a: DentalBooking, b: DentalBooking) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateB.getTime() - dateA.getTime()
      })

      // Split into upcoming and past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming: DentalBooking[] = []
      const past: DentalBooking[] = []

      sortedBookings.forEach((booking: DentalBooking) => {
        const bookingDate = new Date(booking.appointmentDate)
        bookingDate.setHours(0, 0, 0, 0)

        if (bookingDate >= today) {
          upcoming.push(booking)
        } else {
          past.push(booking)
        }
      })

      // Sort upcoming bookings in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateA.getTime() - dateB.getTime()
      })

      setDentalBookings(sortedBookings)
      setUpcomingDentalBookings(upcoming)
      setPastDentalBookings(past)
    } catch (error) {
      console.error('[DentalBookings] Error fetching dental bookings:', error)
      setDentalBookings([])
      setUpcomingDentalBookings([])
      setPastDentalBookings([])
    }
  }

  const fetchVisionBookings = async () => {
    try {
      console.log('[VisionBookings] Fetching user data')
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      console.log('[VisionBookings] User ID:', userData._id)

      const targetUserId = viewingUserId || userData._id
      console.log('[VisionBookings] Fetching vision bookings for profile:', { targetUserId, viewingUserId })

      const response = await fetch(`/api/vision-bookings/user/${targetUserId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[VisionBookings] No vision bookings found or error fetching')
        setVisionBookings([])
        setUpcomingVisionBookings([])
        setPastVisionBookings([])
        return
      }

      const data = await response.json()
      console.log('[VisionBookings] Vision bookings received:', data.length)

      const sortedBookings = data.sort((a: VisionBooking, b: VisionBooking) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateB.getTime() - dateA.getTime()
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming: VisionBooking[] = []
      const past: VisionBooking[] = []

      sortedBookings.forEach((booking: VisionBooking) => {
        const bookingDate = new Date(booking.appointmentDate)
        bookingDate.setHours(0, 0, 0, 0)

        if (bookingDate >= today) {
          upcoming.push(booking)
        } else {
          past.push(booking)
        }
      })

      upcoming.sort((a, b) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateA.getTime() - dateB.getTime()
      })

      setVisionBookings(sortedBookings)
      setUpcomingVisionBookings(upcoming)
      setPastVisionBookings(past)
    } catch (error) {
      console.error('[VisionBookings] Error fetching vision bookings:', error)
      setVisionBookings([])
      setUpcomingVisionBookings([])
      setPastVisionBookings([])
    }
  }

  const fetchLabCarts = async () => {
    try {
      console.log('[LabCarts] Fetching lab carts')
      const response = await fetch('/api/member/lab/carts', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[LabCarts] No lab carts found or error fetching')
        setLabCarts([])
        return
      }

      const data = await response.json()
      console.log('[LabCarts] Lab carts received:', data)
      setLabCarts(data.data || [])
    } catch (error) {
      console.error('[LabCarts] Error fetching lab carts:', error)
      setLabCarts([])
    }
  }

  const fetchLabOrders = async () => {
    try {
      console.log('[LabOrders] Fetching lab orders')
      const response = await fetch('/api/member/lab/orders', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[LabOrders] No lab orders found or error fetching')
        setLabOrders([])
        return
      }

      const data = await response.json()
      console.log('[LabOrders] Lab orders received:', data)
      setLabOrders(data.data || [])
    } catch (error) {
      console.error('[LabOrders] Error fetching lab orders:', error)
      setLabOrders([])
    }
  }

  const fetchDiagnosticCarts = async () => {
    try {
      console.log('[DiagnosticCarts] Fetching diagnostic carts')
      const response = await fetch('/api/member/diagnostics/carts', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[DiagnosticCarts] No diagnostic carts found or error fetching')
        setDiagnosticCarts([])
        return
      }

      const data = await response.json()
      console.log('[DiagnosticCarts] Diagnostic carts received:', data)
      setDiagnosticCarts(data.data || [])
    } catch (error) {
      console.error('[DiagnosticCarts] Error fetching diagnostic carts:', error)
      setDiagnosticCarts([])
    }
  }

  const fetchDiagnosticOrders = async () => {
    try {
      console.log('[DiagnosticOrders] Fetching diagnostic orders')
      const response = await fetch('/api/member/diagnostics/orders', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.log('[DiagnosticOrders] No diagnostic orders found or error fetching')
        setDiagnosticOrders([])
        return
      }

      const data = await response.json()
      console.log('[DiagnosticOrders] Diagnostic orders received:', data)
      setDiagnosticOrders(data.data || [])
    } catch (error) {
      console.error('[DiagnosticOrders] Error fetching diagnostic orders:', error)
      setDiagnosticOrders([])
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const handleViewReport = (reportUrl: string, orderId: string) => {
    // Ensure the URL bypasses the /member basePath to reach the Next.js rewrite
    // Convert /api/uploads/... or uploads/... to absolute URL at root level
    let absoluteUrl = reportUrl
    if (reportUrl.startsWith('/api/')) {
      absoluteUrl = `${window.location.protocol}//${window.location.host}${reportUrl}`
    } else if (reportUrl.startsWith('uploads/')) {
      // Handle legacy URLs without /api/ prefix
      absoluteUrl = `${window.location.protocol}//${window.location.host}/api/${reportUrl}`
    }
    setSelectedReportUrl(absoluteUrl)
    setReportOrderId(orderId)
    setShowReportModal(true)
  }

  const handleDownloadReport = () => {
    if (selectedReportUrl) {
      const link = document.createElement('a')
      link.href = selectedReportUrl
      link.download = `report-${reportOrderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return { background: '#FEF1E7', color: '#E67E22', borderColor: '#E67E22' }
      case 'CONFIRMED':
        return { background: '#E8F5E9', color: '#25A425', borderColor: '#25A425' }
      case 'COMPLETED':
        return { background: '#EFF4FF', color: '#0F5FDC', borderColor: '#0F5FDC' }
      case 'CANCELLED':
        return { background: '#FFEBEE', color: '#E53535', borderColor: '#E53535' }
      default:
        return { background: '#f3f4f6', color: '#6b7280', borderColor: '#6b7280' }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Pending Confirmation'
      case 'CONFIRMED':
        return 'Confirmed'
      case 'COMPLETED':
        return 'Completed'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return status
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PENDING':
        return { background: '#FEF1E7', color: '#E67E22', borderColor: '#E67E22' }
      case 'COMPLETED':
        return { background: '#E8F5E9', color: '#25A425', borderColor: '#25A425' }
      case 'FAILED':
        return { background: '#FFEBEE', color: '#E53535', borderColor: '#E53535' }
      case 'REFUNDED':
        return { background: '#EFF4FF', color: '#0F5FDC', borderColor: '#0F5FDC' }
      default:
        return { background: '#f3f4f6', color: '#6b7280', borderColor: '#6b7280' }
    }
  }

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PENDING':
        return 'Payment Pending'
      case 'COMPLETED':
        return 'Paid'
      case 'FAILED':
        return 'Payment Failed'
      case 'REFUNDED':
        return 'Refunded'
      default:
        return paymentStatus
    }
  }

  const getAppointmentTypeText = (type: string) => {
    return type === 'ONLINE' ? 'Online Consultation' : 'In-Clinic Visit'
  }

  const handleCancelAppointment = async (appointmentId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to cancel your appointment with ${doctorName}? Your wallet will be refunded.`)) {
      return
    }

    try {
      console.log('[Bookings] Cancelling appointment:', appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}/user-cancel`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel appointment')
      }

      console.log('[Bookings] Appointment cancelled successfully')
      alert('Appointment cancelled successfully. Your wallet has been refunded.')

      // Emit appointment cancelled event to update nudge
      emitAppointmentEvent(AppointmentEvents.BOOKING_CANCELLED)

      // Refresh appointments
      await fetchAppointments()
    } catch (error) {
      console.error('[Bookings] Error cancelling appointment:', error)
      alert('Failed to cancel appointment: ' + (error as Error).message)
    }
  }

  const handleCancelDentalBooking = async (bookingId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to cancel your ${serviceName} booking? Your wallet will be refunded.`)) {
      return
    }

    try {
      console.log('[DentalBookings] Cancelling booking:', bookingId)
      const response = await fetch(`/api/dental-bookings/${bookingId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel booking')
      }

      console.log('[DentalBookings] Booking cancelled successfully')
      alert('Dental booking cancelled successfully. Your wallet has been refunded.')

      // Refresh dental bookings
      await fetchDentalBookings()
    } catch (error) {
      console.error('[DentalBookings] Error cancelling booking:', error)
      alert('Failed to cancel booking: ' + (error as Error).message)
    }
  }

  const handleViewInvoice = async (booking: DentalBooking | VisionBooking) => {
    try {
      console.log('[Bookings] Downloading invoice for:', booking.bookingId)

      // Determine booking type
      const isVision = booking.bookingId.startsWith('VIS-BOOK')
      const endpoint = isVision
        ? `/api/vision-bookings/${booking.bookingId}/invoice`
        : `/api/dental-bookings/${booking.bookingId}/invoice`

      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to download invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${booking.bookingId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      console.log('[Bookings] Invoice downloaded successfully')
    } catch (error) {
      console.error('[Bookings] Error downloading invoice:', error)
      alert('Failed to download invoice')
    }
  }

  const handleCancelVisionBooking = async (bookingId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to cancel your ${serviceName} vision appointment?`)) {
      return
    }

    try {
      console.log('[VisionBookings] Cancelling booking:', bookingId)
      const response = await fetch(`/api/vision-bookings/${bookingId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by member' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to cancel booking')
      }

      console.log('[VisionBookings] Booking cancelled successfully')
      alert('Vision appointment cancelled successfully.')
      await fetchVisionBookings()
    } catch (error) {
      console.error('[VisionBookings] Error cancelling booking:', error)
      alert('Failed to cancel booking: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f7f7fc' }}>
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0F5FDC', borderTopColor: 'transparent' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ChevronLeftIcon className="h-6 w-6" style={{ color: '#0E51A2' }} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#0E51A2' }}>
                My Bookings
              </h1>
              <p className="text-xs lg:text-sm text-gray-600">View all your appointments and bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 lg:px-6 border-b shadow-sm max-w-[480px] mx-auto lg:max-w-full" style={{ borderColor: '#e5e7eb' }}>
        <nav className="flex space-x-2 lg:space-x-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-4 px-1 lg:px-2 border-b-3 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'border-b-4'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'doctors' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Doctors</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`py-4 px-1 lg:px-2 border-b-3 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'lab'
                ? 'border-b-4'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'lab' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <BeakerIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Lab</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'diagnostic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === 'diagnostic' ? { borderColor: '#0a529f', color: '#0a529f' } : undefined}
          >
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-5 w-5" />
              <span>Diagnostic</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`py-4 px-1 lg:px-2 border-b-3 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'pharmacy'
                ? 'border-b-4'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'pharmacy' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <BuildingStorefrontIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Pharmacy</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dental')}
            className={`py-4 px-1 lg:px-2 border-b-3 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'dental'
                ? 'border-b-4'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'dental' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <SparklesIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Dental</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`py-4 px-1 lg:px-2 border-b-3 font-semibold text-sm lg:text-base transition-all whitespace-nowrap ${
              activeTab === 'vision'
                ? 'border-b-4'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={activeTab === 'vision' ? { borderColor: '#0F5FDC', color: '#0E51A2' } : { color: '#6b7280' }}
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span>Vision</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6 max-w-[480px] mx-auto lg:max-w-full">
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
                background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                borderColor: '#86ACD8'
              }}>
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <CalendarIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No appointments yet</h3>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">Book your first appointment to get started</p>
                <button
                  onClick={() => router.push('/member/appointments')}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                  <>
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <UserIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                              <div className="text-sm text-gray-900">{appointment.specialty}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(appointment.status)}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                            <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
                            <span className="text-xs text-gray-500">
                              {getAppointmentTypeText(appointment.appointmentType)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {appointment.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{appointment.timeSlot}</span>
                          </div>

                          {appointment.appointmentType === 'IN_CLINIC' && (
                            <div className="flex items-center space-x-2 text-sm text-gray-900">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="line-clamp-1">{appointment.clinicName}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{appointment.appointmentId}</span>
                            </div>
                            <div className="text-sm font-semibold" style={{ color: '#0a529f' }}>
                              ₹{appointment.consultationFee}
                            </div>
                          </div>

                          {/* View Prescription Button */}
                          {appointment.hasPrescription && appointment.prescriptionId && (
                            <div className="mb-3">
                              <ViewPrescriptionButton
                                prescriptionId={appointment.prescriptionId}
                                hasPrescription={appointment.hasPrescription}
                              />
                            </div>
                          )}

                          {(() => {
                            // Parse appointment date and time
                            const [year, month, day] = appointment.appointmentDate.split('-').map(Number);
                            const appointmentDateObj = new Date(year, month - 1, day); // month is 0-indexed

                            // Parse time slot (e.g., "1:30 PM" or "10:00 AM")
                            const timeParts = appointment.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
                            if (timeParts) {
                              let hours = parseInt(timeParts[1]);
                              const minutes = parseInt(timeParts[2]);
                              const period = timeParts[3].toUpperCase();

                              if (period === 'PM' && hours !== 12) {
                                hours += 12;
                              } else if (period === 'AM' && hours === 12) {
                                hours = 0;
                              }

                              appointmentDateObj.setHours(hours, minutes, 0, 0);
                            }

                            const now = new Date();
                            const isFuture = appointmentDateObj > now;
                            const canCancel = (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture;

                            return canCancel;
                          })() && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCancelAppointment(appointment.appointmentId, appointment.doctorName)}
                                className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                disabled
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Separator */}
                {upcomingAppointments.length > 0 && pastAppointments.length > 0 && (
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm font-medium text-gray-500">Past Appointments</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                  <>
                    {upcomingAppointments.length === 0 && (
                      <div className="text-sm font-medium text-gray-500 mb-3">Past Appointments</div>
                    )}
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <UserIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                              <div className="text-sm text-gray-900">{appointment.specialty}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(appointment.status)}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                            <PrescriptionBadge hasPrescription={appointment.hasPrescription} />
                            <span className="text-xs text-gray-500">
                              {getAppointmentTypeText(appointment.appointmentType)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {appointment.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{appointment.timeSlot}</span>
                          </div>

                          {appointment.appointmentType === 'IN_CLINIC' && (
                            <div className="flex items-center space-x-2 text-sm text-gray-900">
                              <MapPinIcon className="h-4 w-4" />
                              <span className="line-clamp-1">{appointment.clinicName}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{appointment.appointmentId}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{appointment.consultationFee}
                            </div>
                          </div>

                          {/* View Prescription Button */}
                          {appointment.hasPrescription && appointment.prescriptionId && (
                            <ViewPrescriptionButton
                              prescriptionId={appointment.prescriptionId}
                              hasPrescription={appointment.hasPrescription}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="space-y-4">
            {labCarts.length === 0 && labOrders.length === 0 ? (
              <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
                background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                borderColor: '#86ACD8'
              }}>
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <BeakerIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No lab tests yet</h3>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">Upload a prescription and create a cart to get started</p>
                <button
                  onClick={() => router.push('/member/lab-tests')}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                >
                  Go to Lab Tests
                </button>
              </div>
            ) : (
              <>
                {/* Lab Orders (Paid) */}
                {labOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                    style={{
                      background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                      borderColor: '#86ACD8'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                            border: '1px solid #A4BFFE7A',
                            boxShadow: '-2px 11px 46.1px 0px #0000000D'
                          }}
                        >
                          <BeakerIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Lab Test Order</div>
                          <div className="text-sm text-gray-900">{order.items?.length || 0} test(s)</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <UserIcon className="h-4 w-4" />
                        <span>Vendor: {order.vendorName}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(order.collectionDate)}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{order.collectionTime}</span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium mb-1">Tests:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>{item.serviceName}</li>
                            ))}
                            {order.items.length > 3 && (
                              <li className="text-gray-500">+{order.items.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          Order ID: <span className="font-medium text-gray-900">{order.orderId}</span>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#0a529f' }}>
                          ₹{order.finalAmount}
                        </div>
                      </div>
                      {order.reportUrl && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleViewReport(order.reportUrl, order.orderId)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                          >
                            <EyeIcon className="h-5 w-5" />
                            View / Download Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Lab Carts (Payment Pending or Active) */}
                {labCarts.map((cart) => {
                  const hasVendorsAssigned = cart.selectedVendorIds && cart.selectedVendorIds.length > 0
                  const displayStatus = hasVendorsAssigned ? 'Payment Pending' : cart.status
                  const statusColor = hasVendorsAssigned
                    ? 'bg-yellow-100 text-yellow-800'
                    : cart.status === 'ACTIVE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'

                  return (
                    <div
                      key={cart._id}
                      className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                      style={{
                        background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                        borderColor: '#86ACD8'
                      }}
                      onClick={() => router.push(`/member/lab-tests?cartId=${cart.cartId}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{
                              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                              border: '1px solid #A4BFFE7A',
                              boxShadow: '-2px 11px 46.1px 0px #0000000D'
                            }}
                          >
                            <BeakerIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Lab Test Cart</div>
                            <div className="text-sm text-gray-900">{cart.items?.length || 0} test(s)</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {displayStatus}
                        </span>
                      </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <UserIcon className="h-4 w-4" />
                        <span>Patient: {cart.patientName}</span>
                      </div>

                      {cart.items && cart.items.length > 0 && (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium mb-1">Tests:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {cart.items.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>{item.serviceName}</li>
                            ))}
                            {cart.items.length > 3 && (
                              <li className="text-gray-500">+{cart.items.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-900">
                          Cart ID: <span className="font-medium text-gray-900">{cart.cartId}</span>
                        </div>
                      </div>

                      {cart.selectedVendorIds && cart.selectedVendorIds.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs text-green-600 mb-2">
                            ✓ Vendors assigned by operations team
                          </div>
                          <button
                            className="w-full py-3 px-4 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                            style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/member/lab-tests/booking/${cart.cartId}`)
                            }}
                          >
                            Select Vendor & Book
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-sm font-semibold hover:underline transition-all"
                          style={{ color: '#0F5FDC' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/member/lab-tests?cartId=${cart.cartId}`)
                          }}
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                )
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'pharmacy' && (
          <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
            background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
            borderColor: '#86ACD8'
          }}>
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <BuildingStorefrontIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>Pharmacy Orders</h3>
            <p className="text-gray-600 text-sm lg:text-base">Pharmacy orders will appear here</p>
          </div>
        )}

        {activeTab === 'diagnostic' && (
          <div className="space-y-4">
            {diagnosticCarts.length === 0 && diagnosticOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="mb-4">
                  <HeartIcon className="h-16 w-16 text-gray-300 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No diagnostic tests yet</h3>
                <p className="text-gray-600 mb-4">Upload a prescription and create a cart to get started</p>
                <button
                  onClick={() => router.push('/member/diagnostics')}
                  className="px-6 py-2 text-white rounded-lg"
                  style={{ backgroundColor: '#0a529f' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                >
                  Go to Diagnostics
                </button>
              </div>
            ) : (
              <>
                {/* Diagnostic Orders (Paid) */}
                {diagnosticOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full" style={{ backgroundColor: '#e6f0fa' }}>
                          <HeartIcon className="h-5 w-5" style={{ color: '#0a529f' }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Diagnostic Order</div>
                          <div className="text-sm text-gray-600">{order.items?.length || 0} service(s)</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <UserIcon className="h-4 w-4" />
                        <span>Vendor: {order.vendorName}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(order.appointmentDate)}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{order.timeSlot}</span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <div className="font-medium mb-1">Services:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>{item.serviceName}</li>
                            ))}
                            {order.items.length > 3 && (
                              <li className="text-gray-500">+{order.items.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Order ID: <span className="font-medium text-gray-900">{order.orderId}</span>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#0a529f' }}>
                          ₹{order.finalAmount}
                        </div>
                      </div>
                      {order.reportUrl && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleViewReport(order.reportUrl, order.orderId)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all"
                            style={{ backgroundColor: '#0a529f' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                          >
                            <EyeIcon className="h-5 w-5" />
                            View / Download Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Diagnostic Carts (Payment Pending or Active) */}
                {diagnosticCarts.map((cart) => {
                  const hasVendorsAssigned = cart.selectedVendorIds && cart.selectedVendorIds.length > 0
                  const displayStatus = hasVendorsAssigned ? 'Payment Pending' : cart.status
                  const statusColor = hasVendorsAssigned
                    ? 'bg-yellow-100 text-yellow-800'
                    : cart.status === 'ACTIVE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'

                  return (
                    <div
                      key={cart._id}
                      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/member/diagnostics?cartId=${cart.cartId}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full" style={{ backgroundColor: '#e6f0fa' }}>
                            <HeartIcon className="h-5 w-5" style={{ color: '#0a529f' }} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Diagnostic Cart</div>
                            <div className="text-sm text-gray-600">{cart.items?.length || 0} service(s)</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {displayStatus}
                        </span>
                      </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <UserIcon className="h-4 w-4" />
                        <span>Patient: {cart.patientName}</span>
                      </div>

                      {cart.items && cart.items.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <div className="font-medium mb-1">Services:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {cart.items.slice(0, 3).map((item: any, idx: number) => (
                              <li key={idx}>{item.serviceName}</li>
                            ))}
                            {cart.items.length > 3 && (
                              <li className="text-gray-500">+{cart.items.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                          Cart ID: <span className="font-medium text-gray-900">{cart.cartId}</span>
                        </div>
                      </div>

                      {cart.selectedVendorIds && cart.selectedVendorIds.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs text-green-600 mb-2">
                            ✓ Vendors assigned by operations team
                          </div>
                          <button
                            className="w-full py-2 px-4 text-white rounded-lg font-medium"
                            style={{ backgroundColor: '#0a529f' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/member/diagnostics/booking/${cart.cartId}`)
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
                          >
                            Select Vendor & Book
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-sm font-medium"
                          style={{ color: '#0a529f' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/member/diagnostics?cartId=${cart.cartId}`)
                          }}
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                )
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'dental' && (
          <div className="space-y-4">
            {dentalBookings.length === 0 ? (
              <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
                background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                borderColor: '#86ACD8'
              }}>
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <SparklesIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No dental bookings yet</h3>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">Book your first dental service to get started</p>
                <button
                  onClick={() => router.push('/member/dental')}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                >
                  Browse Dental Services
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming Dental Bookings */}
                {upcomingDentalBookings.length > 0 && (
                  <>
                    {upcomingDentalBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <SparklesIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{booking.serviceName}</div>
                              <div className="text-sm text-gray-900">{booking.clinicName}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(booking.status)}
                            >
                              {getStatusText(booking.status)}
                            </span>
                            {booking.paymentStatus && (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={getPaymentStatusColor(booking.paymentStatus)}
                              >
                                {getPaymentStatusText(booking.paymentStatus)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {booking.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(booking.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{booking.appointmentTime}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <MapPinIcon className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {booking.clinicAddress.city}, {booking.clinicAddress.state}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{booking.bookingId}</span>
                            </div>
                            <div className="text-sm font-semibold" style={{ color: '#0a529f' }}>
                              ₹{booking.servicePrice}
                            </div>
                          </div>

                          {/* Payment Info */}
                          {booking.walletDebitAmount > 0 && (
                            <div className="text-xs text-gray-600 mb-3">
                              <div className="flex justify-between">
                                <span>Wallet Deduction:</span>
                                <span className="font-medium">₹{booking.walletDebitAmount}</span>
                              </div>
                              {booking.copayAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>Co-pay:</span>
                                  <span className="font-medium">₹{booking.copayAmount}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {(() => {
                            // Parse appointment date and time
                            const bookingDateObj = new Date(booking.appointmentDate)

                            // Parse time (e.g., "14:30" or "9:00")
                            const timeParts = booking.appointmentTime.match(/(\d+):(\d+)/)
                            if (timeParts) {
                              const hours = parseInt(timeParts[1])
                              const minutes = parseInt(timeParts[2])
                              bookingDateObj.setHours(hours, minutes, 0, 0)
                            }

                            const now = new Date()
                            const isFuture = bookingDateObj > now
                            const canCancel = (booking.status === 'PENDING_CONFIRMATION' || booking.status === 'CONFIRMED') && isFuture

                            return canCancel;
                          })() && (
                            <button
                              onClick={() => handleCancelDentalBooking(booking.bookingId, booking.serviceName)}
                              className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}

                          {(() => {
                            console.log('[DentalBookings] Checking invoice button for:', {
                              bookingId: booking.bookingId,
                              status: booking.status,
                              invoiceGenerated: booking.invoiceGenerated,
                              shouldShow: booking.status === 'COMPLETED' && booking.invoiceGenerated
                            })
                            return booking.status === 'COMPLETED' && booking.invoiceGenerated
                          })() && (
                            <button
                              onClick={() => handleViewInvoice(booking)}
                              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              View Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Separator */}
                {upcomingDentalBookings.length > 0 && pastDentalBookings.length > 0 && (
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm font-medium text-gray-500">Past Bookings</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )}

                {/* Past Dental Bookings */}
                {pastDentalBookings.length > 0 && (
                  <>
                    {upcomingDentalBookings.length === 0 && (
                      <div className="text-sm font-medium text-gray-500 mb-3">Past Bookings</div>
                    )}
                    {pastDentalBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <SparklesIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{booking.serviceName}</div>
                              <div className="text-sm text-gray-900">{booking.clinicName}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(booking.status)}
                            >
                              {getStatusText(booking.status)}
                            </span>
                            {booking.paymentStatus && (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={getPaymentStatusColor(booking.paymentStatus)}
                              >
                                {getPaymentStatusText(booking.paymentStatus)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {booking.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(booking.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{booking.appointmentTime}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <MapPinIcon className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {booking.clinicAddress.city}, {booking.clinicAddress.state}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{booking.bookingId}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{booking.servicePrice}
                            </div>
                          </div>

                          {(() => {
                            console.log('[DentalBookings] Checking invoice button for:', {
                              bookingId: booking.bookingId,
                              status: booking.status,
                              invoiceGenerated: booking.invoiceGenerated,
                              shouldShow: booking.status === 'COMPLETED' && booking.invoiceGenerated
                            })
                            return booking.status === 'COMPLETED' && booking.invoiceGenerated
                          })() && (
                            <button
                              onClick={() => handleViewInvoice(booking)}
                              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              View Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Vision Tab */}
        {activeTab === 'vision' && (
          <div className="space-y-4">
            {visionBookings.length === 0 ? (
              <div className="rounded-2xl p-8 lg:p-12 text-center border-2 shadow-md" style={{
                background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
                borderColor: '#86ACD8'
              }}>
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                    border: '1px solid #A4BFFE7A',
                    boxShadow: '-2px 11px 46.1px 0px #0000000D'
                  }}
                >
                  <EyeIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold mb-2" style={{ color: '#0E51A2' }}>No vision bookings yet</h3>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">Book your first vision service to get started</p>
                <button
                  onClick={() => router.push('/member/vision')}
                  className="px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                >
                  Browse Vision Services
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming Vision Bookings */}
                {upcomingVisionBookings.length > 0 && (
                  <>
                    {upcomingVisionBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <EyeIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{booking.serviceName}</div>
                              <div className="text-sm text-gray-900">{booking.clinicName}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(booking.status)}
                            >
                              {getStatusText(booking.status)}
                            </span>
                            {booking.paymentStatus && (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={getPaymentStatusColor(booking.paymentStatus)}
                              >
                                {getPaymentStatusText(booking.paymentStatus)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {booking.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(booking.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{booking.appointmentTime}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <MapPinIcon className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {booking.clinicAddress.city}, {booking.clinicAddress.state}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{booking.bookingId}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{booking.billAmount || booking.servicePrice}
                            </div>
                          </div>

                          {/* Bill generated but payment pending - show View and Pay Bill */}
                          {booking.billGenerated && booking.paymentStatus === 'PENDING' && (
                            <button
                              onClick={() => router.push(`/member/vision/payment/${booking.bookingId}`)}
                              className="w-full py-2 px-3 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg"
                              style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
                            >
                              View and Pay Bill
                            </button>
                          )}

                          {/* Payment completed - show View Invoice */}
                          {booking.paymentStatus === 'COMPLETED' && booking.invoiceGenerated && (
                            <button
                              onClick={() => handleViewInvoice(booking)}
                              className="w-full py-2 px-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              View/Download Invoice
                            </button>
                          )}

                          {/* Can cancel if pending confirmation or confirmed but no bill yet */}
                          {(booking.status === 'PENDING_CONFIRMATION' || (booking.status === 'CONFIRMED' && !booking.billGenerated)) && (
                            <button
                              onClick={() => handleCancelVisionBooking(booking.bookingId, booking.serviceName)}
                              className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Past Vision Bookings */}
                {pastVisionBookings.length > 0 && (
                  <>
                    {upcomingVisionBookings.length === 0 && (
                      <div className="text-sm font-medium text-gray-500 mb-3">Past Bookings</div>
                    )}
                    {pastVisionBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-2xl p-5 lg:p-6 border-2 shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          background: 'linear-gradient(243.73deg, rgba(224, 233, 255, 0.48) -12.23%, rgba(200, 216, 255, 0.48) 94.15%)',
                          borderColor: '#86ACD8'
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{
                                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                                border: '1px solid #A4BFFE7A',
                                boxShadow: '-2px 11px 46.1px 0px #0000000D'
                              }}
                            >
                              <EyeIcon className="h-6 w-6" style={{ color: '#0F5FDC' }} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{booking.serviceName}</div>
                              <div className="text-sm text-gray-900">{booking.clinicName}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getStatusColor(booking.status)}
                            >
                              {getStatusText(booking.status)}
                            </span>
                            {booking.paymentStatus && (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={getPaymentStatusColor(booking.paymentStatus)}
                              >
                                {getPaymentStatusText(booking.paymentStatus)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <UserIcon className="h-4 w-4" />
                            <span>Patient: {booking.patientName}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(booking.appointmentDate)}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <ClockIcon className="h-4 w-4" />
                            <span>{booking.appointmentTime}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <MapPinIcon className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {booking.clinicAddress.city}, {booking.clinicAddress.state}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-900">
                              ID: <span className="font-medium text-gray-900">{booking.bookingId}</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{booking.servicePrice || booking.billAmount}
                            </div>
                          </div>

                          {booking.status === 'COMPLETED' && booking.invoiceGenerated && (
                            <button
                              onClick={() => handleViewInvoice(booking)}
                              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              View Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        booking={selectedBooking}
      />

      {/* Report View Modal */}
      {showReportModal && selectedReportUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Test Report</h3>
                <p className="text-sm text-gray-600">Order ID: {reportOrderId}</p>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setSelectedReportUrl('')
                  setReportOrderId('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedReportUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedReportUrl}
                  className="w-full h-full min-h-[600px]"
                  title="Report PDF"
                />
              ) : (
                <img
                  src={selectedReportUrl}
                  alt="Report"
                  className="w-full h-auto"
                />
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <button
                onClick={handleDownloadReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}