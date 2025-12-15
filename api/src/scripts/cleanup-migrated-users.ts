#!/usr/bin/env ts-node

/**
 * Cleanup Migrated Users Script
 *
 * Deletes internal users from 'users' collection after successful migration
 *
 * ⚠️  DANGER: This script PERMANENTLY DELETES data
 * Only run this AFTER:
 * 1. Migration completed successfully
 * 2. ALL tests passed
 * 3. ALL portals verified working
 * 4. Authentication confirmed working for both user types
 *
 * SAFETY: Requires explicit confirmation via environment variable
 *
 * Usage:
 *   CONFIRM_CLEANUP=YES_DELETE_INTERNAL_USERS node dist/scripts/cleanup-migrated-users.js
 */

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
const CONFIRMATION = process.env.CONFIRM_CLEANUP;
const REQUIRED_CONFIRMATION = 'YES_DELETE_INTERNAL_USERS';

const INTERNAL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'TPA_ADMIN', 'TPA_USER', 'FINANCE_USER', 'OPS'];

async function cleanupMigratedUsers() {
  console.log('\n========================================');
  console.log('CLEANUP MIGRATED USERS');
  console.log('========================================\n');
  console.log('⚠️  WARNING: This will PERMANENTLY DELETE internal users from "users" collection');
  console.log('📊 MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
  console.log('\n');

  // Safety check: Require explicit confirmation
  if (CONFIRMATION !== REQUIRED_CONFIRMATION) {
    console.error('❌ SAFETY CHECK FAILED');
    console.error(`\nRequired confirmation not provided.`);
    console.error(`Set environment variable: CONFIRM_CLEANUP=${REQUIRED_CONFIRMATION}`);
    console.error('\nExample:');
    console.error(`  CONFIRM_CLEANUP=${REQUIRED_CONFIRMATION} node dist/scripts/cleanup-migrated-users.js`);
    console.error('\n⚠️  Do NOT run this script unless ALL tests have passed!\n');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // STEP 1: Verify migration was successful
    console.log('STEP 1: Verifying migration...');
    await verifyMigrationComplete(db);

    // STEP 2: Count users to delete
    console.log('\nSTEP 2: Counting users to delete...');
    const counts = await countUsersToDelete(db);
    console.log(`   Internal users to delete: ${counts.toDelete}`);
    console.log(`   Members to keep: ${counts.toKeep}`);

    if (counts.toDelete === 0) {
      console.log('\n✅ No internal users found in users collection. Already cleaned up.');
      return;
    }

    // STEP 3: Delete internal users from users collection
    console.log('\nSTEP 3: Deleting internal users from users collection...');
    const deleted = await deleteInternalUsers(db);

    // STEP 4: Verify deletion
    console.log('\nSTEP 4: Verifying deletion...');
    await verifyDeletion(db);

    // STEP 5: Log cleanup
    console.log('\nSTEP 5: Logging cleanup...');
    await logCleanup(db, deleted);

    console.log('\n========================================');
    console.log('CLEANUP COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`✅ Deleted ${deleted.count} internal users from users collection`);
    console.log(`✅ Members remain in users collection: ${counts.toKeep}`);
    console.log(`✅ Internal users in internal_users collection: ${deleted.count}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error);
    console.error('\nCleanup aborted. Database state unchanged.');
    console.error('Investigate the error before retrying.\n');
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function verifyMigrationComplete(db: Db): Promise<void> {
  const usersCollection = db.collection('users');
  const internalUsersCollection = db.collection('internal_users');

  // Check if internal_users collection exists and has data
  const internalUsersCount = await internalUsersCollection.countDocuments();

  if (internalUsersCount === 0) {
    throw new Error('Migration verification failed: internal_users collection is empty. Run migration first.');
  }

  console.log(`   ✅ Found ${internalUsersCount} users in internal_users collection`);

  // Check if all internal users from users collection exist in internal_users
  const usersToMigrate = await usersCollection.find({
    role: { $in: INTERNAL_ROLES },
  }).toArray();

  if (usersToMigrate.length === 0) {
    console.log('   ✅ No internal users found in users collection (already cleaned)');
    return;
  }

  for (const user of usersToMigrate) {
    const existsInInternal = await internalUsersCollection.findOne({ _id: user._id });

    if (!existsInInternal) {
      throw new Error(
        `Migration verification failed: User ${user.email} (${user._id}) not found in internal_users collection. ` +
        'Complete migration before running cleanup.'
      );
    }
  }

  console.log(`   ✅ All ${usersToMigrate.length} internal users verified in internal_users collection`);
}

async function countUsersToDelete(db: Db): Promise<{ toDelete: number; toKeep: number }> {
  const usersCollection = db.collection('users');

  const total = await usersCollection.countDocuments();
  const toDelete = await usersCollection.countDocuments({
    role: { $in: INTERNAL_ROLES },
  });
  const toKeep = total - toDelete;

  return { toDelete, toKeep };
}

async function deleteInternalUsers(db: Db): Promise<{ count: number; emails: string[] }> {
  const usersCollection = db.collection('users');

  // Get emails before deletion for logging
  const internalUsers = await usersCollection.find({
    role: { $in: INTERNAL_ROLES },
  }).toArray();

  const emails = internalUsers.map(u => u.email);

  // Delete internal users
  const result = await usersCollection.deleteMany({
    role: { $in: INTERNAL_ROLES },
  });

  console.log(`   ✅ Deleted ${result.deletedCount} internal users`);

  return {
    count: result.deletedCount,
    emails,
  };
}

async function verifyDeletion(db: Db): Promise<void> {
  const usersCollection = db.collection('users');

  const remainingInternal = await usersCollection.countDocuments({
    role: { $in: INTERNAL_ROLES },
  });

  if (remainingInternal > 0) {
    throw new Error(`Deletion verification failed: ${remainingInternal} internal users still in users collection`);
  }

  console.log('   ✅ Verified: No internal users remain in users collection');
}

async function logCleanup(db: Db, deleted: { count: number; emails: string[] }): Promise<void> {
  const cleanupLog = {
    timestamp: new Date(),
    scriptName: 'cleanup-migrated-users',
    status: 'completed',
    usersDeleted: deleted.count,
    deletedUserEmails: deleted.emails,
  };

  await db.collection('migration_logs').insertOne(cleanupLog);
  console.log('   ✅ Cleanup logged to migration_logs collection');
}

// Run cleanup
cleanupMigratedUsers()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });
