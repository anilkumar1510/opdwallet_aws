const mongoose = require('mongoose');

async function checkDoctor() {
  try {
    await mongoose.connect('mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const doctors = await db.collection('doctors').find({}).limit(5).toArray();

    console.log('\n=== Doctor Records ===');
    doctors.forEach(doctor => {
      console.log(`\nDoctor ID: ${doctor.doctorId}`);
      console.log(`Name: ${doctor.name}`);
      console.log(`Email: ${doctor.email || 'NOT SET'}`);
      console.log(`Password: ${doctor.password ? 'SET (hash: ' + doctor.password.substring(0, 20) + '...)' : 'NOT SET'}`);
      console.log(`Active: ${doctor.isActive}`);
      console.log(`Role: ${doctor.role || 'NOT SET'}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDoctor();
