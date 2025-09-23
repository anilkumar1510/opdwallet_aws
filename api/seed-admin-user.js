const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

async function seedAdminUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('opd_wallet');

    console.log('🔐 SEEDING ADMIN USER\n');
    console.log('════════════════════\n');

    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@test.com' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('   Email: admin@test.com');
      console.log('   Password: Test@123');
      return;
    }

    // For now, use a simple hash (not production-ready)
    // This matches the bcrypt hash for 'Test@123'
    const hashedPassword = '$2a$10$B8nRJxmfI1yJKGGxH0nPo.dMqC4DwgXJPCj.U/aXPSK/7s5zCXGCu';

    // Create admin user with unique UHID, memberId and phone
    const timestamp = Date.now();
    const adminUser = {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      isActive: true,
      uhid: `ADMIN-${timestamp}`, // Unique UHID to avoid duplicate key error
      memberId: `MEM-ADMIN-${timestamp}`, // Unique memberId to avoid duplicate key error
      phone: `+1555${timestamp.toString().slice(-7)}`, // Unique phone number
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@test.com');
    console.log('   Password: Test@123');
    console.log('   ID:', result.insertedId);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

seedAdminUser();