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
  { code: 'CON001', name: 'General Medicine', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'CON002', name: 'Pediatrics', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'CON003', name: 'Gynecology', category: 'CONSULTATION', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },

  // Pharmacy Services - PHA prefix
  { code: 'PHA001', name: 'Retail Pharmacy', category: 'PHARMACY', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'PHA002', name: 'E-Pharmacy', category: 'PHARMACY', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },

  // Diagnostic Services - LAB prefix
  { code: 'LAB001', name: 'CBC', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'LAB002', name: 'LFT', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'LAB003', name: 'Lipid Profile', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'LAB004', name: 'Thyroid Panel', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
  { code: 'LAB005', name: 'X-Ray', category: 'DIAGNOSTICS', isActive: true, coveragePercentage: 100, copayAmount: 0, requiresPreAuth: false, requiresReferral: false, waitingPeriodDays: 0, requiredDocuments: [] },
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
    const serviceTypeCollection = db.collection('service_master');
    console.log('\nSeeding service types...');

    for (const serviceType of serviceTypes) {
      const result = await serviceTypeCollection.updateOne(
        { code: serviceType.code },
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
        console.log(`✅ Inserted service type: ${serviceType.name}`);
      } else if (result.modifiedCount > 0) {
        console.log(`🔄 Updated service type: ${serviceType.name}`);
      } else {
        console.log(`⏭️  Skipped service type (unchanged): ${serviceType.name}`);
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
    await serviceTypeCollection.createIndex({ code: 1 }, { unique: true });
    await serviceTypeCollection.createIndex({ category: 1, isActive: 1 });
    console.log('✅ Created indexes for service_master');

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