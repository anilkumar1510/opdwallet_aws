'use client';

import React from 'react';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  label: string;
  labelHighlight?: string; // Optional: word(s) to highlight in blue
  icon: React.ReactNode;
  href: string;
}

interface MoreServicesProps {
  services: ServiceItem[];
}

export default function MoreServices({ services }: MoreServicesProps) {
  const renderLabel = (label: string, highlight?: string) => {
    if (!highlight) {
      return <span className="text-sm font-medium" style={{ color: '#000000' }}>{label}</span>;
    }

    // Split label by the highlight word and wrap it in blue color
    const parts = label.split(highlight);
    return (
      <span className="text-sm font-medium" style={{ color: '#000000' }}>
        {parts[0]}
        <span style={{ color: '#034DA2' }}>{highlight}</span>
        {parts[1]}
      </span>
    );
  };

  return (
    <section className="px-4 lg:px-6 pt-4 lg:pt-6 pb-0 max-w-[480px] mx-auto lg:max-w-full">
      {/* Header */}
      <h2 className="text-lg lg:text-xl font-bold text-black mb-3 lg:mb-6">More Services</h2>

      {/* Mobile: Horizontal scrollable button layout */}
      <div className="lg:hidden flex gap-[10px] overflow-x-auto pb-2 scrollbar-hide">
        {services.map((service) => (
          <Link
            key={service.id}
            href={service.href}
            className="flex items-center justify-center gap-3 h-[50px] px-4 bg-white rounded-2xl transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0px_14px_50px_0px_rgba(0,0,0,0.12)] active:translate-y-0 flex-shrink-0"
            style={{
              border: '1px solid rgba(217, 217, 217, 0.48)',
              boxShadow: '-2px 11px 46.1px 0px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="h-6 flex-shrink-0 flex items-center justify-center">
              {service.icon}
            </div>
            {renderLabel(service.label, service.labelHighlight)}
          </Link>
        ))}
      </div>

      {/* Desktop: Original Grid layout */}
      <div className="hidden lg:grid lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
        {services.map((service) => (
          <Link
            key={service.id}
            href={service.href}
            className="bg-white border-2 border-gray-200 rounded-xl lg:rounded-2xl p-4 lg:p-5 flex flex-col items-center justify-center gap-3 lg:gap-4 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
          >
            <div
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              {service.icon}
            </div>
            <span className="text-xs lg:text-sm font-semibold text-gray-700 text-center leading-tight">
              {service.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
