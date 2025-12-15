#!/usr/bin/env ts-node

/**
 * User Segregation Migration Script
 *
 * Migrates internal users (staff) from 'users' collection to 'internal_users' collection
 *
 * IMPORTANT: This script is IDEMPOTENT - it can be run multiple times safely
 * - Skips users that already exist in internal_users
 * - Preserves ObjectIds for reference integrity
 * - Creates backup before migration
 *
 * Usage:
 *   npm run build
 *   node dist/scripts/migrate-users-segregation.js
 *
 * Or with custom MongoDB URI:
 *   MONGODB_URI="mongodb://localhost:27017/opd_wallet" node dist/scripts/migrate-users-segregation.js
 */

import { MongoClient, Db } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

// Internal user roles to migrate
const INTERNAL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TPA', 'TPA_ADMIN', 'TPA_USER', 'FINANCE_USER', 'OPS'];

// Member-specific fields to remove from internal users
const MEMBER_FIELDS_TO_REMOVE = [
  'uhid',
  'memberId',
  'relationship',
  'primaryMemberId',
  'dob',
  'gender',
  'bloodGroup',
  'address',
  'corporateName',
  'cugId',
];

async function migrateUsers() {
  console.log('\n========================================');
  console.log('USER SEGREGATION MIGRATION');
  console.log('========================================\n');
  console.log('⚠️  This will migrate internal users from "users" to "internal_users" collection');
  console.log('📊 MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password
  console.log('\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // STEP 1: Create backup
    console.log('STEP 1: Creating backup...');
    await createBackup(db);

    // STEP 2: Count users to migrate
    console.log('\nSTEP 2: Counting users to migrate...');
    const counts = await countUsersToMigrate(db);
    console.log(`   Internal users to migrate: ${counts.internalUsers}`);
    console.log(`   Members to keep in users: ${counts.members}`);
    console.log(`   Total users: ${counts.total}`);

    if (counts.internalUsers === 0) {
      console.log('\n⚠️  No internal users found to migrate. Exiting.');
      return;
    }

    // STEP 3: Migrate internal users
    console.log('\nSTEP 3: Migrating internal users...');
    const migrated = await migrateInternalUsers(db);

    // STEP 4: Create indexes
    console.log('\nSTEP 4: Creating indexes on internal_users collection...');
    await createIndexes(db);

    // STEP 5: Verify migration
    console.log('\nSTEP 5: Verifying migration...');
    await verifyMigration(db, migrated);

    // STEP 6: Log migration
    console.log('\nSTEP 6: Logging migration...');
    await logMigration(db, migrated);

    console.log('\n========================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`✅ Migrated ${migrated.length} internal users`);
    console.log(`✅ Backup created: users_backup_pre_segregation`);
    console.log(`✅ Internal users now in: internal_users collection`);
    console.log(`✅ Members remain in: users collection`);
    console.log('\n⚠️  IMPORTANT: Users are still in BOTH collections');
    console.log('   Run cleanup script ONLY after testing confirms everything works');
    console.log('   Command: CONFIRM_CLEANUP=YES_DELETE_INTERNAL_USERS node dist/scripts/cleanup-migrated-users.js');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error('\nMigration aborted. Database state unchanged (except backup created).');
    console.error('You can retry the migration after fixing the issue.\n');
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function createBackup(db: Db): Promise<void> {
  const backupName = 'users_backup_pre_segregation';

  // Check if backup already exists
  const collections = await db.listCollections({ name: backupName }).toArray();

  if (collections.length > 0) {
    console.log(`   ⚠️  Backup collection "${backupName}" already exists`);
    console.log('   Skipping backup creation (using existing backup)');
    return;
  }

  // Create backup by copying users collection
  const users = await db.collection('users').find({}).toArray();
  if (users.length > 0) {
    await db.collection(backupName).insertMany(users);
    console.log(`   ✅ Backup created: ${backupName} (${users.length} users)`);
  } else {
    console.log('   ⚠️  No users found to backup');
  }
}

async function countUsersToMigrate(db: Db): Promise<{ internalUsers: number; members: number; total: number }> {
  const total = await db.collection('users').countDocuments();
  const internalUsers = await db.collection('users').countDocuments({
    role: { $in: INTERNAL_ROLES },
  });
  const members = total - internalUsers;

  return { internalUsers, members, total };
}

async function migrateInternalUsers(db: Db): Promise<any[]> {
  const usersCollection = db.collection('users');
  const internalUsersCollection = db.collection('internal_users');

  // Find all internal users
  const internalUsers = await usersCollection
    .find({ role: { $in: INTERNAL_ROLES } })
    .toArray();

  if (internalUsers.length === 0) {
    console.log('   No internal users found to migrate');
    return [];
  }

  console.log(`   Found ${internalUsers.length} internal users to migrate`);

  const migrated: any[] = [];

  for (const user of internalUsers) {
    // Check if user already exists in internal_users (idempotency)
    const existing = await internalUsersCollection.findOne({ _id: user._id });

    if (existing) {
      console.log(`   ⏭️  Skipping ${user.email} (already in internal_users)`);
      continue;
    }

    // Prepare user for internal_users collection
    const internalUser: any = {
      ...user,
      userType: 'internal',
    };

    // Remove member-specific fields
    MEMBER_FIELDS_TO_REMOVE.forEach((field) => {
      delete internalUser[field];
    });

    // Ensure employeeId exists (required for internal users)
    if (!internalUser.employeeId) {
      // Auto-generate employeeId if missing
      internalUser.employeeId = `EMP-${user.userId || user._id.toString().substring(0, 8).toUpperCase()}`;
    }

    // Ensure phone is an object (required format for internal users)
    if (typeof internalUser.phone === 'string') {
      internalUser.phone = {
        countryCode: '+91',
        number: internalUser.phone,
      };
    }

    // Insert into internal_users
    await internalUsersCollection.insertOne(internalUser);

    console.log(`   ✅ Migrated: ${user.email} (${user.role})`);
    migrated.push(user);
  }

  console.log(`   Successfully migrated ${migrated.length} users`);
  return migrated;
}

async function createIndexes(db: Db): Promise<void> {
  const internalUsersCollection = db.collection('internal_users');

  const indexes = [
    { key: { userId: 1 }, unique: true },
    { key: { employeeId: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { 'phone.number': 1 } },
    { key: { role: 1, status: 1 } },
    { key: { department: 1 } },
    { key: { reportingTo: 1 } },
    { key: { lastLoginAt: -1 } },
  ];

  for (const index of indexes) {
    try {
      await internalUsersCollection.createIndex(index.key as any, {
        unique: index.unique || false,
        sparse: true,
      });
      console.log(`   ✅ Created index: ${JSON.stringify(index.key)}`);
    } catch (error: any) {
      // Index might already exist, that's okay
      if (error.code === 85 || error.code === 86) {
        console.log(`   ⏭️  Index already exists: ${JSON.stringify(index.key)}`);
      } else {
        throw error;
      }
    }
  }
}

async function verifyMigration(db: Db, migratedUsers: any[]): Promise<void> {
  const internalUsersCollection = db.collection('internal_users');

  console.log('   Verifying migration integrity...');

  for (const user of migratedUsers) {
    const found = await internalUsersCollection.findOne({ _id: user._id });

    if (!found) {
      throw new Error(`Verification failed: User ${user.email} not found in internal_users`);
    }

    // Verify essential fields
    if (!found.userId || !found.email || !found.role) {
      throw new Error(`Verification failed: Missing essential fields for ${user.email}`);
    }

    // Verify member fields were removed
    for (const field of ['uhid', 'memberId', 'relationship']) {
      if (found[field]) {
        throw new Error(`Verification failed: Member field "${field}" not removed for ${user.email}`);
      }
    }
  }

  console.log(`   ✅ Verified ${migratedUsers.length} users successfully migrated`);
}

async function logMigration(db: Db, migratedUsers: any[]): Promise<void> {
  const migrationLog = {
    timestamp: new Date(),
    scriptName: 'migrate-users-segregation',
    status: 'completed',
    usersMigrated: migratedUsers.length,
    migratedUserIds: migratedUsers.map((u) => u._id),
    migratedUserEmails: migratedUsers.map((u) => u.email),
  };

  await db.collection('migration_logs').insertOne(migrationLog);
  console.log('   ✅ Migration logged to migration_logs collection');
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
