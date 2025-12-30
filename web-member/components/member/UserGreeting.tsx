'use client';

import React from 'react';
import { useFamily } from '@/contexts/FamilyContext';

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  _id?: string;
}

interface UserGreetingProps {
  userName: string;
  familyMembers?: FamilyMember[];
}

export default function UserGreeting({ userName, familyMembers = [] }: UserGreetingProps) {
  const { activeMember, setActiveMember, canSwitchProfiles } = useFamily();

  const handleAvatarClick = (member: FamilyMember) => {
    const memberId = member._id || member.id;
    const isActive = activeMember?._id === memberId;

    if (!isActive && canSwitchProfiles) {
      // Switch to the selected member
      setActiveMember({
        _id: memberId,
        userId: memberId,
        name: {
          firstName: member.name.split(' ')[0] || '',
          lastName: member.name.split(' ')[1] || '',
        },
        relationship: 'Dependent',
        memberId: memberId,
        isPrimary: false,
      } as any);

      // Reload to update all data
      window.location.reload();
    }
  };

  const isActiveMember = (member: FamilyMember) => {
    const memberId = member._id || member.id;
    return activeMember?._id === memberId;
  };

  return (
    <section className="px-4 lg:px-6 pt-5 lg:pt-6 pb-4 lg:pb-4 max-w-[480px] mx-auto lg:max-w-full bg-white">
      <div className="flex items-center justify-between">
        {/* Greeting Text */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm lg:text-base text-ink-500">
            Welcome back to OPD Wallet,
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold text-black">{userName}!</h1>
        </div>

        {/* Family Avatars with Profile Switching */}
        {familyMembers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide p-2">
            {familyMembers.map((member) => {
              const isActive = isActiveMember(member);

              return (
                <button
                  key={member.id}
                  onClick={() => handleAvatarClick(member)}
                  className={`relative flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold text-sm lg:text-base cursor-pointer transition-all ${
                    isActive
                      ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 bg-blue-100 text-blue-700'
                      : 'hover:scale-105 bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                  title={`Switch to ${member.name}`}
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{member.initials}</span>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
