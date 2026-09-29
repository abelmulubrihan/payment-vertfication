export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'ACCOUNTANT';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  restaurant_id?: string;
  restaurant_name?: string;
  branch_id?: string;
  branch_name?: string;
  is_active: boolean;
}

export interface TransactionDraft {
  provider: string;
  provider_display_name: string;
  reference_number?: string;
  transaction_number?: string;
  invoice_number?: string;
  payer_name?: string;
  payer_account_masked?: string;
  receiver_name?: string;
  receiver_account_masked?: string;
  payment_type?: string;
  payment_method?: string;
  payment_channel?: string;
  amount?: number;
  service_charge?: number;
  vat?: number;
  total_debited?: number;
  currency: string;
  payment_date?: string;
  payment_time?: string;
  qr_payload: string;
  verification_url?: string;
  qr_status: string;
  missing_fields_warning?: string;
}

export interface QRDecodeResult {
  success: boolean;
  draft: TransactionDraft;
  is_duplicate: boolean;
  duplicate_info?: {
    existing_transaction_id: string;
    reference_number: string;
    provider: string;
    amount?: number;
    payment_date?: string;
    payment_time?: string;
    scanned_by?: string;
    recorded_at?: string;
  };
  message?: string;
}

export interface Transaction {
  id: string;
  transaction_uuid: string;
  restaurant_id: string;
  restaurant_name?: string;
  branch_id?: string;
  branch_name?: string;
  scanned_by_user_id?: string;
  scanned_by_user_name?: string;
  provider: string;
  provider_display_name: string;
  reference_number?: string;
  transaction_number?: string;
  invoice_number?: string;
  payer_name?: string;
  payer_account_masked?: string;
  receiver_name?: string;
  receiver_account_masked?: string;
  amount?: number;
  currency: string;
  payment_date?: string;
  payment_time?: string;
  qr_payload: string;
  verification_url?: string;
  qr_status: string;
  receipt_status: string;
  is_duplicate: boolean;
  idempotency_key?: string;
  created_at: string;
}
