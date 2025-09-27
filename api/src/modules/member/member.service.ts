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

    console.log(`🔍 User is ${(user.relationship as string) === 'REL001' ? 'primary member' : 'dependent'}, searching for dependents with primaryMemberId: ${user.memberId}`);

    if ((user.relationship as string) === 'REL001') {
      // If this is a primary member (REL001), fetch their dependents
      dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $ne: 'REL001' }
        })
        .select('-passwordHash')
        .sort({ createdAt: 1 });

      console.log(`👥 Found dependents: ${dependents.length}`, dependents.map(d => ({ memberId: d.memberId, name: `${d.name.firstName} ${d.name.lastName}`, relationship: d.relationship })));

      familyMembers = [user, ...dependents];
    } else {
      // If this is a dependent (non-REL001), they can only see themselves
      familyMembers = [user];
    }

    console.log(`📋 Returning: { user: '${user.name.firstName} ${user.name.lastName}', dependents: ${dependents.length}, familyMembers: ${familyMembers.length} }`);;

    // Fetch policy assignments for all family members
    const assignments = [];
    for (const member of familyMembers) {
      try {
        const memberAssignments = await this.assignmentsService.getUserAssignments(member._id.toString());
        if (memberAssignments && memberAssignments.length > 0) {
          assignments.push({
            userId: member._id,
            memberId: member.memberId,
            memberName: `${member.name.firstName} ${member.name.lastName}`,
            assignment: memberAssignments[0], // Get the first (most recent) active assignment
          });
        } else {
          assignments.push({
            userId: member._id,
            memberId: member.memberId,
            memberName: `${member.name.firstName} ${member.name.lastName}`,
            assignment: null, // No policy assignment
          });
        }
      } catch (error) {
        console.error(`Error fetching assignments for user ${member._id}:`, error);
        assignments.push({
          userId: member._id,
          memberId: member.memberId,
          memberName: `${member.name.firstName} ${member.name.lastName}`,
          assignment: null,
        });
      }
    }

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
        console.log('🔍 Fetching plan config for policy:', policyId);
        const planConfig = await this.planConfigService.getConfig(policyId.toString());

        console.log('📋 Plan config found:', !!planConfig);
        if (planConfig) {
          console.log('📋 Plan config status:', planConfig.status);
          console.log('📋 Plan config isCurrent:', planConfig.isCurrent);
          console.log('📋 Plan config benefits:', JSON.stringify(planConfig.benefits));

          policyBenefits = planConfig.benefits;

          // Map policy benefits to wallet categories using dynamic category lookup
          if (planConfig.benefits) {
            // Get category codes from benefits (CAT001, CAT002, CAT003)
            const categoryIds = Object.keys(planConfig.benefits);
            console.log('🔍 Category IDs from benefits:', categoryIds);

            // Fetch category names from category_master collection
            const categories = await this.categoryMasterModel.find({
              categoryId: { $in: categoryIds },
              isActive: true
            });
            console.log('📋 Categories found in master:', categories.map(c => ({ id: c.categoryId, name: c.name })));

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
                console.log('✅ Added wallet category:', categoryInfo.name, 'with limit:', benefit.annualLimit);
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
                  console.log('✅ Added health benefit:', categoryInfo.name, 'with amount:', amount);
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching policy benefits:', error);
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

    if ((user.relationship as string) === 'REL001') {
      // Primary member (REL001): get self + dependents
      const dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $ne: 'REL001' }
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