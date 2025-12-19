'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AppointmentsTab from '@/components/operations/appointments/AppointmentsTab'
import DentalBookingsTab from '@/components/operations/appointments/DentalBookingsTab'

export default function AppointmentsPage() {
  console.log('[AdminAppointments] Page loaded')

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments" className="w-full appointments-tabs">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="dental">Dental Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <AppointmentsTab />
        </TabsContent>

        <TabsContent value="dental">
          <DentalBookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
