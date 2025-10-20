'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Card } from '../../../../components/ui/Card'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  HeartIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BeakerIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface BookingState {
  step: number
  serviceType: string
  provider: any
  date: string
  timeSlot: string
  familyMember: string
  location: string
  specialization: string
}

interface Provider {
  id: string
  name: string
  specialty: string
  rating: number
  reviews: number
  hospital: string
  location: string
  distance: number
  image: string
  consultationFee: number
  nextAvailable: string
  languages: string[]
  experience: string
  education: string
  isVerified: boolean
  isFavorite: boolean
}

interface TimeSlot {
  time: string
  available: boolean
  consultationFee: number
}

export default function NewBookingPage() {
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 1,
    serviceType: '',
    provider: null,
    date: '',
    timeSlot: '',
    familyMember: 'self',
    location: '',
    specialization: ''
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const providerScrollRef = useRef<HTMLDivElement>(null)

  // Mock data
  const serviceTypes = [
    {
      id: 'consultation',
      title: 'Consultation',
      subtitle: 'Book appointment with doctors',
      icon: UserIcon,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'lab-test',
      title: 'Lab Test',
      subtitle: 'Book diagnostic tests',
      icon: BeakerIcon,
      color: 'bg-green-50 text-green-600'
    },
    {
      id: 'health-checkup',
      title: 'Health Checkup',
      subtitle: 'Comprehensive health packages',
      icon: ShieldCheckIcon,
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  const specializations = [
    'All', 'General Physician', 'Cardiologist', 'Dermatologist',
    'Pediatrician', 'Orthopedic', 'Gynecologist', 'ENT', 'Psychiatrist'
  ]

  const familyMembers = [
    { id: 'self', name: 'Self', relation: '' },
    { id: 'spouse', name: 'John Smith', relation: 'Spouse' },
    { id: 'child1', name: 'Emily Smith', relation: 'Daughter' },
    { id: 'child2', name: 'Michael Smith', relation: 'Son' }
  ]

  const mockProvidersData: Provider[] = useMemo(() => [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'General Physician',
      rating: 4.8,
      reviews: 234,
      hospital: 'Apollo Clinic, Bandra',
      location: 'Bandra West',
      distance: 1.2,
      image: '/api/placeholder/80/80',
      consultationFee: 800,
      nextAvailable: 'Today, 2:30 PM',
      languages: ['English', 'Hindi', 'Marathi'],
      experience: '12 years',
      education: 'MBBS, MD - Internal Medicine',
      isVerified: true,
      isFavorite: false
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      specialty: 'Cardiologist',
      rating: 4.9,
      reviews: 456,
      hospital: 'Fortis Hospital',
      location: 'Mulund',
      distance: 3.5,
      image: '/api/placeholder/80/80',
      consultationFee: 1200,
      nextAvailable: 'Tomorrow, 10:00 AM',
      languages: ['English', 'Hindi'],
      experience: '15 years',
      education: 'MBBS, DM - Cardiology',
      isVerified: true,
      isFavorite: true
    },
    {
      id: '3',
      name: 'Dr. Priya Sharma',
      specialty: 'Dermatologist',
      rating: 4.7,
      reviews: 189,
      hospital: 'Hinduja Hospital',
      location: 'Mahim',
      distance: 2.8,
      image: '/api/placeholder/80/80',
      consultationFee: 1000,
      nextAvailable: 'Today, 4:00 PM',
      languages: ['English', 'Hindi', 'Gujarati'],
      experience: '10 years',
      education: 'MBBS, MD - Dermatology',
      isVerified: true,
      isFavorite: false
    }
  ], [])

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
    const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
    const eveningSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']

    const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots]

    allSlots.forEach(time => {
      slots.push({
        time,
        available: Math.random() > 0.3, // 70% availability
        consultationFee: bookingState.provider?.consultationFee || 800
      })
    })

    return slots
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  useEffect(() => {
    setProviders(mockProvidersData)
    setFilteredProviders(mockProvidersData)
  }, [mockProvidersData])

  useEffect(() => {
    let filtered = providers

    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.hospital.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (bookingState.specialization && bookingState.specialization !== 'All') {
      filtered = filtered.filter(provider =>
        provider.specialty === bookingState.specialization
      )
    }

    if (bookingState.location) {
      filtered = filtered.filter(provider =>
        provider.location.toLowerCase().includes(bookingState.location.toLowerCase())
      )
    }

    setFilteredProviders(filtered)
  }, [searchQuery, bookingState.specialization, bookingState.location, providers])

  const handleNext = () => {
    if (bookingState.step < 4) {
      setBookingState(prev => ({ ...prev, step: prev.step + 1 }))
    }
  }

  const handleBack = () => {
    if (bookingState.step > 1) {
      setBookingState(prev => ({ ...prev, step: prev.step - 1 }))
    }
  }

  const handleServiceSelect = (serviceId: string) => {
    setBookingState(prev => ({ ...prev, serviceType: serviceId }))
  }

  const handleProviderSelect = (provider: Provider) => {
    setBookingState(prev => ({ ...prev, provider }))
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setBookingState(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setBookingState(prev => ({ ...prev, timeSlot }))
  }

  const handleBooking = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    // Handle success
    alert('Booking confirmed!')
  }

  const toggleFavorite = (providerId: string) => {
    setProviders(prev =>
      prev.map(provider =>
        provider.id === providerId
          ? { ...provider, isFavorite: !provider.isFavorite }
          : provider
      )
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            bookingState.step >= step
              ? 'bg-brand-600 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {bookingState.step > step ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              step
            )}
          </div>
          {index < 3 && (
            <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
              bookingState.step > step ? 'bg-brand-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Service Type</h2>
        <p className="text-gray-600">Choose the type of service you need</p>
      </div>

      <div className="space-y-4">
        {serviceTypes.map((service) => {
          const IconComponent = service.icon
          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-200 ${
                bookingState.serviceType === service.id
                  ? 'ring-2 ring-brand-600 border-brand-600'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="flex items-center p-6">
                <div className={`p-3 rounded-xl ${service.color} mr-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{service.subtitle}</p>
                </div>
                {bookingState.serviceType === service.id && (
                  <CheckCircleIcon className="w-6 h-6 text-brand-600" />
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {bookingState.serviceType && (
        <div className="mt-8">
          <button
            onClick={handleNext}
            className="w-full btn-primary py-4 text-base font-medium"
          >
            Continue
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Select Provider</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-ghost p-2"
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search doctors, hospitals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="space-y-4">
          <div>
            <label className="label">Specialization</label>
            <select
              value={bookingState.specialization}
              onChange={(e) => setBookingState(prev => ({ ...prev, specialization: e.target.value }))}
              className="input"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              placeholder="Enter location"
              value={bookingState.location}
              onChange={(e) => setBookingState(prev => ({ ...prev, location: e.target.value }))}
              className="input"
            />
          </div>
        </Card>
      )}

      {/* Provider List */}
      <div className="space-y-4">
        {filteredProviders.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all duration-200 ${
              bookingState.provider?.id === provider.id
                ? 'ring-2 ring-brand-600 border-brand-600'
                : 'hover:shadow-md'
            }`}
            onClick={() => handleProviderSelect(provider)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg">
                      {provider.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{provider.name}</h3>
                      {provider.isVerified && (
                        <CheckCircleIcon className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{provider.specialty}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <StarSolid className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{provider.rating}</span>
                        <span className="ml-1">({provider.reviews})</span>
                      </div>
                      <span>{provider.experience} exp.</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(provider.id)
                  }}
                  className="p-1"
                >
                  {provider.isFavorite ? (
                    <HeartSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{provider.hospital} • {provider.distance} km</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Next available: {provider.nextAvailable}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Consultation Fee:</span>
                  <span className="font-semibold text-gray-900">₹{provider.consultationFee}</span>
                </div>
                {bookingState.provider?.id === provider.id && (
                  <CheckCircleIcon className="w-5 h-5 text-brand-600" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {bookingState.provider && (
        <button
          onClick={handleNext}
          className="w-full btn-primary py-4 text-base font-medium sticky bottom-4"
        >
          Select Date & Time
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  )

  const renderStep3 = () => {
    const calendarDays = generateCalendarDays()
    const timeSlots = generateTimeSlots(selectedDate)
    const morningSlots = timeSlots.filter(slot => parseInt(slot.time) < 12)
    const afternoonSlots = timeSlots.filter(slot => parseInt(slot.time) >= 12 && parseInt(slot.time) < 18)
    const eveningSlots = timeSlots.filter(slot => parseInt(slot.time) >= 18)

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="btn-ghost p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Select Date & Time</h2>
          <div className="w-10" />
        </div>

        {/* Selected Provider Info */}
        <Card className="bg-brand-50 border-brand-200">
          <div className="flex items-center space-x-3 p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-semibold">
              {bookingState.provider.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{bookingState.provider.name}</h3>
              <p className="text-sm text-gray-600">{bookingState.provider.specialty}</p>
              <p className="text-sm text-brand-600">{bookingState.provider.hospital}</p>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Date</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const isSelected = selectedDate.toDateString() === day.toDateString()
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                const isToday = day.toDateString() === new Date().toDateString()

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={`
                      p-2 text-sm rounded-lg transition-colors aspect-square flex items-center justify-center
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isSelected ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}
                      ${isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isToday && !isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : ''}
                    `}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Time Slots */}
        {selectedDate && (
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Available Time Slots</h3>

              {/* Morning Slots */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                  Morning (9:00 AM - 12:00 PM)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {morningSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        p-3 text-sm rounded-lg border transition-all
                        ${slot.available
                          ? bookingState.timeSlot === slot.time
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-600'
                          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                  Afternoon (2:00 PM - 6:00 PM)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        p-3 text-sm rounded-lg border transition-all
                        ${slot.available
                          ? bookingState.timeSlot === slot.time
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-600'
                          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening Slots */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                  Evening (6:00 PM - 8:30 PM)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {eveningSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        p-3 text-sm rounded-lg border transition-all
                        ${slot.available
                          ? bookingState.timeSlot === slot.time
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-600'
                          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {bookingState.timeSlot && (
          <button
            onClick={handleNext}
            className="w-full btn-primary py-4 text-base font-medium sticky bottom-4"
          >
            Review Booking
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    )
  }

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Confirm Booking</h2>
        <div className="w-10" />
      </div>

      {/* Family Member Selection */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Booking For</h3>
          <div className="space-y-3">
            {familyMembers.map(member => (
              <label key={member.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="familyMember"
                  value={member.id}
                  checked={bookingState.familyMember === member.id}
                  onChange={(e) => setBookingState(prev => ({ ...prev, familyMember: e.target.value }))}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{member.name}</div>
                  {member.relation && (
                    <div className="text-sm text-gray-500">{member.relation}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Booking Summary */}
      <Card>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
          <div className="space-y-4">
            {/* Doctor Info */}
            <div className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                {bookingState.provider.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{bookingState.provider.name}</h4>
                <p className="text-sm text-gray-600">{bookingState.provider.specialty}</p>
                <p className="text-sm text-gray-600">{bookingState.provider.hospital}</p>
                <div className="flex items-center mt-2">
                  <StarSolid className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm text-gray-600">
                    {bookingState.provider.rating} ({bookingState.provider.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service Type</span>
                <span className="font-medium text-gray-900 capitalize">
                  {bookingState.serviceType.replace('-', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(bookingState.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time</span>
                <span className="font-medium text-gray-900">{bookingState.timeSlot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Patient</span>
                <span className="font-medium text-gray-900">
                  {familyMembers.find(m => m.id === bookingState.familyMember)?.name}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-gray-900">Consultation Fee</span>
                <span className="font-bold text-gray-900">₹{bookingState.provider.consultationFee}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Pay at the clinic or through the app
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="bg-gray-50">
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Please arrive 10 minutes before your appointment time</li>
            <li>• Bring a valid ID and any relevant medical documents</li>
            <li>• Cancellation allowed up to 2 hours before appointment</li>
            <li>• Consultation fee is non-refundable after appointment</li>
          </ul>
        </div>
      </Card>

      {/* Book Button */}
      <button
        onClick={handleBooking}
        disabled={isLoading}
        className="w-full btn-primary py-4 text-base font-medium sticky bottom-4 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Booking...
          </div>
        ) : (
          <>
            Confirm Booking
            <CheckCircleIcon className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
    </div>
  )

  const renderCurrentStep = () => {
    switch (bookingState.step) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 sm:hidden">
        <h1 className="text-lg font-semibold text-gray-900 text-center">New Booking</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Desktop Header */}
        <div className="hidden sm:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
          <p className="text-gray-600 mt-2">Book your appointment in just a few steps</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="animate-fade-in">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}