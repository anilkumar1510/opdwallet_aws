'use client';

import React from 'react';
import Link from 'next/link';
import { usePolicyPDF } from '@/lib/hooks/usePolicyPDF';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface QuickLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  mobileIcon: React.ReactNode;
  href?: string;
  iconBgColor: string;
  isAction?: boolean;
}

const quickLinksConfig: QuickLink[] = [
  {
    id: 'health-records',
    label: 'Health Records',
    icon: <DocumentTextIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: (
      <svg viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M16 2H11.82C11.4 0.84 10.3 0 9 0C7.7 0 6.6 0.84 6.18 2H2C0.9 2 0 2.9 0 4V18C0 19.1 0.9 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM9 2C9.55 2 10 2.45 10 3C10 3.55 9.55 4 9 4C8.45 4 8 3.55 8 3C8 2.45 8.45 2 9 2ZM11 16H4V14H11V16ZM14 12H4V10H14V12ZM14 8H4V6H14V8Z" fill="#034DA2"/>
      </svg>
    ),
    href: '/member/health-records',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: <CalendarDaysIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: (
      <svg viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M16 2H15V0H13V2H5V0H3V2H2C0.89 2 0.01 2.9 0.01 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM16 18H2V7H16V18ZM4 9H9V14H4V9Z" fill="#034DA2"/>
      </svg>
    ),
    href: '/member/bookings',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: (
      <svg viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M13 0H3C1.9 0 1 0.9 1 2V3H0V6H1V14H0V17H1V18C1 19.1 1.9 20 3 20H13C14.1 20 15 19.1 15 18V17H16V14H15V6H16V3H15V2C15 0.9 14.1 0 13 0ZM8 18C7.45 18 7 17.55 7 17C7 16.45 7.45 16 8 16C8.55 16 9 16.45 9 17C9 17.55 8.55 18 8 18ZM13 14H3V4H13V14Z" fill="#034DA2"/>
      </svg>
    ),
    href: '/member/claims',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    icon: <BanknotesIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: (
      <svg viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M18 0H2C0.9 0 0.01 0.9 0.01 2L0 16C0 17.1 0.9 18 2 18H18C19.1 18 20 17.1 20 16V2C20 0.9 19.1 0 18 0ZM18 16H2V2H18V16ZM10 4C8.34 4 7 5.34 7 7C7 8.66 8.34 10 10 10C11.66 10 13 8.66 13 7C13 5.34 11.66 4 10 4ZM4 14C4 12 8 10.9 10 10.9C12 10.9 16 12 16 14V15H4V14Z" fill="#034DA2"/>
      </svg>
    ),
    href: '/member/transactions',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'download-policy',
    label: 'Download Policy',
    icon: <ArrowDownTrayIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: (
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M16 6H13V0H5V6H2L9 13L16 6ZM0 16V18H18V16H0Z" fill="#034DA2"/>
      </svg>
    ),
    iconBgColor: 'bg-blue-50',
    isAction: true,
  },
];

export default function QuickLinks() {
  const { generatePDF, isGenerating } = usePolicyPDF();

  const handleLinkClick = (link: QuickLink) => {
    if (link.id === 'download-policy') {
      generatePDF();
    }
  };

  // Mobile quick link item (new design)
  const renderMobileQuickLink = (link: QuickLink) => {
    const content = (
      <>
        {link.mobileIcon}
        <span className="text-base font-normal whitespace-nowrap" style={{ color: '#383838' }}>
          {link.id === 'download-policy' && isGenerating ? 'Generating...' : link.label}
        </span>
        <div className="w-[10px] h-[10px] flex-shrink-0 ml-[2px]">
          <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 1.5L7 5L3.5 8.5" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </>
    );

    const baseClasses = "flex items-center gap-2 px-[14px] py-2 rounded-2xl transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0px_13px_50px_0px_rgba(0,0,0,0.08)] active:translate-y-0 flex-shrink-0";
    const baseStyles = {
      background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f5 100%)',
      border: '1px solid rgba(3, 77, 162, 0.11)',
      boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.05)'
    };

    if (link.isAction) {
      return (
        <button
          key={link.id}
          onClick={() => handleLinkClick(link)}
          disabled={isGenerating}
          className={`${baseClasses} ${isGenerating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          style={baseStyles}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={link.id}
        href={link.href!}
        className={baseClasses}
        style={baseStyles}
      >
        {content}
      </Link>
    );
  };

  // Desktop quick link item (original design)
  const renderDesktopQuickLink = (link: QuickLink) => {
    const content = (
      <>
        <div
          className="rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
            border: '1px solid #A4BFFE7A',
            boxShadow: '-2px 11px 46.1px 0px #0000000D'
          }}
        >
          {link.icon}
        </div>
        <span className="text-gray-700 text-sm text-center leading-snug font-semibold w-full">
          {link.id === 'download-policy' && isGenerating ? 'Generating...' : link.label}
        </span>
      </>
    );

    if (link.isAction) {
      return (
        <button
          key={link.id}
          onClick={() => handleLinkClick(link)}
          disabled={isGenerating}
          className={`flex-1 min-h-[140px] bg-white border-2 border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-start gap-4 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 ${isGenerating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={link.id}
        href={link.href!}
        className="flex-1 min-h-[140px] bg-white border-2 border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-start gap-4 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="px-4 lg:px-6 py-6 lg:py-8 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6">
        Quick Links
      </h2>

      {/* Mobile: Horizontal layout with new design */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {quickLinksConfig.map((link) => renderMobileQuickLink(link))}
      </div>

      {/* Desktop: Grid layout with original design */}
      <div className="hidden lg:flex lg:gap-4">
        {quickLinksConfig.map((link) => renderDesktopQuickLink(link))}
      </div>
    </section>
  );
}
