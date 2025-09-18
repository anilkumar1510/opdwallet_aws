import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionDocument } from '../plan-versions/schemas/plan-version.schema';
import { BenefitComponent, BenefitComponentDocument } from '../benefit-components/schemas/benefit-component.schema';
import { WalletRule, WalletRuleDocument } from '../wallet-rules/schemas/wallet-rule.schema';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';

export interface EffectiveConfig {
  policyId: string;
  planVersion: number;
  benefits: {
    consultation?: {
      enabled: boolean;
      annualAmountLimit?: number;
      visitsLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    pharmacy?: {
      enabled: boolean;
      annualAmountLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    diagnostics?: {
      enabled: boolean;
      annualAmountLimit?: number;
      visitsLimit?: number;
      rxRequired?: boolean;
      notes?: string;
    };
    ahc?: {
      enabled: boolean;
      includesFasting?: boolean;
      notes?: string;
    };
    vaccination?: {
      enabled: boolean;
      notes?: string;
    };
    dental?: {
      enabled: boolean;
      notes?: string;
    };
    vision?: {
      enabled: boolean;
      notes?: string;
    };
    wellness?: {
      enabled: boolean;
      notes?: string;
    };
  };
  wallet: {
    totalAnnualAmount?: number;
    perClaimLimit?: number;
    copay?: {
      mode: 'PERCENT' | 'AMOUNT';
      value: number;
    };
    partialPaymentEnabled: boolean;
    carryForward?: {
      enabled: boolean;
      percent?: number;
      months?: number;
    };
    topUpAllowed?: boolean;
    notes?: string;
  };
  meta: {
    generatedAtISO: string;
    status?: 'complete' | 'incomplete';
    missing?: string[];
  };
}

@Injectable()
export class PlanConfigResolverService {
  constructor(
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    @InjectModel(BenefitComponent.name)
    private benefitComponentModel: Model<BenefitComponentDocument>,
    @InjectModel(WalletRule.name)
    private walletRuleModel: Model<WalletRuleDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  /**
   * Resolve effective configuration for admin view
   * @param policyId Policy ID
   * @param planVersion Plan version number
   * @returns Normalized effective configuration
   */
  async resolveForAdmin(
    policyId: string,
    planVersion: number,
  ): Promise<EffectiveConfig> {
    // Verify the plan version exists
    const versionDoc = await this.planVersionModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    if (!versionDoc) {
      throw new NotFoundException(`Plan version ${planVersion} not found for policy`);
    }

    // Fetch benefit components and wallet rules
    const [benefitComponent, walletRule] = await Promise.all([
      this.benefitComponentModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion,
      }),
      this.walletRuleModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion,
      }),
    ]);

    const missing: string[] = [];
    if (!benefitComponent) missing.push('benefitComponents');
    if (!walletRule) missing.push('walletRules');

    // Build normalized response
    const config: EffectiveConfig = {
      policyId,
      planVersion,
      benefits: this.normalizeBenefits(benefitComponent),
      wallet: this.normalizeWallet(walletRule),
      meta: {
        generatedAtISO: new Date().toISOString(),
        status: missing.length === 0 ? 'complete' : 'incomplete',
        missing: missing.length > 0 ? missing : undefined,
      },
    };

