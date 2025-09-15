'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/Card'
import { StatusBadge } from '../../../components/StatusBadge'
import { MemberSwitcher } from '../../../components/family/MemberSwitcher'
import { useFamily } from '../../../contexts/FamilyContext'
import {
  UsersIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function FamilyHubPage() {
  const { familyMembers, activeMember, setActiveMemberById } = useFamily()
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalFamilyCoverage = familyMembers.reduce((sum, member) => sum + member.coverage, 0)
  const totalFamilyUsed = familyMembers.reduce((sum, member) => sum + member.used, 0)

  const scrollToMember = (direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return

    const cardWidth = 320
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Member Switcher */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">Family Hub</h1>
            <Link
              href="/member/family/add"
              className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              <UserPlusIcon className="h-5 w-5" />
            </Link>
          </div>

          {/* Member Switcher */}
          <MemberSwitcher showWalletBalance={true} />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Family Hub</h1>
            <p className="text-gray-500 mt-1">Manage your family members and their benefits</p>
          </div>
          <Link
            href="/member/family/add"
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Member
          </Link>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Active Member Details - Mobile */}
        <div className="md:hidden">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-14 w-14 rounded-full bg-teal-600 text-white text-lg font-semibold flex items-center justify-center">
                  {getInitials(activeMember.name)}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeMember.name}
                    {activeMember.isPrimary && (
                      <span className="ml-2 text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">Primary</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{activeMember.relationship} • {activeMember.age} years</p>
                </div>
              </div>
              <StatusBadge status={activeMember.status} size="sm" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <WalletIcon className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Wallet</p>
                <p className="text-sm font-semibold text-gray-900">₹{activeMember.walletBalance?.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <HeartIcon className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Used</p>
                <p className="text-sm font-semibold text-gray-900">₹{activeMember.used.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-sm font-semibold text-gray-900">₹{(activeMember.coverage - activeMember.used).toLocaleString()}</p>
              </div>
            </div>

            {/* Benefits Usage */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Benefits Used</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Consultations</span>
                  <span className="text-sm font-medium text-gray-900">{activeMember.benefitsUsed?.consultations || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Medicines</span>
                  <span className="text-sm font-medium text-gray-900">{activeMember.benefitsUsed?.medicines || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Diagnostics</span>
                  <span className="text-sm font-medium text-gray-900">{activeMember.benefitsUsed?.diagnostics || 0}</span>
                </div>
              </div>
            </div>

            {/* Coverage Progress */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Coverage Utilization</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((activeMember.used / activeMember.coverage) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-teal-400 to-teal-600 rounded-full h-2"
                  style={{ width: `${(activeMember.used / activeMember.coverage) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Family Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <UsersIcon className="h-6 w-6 mb-2 text-blue-200" />
            <p className="text-xl md:text-2xl font-bold">{familyMembers.length}</p>
            <p className="text-xs md:text-sm text-blue-100">Family Members</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
            <p className="text-xs md:text-sm text-teal-100">Total Coverage</p>
            <p className="text-xl md:text-2xl font-bold">₹{(totalFamilyCoverage / 100000).toFixed(0)}L</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <p className="text-xs md:text-sm text-orange-100">Total Used</p>
            <p className="text-xl md:text-2xl font-bold">₹{(totalFamilyUsed / 1000).toFixed(0)}K</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-xs md:text-sm text-purple-100">Available</p>
            <p className="text-xl md:text-2xl font-bold">₹{((totalFamilyCoverage - totalFamilyUsed) / 100000).toFixed(1)}L</p>
          </div>
        </div>

        {/* Swipeable Member Cards */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Members</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => scrollToMember('left')}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
              </button>
              <button
                onClick={() => scrollToMember('right')}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4" ref={scrollRef}>
            <div className="flex space-x-4" style={{ width: `${familyMembers.length * 320}px` }}>
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex-none w-80 bg-white rounded-xl border border-gray-200 p-4"
                  style={{ width: '300px' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        member.isPrimary ? 'bg-teal-600' : 'bg-gray-400'
                      }`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {member.name}
                          {member.isPrimary && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Primary</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500">{member.relationship} • {member.age} years</p>
                      </div>
                    </div>
                    <StatusBadge status={member.status} size="xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Wallet</p>
                      <p className="text-sm font-medium text-gray-900">₹{member.walletBalance?.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Used</p>
                      <p className="text-sm font-medium text-gray-900">₹{(member.used / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Coverage</span>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((member.used / member.coverage) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-600 rounded-full h-1.5"
                        style={{ width: `${(member.used / member.coverage) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveMemberById(member.id)}
                      className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs font-medium"
                    >
                      Switch To
                    </button>
                    <button className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Family Members Grid */}
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Family Members</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {familyMembers.map((member) => (
              <Card key={member.id} className={member.isPrimary ? 'ring-2 ring-teal-200' : ''}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold ${
                      member.isPrimary ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gray-400'
                    }`}>
                      {getInitials(member.name)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.name}
                        {member.isPrimary && (
                          <span className="ml-2 text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">Primary</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{member.relationship} • {member.age} years</p>
                    </div>
                  </div>
                  <StatusBadge status={member.status} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <WalletIcon className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Wallet Balance</p>
                    <p className="text-sm font-semibold text-gray-900">₹{member.walletBalance?.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <HeartIcon className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Coverage Used</p>
                    <p className="text-sm font-semibold text-gray-900">₹{member.used.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="text-sm font-semibold text-gray-900">₹{(member.coverage - member.used).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">Member ID:</span>
                    <span className="ml-1">{member.memberId}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium">UHID:</span>
                    <span className="ml-1">{member.uhid}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {member.phone}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Coverage Utilization</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((member.used / member.coverage) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-teal-600 rounded-full h-2"
                      style={{ width: `${(member.used / member.coverage) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    Edit
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}