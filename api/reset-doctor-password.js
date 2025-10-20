const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
const email = 'doctor@doctor.com';
const newPassword = '12345678';

async function resetPassword() {
  console.log('[Reset Password] Connecting to MongoDB:', MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('[Reset Password] Connected successfully');

    const db = client.db('opd_wallet');
    const doctorsCollection = db.collection('doctors');

    // Hash the new password with bcrypt (10 salt rounds)
    console.log('[Reset Password] Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('[Reset Password] Password hashed:', hashedPassword);

    // Update the doctor's password
    console.log('[Reset Password] Updating doctor password for:', email);
    const result = await doctorsCollection.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    console.log('[Reset Password] Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      console.error('[Reset Password] No doctor found with email:', email);
    } else if (result.modifiedCount === 0) {
      console.warn('[Reset Password] Doctor found but password not modified (might be same)');
    } else {
      console.log('[Reset Password] ✅ Password successfully updated for:', email);
    }

    // Verify the password can be validated
    const doctor = await doctorsCollection.findOne({ email: email });
    if (doctor) {
      const isValid = await bcrypt.compare(newPassword, doctor.password);
      console.log('[Reset Password] Verification - Password valid:', isValid);
      if (isValid) {
        console.log('[Reset Password] ✅ Password verification successful!');
      } else {
        console.error('[Reset Password] ❌ Password verification failed!');
      }
    }

  } catch (error) {
    console.error('[Reset Password] Error:', error);
  } finally {
    await client.close();
    console.log('[Reset Password] Connection closed');
  }
}

resetPassword();
