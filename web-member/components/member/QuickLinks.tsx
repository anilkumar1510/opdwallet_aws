'use client';

import React from 'react';
import Link from 'next/link';
import { usePolicyPDF } from '@/lib/hooks/usePolicyPDF';

// Custom advanced SVG icons matching the artifact design
const CalendarCheckIcon = () => (
  <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="15" rx="2" stroke="#2563EB" strokeWidth="2" fill="none"/>
    <path d="M3 10H21" stroke="#2563EB" strokeWidth="2"/>
    <path d="M7 3V6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 3V6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 14L11 16L15.5 11.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HealthRecordsIcon = () => (
  <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 2V9H20" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11V17" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 14H15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClaimsIcon = () => (
  <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="9" y="3" width="6" height="4" rx="1" stroke="#2563EB" strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TransactionHistoryIcon = () => (
  <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#2563EB" strokeWidth="2"/>
    <circle cx="7" cy="10" r="1.5" fill="#2563EB"/>
    <path d="M10 10H19" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="7" cy="14" r="1.5" fill="#2563EB"/>
    <path d="M10 14H19" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DownloadPolicyIcon = () => (
  <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface QuickLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  iconBgColor: string;
  isAction?: boolean;
}

const quickLinksConfig: QuickLink[] = [
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: <CalendarCheckIcon />,
    href: '/member/bookings',
    iconBgColor: 'bg-white',
  },
  {
    id: 'health-records',
    label: 'Health Records',
    icon: <HealthRecordsIcon />,
    href: '/member/health-records',
    iconBgColor: 'bg-white',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClaimsIcon />,
    href: '/member/claims',
    iconBgColor: 'bg-white',
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    icon: <TransactionHistoryIcon />,
    href: '/member/transactions',
    iconBgColor: 'bg-white',
  },
  {
    id: 'download-policy',
    label: 'Download Policy',
    icon: <DownloadPolicyIcon />,
    iconBgColor: 'bg-white',
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

  const renderQuickLinkItem = (link: QuickLink, isMobile: boolean) => {
    const baseClasses = isMobile
      ? "flex-shrink-0 w-[90px] h-[100px] bg-quickLink-blue border-2 border-quickLink-border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
      : "flex-1 h-[130px] bg-quickLink-blue border-2 border-quickLink-border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95";

    const iconClasses = isMobile
      ? "w-11 h-11"
      : "w-14 h-14";

    const labelClasses = isMobile
      ? "text-white text-[11px] text-center leading-tight line-clamp-2 font-medium"
      : "text-white text-sm text-center leading-tight font-semibold";

    const content = (
      <>
        <div className={`${link.iconBgColor} rounded-full ${iconClasses} flex items-center justify-center ${isMobile ? 'shadow-sm' : 'shadow-md'}`}>
          {link.icon}
        </div>
        <span className={labelClasses}>
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
          className={`${baseClasses} ${isGenerating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
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
      >
        {content}
      </Link>
    );
  };

  return (
    <section className="px-4 lg:px-6 py-6 lg:py-8">
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6">Quick Links</h2>

      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {quickLinksConfig.map((link) => renderQuickLinkItem(link, true))}
      </div>

      {/* Desktop: Grid layout with flexible width */}
      <div className="hidden lg:flex lg:gap-4">
        {quickLinksConfig.map((link) => renderQuickLinkItem(link, false))}
      </div>
    </section>
  );
}
