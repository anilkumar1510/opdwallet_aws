'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import { Appointment, confirmAppointment } from '@/lib/api/appointments'
import { getStatusColor, getAppointmentTypeText } from '@/lib/utils/appointment-helpers'
import {
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface AppointmentCardProps {
  appointment: Appointment
  onUpdate?: () => void
}

function AppointmentCard({ appointment, onUpdate }: AppointmentCardProps) {
  const [confirming, setConfirming] = useState(false)

  const getTypeIcon = (type: string) => {
    if (type === 'ONLINE') {
      return <VideoCameraIcon className="h-5 w-5 text-brand-600" />
    }
    return <UserIcon className="h-5 w-5 text-gray-600" />
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (confirming) return

    try {
      setConfirming(true)
      await confirmAppointment(appointment.appointmentId)
      if (onUpdate) onUpdate()
    } catch (error: any) {
      alert(error.message || 'Failed to confirm appointment')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow relative">
      <Link
        href={`/doctorview/appointments/${appointment.appointmentId}`}
        className="block"
      >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(appointment.appointmentType)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {appointment.patientName}
            </h3>
            <p className="text-sm text-gray-500">
              {getAppointmentTypeText(appointment.appointmentType)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          <span>{appointment.appointmentDate}</span>
          <ClockIcon className="h-4 w-4 ml-3 mr-2" />
          <span>{appointment.timeSlot}</span>
        </div>

        {appointment.contactNumber && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <span>{appointment.contactNumber}</span>
          </div>
        )}

        {appointment.clinicName && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Clinic:</span> {appointment.clinicName}
          </div>
        )}
      </div>

      {appointment.hasPrescription && (
        <div className="mt-4 flex items-center text-sm text-green-600">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          <span>Prescription uploaded</span>
        </div>
      )}

      {!appointment.hasPrescription && appointment.status === 'CONFIRMED' && (
        <div className="mt-4">
          <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Upload Prescription →
          </button>
        </div>
      )}
    </Link>

    {/*
      The way into the video room from the list.

      Until now the only entry was the appointment DETAIL page, so a doctor with
      a patient waiting had to open the appointment first and find "Start Video
      Consultation" there. The member's side has the same button on their own
      list; this is its counterpart.

      Shown on the same terms the member's is: an online consultation that has
      been confirmed and has no prescription yet, since a prescription means the
      consultation is over. It sits OUTSIDE the wrapping Link so it navigates to
      the room rather than to the appointment.
    */}
    {appointment.appointmentType === 'ONLINE' &&
      appointment.status === 'CONFIRMED' &&
      !appointment.hasPrescription && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={`/doctorview/consultations/${appointment.appointmentId}`}
            className="flex w-full items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            <VideoCameraIcon className="h-4 w-4 mr-2" />
            Join call
          </Link>
        </div>
      )}

    {appointment.status === 'PENDING_CONFIRMATION' && (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {confirming ? 'Confirming...' : 'Confirm Appointment'}
        </button>
      </div>
    )}
    </div>
  )
}

export default memo(AppointmentCard)
