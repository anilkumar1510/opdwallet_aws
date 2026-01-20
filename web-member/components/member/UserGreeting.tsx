'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFamily } from '@/contexts/FamilyContext';
import SwitchProfileModal from '@/components/SwitchProfileModal';

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
  const router = useRouter();
  const { activeMember, setActiveMember, canSwitchProfiles } = useFamily();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationPopup(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCartPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = (member: FamilyMember) => {
    const memberId = member._id || member.id;
    const isActive = activeMember?._id === memberId;

    if (!isActive && canSwitchProfiles) {
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
      window.location.reload();
    }
  };

  const isActiveMember = (member: FamilyMember) => {
    const memberId = member._id || member.id;
    return activeMember?._id === memberId;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('viewingUserId');
      }

      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSwitchProfiles = () => {
    setShowDropdown(false);
    setShowSwitchModal(true);
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    router.push('/member/profile');
  };

  const handleViewServices = () => {
    setShowDropdown(false);
    router.push('/member/services');
  };

  // Get first name and initials
  const firstName = userName.split(' ')[0] || userName;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <section className="px-5 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 max-w-[480px] mx-auto lg:max-w-full" style={{ backgroundColor: '#f7f7fc' }}>
        {/* Mobile View - Figma Design */}
        <div className="lg:hidden flex items-center justify-between gap-4">
          {/* Left: Avatar + Greeting */}
          <div className="flex items-center gap-[9px]">
            {/* Avatar Circle */}
            <button
              className="relative flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center font-medium text-[13px] cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #0E51A2 0%, #1F77E0 100%)',
                color: '#FFFFFF'
              }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {initials}
            </button>

            {/* Greeting Text with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex flex-col gap-[2px] text-left"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="flex items-center gap-[5px]">
                  <span className="text-[16px] font-medium leading-[1.2] whitespace-nowrap" style={{ color: '#000000', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                    Hi {firstName}!
                  </span>
                  {/* Dropdown Arrow */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`flex-shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : 'rotate-90'}`}
                  >
                    <path d="M6 3L10.5 8L6 13" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[12px] font-normal leading-normal whitespace-nowrap" style={{ color: '#656565', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                  welcome to OPD Wallet
                </span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  className="absolute top-full left-0 mt-2 w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                  style={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}
                >
                  {/* Switch Profiles - Only show if user can switch profiles */}
                  {canSwitchProfiles && (
                    <button
                      onClick={handleSwitchProfiles}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-[14px] font-normal"
                      style={{ color: '#383838', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                    >
                      Switch Profile
                    </button>
                  )}

                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-[14px] font-normal"
                    style={{ color: '#383838', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                  >
                    Profile
                  </button>

                  <button
                    onClick={handleViewServices}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-[14px] font-normal"
                    style={{ color: '#383838', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                  >
                    All Services
                  </button>

                  {/* Divider */}
                  <div className="my-1 border-t border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors text-[14px] font-normal"
                    style={{ color: '#EF4444', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-[9px]">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotificationPopup(!showNotificationPopup);
                  setShowCartPopup(false);
                }}
                className="w-[35px] h-[35px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                style={{ backgroundColor: '#fbfdfe' }}
              >
                <img
                  src="/images/icons/notification-bell.svg"
                  alt="Notifications"
                  width={14}
                  height={15}
                  className="object-contain"
                />
              </button>

              {/* No Notifications Popup */}
              {showNotificationPopup && (
                <div
                  className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-[200px] bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-[100]"
                  style={{
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                    top: '120px'
                  }}
                >
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#9CA3AF"/>
                      </svg>
                    </div>
                    <span className="text-[14px] font-medium text-gray-600" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                      No notifications
                    </span>
                    <span className="text-[12px] text-gray-400 text-center" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                      You're all caught up!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Icon - Links to Wallet Page */}
            <Link
              href="/member/wallet"
              className="w-[35px] h-[35px] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              style={{ backgroundColor: '#fbfdfe' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z" fill="#034DA2"/>
                <path d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z" fill="#034DA2"/>
              </svg>
            </Link>

            {/* Cart Icon */}
            <div className="relative" ref={cartRef}>
              <button
                onClick={() => {
                  setShowCartPopup(!showCartPopup);
                  setShowNotificationPopup(false);
                }}
                className="w-[35px] h-[35px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                style={{ backgroundColor: '#fbfdfe' }}
              >
                <img
                  src="/images/icons/cart-icon.svg"
                  alt="Cart"
                  width={14}
                  height={15}
                  className="object-contain"
                />
              </button>

              {/* Coming Soon Popup */}
              {showCartPopup && (
                <div
                  className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-[200px] bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-[100]"
                  style={{
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                    top: '120px'
                  }}
                >
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.48C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z" fill="#034DA2"/>
                      </svg>
                    </div>
                    <span className="text-[14px] font-medium text-gray-800" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                      Coming Soon
                    </span>
                    <span className="text-[12px] text-gray-400 text-center" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
                      Cart feature will be available soon!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop View - Original Design */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-base text-ink-500">
              Welcome back to OPD Wallet,
            </span>
            <h1 className="text-3xl font-bold text-black">{userName}!</h1>
          </div>

          {familyMembers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide p-2">
              {familyMembers.map((member) => {
                const isActive = isActiveMember(member);
                return (
                  <button
                    key={member.id}
                    onClick={() => handleAvatarClick(member)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base cursor-pointer transition-all ${
                      isActive ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'hover:scale-105'
                    }`}
                    style={{
                      background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                      border: '1px solid #A4BFFE7A',
                      boxShadow: '-2px 11px 46.1px 0px #0000000D',
                      color: '#0E51A2'
                    }}
                    title={`Switch to ${member.name}`}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{member.initials}</span>
                    )}
                    {isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white" style={{ background: '#046D40' }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Switch Profile Modal */}
      <SwitchProfileModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />
    </>
  );
}
