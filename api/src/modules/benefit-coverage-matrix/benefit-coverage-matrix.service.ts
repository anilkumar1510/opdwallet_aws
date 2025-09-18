import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BenefitCoverageMatrix,
  BenefitCoverageMatrixDocument,
} from './schemas/benefit-coverage-matrix.schema';
import {
  UpdateBenefitCoverageMatrixDto,
  BenefitCoverageMatrixResponseDto,
} from './dto/benefit-coverage-matrix.dto';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionDocument } from '../plan-versions/schemas/plan-version.schema';
import { PlanVersionStatus } from '../plan-versions/schemas/plan-version.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BenefitCoverageMatrixService {
  constructor(
    @InjectModel(BenefitCoverageMatrix.name)
    private coverageMatrixModel: Model<BenefitCoverageMatrixDocument>,
    @InjectModel(Policy.name)
    private policyModel: Model<PolicyDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    @InjectModel('Category')
    private categoryModel: Model<any>,
    @InjectModel('Service')
    private serviceModel: Model<any>,
    private auditService: AuditService,
  ) {}

  async getCoverageMatrix(
    policyId: string,
    planVersion: number,
  ): Promise<BenefitCoverageMatrixResponseDto> {
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

    // Get coverage matrix
    let matrix = await this.coverageMatrixModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    // If no matrix exists, return empty structure
    if (!matrix) {
      return {
        policyId,
        planVersion,
        rows: [],
      };
    }

    // Normalize rows with category and service names
    const normalizedRows = await this.normalizeRows(matrix.rows);

    return {
      policyId: matrix.policyId.toString(),
      planVersion: matrix.planVersion,
      rows: normalizedRows,
      createdAt: (matrix as any).createdAt,
      updatedAt: (matrix as any).updatedAt,
    };
  }

  async updateCoverageMatrix(
    policyId: string,
    planVersion: number,
    dto: UpdateBenefitCoverageMatrixDto,
    user: any,
  ): Promise<BenefitCoverageMatrixResponseDto> {
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

    // Check edit permissions - only DRAFT versions can be edited
    if (version.status !== PlanVersionStatus.DRAFT) {
      throw new ForbiddenException('Only DRAFT plan versions can have their coverage matrix edited');
    }

    // Validate all categories and services exist
    await this.validateCoverageRows(dto.rows);

    // Get existing matrix for audit
    const existing = await this.coverageMatrixModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion,
    });

    const before = existing ? existing.toObject() : undefined;

    // Upsert coverage matrix
    const updated = await this.coverageMatrixModel.findOneAndUpdate(
      {
        policyId: new Types.ObjectId(policyId),
        planVersion,
      },
      {
        $set: {
          rows: dto.rows,
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
      action: 'COVERAGE_MATRIX_UPSERT' as any,
      resource: 'benefitCoverageMatrix',
      resourceId: updated._id?.toString(),
      before,
      after: updated.toObject(),
      description: `Updated coverage matrix for policy ${policy.policyNumber} version ${planVersion}`,
      metadata: {
        policyId,
        policyNumber: policy.policyNumber,
        planVersion,
        rowCount: dto.rows.length,
        ip: user.ip,
        userAgent: user.userAgent,
      } as any,
    });

    // Normalize and return
    const normalizedRows = await this.normalizeRows(updated.rows);

    return {
      policyId: updated.policyId.toString(),
      planVersion: updated.planVersion,
      rows: normalizedRows,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    };
  }

  private async validateCoverageRows(rows: any[]): Promise<void> {
    for (const row of rows) {
      // Validate category exists and is active
      const category = await this.categoryModel.findOne({
        categoryId: row.categoryId,
        isActive: true,
      });
      if (!category) {
        throw new BadRequestException(
          `Category ${row.categoryId} not found or is inactive`,
        );
      }

      // If service code provided, validate it exists
      if (row.serviceCode) {
        const service = await this.serviceModel.findOne({
          code: row.serviceCode,
        });
        if (!service) {
          throw new BadRequestException(
            `Service code ${row.serviceCode} not found`,
          );
        }
        // Optionally validate service belongs to category
        if (service.category !== row.categoryId) {
          throw new BadRequestException(
            `Service ${row.serviceCode} does not belong to category ${row.categoryId}`,
          );
        }
      }
    }
  }

  private async normalizeRows(rows: any[]): Promise<any[]> {
    const normalizedRows = [];

    for (const row of rows) {
      const normalizedRow: any = {
        categoryId: row.categoryId,
        enabled: row.enabled,
        notes: row.notes,
      };

      // Get category name
      const category = await this.categoryModel.findOne({
        categoryId: row.categoryId,
      });
      if (category) {
        normalizedRow.categoryName = category.name;
      }

      // Get service name if code provided
      if (row.serviceCode) {
        normalizedRow.serviceCode = row.serviceCode;
        const service = await this.serviceModel.findOne({
          code: row.serviceCode,
        });
        if (service) {
          normalizedRow.serviceName = service.serviceType;
        }
      }

      normalizedRows.push(normalizedRow);
    }

    return normalizedRows;
  }

  async getCoverageMatrixForMember(
    policyId: string,
    effectivePlanVersion: number,
  ): Promise<BenefitCoverageMatrixDocument | null> {
    const matrix = await this.coverageMatrixModel.findOne({
      policyId: new Types.ObjectId(policyId),
      planVersion: effectivePlanVersion,
    });

    return matrix;
  }

  async getMemberCoverageMatrix(userId: string): Promise<any> {
    // Get the user's active assignment
    const assignment = await this.coverageMatrixModel.db
      .collection('assignments')
      .findOne({ userId: new Types.ObjectId(userId), status: 'ACTIVE' });

    if (!assignment) {
      return null;
    }

    // Get the policy to determine the effective plan version
    const policy = await this.policyModel.findById(assignment.policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Determine effective plan version
    const effectivePlanVersion = assignment.planVersion || policy.currentPlanVersion;

    // Get the coverage matrix for this policy/version
    const matrix = await this.getCoverageMatrixForMember(
      assignment.policyId.toString(),
      effectivePlanVersion,
    );

    if (!matrix) {
      return null;
    }

    // Return only enabled items
    const enabledRows = matrix.rows.filter(row => row.enabled);
    const normalizedRows = await this.normalizeRows(enabledRows);

    return {
      policyId: matrix.policyId.toString(),
      planVersion: matrix.planVersion,
      rows: normalizedRows,
    };
  }
}