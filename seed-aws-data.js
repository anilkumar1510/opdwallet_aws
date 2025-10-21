const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://opd-mongodb-prod:27017/opd_wallet';

const masterData = {
  categories: [
    {
      categoryId: 'CAT001',
      code: 'CAT001',
      name: 'Consult',
      isActive: true,
      displayOrder: 1,
      description: 'Doctor consultations',
      isAvailableOnline: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      categoryId: 'CAT002',
      code: 'CAT002',
      name: 'Pharmacy',
      isActive: true,
      displayOrder: 2,
      description: 'Medicine purchases',
      isAvailableOnline: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      categoryId: 'CAT003',
      code: 'CAT003',
      name: 'Labs',
      isActive: true,
      displayOrder: 3,
      description: 'Lab tests and diagnostics',
      isAvailableOnline: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      categoryId: 'CAT004',
      code: 'CAT004',
      name: 'Dental',
      isActive: true,
      displayOrder: 4,
      description: 'Dental care',
      isAvailableOnline: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  specialties: [
    { specialtyId: 'SPEC001', code: 'GENERAL_PHYSICIAN', name: 'General Physician', description: 'General medical consultation', icon: 'stethoscope', isActive: true, displayOrder: 1 },
    { specialtyId: 'SPEC002', code: 'GYNECOLOGIST', name: 'Gynaecologist', description: "Women's health", icon: 'female-doctor', isActive: true, displayOrder: 2 },
    { specialtyId: 'SPEC003', code: 'PSYCHOLOGIST', name: 'Psychologist', description: 'Mental health', icon: 'brain', isActive: true, displayOrder: 3 },
    { specialtyId: 'SPEC004', code: 'DERMATOLOGIST', name: 'Dermatologist', description: 'Skin care', icon: 'skin', isActive: true, displayOrder: 4 },
    { specialtyId: 'SPEC005', code: 'NUTRITIONIST', name: 'Nutritionist', description: 'Diet consultation', icon: 'apple', isActive: true, displayOrder: 5 },
    { specialtyId: 'SPEC006', code: 'CARDIOLOGIST', name: 'Cardiologist', description: 'Heart specialist', icon: 'heart', isActive: true, displayOrder: 6 },
    { specialtyId: 'SPEC007', code: 'PEDIATRICIAN', name: 'Pediatrician', description: 'Child specialist', icon: 'child', isActive: true, displayOrder: 7 },
    { specialtyId: 'SPEC008', code: 'ORTHOPEDIC', name: 'Orthopedic', description: 'Bone and joint', icon: 'bone', isActive: true, displayOrder: 8 },
    { specialtyId: 'SPEC009', code: 'DENTIST', name: 'Dentist', description: 'Dental care', icon: 'tooth', isActive: true, displayOrder: 9 }
  ],

  relationships: [
    { relationshipCode: 'REL001', relationshipName: 'Self', displayName: 'Self', description: 'Primary member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { relationshipCode: 'REL002', relationshipName: 'Spouse', displayName: 'Spouse', description: 'Spouse of primary member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { relationshipCode: 'REL003', relationshipName: 'Child', displayName: 'Child', description: 'Child of primary member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { relationshipCode: 'REL004', relationshipName: 'Father', displayName: 'Father', description: 'Father of primary member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { relationshipCode: 'REL005', relationshipName: 'Mother', displayName: 'Mother', description: 'Mother of primary member', isActive: true, createdAt: new Date(), updatedAt: new Date() }
  ],

  clinics: [
    {
      clinicId: 'CLINIC001',
      name: 'Manipal Hospital',
      phone: '+911123456789',
      email: 'contact@manipalhospitals.com',
      address: { street: 'Sector 6, Dwarka', city: 'Delhi', state: 'Delhi', pincode: '110075', country: 'India' },
      location: { latitude: 28.5921, longitude: 77.046 },
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
      name: 'Max Hospital',
      phone: '+911234567890',
      email: 'contact@maxhealthcare.com',
      address: { street: 'Saket', city: 'Delhi', state: 'Delhi', pincode: '110017', country: 'India' },
      location: { latitude: 28.5244, longitude: 77.2066 },
      operatingHours: {
        monday: { open: '00:00', close: '23:59', closed: false },
        tuesday: { open: '00:00', close: '23:59', closed: false },
        wednesday: { open: '00:00', close: '23:59', closed: false },
        thursday: { open: '00:00', close: '23:59', closed: false },
        friday: { open: '00:00', close: '23:59', closed: false },
        saturday: { open: '00:00', close: '23:59', closed: false },
        sunday: { open: '00:00', close: '23:59', closed: false }
      },
      facilities: ['ICU', 'Pharmacy', 'Lab', 'CT Scan', 'MRI', 'Emergency'],
      isActive: true
    },
    {
      clinicId: 'CLINIC003',
      name: 'Apollo Clinic',
      phone: '+911298765432',
      email: 'contact@apolloclinic.com',
      address: { street: 'Nehru Place', city: 'Delhi', state: 'Delhi', pincode: '110019', country: 'India' },
      location: { latitude: 28.5494, longitude: 77.2508 },
      operatingHours: {
        monday: { open: '08:00', close: '21:00', closed: false },
        tuesday: { open: '08:00', close: '21:00', closed: false },
        wednesday: { open: '08:00', close: '21:00', closed: false },
        thursday: { open: '08:00', close: '21:00', closed: false },
        friday: { open: '08:00', close: '21:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { closed: true }
      },
      facilities: ['Pharmacy', 'Lab', 'ECG'],
      isActive: true
    }
  ],

  doctors: [
    {
      doctorId: 'DOC001',
      name: 'Dr. Vikas Mittal',
      email: 'vikas.mittal@hospital.com',
      password: '', // Will be hashed
      role: 'DOCTOR',
      profilePhoto: '',
      qualifications: 'MBBS, MD (Pulmonary Medicine)',
      specializations: ['Pulmonary Medicine', 'Respiratory Diseases'],
      specialtyId: 'SPEC001',
      specialty: 'General Physician',
      experienceYears: 16,
      rating: 4.7,
      reviewCount: 156,
      consultationFee: 800,
      phone: '+919876543210',
      registrationNumber: 'DMC12345',
      languages: ['English', 'Hindi'],
      availableOnline: true,
      availableOffline: true,
      isActive: true
    },
    {
      doctorId: 'DOC002',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@hospital.com',
      password: '',
      role: 'DOCTOR',
      profilePhoto: '',
      qualifications: 'MBBS, MD (Dermatology)',
      specializations: ['Dermatology', 'Cosmetic Procedures'],
      specialtyId: 'SPEC004',
      specialty: 'Dermatologist',
      experienceYears: 12,
      rating: 4.8,
      reviewCount: 234,
      consultationFee: 1000,
      phone: '+919876543211',
      registrationNumber: 'DMC12346',
      languages: ['English', 'Hindi'],
      availableOnline: true,
      availableOffline: true,
      isActive: true
    },
    {
      doctorId: 'DOC003',
      name: 'Dr. Amit Kumar',
      email: 'amit.kumar@hospital.com',
      password: '',
      role: 'DOCTOR',
      profilePhoto: '',
      qualifications: 'MBBS, MD (Cardiology)',
      specializations: ['Cardiology', 'Interventional Cardiology'],
      specialtyId: 'SPEC006',
      specialty: 'Cardiologist',
      experienceYears: 20,
      rating: 4.9,
      reviewCount: 456,
      consultationFee: 1500,
      phone: '+919876543212',
      registrationNumber: 'DMC12347',
      languages: ['English', 'Hindi'],
      availableOnline: false,
      availableOffline: true,
      isActive: true
    },
    {
      doctorId: 'DOC004',
      name: 'Dr. Sneha Patel',
      email: 'sneha.patel@hospital.com',
      password: '',
      role: 'DOCTOR',
      profilePhoto: '',
      qualifications: 'MBBS, MD (Gynecology)',
      specializations: ['Gynecology', 'Obstetrics'],
      specialtyId: 'SPEC002',
      specialty: 'Gynaecologist',
      experienceYears: 15,
      rating: 4.7,
      reviewCount: 289,
      consultationFee: 1200,
      phone: '+919876543213',
      registrationNumber: 'DMC12348',
      languages: ['English', 'Hindi', 'Gujarati'],
      availableOnline: true,
      availableOffline: true,
      isActive: true
    },
    {
      doctorId: 'DOC005',
      name: 'Dr. Rajesh Verma',
      email: 'rajesh.verma@hospital.com',
      password: '',
      role: 'DOCTOR',
      profilePhoto: '',
      qualifications: 'MBBS, MD (Pediatrics)',
      specializations: ['Pediatrics', 'Child Development'],
      specialtyId: 'SPEC007',
      specialty: 'Pediatrician',
      experienceYears: 18,
      rating: 4.9,
      reviewCount: 367,
      consultationFee: 900,
      phone: '+919876543214',
      registrationNumber: 'DMC12349',
      languages: ['English', 'Hindi'],
      availableOnline: true,
      availableOffline: true,
      isActive: true
    }
  ]
};

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Seed Categories
    console.log('\n📦 Seeding Categories...');
    const categoriesResult = await db.collection('category_master').insertMany(
      masterData.categories,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some categories already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${categoriesResult.insertedCount} categories`);

    // Seed Specialties
    console.log('\n📦 Seeding Specialties...');
    const specialtiesResult = await db.collection('specialty_master').insertMany(
      masterData.specialties,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some specialties already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${specialtiesResult.insertedCount} specialties`);

    // Seed Relationships
    console.log('\n📦 Seeding Relationships...');
    const relationshipsResult = await db.collection('relationship_masters').insertMany(
      masterData.relationships,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some relationships already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${relationshipsResult.insertedCount} relationships`);

    // Seed Clinics
    console.log('\n📦 Seeding Clinics...');
    const clinicsResult = await db.collection('clinics').insertMany(
      masterData.clinics,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some clinics already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${clinicsResult.insertedCount} clinics`);

    // Hash passwords for doctors
    console.log('\n📦 Preparing Doctors...');
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    const doctorsWithPasswords = masterData.doctors.map(doc => ({
      ...doc,
      password: hashedPassword
    }));

    // Seed Doctors
    console.log('📦 Seeding Doctors...');
    const doctorsResult = await db.collection('doctors').insertMany(
      doctorsWithPasswords,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some doctors already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${doctorsResult.insertedCount} doctors`);

    // Seed Doctor Slots
    console.log('\n📦 Seeding Doctor Slots...');
    const slots = [];
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const clinics = ['CLINIC001', 'CLINIC002', 'CLINIC003'];

    masterData.doctors.forEach((doctor, docIndex) => {
      // Each doctor works at 1-2 clinics
      const doctorClinics = clinics.slice(0, Math.min(2, docIndex + 1));

      doctorClinics.forEach(clinicId => {
        // Each doctor has slots on 3-5 days
        const workingDays = days.slice(0, 3 + (docIndex % 3));

        workingDays.forEach((day, dayIndex) => {
          const slotId = `SLOT${String(slots.length + 1).padStart(3, '0')}`;
          slots.push({
            slotId,
            doctorId: doctor.doctorId,
            clinicId,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '13:00',
            slotDuration: 30,
            consultationFee: doctor.consultationFee,
            consultationType: 'IN_CLINIC',
            maxAppointments: 8,
            isActive: true
          });

          // Add afternoon slot for some doctors
          if (docIndex % 2 === 0) {
            const afternoonSlotId = `SLOT${String(slots.length + 1).padStart(3, '0')}`;
            slots.push({
              slotId: afternoonSlotId,
              doctorId: doctor.doctorId,
              clinicId,
              dayOfWeek: day,
              startTime: '14:00',
              endTime: '18:00',
              slotDuration: 30,
              consultationFee: doctor.consultationFee,
              consultationType: 'IN_CLINIC',
              maxAppointments: 8,
              isActive: true
            });
          }

          // Add online slots for doctors who are available online
          if (doctor.availableOnline) {
            const onlineSlotId = `SLOT${String(slots.length + 1).padStart(3, '0')}`;
            slots.push({
              slotId: onlineSlotId,
              doctorId: doctor.doctorId,
              clinicId: null,
              dayOfWeek: day,
              startTime: '18:00',
              endTime: '21:00',
              slotDuration: 20,
              consultationFee: doctor.consultationFee * 0.8, // 20% discount for online
              consultationType: 'ONLINE',
              maxAppointments: 12,
              isActive: true
            });
          }
        });
      });
    });

    const slotsResult = await db.collection('doctor_slots').insertMany(
      slots,
      { ordered: false }
    ).catch(err => {
      if (err.code === 11000) {
        console.log('⚠️  Some slots already exist, skipping duplicates');
        return { insertedCount: 0 };
      }
      throw err;
    });
    console.log(`✅ Inserted ${slotsResult.insertedCount} doctor slots`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Categories: ${await db.collection('category_master').countDocuments()}`);
    console.log(`Specialties: ${await db.collection('specialty_master').countDocuments()}`);
    console.log(`Relationships: ${await db.collection('relationship_masters').countDocuments()}`);
    console.log(`Clinics: ${await db.collection('clinics').countDocuments()}`);
    console.log(`Doctors: ${await db.collection('doctors').countDocuments()}`);
    console.log(`Doctor Slots: ${await db.collection('doctor_slots').countDocuments()}`);
    console.log(`Policies: ${await db.collection('policies').countDocuments()}`);
    console.log(`Users: ${await db.collection('users').countDocuments()}`);
    console.log('='.repeat(50));

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Doctor Login Credentials:');
    console.log('Email: vikas.mittal@hospital.com | Password: doctor123');
    console.log('Email: priya.sharma@hospital.com | Password: doctor123');
    console.log('Email: amit.kumar@hospital.com | Password: doctor123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);
