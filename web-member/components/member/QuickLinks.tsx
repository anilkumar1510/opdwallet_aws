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
  mobileIcon: string;
  mobileIconWidth: number;
  mobileIconHeight: number;
  href?: string;
  iconBgColor: string;
  isAction?: boolean;
}

// Mobile quick links matching Figma design exactly (5 items)
const mobileQuickLinksConfig: QuickLink[] = [
  {
    id: 'health-records',
    label: 'Health Records',
    icon: <DocumentTextIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-health-records.svg',
    mobileIconWidth: 16,
    mobileIconHeight: 19,
    href: '/member/health-records',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: <CalendarDaysIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-my-bookings.svg',
    mobileIconWidth: 18,
    mobileIconHeight: 17,
    href: '/member/bookings',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-claims.svg',
    mobileIconWidth: 16,
    mobileIconHeight: 19,
    href: '/member/claims',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'download-policy',
    label: 'Download Policy',
    icon: <ArrowDownTrayIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-download-policy.svg',
    mobileIconWidth: 23,
    mobileIconHeight: 18,
    iconBgColor: 'bg-blue-50',
    isAction: true,
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    icon: <BanknotesIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-transaction-history.svg',
    mobileIconWidth: 20,
    mobileIconHeight: 20,
    href: '/member/transactions',
    iconBgColor: 'bg-blue-50',
  },
];

// Desktop quick links (original 5 items)
const quickLinksConfig: QuickLink[] = [
  {
    id: 'health-records',
    label: 'Health Records',
    icon: <DocumentTextIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-health-records.svg',
    mobileIconWidth: 16,
    mobileIconHeight: 19,
    href: '/member/health-records',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: <CalendarDaysIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-my-bookings.svg',
    mobileIconWidth: 18,
    mobileIconHeight: 17,
    href: '/member/bookings',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-claims.svg',
    mobileIconWidth: 16,
    mobileIconHeight: 19,
    href: '/member/claims',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    icon: <BanknotesIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-transaction-history.svg',
    mobileIconWidth: 20,
    mobileIconHeight: 20,
    href: '/member/transactions',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'download-policy',
    label: 'Download Policy',
    icon: <ArrowDownTrayIcon className="w-6 h-6 text-brand-600" />,
    mobileIcon: '/images/icons/quicklink-download-policy.svg',
    mobileIconWidth: 23,
    mobileIconHeight: 18,
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

  // Arrow icon component matching Figma design
  const ArrowIcon = () => (
    <img
      src="/images/icons/arrow-forward-vector.svg"
      alt=""
      width={10}
      height={10}
      className="flex-shrink-0"
    />
  );

  // Mobile quick link item - Figma design
  const renderMobileQuickLink = (link: QuickLink) => {
    const content = (
      <>
        <img
          src={link.mobileIcon}
          alt=""
          width={link.mobileIconWidth}
          height={link.mobileIconHeight}
          className="flex-shrink-0 object-contain"
        />
        <div className="flex items-center gap-[4px]">
          <span
            className="text-[16px] font-normal whitespace-nowrap"
            style={{ color: '#383838', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
          >
            {link.id === 'download-policy' && isGenerating ? 'Generating...' : link.label}
          </span>
          <ArrowIcon />
        </div>
      </>
    );

    const baseClasses = "flex items-center gap-[8px] h-[36px] px-[14px] rounded-[16px] transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 flex-shrink-0";
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
    <section className="px-5 lg:px-6 pt-2 pb-0 lg:py-8 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-[18px] lg:text-xl font-medium text-[#1c1c1c] mb-2 lg:mb-6" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif', lineHeight: '1.2' }}>
        Quick Links
      </h2>

      {/* Mobile: Horizontal scrollable layout matching Figma design */}
      <div className="lg:hidden flex gap-[8px] overflow-x-auto pb-2 scrollbar-hide">
        {mobileQuickLinksConfig.map((link) => renderMobileQuickLink(link))}
      </div>

      {/* Desktop: Grid layout with original design */}
      <div className="hidden lg:flex lg:gap-4">
        {quickLinksConfig.map((link) => renderDesktopQuickLink(link))}
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
