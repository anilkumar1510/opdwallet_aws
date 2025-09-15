'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/Card'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming')

  const upcomingBookings = [
    {
      id: 1,
      type: 'appointment',
      doctor: 'Dr. Sarah Smith',
      specialty: 'General Physician',
      hospital: 'Apollo Clinic, Bandra',
      date: '2024-01-25',
      time: '10:30 AM',
      status: 'confirmed',
      bookingId: 'APT-2024-001'
    },
    {
      id: 2,
      type: 'lab-test',
      test: 'Complete Blood Count',
      lab: 'PathLab Diagnostics',
      date: '2024-01-26',
      time: '8:00 AM',
      status: 'confirmed',
      bookingId: 'LAB-2024-001',
      instructions: 'Fasting required'
    },
    {
      id: 3,
      type: 'appointment',
      doctor: 'Dr. John Doe',
      specialty: 'Dentist',
      hospital: 'SmileCare Dental',
      date: '2024-01-28',
      time: '2:00 PM',
      status: 'pending',
      bookingId: 'APT-2024-002'
    }
  ]

  const medicineOrders = [
    {
      id: 1,
      orderNumber: 'MED-2024-001',
      items: 3,
      pharmacy: 'MedPlus Pharmacy',
      date: '2024-01-20',
      total: 2340,
      status: 'delivered',
      deliveredOn: '2024-01-22'
    },
    {
      id: 2,
      orderNumber: 'MED-2024-002',
      items: 5,
      pharmacy: 'Apollo Pharmacy',
      date: '2024-01-23',
      total: 4560,
      status: 'in-transit',
      expectedDelivery: '2024-01-25'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings & Orders</h1>
          <p className="text-gray-500 mt-1">Manage your appointments and medicine orders</p>
        </div>
        <Link href="/member/bookings/new">
          <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Booking
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Bookings
          </button>
          <button
            onClick={() => setActiveTab('medicines')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medicines'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Medicine Orders
          </button>
        </nav>
      </div>

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingBookings.map((booking) => (
            <Card key={booking.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {booking.type === 'appointment' ? (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900">{booking.doctor}</h3>
                          <p className="text-sm text-gray-500">{booking.specialty}</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900">{booking.test}</h3>
                          <p className="text-sm text-gray-500">{booking.lab}</p>
                        </>
                      )}
                    </div>
                    <StatusBadge status={booking.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.date}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.time}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.hospital || booking.lab}
                    </div>
                  </div>

                  {booking.instructions && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">⚠️ {booking.instructions}</p>
                    </div>
                  )}

                  <div className="mt-4 flex space-x-3">
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                      View Details
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      Reschedule
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'medicines' && (
        <div className="space-y-4">
          {medicineOrders.map((order) => (
            <Card key={order.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{order.pharmacy}</p>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                    <span>{order.items} items</span>
                    <span>•</span>
                    <span>₹{order.total.toLocaleString()}</span>
                    <span>•</span>
                    <span>Ordered on {order.date}</span>
                  </div>
                  {order.expectedDelivery && (
                    <p className="mt-2 text-sm text-green-600">
                      Expected delivery: {order.expectedDelivery}
                    </p>
                  )}
                </div>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <div className="mt-4 flex space-x-3">
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                  Track Order
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}