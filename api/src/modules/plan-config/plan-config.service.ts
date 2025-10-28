import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanConfig, PlanConfigDocument } from './schemas/plan-config.schema';
import { CreatePlanConfigDto } from './dto/create-plan-config.dto';
import { UpdatePlanConfigDto } from './dto/update-plan-config.dto';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';

@Injectable()
export class PlanConfigService {
  constructor(
    @InjectModel(PlanConfig.name)
    private planConfigModel: Model<PlanConfigDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async createConfig(policyId: string, dto: CreatePlanConfigDto, userId: string) {
    console.log('🟢 [PLAN CONFIG SERVICE] createConfig called');
    console.log('🟢 [PLAN CONFIG SERVICE] policyId:', policyId);
    console.log('🟢 [PLAN CONFIG SERVICE] dto:', JSON.stringify(dto, null, 2));
    console.log('🟢 [PLAN CONFIG SERVICE] userId:', userId);

    // Get next version number
    const latestConfig = await this.planConfigModel
      .findOne({ policyId })
      .sort({ version: -1 })
      .exec();

    const nextVersion = dto.version || (latestConfig ? latestConfig.version + 1 : 1);
    console.log('🟢 [PLAN CONFIG SERVICE] nextVersion:', nextVersion);

    const config = new this.planConfigModel({
      policyId,
      version: nextVersion,
      status: 'DRAFT',
      isCurrent: false,
      benefits: dto.benefits || {},
      wallet: dto.wallet || {},
      policyDescription: dto.policyDescription || { inclusions: [], exclusions: [] },
      coveredRelationships: dto.coveredRelationships || ['SELF'],
      memberConfigs: dto.memberConfigs || {},
      createdBy: userId,
      updatedBy: userId,
    });

    console.log('🟢 [PLAN CONFIG SERVICE] config to save:', JSON.stringify(config.toObject(), null, 2));
    const saved = await config.save();
    console.log('✅ [PLAN CONFIG SERVICE] config saved successfully with id:', saved._id);
    return saved;
  }

  async getConfig(policyId: string, version?: number) {
    if (version) {
      return this.planConfigModel.findOne({ policyId, version });
    }
    // Get current config
    const current = await this.planConfigModel.findOne({ policyId, isCurrent: true });
    if (current) return current;

    // If no current, get latest published
    return this.planConfigModel
      .findOne({ policyId, status: 'PUBLISHED' })
      .sort({ version: -1 });
  }

  async getAllConfigs(policyId: string) {
    return this.planConfigModel
      .find({ policyId })
      .sort({ version: -1 })
      .exec();
  }

  async updateConfig(policyId: string, version: number, updates: UpdatePlanConfigDto, userId: string) {
    console.log('🟠 [PLAN CONFIG SERVICE] updateConfig called');
    console.log('🟠 [PLAN CONFIG SERVICE] policyId:', policyId);
    console.log('🟠 [PLAN CONFIG SERVICE] version:', version);
    console.log('🟠 [PLAN CONFIG SERVICE] updates:', JSON.stringify(updates, null, 2));
    console.log('🟠 [PLAN CONFIG SERVICE] userId:', userId);

    try {
      const config = await this.planConfigModel.findOne({ policyId, version, status: 'DRAFT' });
      console.log('🟠 [PLAN CONFIG SERVICE] found config:', config ? 'YES' : 'NO');

      if (!config) {
        console.error('❌ [PLAN CONFIG SERVICE] No DRAFT config found');
        throw new BadRequestException('Can only edit DRAFT configurations');
      }

      console.log('🟠 [PLAN CONFIG SERVICE] Applying updates...');
      Object.assign(config, {
        ...updates,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      console.log('🟠 [PLAN CONFIG SERVICE] Saving config...');
      const result = await config.save();
      console.log('✅ [PLAN CONFIG SERVICE] updateConfig success');
      return result;
    } catch (error) {
      console.error('❌ [PLAN CONFIG SERVICE] updateConfig error:', error);
      throw error;
    }
  }

  async publishConfig(policyId: string, version: number, userId: string) {
    const config = await this.planConfigModel.findOne({ policyId, version, status: 'DRAFT' });
    if (!config) {
      throw new NotFoundException('Configuration not found or already published');
    }

    config.status = 'PUBLISHED';
    config.publishedAt = new Date();
    config.publishedBy = userId;
    return config.save();
  }

  async setCurrentConfig(policyId: string, version: number) {
    // Verify config is published
    const config = await this.planConfigModel.findOne({ policyId, version, status: 'PUBLISHED' });
    if (!config) {
      throw new BadRequestException('Can only set PUBLISHED configurations as current');
    }

    // Remove current flag from all configs
    await this.planConfigModel.updateMany(
      { policyId },
      { isCurrent: false }
    );

    // Set new current
    await this.planConfigModel.updateOne(
      { policyId, version },
      { isCurrent: true }
    );

    return { success: true, message: `Version ${version} is now current` };
  }

  async deleteConfig(policyId: string, version: number) {
    console.log('🟡 [PLAN CONFIG SERVICE] Attempting to delete plan configuration:', { policyId, version });

    const config = await this.planConfigModel.findOne({ policyId, version });
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    // Check if configuration is current and has user assignments
    if (config.isCurrent) {
      console.log('🟡 [PLAN CONFIG SERVICE] Configuration is current, checking for user assignments...');

      const activeAssignments = await this.assignmentModel.countDocuments({
        policyId: policyId,
        isActive: true,
      });

      if (activeAssignments > 0) {
        throw new ConflictException(
          `Cannot delete current plan configuration. This policy is assigned to ${activeAssignments} user(s). ` +
          `Please unassign all users from this policy or set a different plan configuration as current before deleting.`
        );
      }
    }

    // Additional business rules
    if (config.status === 'PUBLISHED' && config.isCurrent) {
      throw new BadRequestException('Cannot delete a published configuration that is current');
    }

    await this.planConfigModel.deleteOne({ policyId, version });
    console.log('✅ [PLAN CONFIG SERVICE] Plan configuration deleted successfully');

    return {
      success: true,
      message: `Version ${version} deleted successfully`
    };
  }

  async migrateSpouseCoverage() {
    console.log('🔄 Starting spouse coverage migration...');

    // Find all existing plan configs
    const planConfigs = await this.planConfigModel.find({}).exec();
    console.log(`📊 Found ${planConfigs.length} plan configurations to migrate`);

    let migratedCount = 0;

    for (const planConfig of planConfigs) {
      let hasChanges = false;
      const updates: any = {};

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
        memberConfigs.SPOUSE = {
          benefits: planConfig.benefits || {},
          wallet: planConfig.wallet || {},
          inheritFromPrimary: false
        };
        hasChanges = true;
        console.log(`✅ Copied primary member configuration to SPOUSE for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      // Ensure SELF member config exists
      if (!memberConfigs.SELF) {
        memberConfigs.SELF = {
          benefits: planConfig.benefits || {},
          wallet: planConfig.wallet || {},
          inheritFromPrimary: false
        };
        hasChanges = true;
        console.log(`✅ Created SELF member configuration for policy ${planConfig.policyId}, version ${planConfig.version}`);
      }

      if (hasChanges) {
        updates.memberConfigs = memberConfigs;
        updates.updatedAt = new Date();

        await this.planConfigModel.updateOne(
          { _id: planConfig._id },
          { $set: updates }
        );
        migratedCount++;
      }
    }

    console.log(`🎉 Migration completed! Updated ${migratedCount} plan configurations`);
    return {
      success: true,
      migratedCount,
      totalCount: planConfigs.length,
      message: 'Spouse coverage migration completed successfully'
    };
  }
}