import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CategoryMaster, CategoryMasterDocument } from '../masters/schemas/category-master.schema';
import { RelationshipType } from '@/common/constants/status.enum';
import { AssignmentsService } from '../assignments/assignments.service';
import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CategoryMaster.name) private categoryMasterModel: Model<CategoryMasterDocument>,
    private assignmentsService: AssignmentsService,
    private walletService: WalletService,
    private planConfigService: PlanConfigService,
  ) {}

  async getProfile(userId: string) {
    // userId here is actually the MongoDB _id from JWT payload
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let dependents: any[] = [];
    let familyMembers: any[] = [];

    // Support both 'REL001' and legacy 'SELF' values for backward compatibility
    const isSelfRelationship = user.relationship === RelationshipType.SELF ||
                                (user.relationship as string) === 'REL001' ||
                                (user.relationship as string) === 'SELF';

    if (isSelfRelationship) {
      // If this is a primary member (REL001/SELF), fetch their dependents
      dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $nin: [RelationshipType.SELF, 'REL001', 'SELF'] } // Exclude all SELF variants
        })
        .select('-passwordHash')
        .sort({ createdAt: 1 });

      familyMembers = [user, ...dependents];
    } else {
      // If this is a dependent (non-REL001), they can only see themselves
      familyMembers = [user];
    };

    // Fetch policy assignments for all family members - OPTIMIZED: Batch query
    const memberIds = familyMembers.map(m => m._id.toString());
    const allAssignments = await this.assignmentsService.getBatchUserAssignments(memberIds);

    // Create assignment map for quick lookup
    const assignmentMap = new Map();
    allAssignments.forEach(assignment => {
      // After populate, userId is an object with _id field
      const userId = (assignment.userId as any)?._id?.toString() || assignment.userId.toString();
      if (!assignmentMap.has(userId)) {
        assignmentMap.set(userId, []);
      }
      assignmentMap.get(userId).push(assignment);
    });

    // Build assignments array with batched data
    const assignments = familyMembers.map(member => {
      const memberAssignments = assignmentMap.get(member._id.toString()) || [];
      return {
        userId: member._id,
        memberId: member.memberId,
        memberName: `${member.name.firstName} ${member.name.lastName}`,
        assignment: memberAssignments.length > 0 ? memberAssignments[0] : null,
      };
    });

    // Fetch wallet data for user
    const userWallet = await this.walletService.getUserWallet(userId);
    const walletData = this.walletService.formatWalletForFrontend(userWallet);

    // Fetch policy configuration for benefits
    let policyBenefits = null;
    let walletCategories: any[] = [];
    let healthBenefits: any[] = [];

    if (assignments.length > 0 && assignments[0].assignment?.policyId) {
      try {
        const policyId = assignments[0].assignment.policyId._id || assignments[0].assignment.policyId;
        const planConfig = await this.planConfigService.getConfig(policyId.toString());

        if (planConfig) {
          policyBenefits = planConfig.benefits;

          // Map policy benefits to wallet categories using dynamic category lookup
          if (planConfig.benefits) {
            // Get category codes from benefits (CAT001, CAT002, CAT003)
            const categoryIds = Object.keys(planConfig.benefits);

            // Fetch category names from category_master collection
            const categories = await this.categoryMasterModel.find({
              categoryId: { $in: categoryIds },
              isActive: true
            });

            // Map benefits using real database category names
            categoryIds.forEach(catId => {
              const benefit = (planConfig.benefits as any)[catId];
              const categoryInfo = categories.find(cat => cat.categoryId === catId);

              if (benefit?.enabled && categoryInfo) {
                const categoryWallet = walletData.categories.find(c => (c as any).categoryCode === catId);
                walletCategories.push({
                  name: categoryInfo.name, // Real name from database
                  available: categoryWallet?.available || 0,
                  total: benefit.annualLimit || categoryWallet?.total || 0,
                  categoryCode: catId
                });
              }
            });

            // Map to health benefits using dynamic category lookup
            if (planConfig.benefits && categories.length > 0) {
              categoryIds.forEach(catId => {
                const benefit = (planConfig.benefits as any)[catId];
                const categoryInfo = categories.find(cat => cat.categoryId === catId);

                if (benefit?.enabled && categoryInfo) {
                  const categoryWallet = walletData.categories.find(c => (c as any).categoryCode === catId);
                  const amount = benefit.annualLimit || categoryWallet?.total || 0;
                  healthBenefits.push({
                    name: categoryInfo.name,
                    description: `${categoryInfo.name} upto Rs ${amount}`,
                    categoryCode: catId
                  });
                }
              });
            }
          }
        }
      } catch (error) {
        // Error fetching policy benefits - continue with empty benefits
      }
    }

    return {
      user,
      dependents,
      familyMembers,
      assignments,
      wallet: walletData,
      walletCategories,
      healthBenefits,
      policyBenefits,
    };
  }

  async getFamilyMembers(userId: string) {
    // userId here is actually the MongoDB _id from JWT payload
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let familyMembers: any[] = [];

    // Support both 'REL001' and legacy 'SELF' values for backward compatibility
    const isSelfRelationship = user.relationship === RelationshipType.SELF ||
                                (user.relationship as string) === 'REL001' ||
                                (user.relationship as string) === 'SELF';

    if (isSelfRelationship) {
      // Primary member (REL001): get self + dependents
      const dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $nin: [RelationshipType.SELF, 'REL001', 'SELF'] } // Exclude all SELF variants
        })
        .select('-passwordHash')
        .sort({ createdAt: 1 });

      familyMembers = [user, ...dependents];
    } else {
      // Dependent (non-REL001): can only see themselves
      familyMembers = [user];
    }

    return familyMembers;
  }
}