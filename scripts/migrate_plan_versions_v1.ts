#!/usr/bin/env node
/**
 * Migration script to:
 * 1. Backup existing policyRules data
 * 2. Create initial plan versions (v1) for all policies
 * 3. Update policies to have currentPlanVersion = 1
 * 4. Remove policyRules collection
 */

import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

// Define schemas
const policySchema = new mongoose.Schema({
  policyNumber: String,
  name: String,
  effectiveFrom: Date,
  effectiveTo: Date,
  currentPlanVersion: Number,
});

const planVersionSchema = new mongoose.Schema({
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
  planVersion: Number,
  status: String,
  effectiveFrom: Date,
  effectiveTo: Date,
  publishedAt: Date,
  createdBy: String,
  publishedBy: String,
}, {
  timestamps: true,
});

const auditLogSchema = new mongoose.Schema({
  userId: String,
  userEmail: String,
  userRole: String,
  action: String,
  resource: String,
  resourceId: String,
  before: Object,
  after: Object,
  description: String,
  isSystemAction: Boolean,
  metadata: Object,
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Create indexes
planVersionSchema.index({ policyId: 1, planVersion: 1 }, { unique: true });
planVersionSchema.index({ status: 1, effectiveFrom: 1 });

async function migrate() {
  console.log('🚀 Starting Plan Versions v1 Migration...');

  let connection: mongoose.Connection | null = null;

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    connection = await mongoose.createConnection(MONGODB_URI);
    await connection.asPromise();
    console.log('✅ Connected to MongoDB');

    // Get models
    const Policy = connection.model('Policy', policySchema, 'policies');
    const PlanVersion = connection.model('PlanVersion', planVersionSchema, 'planVersions');
    const AuditLog = connection.model('AuditLog', auditLogSchema, 'auditLogs');

    // Step 1: Backup policyRules if collection exists
    console.log('\n📂 Step 1: Backing up policyRules data...');
    const collections = await connection.db!.listCollections().toArray();
    const policyRulesExists = collections.some(col => col.name === 'policyRules');

    if (policyRulesExists) {
      const policyRulesData = await connection.db!.collection('policyRules').find({}).toArray();

      if (policyRulesData.length > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '..', 'backups', `policyRules-${timestamp}.json`);

        fs.writeFileSync(backupPath, JSON.stringify(policyRulesData, null, 2));
        console.log(`✅ Backed up ${policyRulesData.length} policyRules to: ${backupPath}`);
      } else {
        console.log('ℹ️  No policyRules data to backup');
      }
    } else {
      console.log('ℹ️  policyRules collection does not exist, skipping backup');
    }

    // Step 2: Get all policies and create plan versions
    console.log('\n📝 Step 2: Creating initial plan versions for policies...');
    const policies = await Policy.find({}).lean();
    console.log(`Found ${policies.length} policies to process`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const policy of policies) {
      try {
        // Check if plan version 1 already exists
        const existingVersion = await PlanVersion.findOne({
          policyId: policy._id,
          planVersion: 1,
        });

        if (existingVersion) {
          console.log(`⏭️  Skipping policy ${policy.policyNumber} - version 1 already exists`);
          skipped++;
          continue;
        }

        // Create version 1
        const planVersion = new PlanVersion({
          policyId: policy._id,
          planVersion: 1,
          status: 'PUBLISHED',
          effectiveFrom: policy.effectiveFrom,
          effectiveTo: policy.effectiveTo,
          publishedAt: new Date(),
          createdBy: 'SYSTEM',
          publishedBy: 'SYSTEM',
        });

        await planVersion.save();
        created++;

        // Update policy to have currentPlanVersion = 1 if not set
        if (!policy.currentPlanVersion || policy.currentPlanVersion !== 1) {
          await Policy.updateOne(
            { _id: policy._id },
            { $set: { currentPlanVersion: 1 } }
          );
          updated++;
        }

        // Create audit log
        await AuditLog.create({
          userId: 'SYSTEM',
          userEmail: 'system@opdwallet.com',
          userRole: 'SYSTEM',
          action: 'POLICY_VERSION_INIT',
          resource: 'policies',
          resourceId: policy._id.toString(),
          before: { currentPlanVersion: policy.currentPlanVersion },
          after: { currentPlanVersion: 1, planVersion: 1 },
          description: `Initialized plan version 1 for policy ${policy.policyNumber}`,
          isSystemAction: true,
        });

        console.log(`✅ Created version 1 for policy: ${policy.policyNumber}`);
      } catch (error) {
        console.error(`❌ Error processing policy ${policy.policyNumber}:`, error);
      }
    }

    // Step 3: Drop policyRules collection if it exists
    if (policyRulesExists) {
      console.log('\n🗑️  Step 3: Removing policyRules collection...');
      await connection.db!.collection('policyRules').drop();
      console.log('✅ Dropped policyRules collection');

      // Also remove policyRuleMappings if exists
      const mappingsExists = collections.some(col => col.name === 'policyRuleMappings');
      if (mappingsExists) {
        await connection.db!.collection('policyRuleMappings').drop();
        console.log('✅ Dropped policyRuleMappings collection');
      }
    } else {
      console.log('\n⏭️  Step 3: No policyRules collection to drop');
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  - Plan versions created: ${created}`);
    console.log(`  - Policies updated: ${updated}`);
    console.log(`  - Policies skipped: ${skipped}`);
    console.log(`  - Total policies processed: ${policies.length}`);

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});