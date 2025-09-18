import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletRule, WalletRuleDocument, CopayMode } from './schemas/wallet-rule.schema';
import { UpdateWalletRulesDto } from './dto/wallet-rules.dto';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionDocument } from '../plan-versions/schemas/plan-version.schema';
import { PlanVersionStatus } from '../plan-versions/schemas/plan-version.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WalletRulesService {
  constructor(
    @InjectModel(WalletRule.name)
    private walletRuleModel: Model<WalletRuleDocument>,
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    private auditService: AuditService,
  ) {}

  async getWalletRules(
    policyId: string,
    planVersion: number,
  ): Promise<WalletRuleDocument | null> {
    // Validate policy exists
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Validate plan version exists
    const version = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });
    if (!version) {
      throw new NotFoundException(`Plan version ${planVersion} not found for this policy`);
    }

    // Get wallet rules
    const rules = await this.walletRuleModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    // Return null if not configured (UI will handle defaults)
    return rules;
  }

  async updateWalletRules(
    policyId: string,
    planVersion: number,
    dto: UpdateWalletRulesDto,
    user: any,
  ): Promise<WalletRuleDocument> {
    // Validate policy exists
    const policy = await this.policyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Validate plan version exists
    const version = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });
    if (!version) {
      throw new NotFoundException(`Plan version ${planVersion} not found for this policy`);
    }

    // Check edit permissions based on version status
    // Only editable in DRAFT status; read-only when PUBLISHED
    if (version.status === PlanVersionStatus.PUBLISHED) {
      throw new ForbiddenException('Cannot edit wallet rules for published plan versions');
    }

    // Validate copay percentage if mode is PERCENT
    if (dto.copay && dto.copay.mode === CopayMode.PERCENT) {
      if (dto.copay.value > 100) {
        throw new BadRequestException('Copay percentage cannot exceed 100%');
      }
    }

    // Validate carry forward
    if (dto.carryForward && dto.carryForward.enabled) {
      if (!dto.carryForward.percent) {
        dto.carryForward.percent = 100; // Default to 100% if not specified
      }
      if (!dto.carryForward.months) {
        dto.carryForward.months = 3; // Default to 3 months if not specified
      }
    }

    // Get existing rules for audit
    const existing = await this.walletRuleModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    const before = existing ? existing.toObject() : undefined;

    // Upsert wallet rules
    const updated = await this.walletRuleModel.findOneAndUpdate(
      {
        policyId: new Types.ObjectId(policyId),
        planVersion,
      },
      {
        $set: {
          totalAnnualAmount: dto.totalAnnualAmount,
          perClaimLimit: dto.perClaimLimit,
          copay: dto.copay,
          partialPaymentEnabled: dto.partialPaymentEnabled || false,
          carryForward: dto.carryForward,
          topUpAllowed: dto.topUpAllowed || false,
          notes: dto.notes,
          updatedBy: user.id,
        },
        $setOnInsert: {
          createdBy: user.id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    // Audit log
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'WALLET_RULES_UPSERT' as any,
      resource: 'walletRules',
      resourceId: updated._id?.toString(),
      before,
      after: updated.toObject(),
      description: `Updated wallet rules for policy ${policy.policyNumber} version ${planVersion}`,
      metadata: {
        policyId,
        policyNumber: policy.policyNumber,
        planVersion,
        ip: user.ip,
        userAgent: user.userAgent,
      } as any,
    });

    return updated;
  }

  async getWalletRulesForMember(
    policyId: string,
    effectivePlanVersion: number,
  ): Promise<WalletRuleDocument | null> {
    // This method is for member portal - just fetch, no validation of edit permissions
    const rules = await this.walletRuleModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: effectivePlanVersion,
    });

    return rules;
  }

  async getMemberWalletRules(userId: string): Promise<any> {
    // Get the user's active assignment
    const assignment = await this.walletRuleModel.db
      .collection('assignments')
      .findOne({ userId: new Types.ObjectId(userId), status: 'ACTIVE' });

    if (!assignment) {
      // Return null if no active assignment
      return null;
    }

    // Get the policy to determine the effective plan version
    const policy = await this.policyModel.findById(assignment.policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Determine effective plan version (assignment override or policy default)
    const effectivePlanVersion = assignment.planVersion || policy.currentPlanVersion;

    // Get the wallet rules for this policy/version
    return this.getWalletRulesForMember(
      assignment.policyId.toString(),
      effectivePlanVersion,
    );
  }
}