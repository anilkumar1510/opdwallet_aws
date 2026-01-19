'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 246 + 16; // Card width + gap (mobile: 246px + 16px gap)
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);

      // Update arrow visibility
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < container.scrollWidth - container.offsetWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollLeft = () => {
    const newIndex = Math.max(0, activeIndex - 1);
    scrollToCard(newIndex);
  };

  const scrollRight = () => {
    const newIndex = Math.min(policies.length - 1, activeIndex + 1);
    scrollToCard(newIndex);
  };

  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 350 + 16; // Card width + gap (mobile: 350px + 16px gap)
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-5 lg:py-6 max-w-[480px] mx-auto lg:max-w-full">
      <h2 className="text-lg lg:text-xl font-bold text-black mb-4 lg:mb-6 px-4 lg:px-6">
        Your Policies
      </h2>

      {/* Carousel Container with Navigation Arrows */}
      <div className="relative group px-4 lg:px-6">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide pb-2"
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

        {/* Arrow Navigation (Desktop) */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-200"
            style={{ backgroundColor: '#F0F0F0' }}
            aria-label="Previous card"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-200"
            style={{ backgroundColor: '#F0F0F0' }}
            aria-label="Next card"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-700" />
          </button>
        )}
      </div>

      {/* Pagination Dots */}
      {policies.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 lg:mt-5">
          {policies.map((_, index) => (
            <div
              key={index}
              onClick={() => scrollToCard(index)}
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
