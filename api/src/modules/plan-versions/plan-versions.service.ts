import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanVersion, PlanVersionDocument, PlanVersionStatus } from './schemas/plan-version.schema';
import { QueryPlanVersionDto } from './dto/query-plan-version.dto';
import { CreatePlanVersionDto } from './dto/create-plan-version.dto';
import { UpdateCurrentVersionDto } from './dto/update-current-version.dto';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { AuditService } from '../audit/audit.service';
import { PlanConfigResolverService } from '../plan-config-resolver/plan-config-resolver.service';

@Injectable()
export class PlanVersionsService {
  constructor(
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    private auditService: AuditService,
  ) {}

  async findByPolicyId(policyId: string, query: QueryPlanVersionDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = { policyId: new Types.ObjectId(policyId) };

    if (query.status) {
      filter.status = query.status;
    }

    const [versions, total] = await Promise.all([
      this.planVersionModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ planVersion: -1 }),
      this.planVersionModel.countDocuments(filter),
    ]);

    return {
      data: versions,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findCurrentVersion(policyId: string) {
    // Get the policy to find currentPlanVersion
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const currentPlanVersion = policy.currentPlanVersion || 1;

    const version = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: currentPlanVersion,
    });

    if (!version) {
      // If no version exists, this shouldn't happen after migration
      // but handle gracefully
      throw new NotFoundException(`Plan version ${currentPlanVersion} not found for policy`);
    }

    return version;
  }

  async createInitialVersion(policyId: string, policyData: any, createdBy: string = 'SYSTEM') {
    // Check if version 1 already exists
    const existingVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: 1,
    });

    if (existingVersion) {
      return existingVersion;
    }

    // Create version 1
    const version = new this.planVersionModel({
      policyId: new Types.ObjectId(policyId),
      planVersion: 1,
      status: PlanVersionStatus.PUBLISHED,
      effectiveFrom: policyData.effectiveFrom,
      effectiveTo: policyData.effectiveTo,
      publishedAt: new Date(),
      createdBy,
      publishedBy: createdBy,
    });

    return version.save();
  }

  async create(
    policyId: string,
    dto: CreatePlanVersionDto,
    user: any,
  ): Promise<PlanVersionDocument> {
    // Get policy to validate and get defaults
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Get max plan version for this policy
    const maxVersion = await this.planVersionModel
      .findOne({ policyId: new Types.ObjectId(policyId) })
      .sort({ planVersion: -1 });

    const nextVersion = maxVersion ? maxVersion.planVersion + 1 : 1;

    // Validate dates
    if (dto.effectiveTo) {
      const effectiveFrom = new Date(dto.effectiveFrom);
      const effectiveTo = new Date(dto.effectiveTo);
      if (effectiveTo < effectiveFrom) {
        throw new BadRequestException('Effective to date must be after effective from date');
      }
    }

    // Create new version
    const newVersion = new this.planVersionModel({
      policyId: new Types.ObjectId(policyId),
      planVersion: nextVersion,
      status: PlanVersionStatus.DRAFT,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      createdBy: user.id,
      updatedBy: user.id,
    });

    const saved = await newVersion.save();

    // Audit log
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PLAN_VERSION_CREATE',
      resource: 'planVersions',
      resourceId: saved._id?.toString(),
      before: undefined,
      after: saved.toObject(),
      description: `Created draft plan version ${nextVersion} for policy ${policy.policyNumber}`,
      metadata: {
        policyId,
        policyNumber: policy.policyNumber,
        planVersion: nextVersion,
      },
    });

    return saved;
  }

  async publish(
    policyId: string,
    version: number,
    user: any,
  ): Promise<PlanVersionDocument> {
    const planVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!planVersion) {
      throw new NotFoundException(`Plan version ${version} not found`);
    }

    if (planVersion.status !== PlanVersionStatus.DRAFT) {
      throw new BadRequestException('Only draft versions can be published');
    }

    // Validate dates
    if (planVersion.effectiveTo && planVersion.effectiveTo < planVersion.effectiveFrom) {
      throw new BadRequestException('Invalid date range: effective to must be after effective from');
    }

    const before = planVersion.toObject();

    // Update status to published
    planVersion.status = PlanVersionStatus.PUBLISHED;
    planVersion.publishedAt = new Date();
    planVersion.publishedBy = user.id;
    planVersion.updatedBy = user.id;

    const saved = await planVersion.save();

    // Get policy for audit
    const policy = await this.policyModel.findById(policyId);

    // Audit log
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PLAN_VERSION_PUBLISH',
      resource: 'planVersions',
      resourceId: saved._id?.toString(),
      before,
      after: saved.toObject(),
      description: `Published plan version ${version} for policy ${policy?.policyNumber}`,
      metadata: {
        policyId,
        policyNumber: policy?.policyNumber,
        planVersion: version,
      },
    });

    return saved;
  }

  async makeCurrent(
    policyId: string,
    dto: UpdateCurrentVersionDto,
    user: any,
  ): Promise<PolicyDocument> {
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Verify target version exists and is published
    const targetVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: dto.planVersion,
    });

    if (!targetVersion) {
      throw new NotFoundException(`Plan version ${dto.planVersion} not found`);
    }

    if (targetVersion.status !== PlanVersionStatus.PUBLISHED) {
      throw new BadRequestException('Only published versions can be made current');
    }

    // Validate version is within policy date window
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetVersion.effectiveFrom > today) {
      throw new BadRequestException('Cannot make a future version current');
    }

    if (targetVersion.effectiveTo && targetVersion.effectiveTo < today) {
      throw new BadRequestException('Cannot make an expired version current');
    }

    const before = {
      currentPlanVersion: policy.currentPlanVersion,
    };

    // Update policy
    policy.currentPlanVersion = dto.planVersion;
    const saved = await policy.save();

    // Audit log
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PLAN_VERSION_MAKE_CURRENT',
      resource: 'policies',
      resourceId: policy._id?.toString(),
      before,
      after: { currentPlanVersion: dto.planVersion },
      description: `Changed current plan version from ${before.currentPlanVersion} to ${dto.planVersion} for policy ${policy.policyNumber}`,
      metadata: {
        policyId,
        policyNumber: policy.policyNumber,
        oldVersion: before.currentPlanVersion,
        newVersion: dto.planVersion,
      },
    });

    return saved;
  }

  async setCurrentVersion(
    policyId: string,
    planVersion: number,
    user: any,
  ): Promise<PolicyDocument> {
    return this.makeCurrent(policyId, { planVersion }, user);
  }
}