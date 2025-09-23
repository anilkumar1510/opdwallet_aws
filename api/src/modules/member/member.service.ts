import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RelationshipType } from '@/common/constants/status.enum';
import { AssignmentsService } from '../assignments/assignments.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private assignmentsService: AssignmentsService,
  ) {}

  async getProfile(userId: string) {
    // userId here is actually the MongoDB _id from JWT payload
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let dependents: any[] = [];
    let familyMembers: any[] = [];

    if (user.relationship === RelationshipType.SELF) {
      // If this is a primary member, fetch their dependents
      dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $ne: RelationshipType.SELF }
        })
        .select('-passwordHash')
        .sort({ createdAt: 1 });

      familyMembers = [user, ...dependents];
    } else {
      // If this is a dependent, fetch the primary member and all other dependents
      const primaryMember = await this.userModel
        .findOne({
          memberId: user.primaryMemberId,
          relationship: RelationshipType.SELF
        })
        .select('-passwordHash');

      if (primaryMember) {
        const allDependents = await this.userModel
          .find({
            primaryMemberId: user.primaryMemberId,
            relationship: { $ne: RelationshipType.SELF }
          })
          .select('-passwordHash')
          .sort({ createdAt: 1 });

        familyMembers = [primaryMember, ...allDependents];
      } else {
        familyMembers = [user];
      }
    }

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

    return {
      user,
      dependents,
      familyMembers,
      assignments,
    };
  }

  async getFamilyMembers(userId: string) {
    // userId here is actually the MongoDB _id from JWT payload
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let familyMembers: any[] = [];

    if (user.relationship === RelationshipType.SELF) {
      // Primary member: get self + dependents
      const dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $ne: RelationshipType.SELF }
        })
        .select('-passwordHash')
        .sort({ createdAt: 1 });

      familyMembers = [user, ...dependents];
    } else {
      // Dependent: get primary member + all other dependents
      const primaryMember = await this.userModel
        .findOne({
          memberId: user.primaryMemberId,
          relationship: RelationshipType.SELF
        })
        .select('-passwordHash');

      if (primaryMember) {
        const allDependents = await this.userModel
          .find({
            primaryMemberId: user.primaryMemberId,
            relationship: { $ne: RelationshipType.SELF }
          })
          .select('-passwordHash')
          .sort({ createdAt: 1 });

        familyMembers = [primaryMember, ...allDependents];
      } else {
        familyMembers = [user];
      }
    }

    return familyMembers;
  }
}