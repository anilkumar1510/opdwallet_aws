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
          className="rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg, #CDDDFE 0%, #E4EBFE 100%)',
            border: '1px solid #A4BFFE7A',
            boxShadow: '-2px 11px 46.1px 0px #0000000D'
          }}
        >
          {link.icon}
        </div>
        <span className="text-[#374151] text-sm text-left leading-snug font-semibold flex-1">
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
          className={`w-[300px] h-[88px] flex-shrink-0 bg-white border-2 border-[#E5E7EB] rounded-[14px] px-[14px] flex items-center gap-3 transition-all duration-200 hover:border-[#A4BFFE7A] hover:shadow-md active:scale-[0.99] ${isGenerating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={link.id}
        href={link.href!}
        className="w-[300px] h-[88px] flex-shrink-0 bg-white border-2 border-[#E5E7EB] rounded-[14px] px-[14px] flex items-center gap-3 transition-all duration-200 hover:border-[#A4BFFE7A] hover:shadow-md active:scale-[0.99]"
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="px-5 lg:px-0 pt-2 pb-0 lg:py-0 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-[18px] font-medium text-[#1c1c1c] mb-2 lg:mb-[14px]" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif', lineHeight: '1.2' }}>
        Quick Links
      </h2>

      {/* Mobile: Horizontal scrollable layout matching Figma design */}
      <div className="lg:hidden flex gap-[8px] overflow-x-auto pb-2 scrollbar-hide">
        {mobileQuickLinksConfig.map((link) => renderMobileQuickLink(link))}
      </div>

      {/* Desktop: vertical stack of compact icon-left cards (dashboard mockup) */}
      <div className="hidden lg:flex lg:flex-col lg:gap-[10px]">
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
