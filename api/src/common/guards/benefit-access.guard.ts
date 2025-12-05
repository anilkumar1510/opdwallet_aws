import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../modules/assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigDocument } from '../../modules/plan-config/schemas/plan-config.schema';

/**
 * Guard to check if a user has access to a specific benefit category
 * based on their policy configuration
 */
@Injectable()
export class BenefitAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(PlanConfig.name) private planConfigModel: Model<PlanConfigDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required category from decorator metadata
    const requiredCategory = this.reflector.get<string>(
      'requiredCategory',
      context.getHandler(),
    );

    // If no category is required, allow access
    if (!requiredCategory) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    console.log(`[BenefitAccessGuard] Checking access for user ${userId} to category ${requiredCategory}`);

    try {
      // Convert userId to ObjectId for proper MongoDB query
      const userObjectId = new Types.ObjectId(userId);

      // Get user's active policy assignment
      const assignment = await this.assignmentModel
        .findOne({
          userId: userObjectId,
          isActive: true,
        })
        .lean();

      if (!assignment) {
        console.log(`[BenefitAccessGuard] No active assignment found for user ${userId}`);
        throw new ForbiddenException(
          'No active policy found. Please contact your administrator.',
        );
      }

      console.log(`[BenefitAccessGuard] Found assignment for policy ${assignment.policyId}`);

      // Get current published plan configuration
      const planConfig = await this.planConfigModel
        .findOne({
          policyId: assignment.policyId,
          isCurrent: true,
          status: 'PUBLISHED',
        })
        .lean();

      if (!planConfig) {
        console.log(`[BenefitAccessGuard] No published plan config found for policy ${assignment.policyId}`);
        throw new ForbiddenException(
          'Policy configuration not found. Please contact your administrator.',
        );
      }

      console.log(`[BenefitAccessGuard] Found plan config version ${planConfig.version}`);

      // Check if benefit exists and is enabled
      const benefits = planConfig.benefits as any;
      const benefit = benefits?.[requiredCategory];

      if (!benefit) {
        console.log(`[BenefitAccessGuard] Benefit ${requiredCategory} not found in plan config`);
        throw new ForbiddenException(
          `Access denied: This benefit is not available in your policy.`,
        );
      }

      if (!benefit.enabled) {
        console.log(`[BenefitAccessGuard] Benefit ${requiredCategory} is disabled`);
        throw new ForbiddenException(
          `Access denied: This benefit is not enabled in your policy.`,
        );
      }

      console.log(`[BenefitAccessGuard] Access granted to ${requiredCategory}`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error('[BenefitAccessGuard] Error checking benefit access:', error);
      throw new ForbiddenException('Unable to verify benefit access');
    }
  }
}
