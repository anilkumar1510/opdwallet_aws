'use client'

import Link from 'next/link'
import { Appointment } from '@/lib/api/appointments'
import {
  ClockIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface AppointmentCardProps {
  appointment: Appointment
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    if (type === 'ONLINE') {
      return <VideoCameraIcon className="h-5 w-5 text-brand-600" />
    }
    return <UserIcon className="h-5 w-5 text-gray-600" />
  }

  return (
    <Link
      href={`/doctorview/appointments/${appointment.appointmentId}`}
      className="block card hover:shadow-md transition-shadow"
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
              {appointment.appointmentType === 'ONLINE' ? 'Online Consultation' : 'In-Clinic Visit'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-2" />
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
  )
}
