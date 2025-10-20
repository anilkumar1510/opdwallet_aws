const { MongoClient } = require('mongodb');

async function checkAdminUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
  console.log('Connecting to:', uri);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('opd_wallet');
    const users = db.collection('users');

    // Find admin users
    const adminUsers = await users.find({
      role: { $in: ['SUPER_ADMIN', 'ADMIN', 'TPA_ADMIN'] }
    }).toArray();

    console.log('\n📊 Admin Users Found:', adminUsers.length);

    if (adminUsers.length > 0) {
      console.log('\n👥 Admin User Details:');
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
      });
    } else {
      console.log('\n❌ No admin users found in database!');
      console.log('   Need to create an admin user.');
    }

    // Check specifically for admin@opdwallet.com
    const specificAdmin = await users.findOne({ email: 'admin@opdwallet.com' });
    if (specificAdmin) {
      console.log('\n✅ admin@opdwallet.com EXISTS');
      console.log('   Role:', specificAdmin.role);
    } else {
      console.log('\n❌ admin@opdwallet.com NOT FOUND');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkAdminUser();
