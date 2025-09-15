'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { useFamily } from '@/contexts/FamilyContext'

interface MemberSwitcherProps {
  variant?: 'compact' | 'full'
  showWalletBalance?: boolean
  className?: string
}

export function MemberSwitcher({
  variant = 'full',
  showWalletBalance = true,
  className = ''
}: MemberSwitcherProps) {
  const { familyMembers, activeMember, setActiveMember } = useFamily()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMemberSelect = (member: typeof familyMembers[0]) => {
    setActiveMember(member)
    setIsOpen(false)
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-teal-600 text-white text-xs font-semibold flex items-center justify-center">
            {getInitials(activeMember.name)}
          </div>
          <ChevronLeftIcon className={`h-4 w-4 text-gray-400 ml-1 transform transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleMemberSelect(member)}
                className={`w-full flex items-center p-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  member.id === activeMember.id ? 'bg-teal-50' : ''
                }`}
              >
                <div className={`h-8 w-8 rounded-full text-white text-xs font-semibold flex items-center justify-center ${
                  member.isPrimary ? 'bg-teal-600' : 'bg-gray-400'
                }`}>
                  {getInitials(member.name)}
                </div>
                <div className="ml-3 text-left flex-1">
                  <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.relationship} • {member.age} years</p>
                </div>
                {member.id === activeMember.id && (
                  <CheckCircleIcon className="h-4 w-4 text-teal-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-teal-600 text-white text-sm font-semibold flex items-center justify-center">
            {getInitials(activeMember.name)}
          </div>
          <div className="ml-3 text-left">
            <p className="font-medium text-gray-900">{activeMember.name}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>{activeMember.relationship}</span>
              {showWalletBalance && activeMember.walletBalance !== undefined && (
                <>
                  <span className="mx-1">•</span>
                  <span>₹{activeMember.walletBalance.toLocaleString()} wallet</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronLeftIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {familyMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleMemberSelect(member)}
              className={`w-full flex items-center p-4 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                member.id === activeMember.id ? 'bg-teal-50' : ''
              }`}
            >
              <div className={`h-10 w-10 rounded-full text-white text-sm font-semibold flex items-center justify-center ${
                member.isPrimary ? 'bg-teal-600' : 'bg-gray-400'
              }`}>
                {getInitials(member.name)}
              </div>
              <div className="ml-3 text-left flex-1">
                <div className="flex items-center">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  {member.isPrimary && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Primary</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{member.relationship} • {member.age} years</p>
                {showWalletBalance && member.walletBalance !== undefined && (
                  <p className="text-xs text-teal-600 font-medium">₹{member.walletBalance.toLocaleString()} available</p>
                )}
              </div>
              {member.id === activeMember.id && (
                <CheckCircleIcon className="h-5 w-5 text-teal-600" />
              )}
            </button>
          ))}

          <div className="border-t border-gray-100">
            <div className="p-4 bg-gray-50">
              <div className="flex items-center text-gray-600">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{familyMembers.length} family members</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Quick action component for switching members in cards/lists
export function QuickMemberSwitch({ className = '' }: { className?: string }) {
  const { familyMembers, setActiveMemberById } = useFamily()

  return (
    <div className={`flex space-x-2 ${className}`}>
      {familyMembers.slice(0, 4).map((member) => (
        <button
          key={member.id}
          onClick={() => setActiveMemberById(member.id)}
          className="h-8 w-8 rounded-full bg-gray-200 hover:bg-teal-600 text-white text-xs font-semibold flex items-center justify-center transition-colors"
          title={`Switch to ${member.name}`}
        >
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </button>
      ))}
    </div>
  )
}