    return config;
  }

  /**
   * Resolve effective configuration for member view
   * @param userId User ID / Member ID
   * @returns Normalized effective configuration for the member's assignment
   */
  async resolveForMember(userId: string): Promise<EffectiveConfig> {
    // Get member's assignment
    const assignment = await this.assignmentModel
      .findOne({ memberId: userId })
      .populate('policyId');

    if (!assignment) {
      throw new NotFoundException('No policy assignment found for member');
    }

    const policy = assignment.policyId as any as PolicyDocument;

    // Determine effective plan version:
    // Use assignment's planVersion if set, otherwise policy's currentPlanVersion
    const effectivePlanVersion = assignment.planVersion || policy.currentPlanVersion || 1;

    // Use the admin resolver with the determined version
    return this.resolveForAdmin((policy as any)._id.toString(), effectivePlanVersion);
  }

  /**
   * Normalize benefit components to a consistent structure
   */
  private normalizeBenefits(benefitComponent: BenefitComponentDocument | null): EffectiveConfig['benefits'] {
    if (!benefitComponent || !benefitComponent.components) {
      // Return all disabled by default
      return {
        consultation: { enabled: false },
        pharmacy: { enabled: false },
        diagnostics: { enabled: false },
        ahc: { enabled: false },
        vaccination: { enabled: false },
        dental: { enabled: false },
        vision: { enabled: false },
        wellness: { enabled: false },
      };
    }

    const components = benefitComponent.components;
    const normalized: EffectiveConfig['benefits'] = {};

    // Map each component with safe defaults
    if (components.consultation) {
      normalized.consultation = {
        enabled: components.consultation.enabled ?? false,
        annualAmountLimit: components.consultation.annualAmountLimit,
        visitsLimit: components.consultation.visitsLimit,
        rxRequired: components.consultation.rxRequired,
        notes: (components.consultation as any).notes,
      };
    }

    if (components.pharmacy) {
      normalized.pharmacy = {
        enabled: components.pharmacy.enabled ?? false,
        annualAmountLimit: components.pharmacy.annualAmountLimit,
        rxRequired: components.pharmacy.rxRequired,
        notes: (components.pharmacy as any).notes,
      };
    }

    if (components.diagnostics) {
      normalized.diagnostics = {
        enabled: components.diagnostics.enabled ?? false,
        annualAmountLimit: components.diagnostics.annualAmountLimit,
        visitsLimit: components.diagnostics.visitsLimit,
        rxRequired: components.diagnostics.rxRequired,
        notes: (components.diagnostics as any).notes,
      };
    }

    if (components.ahc) {
      normalized.ahc = {
        enabled: components.ahc.enabled ?? false,
        includesFasting: components.ahc.includesFasting,
        notes: (components.ahc as any).notes,
      };
    }

    if (components.vaccination) {
      normalized.vaccination = {
        enabled: components.vaccination.enabled ?? false,
        notes: (components.vaccination as any).notes,
      };
    }

    if (components.dental) {
      normalized.dental = {
        enabled: components.dental.enabled ?? false,
        notes: (components.dental as any).notes,
      };
    }

    if (components.vision) {
      normalized.vision = {
        enabled: components.vision.enabled ?? false,
        notes: (components.vision as any).notes,
      };
    }

    if (components.wellness) {
      normalized.wellness = {
        enabled: components.wellness.enabled ?? false,
        notes: (components.wellness as any).notes,
      };
    }

    return normalized;
  }

  /**
   * Normalize wallet rules to a consistent structure
   */
  private normalizeWallet(walletRule: WalletRuleDocument | null): EffectiveConfig['wallet'] {
    if (!walletRule) {
      // Return safe defaults
      return {
        totalAnnualAmount: 0,
        partialPaymentEnabled: false,
        topUpAllowed: false,
      };
    }

    return {
      totalAnnualAmount: walletRule.totalAnnualAmount,
      perClaimLimit: walletRule.perClaimLimit,
      copay: walletRule.copay ? {
        mode: walletRule.copay.mode,
        value: walletRule.copay.value,
      } : undefined,
      partialPaymentEnabled: walletRule.partialPaymentEnabled ?? false,
      carryForward: walletRule.carryForward ? {
        enabled: walletRule.carryForward.enabled,
        percent: walletRule.carryForward.percent,
        months: walletRule.carryForward.months,
      } : undefined,
      topUpAllowed: walletRule.topUpAllowed,
      notes: walletRule.notes,
    };
  }

  /**
   * Check if a plan version is ready for publishing
   * Returns validation status and any issues found
   */
  async checkPublishReadiness(
    policyId: string,
    planVersion: number,
  ): Promise<{
    isReady: boolean;
    checks: {
      hasBenefitComponents: boolean;
      hasWalletRules: boolean;
      hasValidDates: boolean;
      hasValidWalletConfig: boolean;
      message?: string;
    };
  }> {
    const [versionDoc, benefitComponent, walletRule, policy] = await Promise.all([
      this.planVersionModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion,
      }),
      this.benefitComponentModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion,
      }),
      this.walletRuleModel.findOne({
        policyId: new Types.ObjectId(policyId),
        planVersion,
      }),
      this.policyModel.findById(policyId),
    ]);

    if (!versionDoc || !policy) {
      throw new NotFoundException('Plan version or policy not found');
    }

    const checks = {
      hasBenefitComponents: !!benefitComponent,
      hasWalletRules: !!walletRule,
      hasValidDates: true,
      hasValidWalletConfig: true,
      message: undefined as string | undefined,
    };

    // Check dates are within policy window
    if (versionDoc.effectiveFrom < policy.effectiveFrom) {
      checks.hasValidDates = false;
      checks.message = 'Plan version effective from is before policy effective from';
    }

    if (policy.effectiveTo && versionDoc.effectiveTo && versionDoc.effectiveTo > policy.effectiveTo) {
      checks.hasValidDates = false;
      checks.message = 'Plan version effective to is after policy effective to';
    }

    // Check wallet configuration validity
    if (walletRule) {
      if (walletRule.copay && walletRule.copay.mode === 'PERCENT' && walletRule.copay.value > 100) {
        checks.hasValidWalletConfig = false;
        checks.message = 'Copay percentage cannot exceed 100%';
      }

      if (walletRule.carryForward?.enabled && walletRule.carryForward.percent && walletRule.carryForward.percent > 100) {
        checks.hasValidWalletConfig = false;
        checks.message = 'Carry forward percentage cannot exceed 100%';
      }
    }

    const isReady = Object.values(checks)
      .filter(v => typeof v === 'boolean')
      .every(v => v === true);

    return {
      isReady,
      checks,
    };
  }
}