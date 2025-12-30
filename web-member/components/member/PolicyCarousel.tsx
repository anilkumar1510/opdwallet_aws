'use client';

import React, { useState, useRef } from 'react';
import PolicyCardEnhanced from './PolicyCardEnhanced';

interface Policy {
  policyId: string;
  policyNumber: string;
  policyHolder: string;
  policyHolderId?: string;
  age?: number;
  corporate?: string;
  coverageAmount: number;
  expiryDate: string;
}

interface PolicyCarouselProps {
  policies: Policy[];
}

export default function PolicyCarousel({ policies }: PolicyCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = 320 + 12; // Card width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    }
  };

  return (
    <section className="py-5 lg:py-6 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6 px-4 lg:px-6">
        Your Policies
      </h2>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-3 lg:gap-5 overflow-x-auto scrollbar-hide px-4 lg:px-6 pb-2"
      >
        {policies.map((policy, index) => (
          <PolicyCardEnhanced
            key={policy.policyId}
            policyId={policy.policyId}
            policyNumber={policy.policyNumber}
            policyHolder={policy.policyHolder}
            age={policy.age}
            corporate={policy.corporate}
            coverageAmount={policy.coverageAmount}
            expiryDate={policy.expiryDate}
            isActive={index === activeIndex}
            href={`/member/policy-details/${policy.policyId}`}
          />
        ))}
      </div>

      {/* Pagination Dots */}
      {policies.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 lg:mt-5">
          {policies.map((_, index) => (
            <div
              key={index}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const cardWidth = 320 + 12; // Card width + gap
                  scrollContainerRef.current.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`cursor-pointer rounded-full transition-all duration-200 ${
                index === activeIndex
                  ? 'h-[4px] w-[14px]'
                  : 'h-[4px] w-[4px]'
              }`}
              style={{
                backgroundColor: index === activeIndex ? '#1E3A8C' : '#cbd5e1'
              }}
              role="button"
              tabIndex={0}
              aria-label={`Go to policy ${index + 1}`}
            />
          ))}
        </div>
      )}

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
