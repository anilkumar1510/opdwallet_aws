const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';

async function fixDoctorNames() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const prescriptionsCollection = db.collection('doctorprescriptions');
    const appointmentsCollection = db.collection('appointments');

    // Find all prescriptions with "Unknown Doctor"
    const prescriptionsWithUnknownDoctor = await prescriptionsCollection.find({
      doctorName: 'Unknown Doctor',
      isActive: true
    }).toArray();

    console.log(`📋 Found ${prescriptionsWithUnknownDoctor.length} prescriptions with "Unknown Doctor"`);

    let updatedCount = 0;

    for (const prescription of prescriptionsWithUnknownDoctor) {
      // Find the appointment linked to this prescription
      const appointment = await appointmentsCollection.findOne({
        _id: prescription.appointmentId
      });

      if (appointment && appointment.doctorName && appointment.doctorName !== 'Unknown Doctor') {
        console.log(`🔧 Updating prescription ${prescription.prescriptionId}`);
        console.log(`   Old doctorName: ${prescription.doctorName}`);
        console.log(`   New doctorName: ${appointment.doctorName}`);

        await prescriptionsCollection.updateOne(
          { _id: prescription._id },
          { $set: { doctorName: appointment.doctorName } }
        );
        updatedCount++;
      } else {
        console.log(`⚠️  No valid doctor name found for prescription ${prescription.prescriptionId}`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} prescriptions`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixDoctorNames().catch(console.error);
