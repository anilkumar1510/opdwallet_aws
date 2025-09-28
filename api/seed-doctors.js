const doctors = [
  {
    doctorId: 'DOC001',
    name: 'Dr. Vikas Mittal',
    profilePhoto: '',
    qualifications: 'MBBS, MD',
    specializations: ['Pulmonary Medicine', 'Tuberculosis & Respiratory Diseases', 'Pulmonary Medicine, Fellow'],
    specialtyId: 'SPEC001',
    specialty: 'General Physician',
    experienceYears: 16,
    rating: 4.7,
    reviewCount: 156,
    clinics: [
      {
        clinicId: 'CLINIC001',
        name: 'Manipal Hospital',
        address: 'Sector 6, Dwarka, New Delhi',
        city: 'Delhi (NCR)',
        state: 'Delhi',
        pincode: '110075',
        location: {
          latitude: 28.5921,
          longitude: 77.0460
        },
        distanceKm: 12.67,
        consultationFee: 1000
      }
    ],
    consultationFee: 1000,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: true,
    allowDirectBooking: false,
    availableSlots: [
      {
        date: new Date().toISOString().split('T')[0],
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
      },
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
      }
    ],
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC002',
    name: 'Dr. Rajesh Madan',
    profilePhoto: '',
    qualifications: 'MBBS, MD',
    specializations: ['General Medicine', 'DNB - Cardiology', 'Fellowship in Interventional Cardiology'],
    specialtyId: 'SPEC001',
    specialty: 'General Physician',
    experienceYears: 14,
    rating: 4.5,
    reviewCount: 98,
    clinics: [
      {
        clinicId: 'CLINIC002',
        name: 'Max Hospital',
        address: 'Saket, New Delhi',
        city: 'Delhi (NCR)',
        state: 'Delhi',
        pincode: '110017',
        location: {
          latitude: 28.5244,
          longitude: 77.2066
        },
        distanceKm: 22.34,
        consultationFee: 800
      }
    ],
    consultationFee: 800,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableSlots: [
      {
        date: '2025-09-28',
        slots: ['10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM']
      },
      {
        date: '2025-09-29',
        slots: ['10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM']
      }
    ],
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC003',
    name: 'Dr. Priya Sharma',
    profilePhoto: '',
    qualifications: 'MBBS, MD (Dermatology)',
    specializations: ['Dermatology', 'Cosmetology', 'Hair Transplant'],
    specialtyId: 'SPEC004',
    specialty: 'Dermatologist',
    experienceYears: 12,
    rating: 4.8,
    reviewCount: 234,
    clinics: [
      {
        clinicId: 'CLINIC003',
        name: 'Fortis Hospital',
        address: 'Vasant Kunj, New Delhi',
        city: 'Delhi (NCR)',
        state: 'Delhi',
        pincode: '110070',
        location: {
          latitude: 28.5167,
          longitude: 77.1598
        },
        distanceKm: 8.5,
        consultationFee: 1200
      }
    ],
    consultationFee: 1200,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableSlots: [
      {
        date: '2025-09-28',
        slots: ['09:30 AM', '10:30 AM', '11:30 AM', '03:00 PM', '04:00 PM']
      },
      {
        date: '2025-09-29',
        slots: ['09:30 AM', '10:30 AM', '11:30 AM', '03:00 PM', '04:00 PM']
      }
    ],
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC004',
    name: 'Dr. Anjali Verma',
    profilePhoto: '',
    qualifications: 'MBBS, MD (Obstetrics & Gynecology)',
    specializations: ['Gynecology', 'Obstetrics', 'Infertility'],
    specialtyId: 'SPEC002',
    specialty: 'Gynaecologist',
    experienceYears: 18,
    rating: 4.9,
    reviewCount: 342,
    clinics: [
      {
        clinicId: 'CLINIC004',
        name: 'Apollo Hospital',
        address: 'Jasola, New Delhi',
        city: 'Delhi (NCR)',
        state: 'Delhi',
        pincode: '110025',
        location: {
          latitude: 28.5403,
          longitude: 77.2717
        },
        distanceKm: 15.2,
        consultationFee: 1500
      }
    ],
    consultationFee: 1500,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: true,
    allowDirectBooking: false,
    availableSlots: [
      {
        date: '2025-09-28',
        slots: ['11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM']
      },
      {
        date: '2025-09-29',
        slots: ['11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM']
      }
    ],
    isActive: true
  }
];

db = db.getSiblingDB('opd_wallet');

db.doctors.insertMany(doctors);

print('✅ Seeded ' + doctors.length + ' doctors successfully!');