const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';

async function fixPrescriptionIds() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const prescriptionsCollection = db.collection('doctorprescriptions');
    const appointmentsCollection = db.collection('appointments');

    // Find all prescriptions
    const prescriptions = await prescriptionsCollection.find({isActive: true}).toArray();
    console.log(`📋 Found ${prescriptions.length} active prescriptions`);

    let updatedCount = 0;

    for (const prescription of prescriptions) {
      // Find the appointment linked to this prescription
      const appointment = await appointmentsCollection.findOne({
        _id: prescription.appointmentId
      });

      if (appointment) {
        // Check if the appointment has prescriptionId and if it's an ObjectId or string
        if (appointment.prescriptionId) {
          // If it's an ObjectId (stored as prescription._id), update it to use the string prescriptionId
          if (appointment.prescriptionId.toString() === prescription._id.toString()) {
            console.log(`🔧 Fixing appointment ${appointment.appointmentId}`);
            console.log(`   Old prescriptionId (ObjectId): ${appointment.prescriptionId}`);
            console.log(`   New prescriptionId (string): ${prescription.prescriptionId}`);

            await appointmentsCollection.updateOne(
              { _id: appointment._id },
              { $set: { prescriptionId: prescription.prescriptionId } }
            );
            updatedCount++;
          } else if (appointment.prescriptionId === prescription.prescriptionId) {
            console.log(`✅ Appointment ${appointment.appointmentId} already has correct prescriptionId`);
          }
        } else {
          console.log(`⚠️  Appointment ${appointment.appointmentId} doesn't have prescriptionId set, setting it now`);
          await appointmentsCollection.updateOne(
            { _id: appointment._id },
            { $set: {
              prescriptionId: prescription.prescriptionId,
              hasPrescription: true
            } }
          );
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} appointments`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPrescriptionIds().catch(console.error);
