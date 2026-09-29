export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'ACCOUNTANT';

export type QRStatus = 'QR_DECODED' | 'DATA_EXTRACTED' | 'VERIFICATION_PAGE_AVAILABLE' | 'INVALID_QR';
export type ReceiptStatus = 'RECEIPT_RECORDED' | 'DUPLICATE' | 'NEEDS_REVIEW';

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

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  created_at: string;
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
  qr_status: QRStatus;
  receipt_status: ReceiptStatus;
  is_duplicate: boolean;
  duplicate_of_id?: string;
  idempotency_key?: string;
  notes?: string;
  receipt_image_path?: string;
  created_at: string;
  updated_at: string;
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

export interface ProviderReportSummary {
  provider: string;
  provider_display_name: string;
  transaction_count: number;
  total_amount: number;
  percentage_amount: number;
  percentage_count: number;
}

export interface WaiterReportSummary {
  user_id?: string;
  waiter_name: string;
  transaction_count: number;
  total_amount: number;
}

export interface TimeSeriesPoint {
  label: string;
  date_key?: string;
  transaction_count: number;
  total_amount: number;
}

export interface ReportData {
  period_type: string;
  date_from?: string;
  date_to?: string;
  restaurant_name?: string;
  branch_name?: string;
  total_transactions: number;
  total_amount: number;
  average_amount: number;
  providers_breakdown: ProviderReportSummary[];
  waiters_breakdown: WaiterReportSummary[];
  timeline_breakdown: TimeSeriesPoint[];
}

export interface DashboardMetrics {
  today_total: number;
  today_count: number;
  this_week_total: number;
  this_week_count: number;
  this_month_total: number;
  this_month_count: number;
  this_year_total: number;
  this_year_count: number;
  provider_summary_today: ProviderReportSummary[];
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  restaurant_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  details?: string;
  ip_address?: string;
  timestamp: string;
}
