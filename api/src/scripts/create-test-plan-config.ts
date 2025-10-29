import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PlanConfig } from '../modules/plan-config/schemas/plan-config.schema';
import { Policy } from '../modules/policies/schemas/policy.schema';

async function createTestPlanConfig() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const planConfigModel = app.get<Model<PlanConfig>>(getModelToken(PlanConfig.name));
  const policyModel = app.get<Model<Policy>>(getModelToken(Policy.name));

  try {
    console.log('🔄 Creating test plan config with correct CAT001 format...');

    // Find the seeded policy
    const policy = await policyModel.findOne({ policyNumber: 'POL-2025-0001' }).lean();

    if (!policy) {
      console.error('❌ Policy not found');
      return;
    }

    console.log(`✅ Found policy: ${policy.name} (${policy.policyNumber})`);

    // Delete existing plan configs for this policy
    await planConfigModel.deleteMany({ policyId: policy._id });
    console.log('✅ Cleared existing plan configs');

    // Create plan config with CAT001 format benefit keys
    const planConfig = await planConfigModel.create({
      policyId: policy._id,
      version: 1,
      status: 'PUBLISHED',
      isCurrent: true,
      benefits: {
        CAT001: { // In-Clinic Consultation
          enabled: true,
          claimEnabled: true,
          vasEnabled: true,
          annualLimit: 5000,
          visitLimit: 10,
          notes: 'In-clinic consultation coverage'
        },
        CAT005: { // Online Consultation
          enabled: true,
          claimEnabled: true,
          vasEnabled: true,
          annualLimit: 3000,
          visitLimit: 15,
          notes: 'Online consultation coverage'
        },
        CAT002: { // Pharmacy
          enabled: true,
          claimEnabled: true,
          vasEnabled: true,
          annualLimit: 10000,
          rxRequired: true,
          notes: 'Pharmacy coverage'
        },
        CAT003: { // Diagnostics
          enabled: true,
          claimEnabled: true,
          vasEnabled: true,
          annualLimit: 8000,
          rxRequired: false,
          notes: 'Diagnostic services coverage'
        },
        CAT004: { // Labs
          enabled: true,
          claimEnabled: true,
          vasEnabled: true,
          annualLimit: 6000,
          rxRequired: false,
          notes: 'Lab services coverage'
        }
      },
      wallet: {
        totalAnnualAmount: 32000, // Sum of all category limits
        perClaimLimit: 5000,
        copay: { mode: 'PERCENT', value: 10 },
        partialPaymentEnabled: true,
        carryForward: { enabled: false },
        topUpAllowed: false
      },
      coveredRelationships: ['SELF', 'REL002', 'REL003', 'REL004', 'REL005'],
      memberConfigs: {},
      createdBy: 'SEED_SCRIPT',
      publishedBy: 'SEED_SCRIPT',
      publishedAt: new Date()
    });

    console.log('✅ Created plan config with ID:', planConfig._id);
    console.log('✅ Benefits configured with CAT001, CAT002, CAT003, CAT004, CAT005 format');
    console.log('📊 Total wallet amount: ₹32,000');

  } catch (error) {
    console.error('❌ Failed to create plan config:', error);
  } finally {
    await app.close();
  }
}

createTestPlanConfig();
