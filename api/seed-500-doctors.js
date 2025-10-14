const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  await seedDoctors();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
});

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

// Generate realistic Indian names
const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Kavita',
  'Ravi', 'Deepika', 'Suresh', 'Meera', 'Anil', 'Pooja', 'Manoj', 'Neha',
  'Sanjay', 'Divya', 'Rahul', 'Swati', 'Vijay', 'Lakshmi', 'Karthik', 'Asha',
  'Prakash', 'Shalini', 'Ramesh', 'Nisha', 'Anand', 'Preeti', 'Ashok', 'Rani',
  'Sandeep', 'Rekha', 'Mahesh', 'Sunita', 'Naveen', 'Geeta', 'Mohan', 'Anita',
  'Dinesh', 'Veena', 'Praveen', 'Shobha', 'Krishna', 'Maya', 'Ganesh', 'Radha',
  'Arun', 'Savita', 'Kishore', 'Lalita', 'Naresh', 'Kamala', 'Pawan', 'Usha'
];

const lastNames = [
  'Kumar', 'Sharma', 'Singh', 'Patel', 'Reddy', 'Rao', 'Nair', 'Iyer',
  'Gupta', 'Verma', 'Joshi', 'Desai', 'Mehta', 'Shah', 'Agarwal', 'Malhotra',
  'Bhatia', 'Chopra', 'Kapoor', 'Srinivasan', 'Krishnan', 'Menon', 'Pillai',
  'Das', 'Ghosh', 'Roy', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Sen'
];

const qualifications = [
  'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, DM', 'MBBS, MCh',
  'MBBS, MD, DM', 'MBBS, MS, MCh', 'MBBS, MD, FRCP', 'MBBS, MS, FACS',
  'MBBS, MD, MRCP', 'MBBS, DNB, MNAMS', 'MBBS, MD, PhD'
];

const timeSlots = {
  morning: { start: '09:00', end: '13:00' },
  evening: { start: '17:00', end: '21:00' },
  fullDay: { start: '09:00', end: '18:00' },
  afternoon: { start: '14:00', end: '18:00' }
};

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

