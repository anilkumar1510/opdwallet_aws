import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanVersion, PlanVersionDocument, PlanVersionStatus } from './schemas/plan-version.schema';
import { QueryPlanVersionDto } from './dto/query-plan-version.dto';
import { CreatePlanVersionDto } from './dto/create-plan-version.dto';
import { UpdateCurrentVersionDto } from './dto/update-current-version.dto';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { BenefitComponent, BenefitComponentDocument } from '../benefit-components/schemas/benefit-component.schema';
import { WalletRule, WalletRuleDocument } from '../wallet-rules/schemas/wallet-rule.schema';
import { BenefitCoverageMatrix, BenefitCoverageMatrixDocument } from '../benefit-coverage-matrix/schemas/benefit-coverage-matrix.schema';
import { AuditService } from '../audit/audit.service';
import { CoverageService } from '../benefits/coverage.service';

export interface ReadinessCheck {
  key: string;
  ok: boolean;
  message?: string;
  details?: any;
}

export interface ReadinessResponse {
  policyId: string;
  planVersion: number;
  status: 'READY' | 'BLOCKED';
  checks: ReadinessCheck[];
  generatedAt: string;
}

@Injectable()
export class PlanVersionsService {
  constructor(
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    @InjectModel(BenefitComponent.name)
    private benefitComponentModel: Model<BenefitComponentDocument>,
    @InjectModel(WalletRule.name)
    private walletRuleModel: Model<WalletRuleDocument>,
    @InjectModel(BenefitCoverageMatrix.name)
    private coverageMatrixModel: Model<BenefitCoverageMatrixDocument>,
    private auditService: AuditService,
    private coverageService: CoverageService,
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

    // Run readiness checks before publishing
    const readinessCheck = await this.checkPublishReadiness(policyId, version);

    if (readinessCheck.status === 'BLOCKED') {
      const failedChecks = readinessCheck.checks
        .filter(check => !check.ok)
        .map(check => check.message);

      throw new BadRequestException({
        message: 'Cannot publish: Readiness checks failed',
        failedChecks,
        readinessResponse: readinessCheck,
      });
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

  async checkPublishReadiness(
    policyId: string,
    version: number,
  ): Promise<ReadinessResponse> {
    const checks: ReadinessCheck[] = [];
    let allChecksPassed = true;

    // Get policy first for validation
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      // Return graceful response for missing policy
      return {
        policyId,
        planVersion: version,
        status: 'BLOCKED',
        checks: [
          {
            key: 'versionStatus',
            ok: false,
            message: 'Policy not found',
          },
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    // Get plan version
    const planVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!planVersion) {
      // Return graceful response for missing plan version
      return {
        policyId,
        planVersion: version,
        status: 'BLOCKED',
        checks: [
          {
            key: 'versionStatus',
            ok: false,
            message: `Plan version ${version} does not exist`,
          },
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    // Check 1: Version must be in DRAFT status
    if (planVersion.status !== PlanVersionStatus.DRAFT) {
      checks.push({
        key: 'versionStatus',
        ok: false,
        message: `Version must be in DRAFT status to publish (current: ${planVersion.status})`,
      });
      allChecksPassed = false;
    } else {
      checks.push({
        key: 'versionStatus',
        ok: true,
        message: 'Version is in DRAFT status',
      });
    }

    // Check 2: Validate dates
    const dateCheck = this.validateVersionDates(planVersion, policy);
    checks.push(dateCheck);
    if (!dateCheck.ok) {
      allChecksPassed = false;
    }

    // Check 3: Wallet rules validation
    const walletRulesCheck = await this.validateWalletRules(policyId, version);
    checks.push(walletRulesCheck);
    if (!walletRulesCheck.ok) {
      allChecksPassed = false;
    }

    // Check 4: Benefit components validation
    const benefitsCheck = await this.validateBenefitComponents(policyId, version);
    checks.push(benefitsCheck);
    if (!benefitsCheck.ok) {
      allChecksPassed = false;
    }

    // Check 5: Coverage matrix validation for enabled components
    const coverageCheck = await this.validateCoverageMatrix(policyId, version);
    checks.push(coverageCheck);
    if (!coverageCheck.ok) {
      allChecksPassed = false;
    }

    return {
      policyId,
      planVersion: version,
      status: allChecksPassed ? 'READY' : 'BLOCKED',
      checks,
      generatedAt: new Date().toISOString(),
    };
  }

  private validateVersionDates(
    planVersion: any,
    policy: any,
  ): ReadinessCheck {
    // Check if effectiveFrom is valid
    if (!planVersion.effectiveFrom) {
      return {
        key: 'dates',
        ok: false,
        message: 'Effective from date is required',
      };
    }

    // Check if dates are within policy window
    if (policy.effectiveFrom && planVersion.effectiveFrom < policy.effectiveFrom) {
      return {
        key: 'dates',
        ok: false,
        message: 'Version effective from date is before policy effective from date',
        details: {
          versionEffectiveFrom: planVersion.effectiveFrom,
          policyEffectiveFrom: policy.effectiveFrom,
        },
      };
    }

    if (policy.effectiveTo && planVersion.effectiveTo && planVersion.effectiveTo > policy.effectiveTo) {
      return {
        key: 'dates',
        ok: false,
        message: 'Version effective to date is after policy effective to date',
        details: {
          versionEffectiveTo: planVersion.effectiveTo,
          policyEffectiveTo: policy.effectiveTo,
        },
      };
    }

    // Check if effectiveTo is after effectiveFrom
    if (planVersion.effectiveTo && planVersion.effectiveTo < planVersion.effectiveFrom) {
      return {
        key: 'dates',
        ok: false,
        message: 'Effective to date must be after effective from date',
        details: {
          effectiveFrom: planVersion.effectiveFrom,
          effectiveTo: planVersion.effectiveTo,
        },
      };
    }

    return {
      key: 'dates',
      ok: true,
      message: 'Date validation passed',
      details: {
        effectiveFrom: planVersion.effectiveFrom,
        effectiveTo: planVersion.effectiveTo || null,
      },
    };
  }

  private async validateWalletRules(
    policyId: string,
    version: number,
  ): Promise<ReadinessCheck> {
    const walletRule = await this.walletRuleModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!walletRule) {
      return {
        key: 'walletRules',
        ok: false,
        message: 'Wallet rules not configured for this version',
      };
    }

    // Check totalAnnualAmount is present and > 0
    if (!walletRule.totalAnnualAmount || walletRule.totalAnnualAmount <= 0) {
      return {
        key: 'walletRules',
        ok: false,
        message: 'Total annual amount must be greater than 0',
        details: {
          totalAnnualAmount: walletRule.totalAnnualAmount || 0,
        },
      };
    }

    // Additional wallet rules validation
    const warnings: string[] = [];

    // Check if per claim limit is reasonable
    if (walletRule.perClaimLimit && walletRule.perClaimLimit > walletRule.totalAnnualAmount) {
      warnings.push('Per claim limit exceeds total annual amount');
    }

    // Check copay configuration
    if (walletRule.copay) {
      if (walletRule.copay.mode === 'PERCENT' && walletRule.copay.value > 100) {
        warnings.push('Copay percentage exceeds 100%');
      }
    }

    return {
      key: 'walletRules',
      ok: true,
      message: 'Wallet rules configured correctly',
      details: {
        totalAnnualAmount: walletRule.totalAnnualAmount,
        perClaimLimit: walletRule.perClaimLimit || null,
        copayMode: walletRule.copay?.mode || null,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    };
  }

  private async validateBenefitComponents(
    policyId: string,
    version: number,
  ): Promise<ReadinessCheck> {
    const benefitComponent = await this.benefitComponentModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!benefitComponent || !benefitComponent.components) {
      return {
        key: 'benefitComponents',
        ok: false,
        message: 'No benefit components configured for this version',
      };
    }

    // Check if at least one component is enabled
    const enabledComponents: string[] = [];
    const components = benefitComponent.components;

    if (components.consultation?.enabled) enabledComponents.push('consultation');
    if (components.pharmacy?.enabled) enabledComponents.push('pharmacy');
    if (components.diagnostics?.enabled) enabledComponents.push('diagnostics');
    if (components.ahc?.enabled) enabledComponents.push('ahc');
    if (components.vaccination?.enabled) enabledComponents.push('vaccination');
    if (components.dental?.enabled) enabledComponents.push('dental');
    if (components.vision?.enabled) enabledComponents.push('vision');
    if (components.wellness?.enabled) enabledComponents.push('wellness');

    if (enabledComponents.length === 0) {
      return {
        key: 'benefitComponents',
        ok: false,
        message: 'At least one benefit component must be enabled',
        details: {
          enabledCount: 0,
        },
      };
    }

    return {
      key: 'benefitComponents',
      ok: true,
      message: `${enabledComponents.length} benefit component(s) enabled`,
      details: {
        enabledCount: enabledComponents.length,
        enabledComponents,
      },
    };
  }

  private async validateCoverageMatrix(
    policyId: string,
    version: number,
  ): Promise<ReadinessCheck> {
    // Get the plan version to get its ID
    const planVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!planVersion) {
      return {
        key: 'coverageMatrix',
        ok: false,
        message: 'Plan version not found',
      };
    }

    // Use the new coverage service to check readiness
    const coverageReadinessResult = await this.coverageService.checkCoverageReadiness((planVersion as any)._id.toString());

    // The coverage service returns the structured check result directly
    return coverageReadinessResult;
  }

  async getEffectiveConfig(
    policyId: string,
    version: number,
  ): Promise<any> {
    // Get all configuration for this plan version
    const [planVersion, walletRule, benefitComponent, coverageMatrix] = await Promise.all([
      this.planVersionModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion: version,
      }),
      this.walletRuleModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion: version,
      }),
      this.benefitComponentModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion: version,
      }),
      this.coverageMatrixModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion: version,
      }),
    ]);

    if (!planVersion) {
      throw new NotFoundException(`Plan version ${version} not found`);
    }

    // Get policy for context
    const policy = await this.policyModel.findById(policyId);

    // Build the effective configuration (what members will see)
    return {
      policy: {
        policyId: policy?._id,
        policyNumber: policy?.policyNumber,
        policyName: policy?.name,
        companyName: policy?.sponsorName,
      },
      planVersion: {
        version: planVersion.planVersion,
        status: planVersion.status,
        effectiveFrom: planVersion.effectiveFrom,
        effectiveTo: planVersion.effectiveTo,
      },
      wallet: walletRule ? {
        totalAnnualAmount: walletRule.totalAnnualAmount,
        perClaimLimit: walletRule.perClaimLimit,
        copay: walletRule.copay,
        partialPaymentEnabled: walletRule.partialPaymentEnabled,
        carryForward: walletRule.carryForward,
        topUpAllowed: walletRule.topUpAllowed,
      } : null,
      benefits: benefitComponent?.components || {},
      coverage: coverageMatrix?.rows || [],
    };
  }

  async findByVersion(policyId: string, version: number): Promise<PlanVersionDocument> {
    const planVersion = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: version,
    });

    if (!planVersion) {
      throw new NotFoundException(`Plan version ${version} not found for policy ${policyId}`);
    }

    return planVersion;
  }
}