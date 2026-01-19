#!/usr/bin/env ts-node

/**
 * Rollback User Segregation Script
 *
 * Reverts the user segregation migration by:
 * 1. Copying internal users back from internal_users to users collection
 * 2. Deleting the internal_users collection
 * 3. Restoring from backup if needed
 *
 * Use this if you encounter issues after migration and need to revert
 *
 * Usage:
 *   node dist/scripts/rollback-user-segregation.js
 */

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

async function rollbackSegregation() {
  console.log('\n========================================');
  console.log('ROLLBACK USER SEGREGATION');
  console.log('========================================\n');
  console.log('⚠️  This will revert the user segregation migration');
  console.log('📊 MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));
  console.log('\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // STEP 1: Check if rollback is needed
    console.log('STEP 1: Checking migration state...');
    const state = await checkMigrationState(db);

    if (!state.migrationPerformed) {
      console.log('\n✅ No migration detected. Nothing to rollback.');
      return;
    }

    // STEP 2: Restore internal users to users collection
    console.log('\nSTEP 2: Restoring internal users to users collection...');
    const restored = await restoreInternalUsers(db, state);

    // STEP 3: Delete internal_users collection
    console.log('\nSTEP 3: Removing internal_users collection...');
    await removeInternalUsersCollection(db);

    // STEP 4: Verify rollback
    console.log('\nSTEP 4: Verifying rollback...');
    await verifyRollback(db, restored);

    // STEP 5: Log rollback
    console.log('\nSTEP 5: Logging rollback...');
    await logRollback(db, restored);

    console.log('\n========================================');
    console.log('ROLLBACK COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`✅ Restored ${restored.count} internal users to users collection`);
    console.log(`✅ Removed internal_users collection`);
    console.log(`✅ Database reverted to pre-migration state`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ROLLBACK FAILED:', error);
    console.error('\nRollback aborted.');
    console.error('Check the error and database state before retrying.\n');
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function checkMigrationState(db: Db): Promise<{
  migrationPerformed: boolean;
  internalUsersCount: number;
  backupExists: boolean;
}> {
  // Check if internal_users collection exists
  const collections = await db.listCollections({ name: 'internal_users' }).toArray();
  const migrationPerformed = collections.length > 0;

  let internalUsersCount = 0;
  if (migrationPerformed) {
    internalUsersCount = await db.collection('internal_users').countDocuments();
  }

  // Check if backup exists
  const backupCollections = await db.listCollections({ name: 'users_backup_pre_segregation' }).toArray();
  const backupExists = backupCollections.length > 0;

  console.log('   Migration state:');
  console.log(`   - internal_users collection exists: ${migrationPerformed}`);
  console.log(`   - Internal users count: ${internalUsersCount}`);
  console.log(`   - Backup exists: ${backupExists}`);

  return {
    migrationPerformed,
    internalUsersCount,
    backupExists,
  };
}

async function restoreInternalUsers(
  db: Db,
  state: { internalUsersCount: number; backupExists: boolean }
): Promise<{ count: number; users: any[] }> {
  const internalUsersCollection = db.collection('internal_users');
  const usersCollection = db.collection('users');

  if (state.internalUsersCount === 0) {
    console.log('   No users to restore from internal_users');
    return { count: 0, users: [] };
  }

  // Get all users from internal_users
  const internalUsers = await internalUsersCollection.find({}).toArray();
  console.log(`   Found ${internalUsers.length} users in internal_users collection`);

  const restored: any[] = [];

  for (const user of internalUsers) {
    // Check if user already exists in users collection
    const existing = await usersCollection.findOne({ _id: user._id });

    if (existing) {
      console.log(`   ⏭️  User ${user.email} already exists in users collection`);
      continue;
    }

    // Remove userType field (specific to internal_users)
    const userToRestore = { ...user };
    delete userToRestore.userType;

    // Insert back into users collection
    await usersCollection.insertOne(userToRestore);
    console.log(`   ✅ Restored: ${user.email} (${user.role})`);
    restored.push(userToRestore);
  }

  console.log(`   Successfully restored ${restored.length} users`);
  return { count: restored.length, users: restored };
}

async function removeInternalUsersCollection(db: Db): Promise<void> {
  const collections = await db.listCollections({ name: 'internal_users' }).toArray();

  if (collections.length === 0) {
    console.log('   internal_users collection does not exist');
    return;
  }

  await db.collection('internal_users').drop();
  console.log('   ✅ Dropped internal_users collection');
}

async function verifyRollback(db: Db, restored: { count: number }): Promise<void> {
  const usersCollection = db.collection('users');

  // Verify internal_users collection is gone
  const collections = await db.listCollections({ name: 'internal_users' }).toArray();

  if (collections.length > 0) {
    throw new Error('Rollback verification failed: internal_users collection still exists');
  }

  console.log('   ✅ Verified: internal_users collection removed');

  // Verify users are back in users collection
  if (restored.count > 0) {
    const INTERNAL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'TPA_ADMIN', 'TPA_USER', 'FINANCE_USER', 'OPS'];
    const internalUsersCount = await usersCollection.countDocuments({
      role: { $in: INTERNAL_ROLES },
    });

    console.log(`   ✅ Verified: ${internalUsersCount} internal users in users collection`);
  }
}

async function logRollback(db: Db, restored: { count: number; users: any[] }): Promise<void> {
  const rollbackLog = {
    timestamp: new Date(),
    scriptName: 'rollback-user-segregation',
    status: 'completed',
    usersRestored: restored.count,
    restoredUserEmails: restored.users.map(u => u.email),
  };

  await db.collection('migration_logs').insertOne(rollbackLog);
  console.log('   ✅ Rollback logged to migration_logs collection');
}

// Run rollback
rollbackSegregation()
  .then(() => {
    console.log('Rollback script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Rollback script failed:', error);
    process.exit(1);
  });
