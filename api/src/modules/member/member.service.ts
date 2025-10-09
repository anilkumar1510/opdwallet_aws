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

  private isSelfRelationship(relationship: string): boolean {
    return relationship === RelationshipType.SELF ||
           relationship === 'REL001' ||
           relationship === 'SELF';
  }

  private async fetchDependents(user: any): Promise<any[]> {
    return this.userModel
      .find({
        primaryMemberId: user.memberId,
        relationship: { $nin: [RelationshipType.SELF, 'REL001', 'SELF'] }
      })
      .select('-passwordHash')
      .sort({ createdAt: 1 });
  }

  private async getFamilyMembersForUser(user: any): Promise<{ familyMembers: any[], dependents: any[] }> {
    if (this.isSelfRelationship(user.relationship)) {
      const dependents = await this.fetchDependents(user);
      return { familyMembers: [user, ...dependents], dependents };
    }
    return { familyMembers: [user], dependents: [] };
  }

  private async fetchPolicyBenefits(assignments: any[], walletData: any) {
    let policyBenefits = null;
    let walletCategories: any[] = [];
    let healthBenefits: any[] = [];

    if (assignments.length === 0 || !assignments[0].assignment?.policyId) {
      return { policyBenefits, walletCategories, healthBenefits };
    }

    try {
      const policyId = assignments[0].assignment.policyId._id || assignments[0].assignment.policyId;
      const planConfig = await this.planConfigService.getConfig(policyId.toString());

      if (!planConfig || !planConfig.benefits) {
        return { policyBenefits, walletCategories, healthBenefits };
      }

      policyBenefits = planConfig.benefits;
      const categoryIds = Object.keys(planConfig.benefits);
      const categories = await this.categoryMasterModel.find({
        categoryId: { $in: categoryIds },
        isActive: true
      });

      walletCategories = this.mapWalletCategories(categoryIds, planConfig.benefits, categories, walletData);
      healthBenefits = this.mapHealthBenefits(categoryIds, planConfig.benefits, categories, walletData);
    } catch (error) {
      // Error fetching policy benefits - continue with empty benefits
    }

    return { policyBenefits, walletCategories, healthBenefits };
  }

  private mapWalletCategories(categoryIds: string[], benefits: any, categories: any[], walletData: any): any[] {
    const walletCategories: any[] = [];

    categoryIds.forEach(catId => {
      const benefit = benefits[catId];
      const categoryInfo = categories.find(cat => cat.categoryId === catId);

      if (benefit?.enabled && categoryInfo) {
        const categoryWallet = walletData.categories.find((c: any) => c.categoryCode === catId);
        walletCategories.push({
          name: categoryInfo.name,
          available: categoryWallet?.available || 0,
          total: benefit.annualLimit || categoryWallet?.total || 0,
          categoryCode: catId
        });
      }
    });

    return walletCategories;
  }

  private mapHealthBenefits(categoryIds: string[], benefits: any, categories: any[], walletData: any): any[] {
    const healthBenefits: any[] = [];

    categoryIds.forEach(catId => {
      const benefit = benefits[catId];
      const categoryInfo = categories.find(cat => cat.categoryId === catId);

      if (benefit?.enabled && categoryInfo) {
        const categoryWallet = walletData.categories.find((c: any) => c.categoryCode === catId);
        const amount = benefit.annualLimit || categoryWallet?.total || 0;
        healthBenefits.push({
          name: categoryInfo.name,
          description: `${categoryInfo.name} upto Rs ${amount}`,
          categoryCode: catId
        });
      }
    });

    return healthBenefits;
  }

  async getProfile(userId: string) {
    // userId here is actually the MongoDB _id from JWT payload
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { familyMembers, dependents } = await this.getFamilyMembersForUser(user);

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

    const { policyBenefits, walletCategories, healthBenefits } =
      await this.fetchPolicyBenefits(assignments, walletData);

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