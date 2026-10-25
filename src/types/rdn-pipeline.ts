/**
 * Type definitions for RDN Asynchronous Ingestion & Ledger Pipeline
 */

export type RDNInstitution =
  | 'STOCKBIT'
  | 'BCA'
  | 'JAGO'
  | 'MANDIRI'
  | 'PERMATA'
  | 'AJAIB'
  | 'IPOT'
  | 'MIRAE'
  | 'UNKNOWN';

export type RDNStatementType =
  | 'BANK_RDN_MUTATION'          // Settlement T+2 cash balance mutation
  | 'BROKER_TRADE_CONFIRMATION';  // Execution T+0 trade slips & fee breakdown

export type RDNCategory =
  | 'TOPUP'
  | 'WITHDRAWAL'
  | 'BUY'
  | 'SELL'
  | 'DIVIDEND'
  | 'COUPON'
  | 'INTEREST'
  | 'ADMIN_TAX';

export type RDNBatchStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'NEEDS_REVIEW'
  | 'COMMITTED'
  | 'FAILED';

export type RDNItemStatus =
  | 'READY'
  | 'DUPLICATE_SKIPPED'
  | 'INTERNAL_TRANSFER'
  | 'REVIEW_REQUIRED'
  | 'COMMITTED';

export interface StandardizedRDNRecord {
  id: string;
  transaction_date: string; // ISO date YYYY-MM-DD
  settlement_date?: string; // Optional ISO date YYYY-MM-DD (e.g. T+2)
  category: RDNCategory;
  ticker: string | null;   // e.g. "BBRI.JK", null if pure cash mutation
  lot: number | null;      // 1 lot = 100 shares
  execution_price: number | null;
  gross_amount: number;
  broker_fee: number;
  tax_amount: number;
  net_amount: number;
  running_balance: number | null;
  raw_description: string;
  transaction_hash: string;
}

export interface IngestionPayload {
  source: 'MANUAL_UPLOAD' | 'EMAIL_WEBHOOK';
  account_id: string;
  file_name: string;
  content_base64?: string;
  content_text?: string;
  pdf_password?: string;
  sender_email?: string;
  received_at?: string;
}

export interface RDNStagingItem {
  id: string;
  batch_id: string;
  record: StandardizedRDNRecord;
  status: RDNItemStatus;
  matched_transfer_account_name?: string;
  matched_transfer_tx_id?: string;
  validation_error?: string;
}

export interface ReconciliationSummary {
  opening_balance: number;
  total_credit: number;
  total_debit: number;
  calculated_closing: number;
  statement_closing: number;
  discrepancy_amount: number;
  is_balanced: boolean; // Math: opening + credit - debit == statement_closing
  status: 'VERIFIED' | 'NEEDS_REVIEW';
}

export interface RDNStagingBatch {
  id: string;
  account_id: string;
  institution: string;
  statement_type: RDNStatementType;
  file_name: string;
  file_checksum: string;
  source: 'MANUAL_UPLOAD' | 'EMAIL_WEBHOOK';
  status: RDNBatchStatus;
  reconciliation: ReconciliationSummary;
  total_items: number;
  new_items_count: number;
  duplicate_skipped_count: number;
  internal_transfers_count: number;
  items: RDNStagingItem[];
  created_at: string;
  error_message?: string;
}

export interface RDNImportLog {
  id: string;
  batch_id: string;
  account_id: string;
  file_checksum: string;
  source: string;
  institution: string;
  total_records: number;
  success_count: number;
  skipped_count: number;
  committed_at: string;
  discrepancy_amount: number;
}
