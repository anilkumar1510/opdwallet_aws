// Simple MongoDB script to seed relationship master data
const { MongoClient } = require('mongodb');

async function seedRelationships() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('relationship_masters');

    console.log('🌱 Seeding Relationship Master data...');

    const relationships = [
      {
        relationshipCode: 'SELF',
        relationshipName: 'Self',
        displayName: 'Primary Member',
        description: 'The primary policy holder',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        relationshipCode: 'SPOUSE',
        relationshipName: 'Spouse',
        displayName: 'Spouse',
        description: 'Husband or Wife of the primary member',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        relationshipCode: 'CHILD',
        relationshipName: 'Child',
        displayName: 'Child',
        description: 'Son or Daughter of the primary member',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        relationshipCode: 'PARENT',
        relationshipName: 'Parent',
        displayName: 'Parent',
        description: 'Father or Mother of the primary member',
        sortOrder: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        relationshipCode: 'SIBLING',
        relationshipName: 'Sibling',
        displayName: 'Sibling',
        description: 'Brother or Sister of the primary member',
        sortOrder: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing data
    await collection.deleteMany({});

    // Insert new data
    const result = await collection.insertMany(relationships);

    console.log('✅ Relationship Master data seeded successfully');
    console.log(`📊 Inserted ${result.insertedCount} relationship types`);

  } catch (error) {
    console.error('❌ Error seeding relationship master:', error);
  } finally {
    await client.close();
  }
}

seedRelationships();