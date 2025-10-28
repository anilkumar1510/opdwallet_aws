'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import OPDECard from './OPDECard'

interface Member {
  _id?: string
  id?: string
  name?: {
    firstName?: string
    lastName?: string
  }
  dob?: string
  [key: string]: any
}

interface OPDCardCarouselProps {
  members: Member[]
  getPolicyNumber: (userId: string) => string
  getValidTill: (userId: string) => string
  getCorporateName: (member: any) => string
  getPolicyId: (userId: string) => string
}

export default function OPDCardCarousel({
  members,
  getPolicyNumber,
  getValidTill,
  getCorporateName,
  getPolicyId
}: OPDCardCarouselProps) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const cardWidth = container.offsetWidth
    const currentIndex = Math.round(scrollLeft / cardWidth)

    setActiveIndex(currentIndex)
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < container.scrollWidth - container.offsetWidth - 10)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const cardWidth = container.offsetWidth
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    })
  }

  const scrollLeft = () => {
    const newIndex = Math.max(0, activeIndex - 1)
    scrollToCard(newIndex)
  }

  const scrollRight = () => {
    const newIndex = Math.min(members.length - 1, activeIndex + 1)
    scrollToCard(newIndex)
  }

  const handleCardClick = (policyId: string) => {
    if (policyId && policyId !== 'N/A') {
      router.push(`/member/policy-details/${policyId}`)
    }
  }

  return (
    <div className="relative group">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {members.map((member, index) => {
          const memberId = member._id || member.id || ''
          const policyId = getPolicyId(memberId)
          return (
            <div
              key={memberId || index}
              className="flex-shrink-0 snap-start w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              <OPDECard
                member={member}
                policyNumber={getPolicyNumber(memberId)}
                validTill={getValidTill(memberId)}
                corporateName={getCorporateName(member)}
                policyId={policyId}
                onClick={() => handleCardClick(policyId)}
              />
            </div>
          )
        })}
      </div>

      {/* Pagination Dots (Mobile) */}
      <div className="flex justify-center items-center gap-1.5 mt-2.5 lg:hidden">
        {members.map((_, index) => (
          <div
            key={index}
            className={`rounded-full transition-all duration-200 ${
              index === activeIndex
                ? 'h-[4px] w-[14px]'
                : 'h-[4px] w-[4px]'
            }`}
            style={{
              backgroundColor: index === activeIndex ? '#6366f1' : '#cbd5e1'
            }}
          />
        ))}
      </div>

      {/* Arrow Navigation (Desktop) */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
          aria-label="Previous card"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
          aria-label="Next card"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-700" />
        </button>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