async function seedDoctors() {
  try {
    console.log('\n🔍 Fetching specialties and clinics...');

    // Fetch specialties
    const specialties = await db.collection('specialty_master').find({ isActive: true }).toArray();
    console.log(`✅ Found ${specialties.length} specialties`);

    if (specialties.length === 0) {
      console.error('❌ No specialties found. Please seed specialties first.');
      return;
    }

    // Fetch clinics
    const clinics = await db.collection('clinics').find({ isActive: true }).toArray();
    console.log(`✅ Found ${clinics.length} clinics`);

    if (clinics.length === 0) {
      console.error('❌ No clinics found. Please seed clinics first.');
      return;
    }

    // Get next doctor number - check existing doctors first
    const lastDoctor = await db.collection('doctors')
      .find({})
      .sort({ doctorId: -1 })
      .limit(1)
      .toArray();

    let doctorCounter = 6; // Start from DOC006 (we have DOC001-DOC005)
    if (lastDoctor.length > 0) {
      const lastId = lastDoctor[0].doctorId;
      const lastNum = parseInt(lastId.replace('DOC', ''));
      doctorCounter = lastNum + 1;
    }

    console.log(`\n🏥 Starting to generate 500 doctors...`);

    const doctorsToInsert = [];
    const slotsToInsert = [];
    const usedEmails = new Set();

    for (let i = 0; i < 500; i++) {
      // Generate unique doctor ID
      const doctorId = `DOC${String(doctorCounter).padStart(3, '0')}`;
      doctorCounter++;

      // Generate name
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const name = `Dr. ${firstName} ${lastName}`;

      // Generate unique email
      let email;
      do {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@doctors.opd.com`;
      } while (usedEmails.has(email));
      usedEmails.add(email);

      // Select specialty (weighted distribution)
      const specialty = randomElement(specialties);

      // Random attributes
      const experienceYears = randomInt(5, 40);
      const consultationFee = randomInt(6, 40) * 50; // ₹300 to ₹2000 in steps of 50
      const qualification = randomElement(qualifications);
      const availableOnline = Math.random() > 0.3; // 70% available online
      const availableOffline = true; // All available offline

      // Create doctor document
      const doctor = {
        doctorId,
        name,
        email,
        phone: `+91${randomInt(7000000000, 9999999999)}`,
        profilePhoto: null,
        qualifications: qualification,
        specializations: [specialty.name],
        specialtyId: specialty.specialtyId,
        specialty: specialty.name,
        experienceYears,
        rating: 0,
        reviewCount: 0,
        consultationFee,
        availableOnline,
        availableOffline,
        isActive: true,
        role: 'DOCTOR',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      doctorsToInsert.push(doctor);

      // Assign doctor to 2-4 random clinics and create slots
      const numClinics = randomInt(2, 4);
      const assignedClinics = randomElements(clinics, numClinics);

      assignedClinics.forEach((clinic) => {
        // Create 2-3 slot configurations per clinic
        const numSlotConfigs = randomInt(2, 3);

        for (let j = 0; j < numSlotConfigs; j++) {
          const slotType = randomElement(['morning', 'evening', 'fullDay', 'afternoon']);
          const slotTime = timeSlots[slotType];

          // Select 3-5 random days
          const workDays = randomElements(daysOfWeek, randomInt(3, 5));

          workDays.forEach((day) => {
            const slot = {
              slotId: `${doctorId}_${clinic.clinicId}_${day}_${slotType}_${Date.now()}${randomInt(1000, 9999)}`,
              doctorId,
              doctorName: name,
              clinicId: clinic.clinicId,
              clinicName: clinic.name,
              consultationType: 'IN_CLINIC',
              dayOfWeek: day,
              startTime: slotTime.start,
              endTime: slotTime.end,
              slotDuration: 15, // 15 minutes per slot
              consultationFee: consultationFee + randomInt(-100, 100), // Slight variation per clinic
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            slotsToInsert.push(slot);
          });
        }

        // If doctor is available online, create online slots
        if (availableOnline) {
          const onlineSlotType = randomElement(['morning', 'evening']);
          const onlineSlotTime = timeSlots[onlineSlotType];
          const onlineDays = randomElements(daysOfWeek, randomInt(5, 7)); // More online availability

          onlineDays.forEach((day) => {
            const onlineSlot = {
              slotId: `${doctorId}_ONLINE_${day}_${onlineSlotType}_${Date.now()}${randomInt(1000, 9999)}`,
              doctorId,
              doctorName: name,
              clinicId: clinic.clinicId, // Still linked to a clinic for administrative purposes
              clinicName: 'Online Consultation',
              consultationType: 'ONLINE',
              dayOfWeek: day,
              startTime: onlineSlotTime.start,
              endTime: onlineSlotTime.end,
              slotDuration: 15,
              consultationFee: Math.floor(consultationFee * 0.8), // 20% discount for online
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            slotsToInsert.push(onlineSlot);
          });
        }
      });

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`✓ Generated ${i + 1}/500 doctors...`);
      }
    }

    console.log('\n📝 Inserting doctors into database...');
    await db.collection('doctors').insertMany(doctorsToInsert);
    console.log(`✅ Inserted ${doctorsToInsert.length} doctors`);

    console.log('\n📝 Inserting doctor slots into database...');
    await db.collection('doctor_slots').insertMany(slotsToInsert);
    console.log(`✅ Inserted ${slotsToInsert.length} doctor slots`);

    // Update counter
    await db.collection('counters').updateOne(
      { _id: 'doctorId' },
      { $set: { seq: doctorCounter } },
      { upsert: true }
    );
    console.log(`✅ Updated doctor counter to ${doctorCounter}`);

    // Statistics
    console.log('\n📊 Seeding Statistics:');
    console.log(`   Total Doctors: ${doctorsToInsert.length}`);
    console.log(`   Total Slots: ${slotsToInsert.length}`);
    console.log(`   Avg Slots per Doctor: ${Math.round(slotsToInsert.length / doctorsToInsert.length)}`);
    console.log(`   Specialties Used: ${specialties.length}`);
    console.log(`   Clinics Used: ${clinics.length}`);

    // Count by specialty
    const specialtyCount = {};
    doctorsToInsert.forEach(doc => {
      specialtyCount[doc.specialty] = (specialtyCount[doc.specialty] || 0) + 1;
    });
    console.log('\n📈 Doctors per Specialty:');
    Object.entries(specialtyCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([specialty, count]) => {
        console.log(`   ${specialty}: ${count}`);
      });

    console.log('\n✅ Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    throw error;
  }
}
