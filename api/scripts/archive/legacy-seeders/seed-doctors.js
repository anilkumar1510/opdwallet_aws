const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

const doctors = [
  {
    doctorId: 'DOC001',
    name: 'Dr. Vikas Mittal',
    profilePhoto: '',
    qualifications: 'MBBS, MD (Pulmonary Medicine)',
    specializations: ['Pulmonary Medicine', 'Tuberculosis & Respiratory Diseases'],
    specialtyId: 'SPEC001',
    specialty: 'General Physician',
    experienceYears: 16,
    rating: 4.7,
    reviewCount: 156,
    consultationFee: 1000,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC002',
    name: 'Dr. Amit Kumar',
    profilePhoto: '',
    qualifications: 'MBBS, MD (Cardiology)',
    specializations: ['Cardiology', 'Interventional Cardiology'],
    specialtyId: 'SPEC002',
    specialty: 'Cardiologist',
    experienceYears: 20,
    rating: 4.9,
    reviewCount: 289,
    consultationFee: 1500,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
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
    consultationFee: 1200,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC004',
    name: 'Dr. Rajesh Verma',
    profilePhoto: '',
    qualifications: 'MBBS, MS (Orthopedics)',
    specializations: ['Orthopedic Surgery', 'Sports Medicine', 'Joint Replacement'],
    specialtyId: 'SPEC005',
    specialty: 'Orthopedic',
    experienceYears: 18,
    rating: 4.6,
    reviewCount: 178,
    consultationFee: 1300,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: true,
    allowDirectBooking: false,
    availableOnline: false,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC005',
    name: 'Dr. Sunita Mehta',
    profilePhoto: '',
    qualifications: 'MBBS, MD (Pediatrics)',
    specializations: ['Pediatrics', 'Child Development', 'Neonatology'],
    specialtyId: 'SPEC003',
    specialty: 'Pediatrician',
    experienceYears: 15,
    rating: 4.9,
    reviewCount: 312,
    consultationFee: 900,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableOnline: true,
    availableOffline: true,
    isActive: true
  },
  {
    doctorId: 'DOC006',
    name: 'Dr. Anil Kapoor',
    profilePhoto: '',
    qualifications: 'MBBS, MS (ENT)',
    specializations: ['ENT Surgery', 'Head and Neck Surgery', 'Voice Disorders'],
    specialtyId: 'SPEC006',
    specialty: 'ENT Specialist',
    experienceYears: 14,
    rating: 4.5,
    reviewCount: 145,
    consultationFee: 1100,
    cashlessAvailable: true,
    insuranceAccepted: ['MCLTech'],
    requiresConfirmation: false,
    allowDirectBooking: true,
    availableOnline: true,
    availableOffline: true,
    isActive: true
  }
];

async function seedDoctors() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('doctors');

    const result = await collection.insertMany(doctors);
    console.log(`Successfully inserted ${result.insertedCount} doctors`);

    const count = await collection.countDocuments({});
    console.log(`Total doctors in database: ${count}`);

  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

seedDoctors();
