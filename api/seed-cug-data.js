const { MongoClient } = require('mongodb');

const cugData = [
  {
    cugId: 'CUG001',
    code: 'GOOGLE',
    name: 'Google Inc.',
    description: 'Google corporate group',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG002',
    code: 'MICROSOFT',
    name: 'Microsoft Corporation',
    description: 'Microsoft corporate group',
    isActive: true,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG003',
    code: 'AMAZON',
    name: 'Amazon Inc.',
    description: 'Amazon corporate group',
    isActive: true,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG004',
    code: 'APPLE',
    name: 'Apple Inc.',
    description: 'Apple corporate group',
    isActive: true,
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG005',
    code: 'META',
    name: 'Meta Platforms Inc.',
    description: 'Meta corporate group',
    isActive: true,
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG006',
    code: 'NETFLIX',
    name: 'Netflix Inc.',
    description: 'Netflix corporate group',
    isActive: true,
    displayOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG007',
    code: 'TESLA',
    name: 'Tesla Inc.',
    description: 'Tesla corporate group',
    isActive: true,
    displayOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cugId: 'CUG008',
    code: 'IBM',
    name: 'IBM Corporation',
    description: 'IBM corporate group',
    isActive: true,
    displayOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedCugData() {
  const uri = 'mongodb://localhost:27017/opd_wallet';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('cug_master');

    // Clear existing CUG data
    await collection.deleteMany({});
    console.log('Cleared existing CUG data');

    // Insert new data
    const result = await collection.insertMany(cugData);
    console.log(`Inserted ${result.insertedCount} CUG records`);

    // Verify insertion
    const count = await collection.countDocuments();
    console.log(`Total CUG records in database: ${count}`);

    console.log('\nSeeded CUG data:');
    cugData.forEach((cug, index) => {
      console.log(`${index + 1}. ${cug.name} (${cug.code})`);
    });

  } catch (error) {
    console.error('Error seeding CUG data:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

seedCugData();