'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AppointmentsTab from '@/components/operations/appointments/AppointmentsTab'
import DentalBookingsTab from '@/components/operations/appointments/DentalBookingsTab'
import VisionBookingsTab from '@/components/operations/appointments/VisionBookingsTab'

export default function AppointmentsPage() {
  console.log('[AdminAppointments] Page loaded')

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments" className="w-full appointments-tabs">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="dental">Dental Bookings</TabsTrigger>
          <TabsTrigger value="vision">Vision Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <AppointmentsTab />
        </TabsContent>

        <TabsContent value="dental">
          <DentalBookingsTab />
        </TabsContent>

        <TabsContent value="vision">
          <VisionBookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
