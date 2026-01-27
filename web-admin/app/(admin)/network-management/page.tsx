'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ClinicsTab from './components/ClinicsTab'
import DoctorsTab from './components/DoctorsTab'
import DentalServicesTab from './components/DentalServicesTab'
import VisionServicesTab from './components/VisionServicesTab'

function NetworkManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'clinics'

  const handleTabChange = (value: string) => {
    router.push(`/network-management?tab=${value}`)
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
          <TabsTrigger
            value="clinics"
            className="text-xs sm:text-sm data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
          >
            Clinics
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="text-xs sm:text-sm data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
          >
            Doctors
          </TabsTrigger>
          <TabsTrigger
            value="dental-services"
            className="text-xs sm:text-sm data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
          >
            Dental Services
          </TabsTrigger>
          <TabsTrigger
            value="vision-services"
            className="text-xs sm:text-sm data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
          >
            Vision Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinics" className="mt-6">
          <ClinicsTab />
        </TabsContent>

        <TabsContent value="doctors" className="mt-6">
          <DoctorsTab />
        </TabsContent>

        <TabsContent value="dental-services" className="mt-6">
          <DentalServicesTab />
        </TabsContent>

        <TabsContent value="vision-services" className="mt-6">
          <VisionServicesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function NetworkManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NetworkManagementContent />
    </Suspense>
  )
}
