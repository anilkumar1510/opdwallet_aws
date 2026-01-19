const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

const clinics = [
  {
    clinicId: 'CLINIC001',
    name: 'Manipal Hospital',
    phone: '+911123456789',
    email: 'contact@manipalhospitals.com',
    address: {
      street: 'Sector 6, Dwarka',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110075',
      country: 'India'
    },
    location: {
      latitude: 28.5921,
      longitude: 77.046
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: false }
    },
    facilities: ['Pharmacy', 'Lab', 'X-Ray', 'ECG', 'Emergency'],
    isActive: true
  },
  {
    clinicId: 'CLINIC002',
    name: 'Max Super Specialty Hospital',
    phone: '+911198765432',
    email: 'info@maxhealthcare.com',
    address: {
      street: 'Saket',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110017',
      country: 'India'
    },
    location: {
      latitude: 28.5244,
      longitude: 77.2066
    },
    operatingHours: {
      monday: { open: '07:00', close: '21:00', closed: false },
      tuesday: { open: '07:00', close: '21:00', closed: false },
      wednesday: { open: '07:00', close: '21:00', closed: false },
      thursday: { open: '07:00', close: '21:00', closed: false },
      friday: { open: '07:00', close: '21:00', closed: false },
      saturday: { open: '08:00', close: '20:00', closed: false },
      sunday: { open: '08:00', close: '16:00', closed: false }
    },
    facilities: ['Pharmacy', 'Lab', 'X-Ray', 'CT Scan', 'MRI', 'ICU', 'Emergency'],
    isActive: true
  },
  {
    clinicId: 'CLINIC003',
    name: 'Fortis Hospital',
    phone: '+911187654321',
    email: 'care@fortishealthcare.com',
    address: {
      street: 'Vasant Kunj',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110070',
      country: 'India'
    },
    location: {
      latitude: 28.5167,
      longitude: 77.1598
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: false }
    },
    facilities: ['Pharmacy', 'Lab', 'X-Ray', 'Ultrasound', 'Emergency'],
    isActive: true
  },
  {
    clinicId: 'CLINIC004',
    name: 'Apollo Clinic',
    phone: '+911176543210',
    email: 'info@apolloclinic.com',
    address: {
      street: 'Nehru Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110019',
      country: 'India'
    },
    location: {
      latitude: 28.5494,
      longitude: 77.2501
    },
    operatingHours: {
      monday: { open: '09:00', close: '19:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '19:00', closed: false },
      friday: { open: '09:00', close: '19:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '13:00', closed: true }
    },
    facilities: ['Pharmacy', 'Lab', 'X-Ray'],
    isActive: true
  },
  {
    clinicId: 'CLINIC005',
    name: 'Sir Ganga Ram Hospital',
    phone: '+911165432109',
    email: 'contact@sgrh.com',
    address: {
      street: 'Rajinder Nagar',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110060',
      country: 'India'
    },
    location: {
      latitude: 28.6409,
      longitude: 77.1924
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: false }
    },
    facilities: ['Pharmacy', 'Lab', 'X-Ray', 'CT Scan', 'Emergency', 'ICU'],
    isActive: true
  }
];

async function seedClinics() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('clinics');

    const result = await collection.insertMany(clinics);
    console.log(`Successfully inserted ${result.insertedCount} clinics`);

    const count = await collection.countDocuments({});
    console.log(`Total clinics in database: ${count}`);

  } catch (error) {
    console.error('Error seeding clinics:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

seedClinics();