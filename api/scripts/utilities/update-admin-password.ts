import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

async function updateAdminPassword() {
  console.log('🔐 Updating admin password...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db!;

    // Hash the new password
    const newPasswordHash = await bcrypt.hash('Admin@123', 10);
    console.log('✅ New password hashed');

    // Update admin user
    const result = await db.collection('users').updateOne(
      { email: 'admin@opdwallet.com' },
      { $set: { passwordHash: newPasswordHash } }
    );

    console.log('\n✅ Admin password updated successfully!');
    console.log('   Email: admin@opdwallet.com');
    console.log('   New Password: Admin@123');
    console.log(`   Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}\n`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

updateAdminPassword()
  .then(() => {
    console.log('\n✨ Password update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Password update failed:', error);
    process.exit(1);
  });
