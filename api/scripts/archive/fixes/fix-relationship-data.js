/**
 * Migration Script: Fix Relationship Data Inconsistencies
 *
 * Issues Fixed:
 * 1. Users with relationship='SELF' should have relationship='REL001'
 * 2. Users with relationship='REL001' should NOT have primaryMemberId field
 *
 * Run: node fix-relationship-data.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
const DB_NAME = 'opd_wallet';

async function fixRelationshipData() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    // Issue 1: Fix users with relationship='SELF' -> 'REL001'
    console.log('\n🔍 Finding users with relationship="SELF"...');
    const selfUsers = await usersCollection.find({ relationship: 'SELF' }).toArray();
    console.log(`   Found ${selfUsers.length} users with relationship="SELF"`);

    if (selfUsers.length > 0) {
      console.log('\n📝 Users to be fixed:');
      selfUsers.forEach(user => {
        console.log(`   - ${user.memberId} (${user.name.firstName} ${user.name.lastName})`);
        if (user.primaryMemberId) {
          console.log(`     ⚠️  Has incorrect primaryMemberId: ${user.primaryMemberId}`);
        }
      });

      console.log('\n🔧 Fixing relationship="SELF" to "REL001"...');
      const result1 = await usersCollection.updateMany(
        { relationship: 'SELF' },
        {
          $set: { relationship: 'REL001' },
          $unset: { primaryMemberId: '' } // Remove primaryMemberId if exists
        }
      );
      console.log(`   ✅ Updated ${result1.modifiedCount} users`);
    }

    // Issue 2: Find and fix users with REL001 but have primaryMemberId
    console.log('\n🔍 Finding users with relationship="REL001" but have primaryMemberId...');
    const incorrectREL001 = await usersCollection.find({
      relationship: 'REL001',
      primaryMemberId: { $exists: true, $ne: null }
    }).toArray();

    console.log(`   Found ${incorrectREL001.length} users with REL001 + primaryMemberId`);

    if (incorrectREL001.length > 0) {
      console.log('\n📝 Users to be fixed:');
      incorrectREL001.forEach(user => {
        console.log(`   - ${user.memberId} (${user.name.firstName} ${user.name.lastName})`);
        console.log(`     Removing primaryMemberId: ${user.primaryMemberId}`);
      });

      console.log('\n🔧 Removing primaryMemberId from REL001 users...');
      const result2 = await usersCollection.updateMany(
        {
          relationship: 'REL001',
          primaryMemberId: { $exists: true, $ne: null }
        },
        {
          $unset: { primaryMemberId: '' }
        }
      );
      console.log(`   ✅ Updated ${result2.modifiedCount} users`);
    }

    // Verification
    console.log('\n✅ VERIFICATION:');
    const selfCount = await usersCollection.countDocuments({ relationship: 'SELF' });
    const rel001Count = await usersCollection.countDocuments({ relationship: 'REL001' });
    const rel001WithPrimary = await usersCollection.countDocuments({
      relationship: 'REL001',
      primaryMemberId: { $exists: true, $ne: null }
    });

    console.log(`   - Users with relationship="SELF": ${selfCount}`);
    console.log(`   - Users with relationship="REL001": ${rel001Count}`);
    console.log(`   - REL001 users with primaryMemberId: ${rel001WithPrimary}`);

    if (selfCount === 0 && rel001WithPrimary === 0) {
      console.log('\n🎉 All data fixed successfully!');
    } else {
      console.log('\n⚠️  Some issues remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the migration
fixRelationshipData().catch(console.error);
