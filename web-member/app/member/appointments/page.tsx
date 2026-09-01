'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import ViewPrescriptionButton from '@/components/ViewPrescriptionButton'
import { appointmentsApi, usersApi, type Appointment } from '@/lib/api'
import { useFamily } from '@/contexts/FamilyContext'

const INK = '#0E51A2'
const ACCENT = '#0F5FDC'
const CONTAINER = 'max-w-[480px] mx-auto lg:max-w-full px-4 lg:px-6'

/** Combine the stored date (YYYY-MM-DD) and the display time slot into a Date. */
function getAppointmentDateTime(appointment: Appointment): Date {
  const [year, month, day] = appointment.appointmentDate.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)

  const parts = appointment.timeSlot?.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (parts) {
    let hours = parseInt(parts[1], 10)
    const minutes = parseInt(parts[2], 10)
    if (parts[3].toUpperCase() === 'PM' && hours !== 12) hours += 12
    if (parts[3].toUpperCase() === 'AM' && hours === 12) hours = 0
    date.setHours(hours, minutes, 0, 0)
  }
  return date
}

const isClosed = (status: string) =>
  status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW'

const isPending = (status: string) =>
  status === 'PENDING_CONFIRMATION' || status === 'SCHEDULED'

function statusChipStyle(status: string): React.CSSProperties {
  if (status === 'CONFIRMED') return { background: '#25A425', color: '#ffffff' }
  if (status === 'COMPLETED') return { background: '#6b7280', color: '#ffffff' }
  if (status === 'CANCELLED' || status === 'NO_SHOW') return { background: '#E53535', color: '#ffffff' }
  return { background: '#FEF3C7', color: '#92400E' }
}

function statusText(status: string) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
    case 'SCHEDULED':
      return 'Confirming'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    case 'NO_SHOW':
      return 'Missed'
    default:
      return status
  }
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className="px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap"
      style={statusChipStyle(status)}
    >
      {statusText(status)}
    </span>
  )
}

function SectionHeading({ label, count, tone }: { label: string; count: number; tone: 'active' | 'muted' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: tone === 'active' ? '#22c55e' : '#9ca3af' }}
      />
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: INK }}>
        {label}
      </h2>
      <span className="text-[13px] font-semibold text-gray-400">{count}</span>
    </div>
  )
}

function UpcomingCard({
  appointment,
  isNext,
  onCancel,
}: {
  appointment: Appointment
  isNext: boolean
  onCancel: (id: string) => void
}) {
  const when = getAppointmentDateTime(appointment)
  const dateLabel = when.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const clinic = [appointment.clinicName, appointment.clinicAddress].filter(Boolean).join(', ')

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: 'linear-gradient(135deg, #eaeffb 0%, #e3ebf8 100%)',
        borderColor: '#d7e1f4',
      }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#dbe6f9' }}
        >
          <UserIcon className="w-6 h-6" style={{ color: ACCENT }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {isNext && (
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.05em] bg-white border"
                style={{ color: INK, borderColor: '#cddcf3' }}
              >
                Next Visit
              </span>
            )}
            <StatusChip status={appointment.status} />
            {isPending(appointment.status) && (
              <span className="text-[12px] text-gray-500">clinic is confirming your slot</span>
            )}
          </div>

          <h3 className="text-lg font-bold leading-tight truncate" style={{ color: INK }}>
            {appointment.doctorName}
          </h3>
          <p className="text-[13px] text-gray-500 truncate">
            {appointment.specialty} · {appointment.patientName}
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl px-4 py-3.5 border"
        style={{ background: 'rgba(255,255,255,0.6)', borderColor: '#cddcf3' }}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#1f3a68' }}>
            <CalendarIcon className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#1f3a68' }}>
            <ClockIcon className="w-[18px] h-[18px]" style={{ color: ACCENT }} />
            {appointment.timeSlot}
          </span>
        </div>
        {clinic && (
          <div className="mt-2.5 flex items-start gap-2 text-sm" style={{ color: '#1f3a68' }}>
            <MapPinIcon className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <span>{clinic}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-gray-400 truncate">{appointment.appointmentId}</span>
          <span className="text-[15px] font-bold" style={{ color: '#25A425' }}>
            ₹{appointment.consultationFee}
          </span>
        </div>
        <button
          onClick={() => onCancel(appointment.appointmentId)}
          className="text-[13px] font-medium underline underline-offset-2 hover:no-underline flex-shrink-0"
          style={{ color: '#dc4b45' }}
        >
          Cancel appointment
        </button>
      </div>
    </div>
  )
}

