// Seed script for categories
const { MongoClient } = require('mongodb');

const categories = [
  {
    categoryId: 'CAT001',
    name: 'Consultation Services',
    description: 'Doctor consultations including general and specialist visits',
    isActive: true,
    displayOrder: 1
  },
  {
    categoryId: 'CAT002',
    name: 'Diagnostic Services',
    description: 'Laboratory tests, imaging, and diagnostic procedures',
    isActive: true,
    displayOrder: 2
  },
  {
    categoryId: 'CAT003',
    name: 'Pharmacy',
    description: 'Medicines and pharmaceutical products',
    isActive: true,
    displayOrder: 3
  },
  {
    categoryId: 'CAT004',
    name: 'Medical Procedures',
    description: 'Surgical and non-surgical medical procedures',
    isActive: true,
    displayOrder: 4
  },
  {
    categoryId: 'CAT005',
    name: 'Preventive Care',
    description: 'Health check-ups, vaccinations, and preventive services',
    isActive: true,
    displayOrder: 5
  },
  {
    categoryId: 'CAT006',
    name: 'Emergency Services',
    description: 'Emergency room visits and ambulance services',
    isActive: true,
    displayOrder: 6
  },
  {
    categoryId: 'CAT007',
    name: 'Wellness Programs',
    description: 'Physiotherapy, mental health, and wellness services',
    isActive: true,
    displayOrder: 7
  },
  {
    categoryId: 'CAT008',
    name: 'Dental Services',
    description: 'Dental consultations, procedures, and treatments',
    isActive: true,
    displayOrder: 8
  },
  {
    categoryId: 'CAT009',
    name: 'Vision Care',
    description: 'Eye examinations, glasses, and vision correction',
    isActive: true,
    displayOrder: 9
  },
  {
    categoryId: 'CAT010',
    name: 'Maternity Services',
    description: 'Prenatal, delivery, and postnatal care',
    isActive: true,
    displayOrder: 10
  },
  {
    categoryId: 'CAT011',
    name: 'Rehabilitation',
    description: 'Physical and occupational therapy services',
    isActive: true,
    displayOrder: 11
  },
  {
    categoryId: 'CAT099',
    name: 'Other Services',
    description: 'Miscellaneous medical services',
    isActive: true,
    displayOrder: 99
  }
];

async function seedCategories() {
  const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('category_master');

    // Clear existing categories
    await collection.deleteMany({});
    console.log('Cleared existing categories');

    // Add timestamps
    const now = new Date();
    const documentsToInsert = categories.map(category => ({
      ...category,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system'
    }));

    // Insert new categories
    const result = await collection.insertMany(documentsToInsert);
    console.log(`Inserted ${result.insertedCount} categories`);

    // List inserted categories
    const inserted = await collection.find({}).sort({ displayOrder: 1 }).toArray();
    console.log('\nInserted categories:');
    inserted.forEach(category => {
      console.log(`  ${category.categoryId}: ${category.name}`);
    });

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

seedCategories();