import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PlanConfig } from '../modules/plan-config/schemas/plan-config.schema';

async function migrateSpouseCoverage() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const planConfigModel = app.get<Model<PlanConfig>>(getModelToken(PlanConfig.name));

    console.log('🔄 Starting spouse coverage migration...');

    // Find all existing plan configs
    const planConfigs = await planConfigModel.find({});
    console.log(`📊 Found ${planConfigs.length} plan configurations to migrate`);

    let migratedCount = 0;

    for (const planConfig of planConfigs) {
      let hasChanges = false;

      // Check if spouse is not already covered
      if (!planConfig.coveredRelationships?.includes('SPOUSE')) {
        // Add SPOUSE to covered relationships
        if (!planConfig.coveredRelationships) {
          planConfig.coveredRelationships = ['SELF'];
        }
        planConfig.coveredRelationships.push('SPOUSE');
        hasChanges = true;
        console.log(`✅ Added SPOUSE to covered relationships for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Check if spouse member config exists
      if (!planConfig.memberConfigs?.SPOUSE) {
        // Initialize memberConfigs if it doesn't exist
        if (!planConfig.memberConfigs) {
          planConfig.memberConfigs = {};
        }

        // Copy primary member configuration to spouse
        const primaryConfig = {
          benefits: planConfig.benefits,
          wallet: planConfig.wallet,
          enabledServices: planConfig.enabledServices,
          inheritFromPrimary: false // Start with custom config to preserve existing setup
        };

        planConfig.memberConfigs.SPOUSE = primaryConfig;
        hasChanges = true;
        console.log(`✅ Copied primary member configuration to SPOUSE for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Ensure SELF member config exists and inherits properly
      if (!planConfig.memberConfigs?.SELF) {
        if (!planConfig.memberConfigs) {
          planConfig.memberConfigs = {};
        }

        planConfig.memberConfigs.SELF = {
          benefits: planConfig.benefits,
          wallet: planConfig.wallet,
          enabledServices: planConfig.enabledServices,
          inheritFromPrimary: false // SELF is the primary, so doesn't inherit
        };
        hasChanges = true;
        console.log(`✅ Created SELF member configuration for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Save changes if any were made
      if (hasChanges) {
        await planConfigModel.updateOne(
          { _id: planConfig._id },
          {
            $set: {
              coveredRelationships: planConfig.coveredRelationships,
              memberConfigs: planConfig.memberConfigs,
              updatedAt: new Date()
            }
          }
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

    await app.close();
  } catch (error) {
    console.error('❌ Error during spouse coverage migration:', error);
    process.exit(1);
  }
}

migrateSpouseCoverage();