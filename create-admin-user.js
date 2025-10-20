const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');

async function createAdminUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
  console.log('Connecting to:', uri);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('opd_wallet');
    const users = db.collection('users');

    // Check if admin already exists
    const existing = await users.findOne({ email: 'admin@opdwallet.com' });
    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('   Email:', existing.email);
      console.log('   Role:', existing.role);
      return;
    }

    // Hash password
    const password = 'Admin@123';
    const rounds = 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    // Generate unique IDs
    const timestamp = Date.now();
    const userId = `ADMIN-${timestamp}`;
    const uhid = `UHID-ADMIN-${timestamp}`;
    const memberId = `MEM-ADMIN-${timestamp}`;

    // Create admin user matching schema
    const adminUser = {
      _id: new ObjectId(),
      userId: userId,
      uhid: uhid,
      memberId: memberId,
      relationship: 'SELF',
      name: {
        firstName: 'Super',
        lastName: 'Administrator',
        fullName: 'Super Administrator'
      },
      email: 'admin@opdwallet.com',
      phone: '+919999999999',
      dob: new Date('1990-01-01'),
      gender: 'MALE',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      passwordHash: passwordHash,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(adminUser);

    console.log('\n✅ Admin user created successfully!');
    console.log('   Email: admin@opdwallet.com');
    console.log('   Password: Admin@123');
    console.log('   Role: SUPER_ADMIN');
    console.log('   ID:', result.insertedId);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

createAdminUser();
