'use client'

import Link from 'next/link'
import { useFamily } from '../../../contexts/FamilyContext'
import {
  UsersIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

export default function FamilyHubPage() {
  const { familyMembers, activeMember } = useFamily()

  const getFullName = (name: { firstName: string; lastName: string }) => {
    return `${name.firstName} ${name.lastName}`
  }

  const getInitials = (name: { firstName: string; lastName: string }) => {
    return `${name.firstName[0]}${name.lastName[0]}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Family Hub</h1>
            <p className="text-gray-500 mt-1">Manage your family members</p>
          </div>
          <Link
            href="/member/family/add"
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Add Member</span>
          </Link>
        </div>

        {/* Under Construction Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Page Under Construction</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Advanced family management features are being developed. Basic family member list is shown below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Family Members Count */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-6 text-white mb-6">
        <UsersIcon className="h-8 w-8 mb-2 text-teal-200" />
        <p className="text-3xl font-bold">{familyMembers.length}</p>
        <p className="text-teal-100">Family Members</p>
      </div>

      {/* Family Members List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Family Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => (
            <div key={member._id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start mb-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  member.isPrimary ? 'bg-teal-600' : 'bg-gray-400'
                }`}>
                  {getInitials(member.name)}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    {getFullName(member.name)}
                    {member.isPrimary && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Primary</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{member.relationship}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">ID:</span>
                  <span className="ml-1">{member.memberId}</span>
                </div>
                {member.email && (
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {member.phone}
                  </div>
                )}
                {member.gender && (
                  <div className="text-gray-600">
                    <span className="font-medium">Gender:</span> {member.gender}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}