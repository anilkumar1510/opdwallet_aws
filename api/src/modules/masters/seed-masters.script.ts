import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

// Using canonical IDs as categoryId (not CAT codes)
const categories = [
  { categoryId: 'CONSULTATION', code: 'CAT001', name: 'Consultation Services', displayOrder: 1, isActive: true },
  { categoryId: 'PHARMACY', code: 'CAT002', name: 'Pharmacy Services', displayOrder: 2, isActive: true },
  { categoryId: 'DIAGNOSTICS', code: 'CAT003', name: 'Diagnostic Services', displayOrder: 3, isActive: true },
];

const serviceTypes = [
  // Consultation Services - CON prefix
  { serviceCode: 'CON001', serviceName: 'General Medicine', categoryId: 'CONSULTATION', displayOrder: 1, isActive: true },
  { serviceCode: 'CON002', serviceName: 'Pediatrics', categoryId: 'CONSULTATION', displayOrder: 2, isActive: true },
  { serviceCode: 'CON003', serviceName: 'Gynecology', categoryId: 'CONSULTATION', displayOrder: 3, isActive: true },

  // Pharmacy Services - PHA prefix
  { serviceCode: 'PHA001', serviceName: 'Retail Pharmacy', categoryId: 'PHARMACY', displayOrder: 1, isActive: true },
  { serviceCode: 'PHA002', serviceName: 'E-Pharmacy', categoryId: 'PHARMACY', displayOrder: 2, isActive: true },

  // Diagnostic Services - LAB prefix
  { serviceCode: 'LAB001', serviceName: 'CBC', categoryId: 'DIAGNOSTICS', displayOrder: 1, isActive: true },
  { serviceCode: 'LAB002', serviceName: 'LFT', categoryId: 'DIAGNOSTICS', displayOrder: 2, isActive: true },
  { serviceCode: 'LAB003', serviceName: 'Lipid Profile', categoryId: 'DIAGNOSTICS', displayOrder: 3, isActive: true },
  { serviceCode: 'LAB004', serviceName: 'Thyroid Panel', categoryId: 'DIAGNOSTICS', displayOrder: 4, isActive: true },
  { serviceCode: 'LAB005', serviceName: 'X-Ray', categoryId: 'DIAGNOSTICS', displayOrder: 5, isActive: true },
];

async function seedMasters() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Seed Categories (idempotent using upsert)
    const categoryCollection = db.collection('category_master');
    console.log('\nSeeding categories...');

    for (const category of categories) {
      const result = await categoryCollection.updateOne(
        { categoryId: category.categoryId },
        {
          $set: {
            ...category,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`✅ Inserted category: ${category.name}`);
      } else if (result.modifiedCount > 0) {
        console.log(`🔄 Updated category: ${category.name}`);
      } else {
        console.log(`⏭️  Skipped category (unchanged): ${category.name}`);
      }
    }

    // Seed Service Types (idempotent using upsert)
    const serviceTypeCollection = db.collection('service_types');
    console.log('\nSeeding service types...');

    for (const serviceType of serviceTypes) {
      const result = await serviceTypeCollection.updateOne(
        { serviceCode: serviceType.serviceCode },
        {
          $set: {
            ...serviceType,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`✅ Inserted service type: ${serviceType.serviceName}`);
      } else if (result.modifiedCount > 0) {
        console.log(`🔄 Updated service type: ${serviceType.serviceName}`);
      } else {
        console.log(`⏭️  Skipped service type (unchanged): ${serviceType.serviceName}`);
      }
    }

    // Create indexes
    console.log('\nCreating indexes...');

    // Category indexes
    await categoryCollection.createIndex({ categoryId: 1 }, { unique: true });
    await categoryCollection.createIndex({ code: 1 }, { unique: true });
    await categoryCollection.createIndex({ isActive: 1, displayOrder: 1 });
    console.log('✅ Created indexes for category_master');

    // Service Type indexes
    await serviceTypeCollection.createIndex({ serviceCode: 1 }, { unique: true });
    await serviceTypeCollection.createIndex({ categoryId: 1, isActive: 1 });
    await serviceTypeCollection.createIndex({ categoryId: 1, displayOrder: 1 });
    console.log('✅ Created indexes for service_types');

    console.log('\n✨ Master data seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding master data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the seed script
seedMasters().catch(console.error);