// Simple MongoDB script to migrate spouse coverage for existing plan configs
const { MongoClient } = require('mongodb');

async function migrateSpouseCoverage() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('opd_wallet');
    const planConfigsCollection = db.collection('plan_configs');

    console.log('🔄 Starting spouse coverage migration...');

    // Find all existing plan configs
    const planConfigs = await planConfigsCollection.find({}).toArray();
    console.log(`📊 Found ${planConfigs.length} plan configurations to migrate`);

    let migratedCount = 0;

    for (const planConfig of planConfigs) {
      const updates = {};
      let hasChanges = false;

      // Check if spouse is not already covered
      const coveredRelationships = planConfig.coveredRelationships || ['SELF'];
      if (!coveredRelationships.includes('SPOUSE')) {
        coveredRelationships.push('SPOUSE');
        updates.coveredRelationships = coveredRelationships;
        hasChanges = true;
        console.log(`✅ Added SPOUSE to covered relationships for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Initialize memberConfigs if it doesn't exist
      const memberConfigs = planConfig.memberConfigs || {};

      // Check if spouse member config exists
      if (!memberConfigs.SPOUSE) {
        // Copy primary member configuration to spouse
        memberConfigs.SPOUSE = {
          benefits: planConfig.benefits || {},
          wallet: planConfig.wallet || {},
          enabledServices: planConfig.enabledServices || {},
          inheritFromPrimary: false // Start with custom config to preserve existing setup
        };
        hasChanges = true;
        console.log(`✅ Copied primary member configuration to SPOUSE for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Ensure SELF member config exists
      if (!memberConfigs.SELF) {
        memberConfigs.SELF = {
          benefits: planConfig.benefits || {},
          wallet: planConfig.wallet || {},
          enabledServices: planConfig.enabledServices || {},
          inheritFromPrimary: false // SELF is the primary, so doesn't inherit
        };
        hasChanges = true;
        console.log(`✅ Created SELF member configuration for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      if (hasChanges) {
        updates.memberConfigs = memberConfigs;
        updates.updatedAt = new Date();

        // Save changes
        await planConfigsCollection.updateOne(
          { _id: planConfig._id },
          { $set: updates }
        );
        migratedCount++;
      }
    }

    console.log(`🎉 Migration completed! Updated ${migratedCount} plan configurations`);
    console.log('📝 Summary of changes:');
    console.log('   - Added SPOUSE to coveredRelationships (if not present)');
    console.log('   - Copied primary member configuration to SPOUSE memberConfig');
    console.log('   - Ensured SELF memberConfig exists');
    console.log('   - Set inheritFromPrimary: false to preserve existing configurations');

  } catch (error) {
    console.error('❌ Error during spouse coverage migration:', error);
  } finally {
    await client.close();
  }
}

migrateSpouseCoverage();