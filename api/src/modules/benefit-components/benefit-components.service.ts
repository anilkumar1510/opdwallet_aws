import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BenefitComponent, BenefitComponentDocument } from './schemas/benefit-component.schema';
import { UpdateBenefitComponentsDto } from './dto/benefit-components.dto';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionDocument } from '../plan-versions/schemas/plan-version.schema';
import { PlanVersionStatus } from '../plan-versions/schemas/plan-version.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BenefitComponentsService {
  constructor(
    @InjectModel(BenefitComponent.name)
    private benefitComponentModel: Model<BenefitComponentDocument>,
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    private auditService: AuditService,
  ) {}

  async getBenefitComponents(
    policyId: string,
    planVersion: number,
  ): Promise<BenefitComponentDocument | null> {
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

    // Get or create benefit components
    let components = await this.benefitComponentModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    // If not found, return default (all disabled)
    if (!components) {
      return {
        policyId: new Types.ObjectId(policyId),
        planVersion,
        components: {
          consultation: { enabled: false },
          pharmacy: { enabled: false },
          diagnostics: { enabled: false },
          ahc: { enabled: false },
          vaccination: { enabled: false },
          dental: { enabled: false },
          vision: { enabled: false },
          wellness: { enabled: false },
        },
      } as BenefitComponentDocument;
    }

    return components;
  }

  async updateBenefitComponents(
    policyId: string,
    planVersion: number,
    dto: UpdateBenefitComponentsDto,
    user: any,
  ): Promise<BenefitComponentDocument> {
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
    // Rule: Only editable in DRAFT status; read-only when PUBLISHED
    if (version.status === PlanVersionStatus.PUBLISHED) {
      throw new ForbiddenException('Cannot edit benefit components for published plan versions');
    }

    // Get existing components for audit
    const existing = await this.benefitComponentModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    const before = existing ? existing.toObject() : undefined;

    // Upsert components
    const updated = await this.benefitComponentModel.findOneAndUpdate(
      {
        policyId: new Types.ObjectId(policyId),
        planVersion,
      },
      {
        $set: {
          components: dto.components,
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
      action: 'BENEFIT_COMPONENTS_UPSERT' as any,
      resource: 'benefitComponents',
      resourceId: updated._id?.toString(),
      before,
      after: updated.toObject(),
      description: `Updated benefit components for policy ${policy.policyNumber} version ${planVersion}`,
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

  async getBenefitComponentsForMember(
    policyId: string,
    effectivePlanVersion: number,
  ): Promise<BenefitComponentDocument | null> {
    // This method is for member portal - just fetch, no validation of edit permissions
    const components = await this.benefitComponentModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: effectivePlanVersion,
    });

    // Return default if not configured
    if (!components) {
      return {
        policyId: new Types.ObjectId(policyId),
        planVersion: effectivePlanVersion,
        components: {
          consultation: { enabled: false },
          pharmacy: { enabled: false },
          diagnostics: { enabled: false },
          ahc: { enabled: false },
          vaccination: { enabled: false },
          dental: { enabled: false },
          vision: { enabled: false },
          wellness: { enabled: false },
        },
      } as BenefitComponentDocument;
    }

    return components;
  }

  async getMemberBenefitComponents(userId: string): Promise<any> {
    // Get the user's active assignment
    const assignment = await this.benefitComponentModel.db
      .collection('assignments')
      .findOne({ userId: new Types.ObjectId(userId), status: 'ACTIVE' });

    if (!assignment) {
      // Return all disabled if no active assignment
      return {
        components: {
          consultation: { enabled: false },
          pharmacy: { enabled: false },
          diagnostics: { enabled: false },
          ahc: { enabled: false },
          vaccination: { enabled: false },
          dental: { enabled: false },
          vision: { enabled: false },
          wellness: { enabled: false },
        },
      };
    }

    // Get the policy to determine the effective plan version
    const policy = await this.policyModel.findById(assignment.policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Determine effective plan version (assignment override or policy default)
    const effectivePlanVersion = assignment.planVersion || policy.currentPlanVersion;

    // Get the benefit components for this policy/version
    return this.getBenefitComponentsForMember(
      assignment.policyId.toString(),
      effectivePlanVersion,
    );
  }
}