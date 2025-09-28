const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

const doctorSlots = [
  {
    slotId: 'SLOT001',
    doctorId: 'DOC001',
    clinicId: 'CLINIC001',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    consultationFee: 1000,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT002',
    doctorId: 'DOC001',
    clinicId: 'CLINIC001',
    dayOfWeek: 'WEDNESDAY',
    startTime: '14:00',
    endTime: '18:00',
    slotDuration: 30,
    consultationFee: 1000,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT003',
    doctorId: 'DOC001',
    clinicId: 'CLINIC001',
    dayOfWeek: 'FRIDAY',
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 30,
    consultationFee: 900,
    consultationType: 'ONLINE',
    maxAppointments: 10,
    isActive: true
  },
  {
    slotId: 'SLOT004',
    doctorId: 'DOC002',
    clinicId: 'CLINIC002',
    dayOfWeek: 'TUESDAY',
    startTime: '08:00',
    endTime: '12:00',
    slotDuration: 30,
    consultationFee: 1500,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT005',
    doctorId: 'DOC002',
    clinicId: 'CLINIC002',
    dayOfWeek: 'THURSDAY',
    startTime: '15:00',
    endTime: '19:00',
    slotDuration: 30,
    consultationFee: 1500,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT006',
    doctorId: 'DOC002',
    clinicId: 'CLINIC002',
    dayOfWeek: 'SATURDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    consultationFee: 1400,
    consultationType: 'ONLINE',
    maxAppointments: 10,
    isActive: true
  },
  {
    slotId: 'SLOT007',
    doctorId: 'DOC003',
    clinicId: 'CLINIC003',
    dayOfWeek: 'MONDAY',
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 20,
    consultationFee: 1200,
    consultationType: 'IN_CLINIC',
    maxAppointments: 12,
    isActive: true
  },
  {
    slotId: 'SLOT008',
    doctorId: 'DOC003',
    clinicId: 'CLINIC003',
    dayOfWeek: 'WEDNESDAY',
    startTime: '15:00',
    endTime: '19:00',
    slotDuration: 20,
    consultationFee: 1200,
    consultationType: 'IN_CLINIC',
    maxAppointments: 12,
    isActive: true
  },
  {
    slotId: 'SLOT009',
    doctorId: 'DOC003',
    clinicId: 'CLINIC003',
    dayOfWeek: 'FRIDAY',
    startTime: '16:00',
    endTime: '20:00',
    slotDuration: 20,
    consultationFee: 1000,
    consultationType: 'ONLINE',
    maxAppointments: 15,
    isActive: true
  },
  {
    slotId: 'SLOT010',
    doctorId: 'DOC004',
    clinicId: 'CLINIC004',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    consultationFee: 1300,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT011',
    doctorId: 'DOC004',
    clinicId: 'CLINIC004',
    dayOfWeek: 'THURSDAY',
    startTime: '14:00',
    endTime: '18:00',
    slotDuration: 30,
    consultationFee: 1300,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT012',
    doctorId: 'DOC005',
    clinicId: 'CLINIC005',
    dayOfWeek: 'TUESDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 20,
    consultationFee: 900,
    consultationType: 'IN_CLINIC',
    maxAppointments: 12,
    isActive: true
  },
  {
    slotId: 'SLOT013',
    doctorId: 'DOC005',
    clinicId: 'CLINIC005',
    dayOfWeek: 'THURSDAY',
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 20,
    consultationFee: 900,
    consultationType: 'IN_CLINIC',
    maxAppointments: 12,
    isActive: true
  },
  {
    slotId: 'SLOT014',
    doctorId: 'DOC005',
    clinicId: 'CLINIC005',
    dayOfWeek: 'SATURDAY',
    startTime: '15:00',
    endTime: '18:00',
    slotDuration: 20,
    consultationFee: 800,
    consultationType: 'ONLINE',
    maxAppointments: 15,
    isActive: true
  },
  {
    slotId: 'SLOT015',
    doctorId: 'DOC006',
    clinicId: 'CLINIC001',
    dayOfWeek: 'WEDNESDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    consultationFee: 1100,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT016',
    doctorId: 'DOC006',
    clinicId: 'CLINIC001',
    dayOfWeek: 'FRIDAY',
    startTime: '14:00',
    endTime: '18:00',
    slotDuration: 30,
    consultationFee: 1100,
    consultationType: 'IN_CLINIC',
    maxAppointments: 8,
    isActive: true
  },
  {
    slotId: 'SLOT017',
    doctorId: 'DOC006',
    clinicId: 'CLINIC001',
    dayOfWeek: 'SATURDAY',
    startTime: '10:00',
    endTime: '13:00',
    slotDuration: 30,
    consultationFee: 1000,
    consultationType: 'ONLINE',
    maxAppointments: 10,
    isActive: true
  }
];

async function seedDoctorSlots() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('doctor_slots');

    const result = await collection.insertMany(doctorSlots);
    console.log(`Successfully inserted ${result.insertedCount} doctor slots`);

    const count = await collection.countDocuments({});
    console.log(`Total doctor slots in database: ${count}`);

  } catch (error) {
    console.error('Error seeding doctor slots:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

seedDoctorSlots();
