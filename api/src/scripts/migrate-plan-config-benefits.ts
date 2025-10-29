import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PlanConfig } from '../modules/plan-config/schemas/plan-config.schema';

// Mapping from old benefit keys to new category IDs
const BENEFIT_KEY_TO_CAT_ID: Record<string, string> = {
  'in-clinic-consultation': 'CAT001',
  'online-consultation': 'CAT005',
  'pharmacy': 'CAT002',
  'diagnostics': 'CAT003',
  'labs': 'CAT004',
  'IN_CLINIC_CONSULTATION': 'CAT001',
  'ONLINE_CONSULTATION': 'CAT005',
  'PHARMACY': 'CAT002',
  'DIAGNOSTICS': 'CAT003',
  'LABS': 'CAT004',
};

async function migratePlanConfigBenefits() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const planConfigModel = app.get<Model<PlanConfig>>(getModelToken(PlanConfig.name));

  try {
    console.log('🔄 Starting plan config benefits migration...');

    // Find all plan configs
    const planConfigs = await planConfigModel.find({}).lean();
    console.log(`📊 Found ${planConfigs.length} plan configs to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const config of planConfigs) {
      let needsMigration = false;
      const newBenefits: any = {};
      const newMemberConfigs: any = {};

      // Migrate primary benefits
      if (config.benefits && Object.keys(config.benefits).length > 0) {
        for (const [key, value] of Object.entries(config.benefits)) {
          const categoryId = BENEFIT_KEY_TO_CAT_ID[key];
          if (categoryId) {
            // Key needs migration
            newBenefits[categoryId] = value;
            needsMigration = true;
            console.log(`  ✓ Migrating benefit key: ${key} → ${categoryId}`);
          } else {
            // Key is already in correct format or unknown
            newBenefits[key] = value;
          }
        }
      }

      // Migrate memberConfigs benefits
      if (config.memberConfigs && Object.keys(config.memberConfigs).length > 0) {
        for (const [relationshipCode, memberConfig] of Object.entries(config.memberConfigs)) {
          const newMemberBenefits: any = {};

          if ((memberConfig as any).benefits && Object.keys((memberConfig as any).benefits).length > 0) {
            for (const [key, value] of Object.entries((memberConfig as any).benefits)) {
              const categoryId = BENEFIT_KEY_TO_CAT_ID[key];
              if (categoryId) {
                newMemberBenefits[categoryId] = value;
                needsMigration = true;
                console.log(`  ✓ Migrating member benefit key (${relationshipCode}): ${key} → ${categoryId}`);
              } else {
                newMemberBenefits[key] = value;
              }
            }
          }

          newMemberConfigs[relationshipCode] = {
            ...(memberConfig as any),
            benefits: Object.keys(newMemberBenefits).length > 0 ? newMemberBenefits : (memberConfig as any).benefits,
          };
        }
      }

      if (needsMigration) {
        // Update the plan config
        await planConfigModel.updateOne(
          { _id: config._id },
          {
            $set: {
              benefits: newBenefits,
              ...(Object.keys(newMemberConfigs).length > 0 && { memberConfigs: newMemberConfigs }),
            },
          }
        );
        migratedCount++;
        console.log(`✅ Migrated plan config ID: ${config._id}`);
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped plan config ID: ${config._id} (already using correct format)`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`✅ Migrated: ${migratedCount} plan configs`);
    console.log(`⏭️  Skipped: ${skippedCount} plan configs (already correct)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
  }
}

migratePlanConfigBenefits();
