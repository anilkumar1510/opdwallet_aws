#!/usr/bin/env node

/**
 * Fix CUG Master Collection Index Issue
 *
 * Problem: Old 'code_1' unique index exists but field 'code' doesn't exist in schema
 * Current schema uses 'shortCode' instead
 *
 * This script:
 * 1. Drops the old 'code_1' index
 * 2. Ensures correct indexes exist (cugId, shortCode)
 * 3. Verifies the fix
 *
 * Usage:
 *   node scripts/utilities/fix-cug-index.js
 *
 * Or with custom MongoDB URI:
 *   MONGODB_URI="mongodb://..." node scripts/utilities/fix-cug-index.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
const DB_NAME = 'opd_wallet';
const COLLECTION_NAME = 'cug_master';

async function fixCugIndexes() {
  console.log('\n========================================');
  console.log('🔧 CUG Master Index Fix Script');
  console.log('========================================\n');
  console.log('📊 MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password
  console.log('📦 Database:', DB_NAME);
  console.log('📋 Collection:', COLLECTION_NAME);
  console.log('\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Step 1: List current indexes
    console.log('🔍 Step 1: Checking current indexes...');
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    // Step 2: Check if problematic 'code_1' index exists
    const codeIndexExists = indexes.some(idx => idx.name === 'code_1');

    if (codeIndexExists) {
      console.log('⚠️  Found problematic index: code_1');
      console.log('🗑️  Step 2: Dropping old "code_1" index...');

      try {
        await collection.dropIndex('code_1');
        console.log('✅ Successfully dropped "code_1" index\n');
      } catch (error) {
        if (error.code === 27) {
          console.log('ℹ️  Index "code_1" does not exist (already removed)\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Index "code_1" does not exist (already clean)\n');
    }

    // Step 3: Ensure correct indexes exist
    console.log('🔍 Step 3: Ensuring correct indexes exist...');

    // Check and create cugId index
    const cugIdIndexExists = indexes.some(idx =>
      idx.name === 'cugId_1' || JSON.stringify(idx.key) === '{"cugId":1}'
    );

    if (!cugIdIndexExists) {
      console.log('   Creating index on "cugId"...');
      await collection.createIndex({ cugId: 1 }, { unique: true });
      console.log('   ✅ Created cugId index');
    } else {
      console.log('   ✅ cugId index already exists');
    }

    // Check and create shortCode index (sparse unique)
    const shortCodeIndexExists = indexes.some(idx =>
      idx.name === 'shortCode_1' || JSON.stringify(idx.key) === '{"shortCode":1}'
    );

    if (!shortCodeIndexExists) {
      console.log('   Creating sparse unique index on "shortCode"...');
      await collection.createIndex({ shortCode: 1 }, { unique: true, sparse: true });
      console.log('   ✅ Created shortCode index');
    } else {
      console.log('   ✅ shortCode index already exists');
    }

    console.log('');

    // Step 4: Verify final state
    console.log('🔍 Step 4: Verifying final index state...');
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:');
    finalIndexes.forEach(idx => {
      const indexInfo = {
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false,
      };
      console.log(`   - ${JSON.stringify(indexInfo)}`);
    });
    console.log('');

    // Step 5: Test creating a CUG without shortCode
    console.log('🧪 Step 5: Testing CUG creation...');
    const testCugId = `TEST-${Date.now()}`;

    try {
      // Try to insert a test document without shortCode
      await collection.insertOne({
        cugId: testCugId,
        companyName: 'Test Company (will be deleted)',
        employeeCount: '1-100',
        isActive: true,
        displayOrder: 999,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Successfully created test CUG without shortCode');

      // Clean up test document
      await collection.deleteOne({ cugId: testCugId });
      console.log('✅ Test CUG cleaned up');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }

    console.log('');
    console.log('========================================');
    console.log('✅ CUG Index Fix Completed Successfully');
    console.log('========================================');
    console.log('');
    console.log('📝 Summary:');
    console.log('   • Removed old "code_1" index (if existed)');
    console.log('   • Verified correct indexes exist');
    console.log('   • Tested CUG creation without shortCode');
    console.log('');
    console.log('✨ You can now create CUGs in production without errors');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during migration:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the migration
fixCugIndexes()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
