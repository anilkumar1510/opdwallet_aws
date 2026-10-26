/**
 * DTO matching the live /wallet/api/v1/wallet_passbook endpoint response.
 */
export interface WalletPassbookItemDto {
  id: string;
  g_created_by_id?: string;
  g_created_by_name?: string;
  g_created_by_loginId?: string;
  account_time_zone?: string;
  g_creation_time?: number;
  g_modify_time?: number;
  g_created_by_role?: string;
  g_created_by_role_type?: string | null;
  cug_code?: string;
  account_id?: string;
  cug_name?: string;
  cug_id?: string;
  user_id?: string;
  user_name?: string;
  wallet_id?: string;
  txn_type?: 'DEBIT' | 'RECHARGE' | string;
  txn_amount?: number;
  credit_debit?: 'D' | 'C' | string;
  user_code?: string;
  previous_bal?: number;
  updated_bal?: number;
  phone_number?: string;
}

export interface WalletPassbookDto {
  errCode: number;
  message: string;
  count: number;
  resource: WalletPassbookItemDto[];
}
