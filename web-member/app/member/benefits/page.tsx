'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import {
  BuildingOffice2Icon,
  BeakerIcon,
  CubeIcon,
  EyeIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function BenefitsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const benefitCategories = [
    {
      id: 'consultations',
      name: 'Consultations',
      description: 'Doctor visits and specialist care',
      icon: BuildingOffice2Icon,
      limit: '₹30,000/year',
      used: '40%',
      color: 'bg-blue-600',
      features: ['General physicians', 'Specialists', 'Follow-ups', 'Teleconsultations']
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      description: 'Medicines and medical supplies',
      icon: CubeIcon,
      limit: '₹20,000/year',
      used: '27%',
      color: 'bg-green-600',
      features: ['Prescribed drugs', 'OTC medicines', 'Home delivery', '20% discount']
    },
    {
      id: 'diagnostics',
      name: 'Lab & Diagnostics',
      description: 'Tests and medical imaging',
      icon: BeakerIcon,
      limit: '₹25,000/year',
      used: '32%',
      color: 'bg-purple-600',
      features: ['Blood tests', 'X-rays', 'MRI/CT scans', 'Health packages']
    },
    {
      id: 'preventive',
      name: 'Preventive Care',
      description: 'Health checkups and vaccinations',
      icon: ShieldCheckIcon,
      limit: '₹15,000/year',
      used: '13%',
      color: 'bg-amber-600',
      features: ['Annual checkup', 'Vaccinations', 'Health screening', 'Risk assessment']
    },
    {
      id: 'vision-dental',
      name: 'Vision & Dental',
      description: 'Eye and dental care services',
      icon: EyeIcon,
      limit: '₹10,000/year',
      used: '35%',
      color: 'bg-pink-600',
      features: ['Eye exams', 'Glasses/contacts', 'Dental cleanings', 'Basic procedures']
    },
    {
      id: 'wellness',
      name: 'Wellness',
      description: 'Fitness and mental health',
      icon: SparklesIcon,
      limit: '₹10,000/year',
      used: '15%',
      color: 'bg-indigo-600',
      features: ['Gym membership', 'Yoga classes', 'Mental health', 'Nutrition counseling']
    }
  ]

  const filteredCategories = searchQuery
    ? benefitCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : benefitCategories

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-ink-900">Your Benefits</h1>
        <p className="text-ink-500 mt-1">Comprehensive healthcare coverage for you and your family</p>
      </div>

      {/* Search Bar - Mobile optimized */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
        <input
          type="text"
          placeholder="Search benefits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
        />
      </div>

      {/* Quick Stats - Enhanced desktop grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 hover:scale-105 transition-transform">
          <div className="p-5 text-center">
            <BuildingOffice2Icon className="h-8 w-8 mx-auto mb-2 text-brand-100" />
            <p className="text-brand-100 text-sm">Total Coverage</p>
            <p className="text-3xl font-bold mt-1">₹2L</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 hover:scale-105 transition-transform">
          <div className="p-5 text-center">
            <CubeIcon className="h-8 w-8 mx-auto mb-2 text-blue-100" />
            <p className="text-blue-100 text-sm">Used</p>
            <p className="text-3xl font-bold mt-1">16%</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 hover:scale-105 transition-transform">
          <div className="p-5 text-center">
            <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-purple-100" />
            <p className="text-purple-100 text-sm">Network</p>
            <p className="text-3xl font-bold mt-1">500+</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 hover:scale-105 transition-transform">
          <div className="p-5 text-center">
            <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 text-green-100" />
            <p className="text-green-100 text-sm">Cashless</p>
            <p className="text-3xl font-bold mt-1">Yes</p>
          </div>
        </Card>
      </div>

      {/* Benefits Grid - Enhanced desktop experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredCategories.map((category) => (
          <Link key={category.id} href={`/member/benefits/${category.id}`}>
            <Card className="h-full group hover:shadow-lg hover:-translate-y-1 hover:border-brand-300 transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className={`${category.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-500 uppercase tracking-wide">Used</p>
                    <p className="text-2xl font-bold text-ink-900 group-hover:text-brand-700 transition-colors">{category.used}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-2 group-hover:text-brand-700 transition-colors">{category.name}</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{category.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {category.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-ink-700">
                      <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 group-hover:scale-125 transition-transform ${
                        idx < 2 ? 'bg-brand-600' : 'bg-ink-300'
                      }`} />
                      <span className={idx >= 2 ? 'text-ink-500' : ''}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Progress indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-ink-500">Usage</span>
                    <span className="text-xs font-bold text-ink-700">{category.used}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all duration-500 group-hover:opacity-80`}
                      style={{ width: `${parseFloat(category.used)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-border group-hover:border-brand-200 transition-colors">
                  <span className="text-sm font-medium text-ink-600 group-hover:text-brand-600 transition-colors">{category.limit}</span>
                  <div className="flex items-center text-brand-600">
                    <span className="text-sm font-medium mr-1 group-hover:mr-2 transition-all">Explore</span>
                    <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-100/0 group-hover:from-brand-50/10 group-hover:to-brand-100/5 transition-all duration-300 pointer-events-none" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Family Members Section - Enhanced layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card title="Coverage for Family">
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-r from-brand-50 to-brand-100 rounded-2xl border border-brand-200">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold mr-4">
                  Y
                </div>
                <div>
                  <p className="text-lg font-semibold text-brand-900">You</p>
                  <p className="text-sm text-brand-600">Primary member</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="font-bold text-green-700">100%</p>
                  <p className="text-green-600">Coverage</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl">
                  <p className="font-bold text-blue-700">0%</p>
                  <p className="text-blue-600">Co-pay</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-2 border-dashed border-surface-border rounded-2xl hover:border-brand-300 transition-colors group cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-brand-50 transition-colors">
                  <UserGroupIcon className="h-7 w-7 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">Add Family</p>
                  <p className="text-sm text-ink-500">Extend coverage to dependents</p>
                </div>
              </div>
              <Link href="/member/family/add" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center">
                Add family members →
              </Link>
            </div>
          </div>
        </Card>

        {/* Provider Network Info */}
        <Card title="Network Providers">
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <BuildingOffice2Icon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-700 mb-1">500+</p>
              <p className="text-sm text-purple-600">Network Hospitals</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-surface-alt rounded-xl">
                <SparklesIcon className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-amber-700">24/7</p>
                <p className="text-xs text-amber-600">Support</p>
              </div>
              <div className="text-center p-4 bg-surface-alt rounded-xl">
                <ShieldCheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-700">100%</p>
                <p className="text-xs text-green-600">Cashless</p>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/member/providers" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center">
                Find providers near you →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* How to Use - Enhanced desktop layout */}
      <Card className="bg-gradient-to-br from-brand-50 via-blue-50 to-purple-50 border-brand-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-ink-900 mb-2">How to Use Your Benefits</h3>
            <p className="text-ink-600">Simple steps to maximize your healthcare coverage</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center group">
              <div className="relative">
                <span className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">1</span>
                <div className="absolute -inset-2 bg-brand-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
              <h4 className="font-semibold text-ink-900 mb-2">Choose Provider</h4>
              <p className="text-sm text-ink-600 leading-relaxed">Select a network provider for cashless treatment from our extensive network</p>
            </div>

            <div className="text-center group">
              <div className="relative">
                <span className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">2</span>
                <div className="absolute -inset-2 bg-blue-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
              <h4 className="font-semibold text-ink-900 mb-2">Show Card</h4>
              <p className="text-sm text-ink-600 leading-relaxed">Present your digital member card at the healthcare facility for instant verification</p>
            </div>

            <div className="text-center group">
              <div className="relative">
                <span className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">3</span>
                <div className="absolute -inset-2 bg-purple-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
              <h4 className="font-semibold text-ink-900 mb-2">Track & Claim</h4>
              <p className="text-sm text-ink-600 leading-relaxed">Monitor your usage and submit reimbursement claims directly through the app</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/member/providers" className="btn-primary">
              <BuildingOffice2Icon className="h-4 w-4 mr-2" />
              Find Providers
            </Link>
            <Link href="/member/claims/new" className="btn-secondary">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              File New Claim
            </Link>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-200/20 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full transform -translate-x-12 translate-y-12" />
      </Card>
    </div>
  )
}