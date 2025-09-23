/**
 * Script to validate and fix plan versions with missing or invalid policyId
 * Ensures every plan version is properly linked to a policy
 */

const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
const DB_NAME = 'opd_wallet';

async function validatePlanVersions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const planVersions = db.collection('planVersions');
    const policies = db.collection('policies');

    // 1. Check for plan versions without policyId
    console.log('\n📊 Checking plan versions without policyId...');
    const versionsWithoutPolicy = await planVersions.find({
      $or: [
        { policyId: { $exists: false } },
        { policyId: null }
      ]
    }).toArray();

    if (versionsWithoutPolicy.length > 0) {
      console.log(`❌ Found ${versionsWithoutPolicy.length} plan versions without policyId:`);
      versionsWithoutPolicy.forEach(v => {
        console.log(`  - Version ID: ${v._id}, planVersion: ${v.planVersion}, status: ${v.status}`);
      });
    } else {
      console.log('✅ All plan versions have policyId set');
    }

    // 2. Check for plan versions with invalid policyId (policy doesn't exist)
    console.log('\n📊 Checking plan versions with invalid policyId...');
    const allVersions = await planVersions.find({
      policyId: { $exists: true, $ne: null }
    }).toArray();

    const invalidVersions = [];
    for (const version of allVersions) {
      const policy = await policies.findOne({ _id: version.policyId });
      if (!policy) {
        invalidVersions.push(version);
      }
    }

    if (invalidVersions.length > 0) {
      console.log(`❌ Found ${invalidVersions.length} plan versions with invalid policyId:`);
      invalidVersions.forEach(v => {
        console.log(`  - Version ID: ${v._id}, policyId: ${v.policyId}, planVersion: ${v.planVersion}`);
      });
    } else {
      console.log('✅ All plan versions have valid policy references');
    }

    // 3. Check for policies without any plan versions
    console.log('\n📊 Checking policies without plan versions...');
    const allPolicies = await policies.find({}).toArray();
    const policiesWithoutVersions = [];

    for (const policy of allPolicies) {
      const versionCount = await planVersions.countDocuments({
        policyId: policy._id
      });

      if (versionCount === 0) {
        policiesWithoutVersions.push(policy);
      }
    }

    if (policiesWithoutVersions.length > 0) {
      console.log(`⚠️  Found ${policiesWithoutVersions.length} policies without plan versions:`);

      for (const policy of policiesWithoutVersions) {
        console.log(`  - Policy: ${policy.policyNumber} (${policy._id})`);
        console.log('    Creating initial plan version...');

        // Create version 1 for policies without versions
        const newVersion = {
          policyId: policy._id,
          planVersion: 1,
          status: 'PUBLISHED',
          effectiveFrom: policy.effectiveFrom || new Date(),
          effectiveTo: policy.effectiveTo,
          publishedAt: new Date(),
          createdBy: 'SYSTEM',
          publishedBy: 'SYSTEM',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await planVersions.insertOne(newVersion);
        console.log(`    ✅ Created version 1 for policy ${policy.policyNumber}`);

        // Update policy's currentPlanVersion if not set
        if (!policy.currentPlanVersion) {
          await policies.updateOne(
            { _id: policy._id },
            {
              $set: {
                currentPlanVersion: 1,
                updatedAt: new Date()
              }
            }
          );
          console.log(`    ✅ Updated policy currentPlanVersion to 1`);
        }
      }
    } else {
      console.log('✅ All policies have at least one plan version');
    }

    // 4. Validate indexes
    console.log('\n📊 Validating indexes...');
    const indexes = await planVersions.indexes();
    const hasUniqueIndex = indexes.some(idx =>
      idx.key.policyId && idx.key.planVersion && idx.unique
    );

    if (hasUniqueIndex) {
      console.log('✅ Unique compound index (policyId, planVersion) exists');
    } else {
      console.log('⚠️  Creating unique compound index...');
      await planVersions.createIndex(
        { policyId: 1, planVersion: 1 },
        { unique: true }
      );
      console.log('✅ Index created successfully');
    }

    // 5. Summary statistics
    console.log('\n📊 Summary Statistics:');
    const totalVersions = await planVersions.countDocuments({});
    const totalPolicies = await policies.countDocuments({});
    const draftVersions = await planVersions.countDocuments({ status: 'DRAFT' });
    const publishedVersions = await planVersions.countDocuments({ status: 'PUBLISHED' });
    const archivedVersions = await planVersions.countDocuments({ status: 'ARCHIVED' });

    console.log(`  - Total policies: ${totalPolicies}`);
    console.log(`  - Total plan versions: ${totalVersions}`);
    console.log(`  - Draft versions: ${draftVersions}`);
    console.log(`  - Published versions: ${publishedVersions}`);
    console.log(`  - Archived versions: ${archivedVersions}`);
    console.log(`  - Average versions per policy: ${(totalVersions / totalPolicies).toFixed(2)}`);

    // 6. Check for duplicate version numbers per policy
    console.log('\n📊 Checking for duplicate version numbers...');
    const duplicates = await planVersions.aggregate([
      {
        $group: {
          _id: {
            policyId: '$policyId',
            planVersion: '$planVersion'
          },
          count: { $sum: 1 },
          versions: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate version numbers:`);
      duplicates.forEach(d => {
        console.log(`  - Policy ${d._id.policyId}, Version ${d._id.planVersion}: ${d.count} duplicates`);
        console.log(`    IDs: ${d.versions.join(', ')}`);
      });
    } else {
      console.log('✅ No duplicate version numbers found');
    }

    console.log('\n✅ Validation complete!');

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the validation
console.log('🚀 Starting Plan Version Validation...');
console.log('================================\n');

validatePlanVersions()
  .then(() => {
    console.log('\n================================');
    console.log('✅ Validation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n================================');
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });