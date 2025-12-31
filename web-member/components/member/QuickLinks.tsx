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
  href?: string;
  iconBgColor: string;
  isAction?: boolean;
}

const quickLinksConfig: QuickLink[] = [
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: <CalendarDaysIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/bookings',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'health-records',
    label: 'Health Records',
    icon: <DocumentTextIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/health-records',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/claims',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    icon: <BanknotesIcon className="w-6 h-6 text-brand-600" />,
    href: '/member/transactions',
    iconBgColor: 'bg-blue-50',
  },
  {
    id: 'download-policy',
    label: 'Download Policy',
    icon: <ArrowDownTrayIcon className="w-6 h-6 text-brand-600" />,
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

  const renderQuickLinkItem = (link: QuickLink, isMobile: boolean) => {
    const baseClasses = isMobile
      ? "flex-shrink-0 w-[90px] min-h-[110px] bg-white border-2 border-gray-200 rounded-xl p-3 flex flex-col items-center justify-start gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
      : "flex-1 min-h-[140px] bg-white border-2 border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-start gap-4 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95";

    const iconClasses = isMobile
      ? "w-12 h-12"
      : "w-16 h-16";

    const labelClasses = isMobile
      ? "text-gray-700 text-[10px] text-center leading-snug font-semibold w-full"
      : "text-gray-700 text-sm text-center leading-snug font-semibold w-full";

    const content = (
      <>
        <div className={`${link.iconBgColor} rounded-full ${iconClasses} flex items-center justify-center flex-shrink-0 ${isMobile ? 'shadow-sm' : 'shadow-md'}`}>
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
