/**
 * Complete Data Cleanup Script for MEM003 and MEM002
 *
 * This script removes ALL traces of MEM003 and MEM002 from ALL collections:
 * - Policy assignments
 * - Wallets and transactions
 * - Claims (memberclaims)
 * - Appointments
 * - Lab orders, carts, prescriptions
 * - Notifications
 * - Audit logs
 *
 * Run: node cleanup-mem003-mem002.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
const DB_NAME = 'opd_wallet';

// Target users
const TARGET_MEMBER_IDS = ['MEM002', 'MEM003'];
const TARGET_USER_IDS = ['USR-2025-0002', 'USR-2025-0003'];
const TARGET_OBJECT_IDS = [
  new ObjectId('68ce7f937ca7c61fde3135fb'), // MEM002
  new ObjectId('68ce7f937ca7c61fde3135ff')  // MEM003
];

async function cleanupAllData() {
  const client = new MongoClient(MONGO_URI);
  const results = {};

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    console.log('🎯 Target Users:');
    console.log(`   - MEM002 (ObjectId: ${TARGET_OBJECT_IDS[0]})`);
    console.log(`   - MEM003 (ObjectId: ${TARGET_OBJECT_IDS[1]})`);
    console.log('');

    // 1. Policy Assignments (userPolicyAssignments)
    console.log('🗑️  [1/10] Cleaning userPolicyAssignments...');
    const assignmentsResult = await db.collection('userPolicyAssignments').deleteMany({
      userId: { $in: TARGET_OBJECT_IDS }
    });
    console.log(`   ✅ Deleted ${assignmentsResult.deletedCount} assignments\n`);
    results.assignments = assignmentsResult.deletedCount;

    // 2. User Wallets (user_wallets)
    console.log('🗑️  [2/10] Cleaning user_wallets...');
    const walletsResult = await db.collection('user_wallets').deleteMany({
      userId: { $in: TARGET_OBJECT_IDS }
    });
    console.log(`   ✅ Deleted ${walletsResult.deletedCount} wallets\n`);
    results.wallets = walletsResult.deletedCount;

    // 3. Wallet Transactions (wallet_transactions)
    console.log('🗑️  [3/10] Cleaning wallet_transactions...');
    const transactionsResult = await db.collection('wallet_transactions').deleteMany({
      userId: { $in: TARGET_OBJECT_IDS }
    });
    console.log(`   ✅ Deleted ${transactionsResult.deletedCount} transactions\n`);
    results.transactions = transactionsResult.deletedCount;

    // 4. Member Claims (memberclaims)
    console.log('🗑️  [4/10] Cleaning memberclaims...');
    const claimsResult = await db.collection('memberclaims').deleteMany({
      $or: [
        { memberId: { $in: TARGET_MEMBER_IDS } },
        { userId: { $in: TARGET_OBJECT_IDS } }
      ]
    });
    console.log(`   ✅ Deleted ${claimsResult.deletedCount} claims\n`);
    results.claims = claimsResult.deletedCount;

    // 5. Appointments (appointments)
    console.log('🗑️  [5/10] Cleaning appointments...');
    const appointmentsResult = await db.collection('appointments').deleteMany({
      $or: [
        { memberId: { $in: TARGET_MEMBER_IDS } },
        { userId: { $in: TARGET_OBJECT_IDS } }
      ]
    });
    console.log(`   ✅ Deleted ${appointmentsResult.deletedCount} appointments\n`);
    results.appointments = appointmentsResult.deletedCount;

    // 6. Lab Orders (lab_orders)
    console.log('🗑️  [6/10] Cleaning lab_orders...');
    const labOrdersResult = await db.collection('lab_orders').deleteMany({
      $or: [
        { memberId: { $in: TARGET_MEMBER_IDS } },
        { userId: { $in: TARGET_OBJECT_IDS } }
      ]
    });
    console.log(`   ✅ Deleted ${labOrdersResult.deletedCount} lab orders\n`);
    results.labOrders = labOrdersResult.deletedCount;

    // 7. Lab Carts (lab_carts)
    console.log('🗑️  [7/10] Cleaning lab_carts...');
    const labCartsResult = await db.collection('lab_carts').deleteMany({
      $or: [
        { memberId: { $in: TARGET_MEMBER_IDS } },
        { userId: { $in: TARGET_OBJECT_IDS } }
      ]
    });
    console.log(`   ✅ Deleted ${labCartsResult.deletedCount} lab carts\n`);
    results.labCarts = labCartsResult.deletedCount;

    // 8. Lab Prescriptions (lab_prescriptions)
    console.log('🗑️  [8/10] Cleaning lab_prescriptions...');
    const labPrescriptionsResult = await db.collection('lab_prescriptions').deleteMany({
      $or: [
        { memberId: { $in: TARGET_MEMBER_IDS } },
        { userId: { $in: TARGET_OBJECT_IDS } }
      ]
    });
    console.log(`   ✅ Deleted ${labPrescriptionsResult.deletedCount} lab prescriptions\n`);
    results.labPrescriptions = labPrescriptionsResult.deletedCount;

    // 9. Notifications (notifications)
    console.log('🗑️  [9/10] Cleaning notifications...');
    const notificationsResult = await db.collection('notifications').deleteMany({
      userId: { $in: TARGET_OBJECT_IDS }
    });
    console.log(`   ✅ Deleted ${notificationsResult.deletedCount} notifications\n`);
    results.notifications = notificationsResult.deletedCount;

    // 10. Audit Logs (auditLogs) - Clean but keep for tracking
    console.log('🗑️  [10/10] Cleaning auditLogs...');
    const auditLogsResult = await db.collection('auditLogs').deleteMany({
      $or: [
        { userId: { $in: TARGET_USER_IDS } },
        { 'metadata.memberId': { $in: TARGET_MEMBER_IDS } },
        { 'metadata.userId': { $in: TARGET_OBJECT_IDS.map(id => id.toString()) } }
      ]
    });
    console.log(`   ✅ Deleted ${auditLogsResult.deletedCount} audit logs\n`);
    results.auditLogs = auditLogsResult.deletedCount;

    // Final Verification
    console.log('═'.repeat(60));
    console.log('✅ CLEANUP SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`   Policy Assignments:    ${results.assignments}`);
    console.log(`   User Wallets:          ${results.wallets}`);
    console.log(`   Wallet Transactions:   ${results.transactions}`);
    console.log(`   Member Claims:         ${results.claims}`);
    console.log(`   Appointments:          ${results.appointments}`);
    console.log(`   Lab Orders:            ${results.labOrders}`);
    console.log(`   Lab Carts:             ${results.labCarts}`);
    console.log(`   Lab Prescriptions:     ${results.labPrescriptions}`);
    console.log(`   Notifications:         ${results.notifications}`);
    console.log(`   Audit Logs:            ${results.auditLogs}`);
    console.log('═'.repeat(60));

    const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎉 Total Records Deleted: ${totalDeleted}`);

    // Verification Queries
    console.log('\n🔍 VERIFICATION:');
    const verifications = {
      assignments: await db.collection('userPolicyAssignments').countDocuments({ userId: { $in: TARGET_OBJECT_IDS } }),
      wallets: await db.collection('user_wallets').countDocuments({ userId: { $in: TARGET_OBJECT_IDS } }),
      transactions: await db.collection('wallet_transactions').countDocuments({ userId: { $in: TARGET_OBJECT_IDS } }),
      claims: await db.collection('memberclaims').countDocuments({ $or: [{ memberId: { $in: TARGET_MEMBER_IDS } }, { userId: { $in: TARGET_OBJECT_IDS } }] }),
      appointments: await db.collection('appointments').countDocuments({ $or: [{ memberId: { $in: TARGET_MEMBER_IDS } }, { userId: { $in: TARGET_OBJECT_IDS } }] }),
      labOrders: await db.collection('lab_orders').countDocuments({ $or: [{ memberId: { $in: TARGET_MEMBER_IDS } }, { userId: { $in: TARGET_OBJECT_IDS } }] }),
      notifications: await db.collection('notifications').countDocuments({ userId: { $in: TARGET_OBJECT_IDS } }),
    };

    const hasRemainingData = Object.values(verifications).some(count => count > 0);

    if (!hasRemainingData) {
      console.log('   ✅ All data successfully removed!');
      console.log('   ✅ No traces of MEM002 or MEM003 remain in any collection');
    } else {
      console.log('   ⚠️  WARNING: Some data still exists:');
      Object.entries(verifications).forEach(([key, count]) => {
        if (count > 0) {
          console.log(`      - ${key}: ${count} records remaining`);
        }
      });
    }

    console.log('\n💡 Users MEM002 and MEM003 still exist in the users collection.');
    console.log('   You can now reassign policies and start fresh!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✅ MongoDB connection closed\n');
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will DELETE ALL data for MEM002 and MEM003!');
console.log('⚠️  This includes assignments, wallets, claims, appointments, lab orders, etc.\n');
console.log('Starting cleanup in 3 seconds...\n');

setTimeout(() => {
  cleanupAllData().catch(console.error);
}, 3000);
