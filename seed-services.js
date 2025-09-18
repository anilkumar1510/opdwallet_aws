// Seed script for service types
const { MongoClient } = require('mongodb');

const serviceTypes = [
  // CONSULTATION
  {
    code: 'CON001',
    name: 'General Consultation',
    description: 'General physician consultation for routine check-ups',
    category: 'CONSULTATION',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 500, max: 1500 }
  },
  {
    code: 'CON002',
    name: 'Specialist Consultation',
    description: 'Consultation with specialist doctors',
    category: 'CONSULTATION',
    isActive: true,
    coveragePercentage: 80,
    copayAmount: 200,
    requiresPreAuth: false,
    requiresReferral: true,
    priceRange: { min: 1000, max: 3000 }
  },

  // DIAGNOSTIC
  {
    code: 'DIA001',
    name: 'Blood Test',
    description: 'Complete blood count and routine blood tests',
    category: 'DIAGNOSTIC',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 300, max: 2000 }
  },
  {
    code: 'DIA002',
    name: 'X-Ray',
    description: 'X-Ray imaging services',
    category: 'DIAGNOSTIC',
    isActive: true,
    coveragePercentage: 90,
    copayAmount: 100,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 500, max: 1500 }
  },
  {
    code: 'DIA003',
    name: 'MRI Scan',
    description: 'Magnetic Resonance Imaging',
    category: 'DIAGNOSTIC',
    isActive: true,
    coveragePercentage: 70,
    copayAmount: 500,
    requiresPreAuth: true,
    requiresReferral: true,
    priceRange: { min: 5000, max: 15000 }
  },

  // PHARMACY
  {
    code: 'PHA001',
    name: 'Generic Medicines',
    description: 'Generic prescription medications',
    category: 'PHARMACY',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 50, max: 500 }
  },
  {
    code: 'PHA002',
    name: 'Branded Medicines',
    description: 'Branded prescription medications',
    category: 'PHARMACY',
    isActive: true,
    coveragePercentage: 75,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 100, max: 2000 }
  },

  // PROCEDURE
  {
    code: 'PRO001',
    name: 'Minor Procedures',
    description: 'Minor surgical procedures and treatments',
    category: 'PROCEDURE',
    isActive: true,
    coveragePercentage: 90,
    copayAmount: 500,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 2000, max: 10000 }
  },
  {
    code: 'PRO002',
    name: 'Major Surgery',
    description: 'Major surgical procedures',
    category: 'PROCEDURE',
    isActive: true,
    coveragePercentage: 80,
    copayAmount: 5000,
    requiresPreAuth: true,
    requiresReferral: true,
    priceRange: { min: 50000, max: 500000 }
  },

  // PREVENTIVE
  {
    code: 'PRE001',
    name: 'Health Check-up',
    description: 'Annual comprehensive health check-up',
    category: 'PREVENTIVE',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 3000, max: 8000 },
    annualLimit: 1
  },
  {
    code: 'PRE002',
    name: 'Vaccination',
    description: 'Preventive vaccinations',
    category: 'PREVENTIVE',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 500, max: 5000 }
  },

  // EMERGENCY
  {
    code: 'EMR001',
    name: 'Emergency Room Visit',
    description: 'Emergency department services',
    category: 'EMERGENCY',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 5000, max: 50000 }
  },
  {
    code: 'EMR002',
    name: 'Ambulance Service',
    description: 'Emergency ambulance transportation',
    category: 'EMERGENCY',
    isActive: true,
    coveragePercentage: 100,
    copayAmount: 0,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 2000, max: 10000 }
  },

  // WELLNESS
  {
    code: 'WEL001',
    name: 'Physiotherapy',
    description: 'Physical therapy sessions',
    category: 'WELLNESS',
    isActive: true,
    coveragePercentage: 50,
    copayAmount: 300,
    requiresPreAuth: false,
    requiresReferral: true,
    priceRange: { min: 500, max: 1500 },
    annualLimit: 20
  },
  {
    code: 'WEL002',
    name: 'Mental Health Counseling',
    description: 'Psychological counseling and therapy',
    category: 'WELLNESS',
    isActive: true,
    coveragePercentage: 80,
    copayAmount: 200,
    requiresPreAuth: false,
    requiresReferral: false,
    priceRange: { min: 1000, max: 3000 },
    annualLimit: 12
  }
];

async function seedServiceTypes() {
  const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('opd_wallet');
    const collection = db.collection('service_master');

    // Clear existing service types
    await collection.deleteMany({});
    console.log('Cleared existing service types');

    // Add timestamps
    const now = new Date();
    const documentsToInsert = serviceTypes.map(service => ({
      ...service,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      requiredDocuments: [],
      waitingPeriodDays: 0
    }));

    // Insert new service types
    const result = await collection.insertMany(documentsToInsert);
    console.log(`Inserted ${result.insertedCount} service types`);

    // List inserted services
    const inserted = await collection.find({}).toArray();
    console.log('\nInserted service types:');
    inserted.forEach(service => {
      console.log(`  - ${service.code}: ${service.name} (${service.category})`);
    });

  } catch (error) {
    console.error('Error seeding service types:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

seedServiceTypes();