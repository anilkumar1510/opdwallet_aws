import { ForbiddenException } from '@nestjs/common';
import { Model } from 'mongoose';

/**
 * FamilyAccessHelper - Centralized family access verification
 *
 * This helper ensures that users can only access data for themselves and their dependents.
 * It prevents unauthorized cross-family data access.
 */
export class FamilyAccessHelper {
  /**
   * Verifies that the requesting user has access to view the target user's data
   *
   * Access Rules:
   * - Users can always access their own data
   * - Primary members can access their dependents' data
   * - Dependents cannot access other users' data (including primary member)
   * - No cross-family access allowed
   *
   * @param userModel - Mongoose User model for database queries
   * @param requestingUserId - ID of the user making the request (from JWT token)
   * @param targetUserId - ID of the user whose data is being accessed
   * @throws ForbiddenException if access is not allowed
   */
  static async verifyFamilyAccess(
    userModel: Model<any>,
    requestingUserId: string,
    targetUserId: string,
  ): Promise<void> {
    // If viewing own data, allow immediately
    if (requestingUserId === targetUserId) {
      return;
    }

    // Fetch both users to verify relationship
    const [requestingUser, targetUser] = await Promise.all([
      userModel.findById(requestingUserId).lean().exec(),
      userModel.findById(targetUserId).lean().exec(),
    ]);

    if (!requestingUser || !targetUser) {
      throw new ForbiddenException('User not found');
    }

    // Check if requesting user is the primary member of the target user
    // Note: primaryMemberId stores the memberId (e.g., "MEM1767959763793"), not the MongoDB ObjectId
    const targetUserPrimaryMemberId = (targetUser as any).primaryMemberId;
    const requestingUserMemberId = (requestingUser as any).memberId;

    // Allow access if the requesting user's memberId matches the target user's primaryMemberId
    const isPrimaryViewingDependent = targetUserPrimaryMemberId === requestingUserMemberId;

    if (!isPrimaryViewingDependent) {
      throw new ForbiddenException(
        'You can only view data for yourself and your dependents',
      );
    }
  }
}