function PastRow({ appointment }: { appointment: Appointment }) {
  const when = getAppointmentDateTime(appointment)
  const details = [
    appointment.specialty,
    appointment.timeSlot,
    appointment.clinicAddress || appointment.clinicName,
    appointment.appointmentId,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-11 text-center flex-shrink-0">
        <div className="text-[22px] font-bold leading-none" style={{ color: INK }}>
          {String(when.getDate()).padStart(2, '0')}
        </div>
        <div className="text-[11px] font-semibold uppercase text-gray-400 mt-0.5">
          {when.toLocaleString('en-IN', { month: 'short' })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold truncate" style={{ color: INK }}>
          {appointment.doctorName}
        </div>
        <div className="text-[13px] text-gray-500 truncate">{details}</div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <StatusChip status={appointment.status} />
        <span className="text-[15px] font-semibold text-gray-700">₹{appointment.consultationFee}</span>
        {appointment.hasPrescription && appointment.prescriptionId ? (
          <ViewPrescriptionButton
            prescriptionId={appointment.prescriptionId}
            hasPrescription={appointment.hasPrescription}
            label="Prescription"
            className="!w-auto !px-4 !py-2 !rounded-lg"
          />
        ) : appointment.status === 'CANCELLED' ? (
          <span className="text-[13px] text-gray-400 whitespace-nowrap">Refunded to wallet</span>
        ) : null}
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { viewingUserId, familyMembers, isLoading: familyLoading } = useFamily()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<any>(null)

  // Links from the dashboard carry ?defaultPatient=<id>. sessionStorage-backed
  // viewingUserId is empty in a fresh tab, so without this the page silently
  // falls back to the logged-in user. Only honour the param if it names one of
  // this member's own family profiles — it decides whose records are shown.
  const requestedPatient = searchParams.get('defaultPatient')
  const linkedPatientId =
    requestedPatient && familyMembers.some((m) => m._id === requestedPatient)
      ? requestedPatient
      : null

  const fetchAppointments = async (userId: string) => {
    try {
      const data = await appointmentsApi.getUserAppointments(userId, 'IN_CLINIC')
      setAppointments(data)
    } catch (error) {
      console.error('[Appointments] Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = useCallback(async () => {
    try {
      const data = await usersApi.getCurrentUser()
      setUser(data)

      // PRIVACY: show the linked profile if the URL named a valid one, else the
      // active profile, else the logged-in user.
      await fetchAppointments(linkedPatientId || viewingUserId || data._id)
    } catch (error) {
      console.error('[Appointments] Error fetching user data:', error)
      setLoading(false)
    }
  }, [linkedPatientId, viewingUserId])

  useEffect(() => {
    // Wait for the family list, otherwise validating the URL param would
    // always fail on first render and drop us to the logged-in user.
    if (familyLoading) return
    fetchUserData()
  }, [fetchUserData, familyLoading])

  const handleBookAppointment = () => {
    router.push(
      viewingUserId
        ? `/member/appointments/specialties?defaultPatient=${viewingUserId}`
        : '/member/appointments/specialties'
    )
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? Your wallet will be refunded.')) {
      return
    }

    try {
      await appointmentsApi.cancel(appointmentId)
      alert('Appointment cancelled successfully. Your wallet has been refunded.')
      await fetchAppointments(linkedPatientId || viewingUserId || user._id)
    } catch (error) {
      console.error('[Appointments] Error cancelling appointment:', error)
      alert('Failed to cancel appointment: ' + (error as Error).message)
    }
  }

  const now = new Date()
  const upcoming = appointments
    .filter((a) => !isClosed(a.status) && getAppointmentDateTime(a) > now)
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime())
  const past = appointments
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime())

  const activeProfile = familyMembers.find((m) => m._id === (linkedPatientId || viewingUserId))
  const profileName = activeProfile
    ? `${activeProfile.name.firstName} ${activeProfile.name.lastName}`.trim()
    : appointments[0]?.patientName || user?.fullName || ''
  const summary =
    appointments.length === 0
      ? 'nothing booked yet'
      : `${upcoming.length} upcoming, ${past.length} past`
  const subtitle = [profileName, summary].filter(Boolean).join(' · ')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f4f6fb' }}>
        <div
          className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: ACCENT, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f4f6fb' }}>
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className={`${CONTAINER} py-4`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/member')}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-[1.25] truncate" style={{ color: INK }}>
                In-Clinic Appointments
              </h1>
              {subtitle && <p className="mt-0.5 text-[13px] text-gray-500 truncate">{subtitle}</p>}
            </div>

            <button
              onClick={handleBookAppointment}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold flex-shrink-0 transition-all duration-200 hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: 'linear-gradient(180deg, #1a6fd4 0%, #034da2 100%)',
                // @ts-expect-error -- CSS custom property for the Tailwind focus ring colour
                '--tw-ring-color': ACCENT,
              }}
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Book New Appointment</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`${CONTAINER} py-6`}>
        {appointments.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-14 lg:py-16 text-center"
            style={{
              background: 'linear-gradient(135deg, #eaeffb 0%, #e3ebf8 100%)',
              borderColor: '#d7e1f4',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: '#dbe6f9' }}
            >
              <CalendarIcon className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: INK }}>
              No in-clinic appointments
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Pick a specialty, choose a doctor and slot, and the consultation fee is paid
              straight from your OPD wallet.
            </p>
            <button
              onClick={handleBookAppointment}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: 'linear-gradient(180deg, #1a6fd4 0%, #034da2 100%)',
                // @ts-expect-error -- CSS custom property for the Tailwind focus ring colour
                '--tw-ring-color': ACCENT,
              }}
            >
              <PlusIcon className="w-5 h-5" />
              Book New Appointment
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-8">
                <SectionHeading label="Upcoming" count={upcoming.length} tone="active" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {upcoming.map((appointment, index) => (
                    <UpcomingCard
                      key={appointment._id}
                      appointment={appointment}
                      isNext={index === 0}
                      onCancel={handleCancelAppointment}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <SectionHeading label="Past" count={past.length} tone="muted" />
                <div className="bg-white rounded-2xl border border-[#e4e9f2] divide-y divide-[#eef1f7] overflow-hidden">
                  {past.map((appointment) => (
                    <PastRow key={appointment._id} appointment={appointment} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
