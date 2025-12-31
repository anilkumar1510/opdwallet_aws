'use client';

import React from 'react';
import Link from 'next/link';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface MoreServicesProps {
  services: ServiceItem[];
}

export default function MoreServices({ services }: MoreServicesProps) {
  return (
    <section className="px-4 lg:px-6 pt-4 lg:pt-6 pb-0 max-w-[480px] mx-auto lg:max-w-full">
      {/* Header */}
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6">More Services</h2>

      {/* Services Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
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
