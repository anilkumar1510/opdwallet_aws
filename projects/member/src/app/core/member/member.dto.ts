/**
 * Transport shapes exactly as the API returns them. Nothing outside a mapper
 * may import from this file.
 *
 * Sources: api/src/modules/auth/auth.controller.ts (login, me) and
 * api/src/modules/member/member.service.ts (getProfile, getFamilyMembers).
 */

export interface NameDto {
  firstName?: string;
  lastName?: string;
}

export interface UserDto {
  _id?: string;
  /** Login returns the same value under `id`; every other endpoint uses `_id`. */
  id?: string;
  memberId?: string;
  /** Sometimes an object, sometimes a flat string, depending on the endpoint. */
  name?: NameDto | string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  /** Coded: REL001..REL010, or a legacy spelled value such as SELF. */
  relationship?: string;
  uhid?: string;
  dob?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  corporateName?: string;
}

/**
 * POST /auth/login returns the user's fields at the top level for backward
 * compatibility AND a nested `user`. Newer clients should read `user`.
 */
export interface LoginResponseDto extends UserDto {
  user?: UserDto;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface PolicyDto {
  _id?: string;
  policyNumber?: string;
  name?: string;
  companyName?: string;
  company?: string;
  status?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface AssignmentInnerDto {
  _id?: string;
  assignmentId?: string;
  policyId?: PolicyDto;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

/** One entry per family member, whether or not they hold a policy. */
export interface AssignmentDto {
  userId?: string;
  memberId?: string;
  memberName?: string;
  assignment?: AssignmentInnerDto | null;
}

/** GET /member/profile */
export interface MemberProfileDto {
  user: UserDto;
  dependents?: UserDto[];
  familyMembers?: UserDto[];
  assignments?: AssignmentDto[];
  wallet?: unknown;
  walletCategories?: unknown[];
  healthBenefits?: unknown[];
  policyBenefits?: unknown;
}
