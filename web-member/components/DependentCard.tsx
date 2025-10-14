'use client'

import { UserIcon } from '@heroicons/react/24/outline'

interface Dependent {
  _id?: string
  id?: string
  name?: {
    firstName?: string
    lastName?: string
  }
  dob?: string
  gender?: string
  relationship?: string
  phone?: string
  [key: string]: any
}

interface DependentCardProps {
  dependent: Dependent
}

export default function DependentCard({ dependent }: DependentCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getInitials = () => {
    const firstName = dependent.name?.firstName || ''
    const lastName = dependent.name?.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  }

  const fullName = dependent.name
    ? `${dependent.name.firstName || ''} ${dependent.name.lastName || ''}`.trim()
    : 'Unknown'

  return (
    <div className="card group hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-xl">
            {getInitials()}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{fullName}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {dependent.relationship && (
              <div>
                <span className="text-gray-500">Relationship:</span>{' '}
                <span className="text-gray-900 font-medium">{dependent.relationship}</span>
              </div>
            )}
            {dependent.gender && (
              <div>
                <span className="text-gray-500">Gender:</span>{' '}
                <span className="text-gray-900 font-medium">{dependent.gender}</span>
              </div>
            )}
            {dependent.dob && (
              <div>
                <span className="text-gray-500">Date of Birth:</span>{' '}
                <span className="text-gray-900 font-medium">{formatDate(dependent.dob)}</span>
              </div>
            )}
            {dependent.phone && (
              <div>
                <span className="text-gray-500">Mobile:</span>{' '}
                <span className="text-gray-900 font-medium">{dependent.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
