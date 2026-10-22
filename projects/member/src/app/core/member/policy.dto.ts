/**
 * DTOs for habit-opd policy and assignment endpoints:
 * 1. /habit-opd/api/v1/opd_policy_member_assignment
 * 2. /habit-opd/api/v1/opd_policy_version
 */

export interface OpdApiResponse<T> {
  errCode: number;
  message: string;
  count: number;
  resource: T[];
}

export interface OpdPolicyMemberAssignmentDto {
  id: string;
  g_created_by_id?: string;
  g_created_by_name?: string;
  g_created_by_loginId?: string;
  account_time_zone?: string;
  g_creation_time?: number;
  g_modify_time?: number;
  g_created_by_role?: string;
  cug_code?: string;
  account_id?: string;
  policy_id: string;
  policy_version_id: string;
  patient_id: string;
  uhid?: string;
  user_id?: string;
  employee_id?: string;
  relationship_code?: string;
  effective_from: number;
  effective_to: number;
  active: boolean;
  wallet_id?: string;
  assignment_source?: string;
  operation_id?: string;
}

export interface PolicyWalletConfigurationDto {
  annual_limit?: number;
  partial_payment_enabled?: boolean;
  carry_forward_enabled?: boolean;
  topup_allowed?: boolean;
  copay_type?: string;
  copay_value?: number;
  per_claim_limit?: number;
}

export interface PolicyCategoryDto {
  category_code: string;
  category_name: string;
  cashless?: boolean;
  claims?: boolean;
  vas_enabled?: boolean;
  capping_type?: string;
  pool_code?: string;
  pool_name?: string;
  per_transaction_limit?: number;
  per_claim_limit?: number;
  pharmacy_benefit_type?: string;
  co_payment_mode?: string;
  co_payment_value?: number;
  doctor_fee_ceiling?: boolean;
  doctor_fee_ceiling_amount?: number;
  notes?: string;
}

export interface PolicyAdditionalClaimCategoryDto {
  claim_category_name: string;
  claim_per_claim_limit?: number;
  claim_pool_code?: string;
}

export interface PolicyBenefitPoolDto {
  code: string;
  pool_name: string;
  policy_id: string;
  annual_limit: number;
}

export interface PolicyRelationshipDto {
  relationship_code: string;
  relationship_name: string;
  is_primary: boolean;
  covered?: boolean;
  benefit_set: string;
  wallet_configuration?: PolicyWalletConfigurationDto;
  categories?: PolicyCategoryDto[];
  additional_claim_categories_enabled?: boolean;
  additional_claim_categories?: PolicyAdditionalClaimCategoryDto[];
}

export interface PolicyClauseDto {
  headline: string;
  description: string;
}

export interface OpdPolicyVersionDto {
  id: string;
  g_created_by_id?: string;
  g_created_by_name?: string;
  g_created_by_loginId?: string;
  account_time_zone?: string;
  g_creation_time?: number;
  g_modify_time?: number;
  g_created_by_role?: string;
  cug_code?: string;
  account_id?: string;
  policy_id: string;
  policy_number: string;
  policy_name: string;
  owner_type?: string;
  version_no?: number;
  status: string;
  is_current: boolean;
  effective_from: number;
  effective_to: number;
  description?: string;
  allocation_type?: string;
  relationships: PolicyRelationshipDto[];
  inclusions: PolicyClauseDto[];
  exclusions: PolicyClauseDto[];
  claim_expiry: number;
  claim_type?: string;
  tag_data?: unknown[];
}

export interface OpdConsumptionCycleDto {
  id: string;
  g_created_by_id?: string;
  g_created_by_name?: string;
  g_created_by_loginId?: string;
  account_time_zone?: string;
  g_creation_time?: number;
  g_modify_time?: number;
  g_created_by_role?: string;
  cug_code?: string;
  account_id?: string;
  consumption_id?: string;
  reference_id?: string;
  cycle_no?: number;
  patient_id?: string;
  policy_version_id?: string;
  benefit_year?: string;
  category_code?: string;
  route?: string;
  event?: string;
  to_status?: string;
  bill_amount?: number;
  copay_amount?: number;
  covered_amount?: number;
  excess_above_cap?: number;
  delta_amount?: number;
  delta_visits?: number;
  previous_consumed?: number;
  updated_consumed?: number;
  previous_visits?: number;
  updated_visits?: number;
  wallet_block_id?: string;
  wallet_txn_id?: string;
  channel?: string;
  actor_user_id?: string;
  occurred_at?: number;
}
