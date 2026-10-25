import {
  IngestionPayload,
  RDNStagingBatch,
  RDNBatchStatus,
} from '../../types/rdn-pipeline';
import { Account, StockAsset, Transaction } from '../../types';
import { computeFileChecksum } from '../../utils/crypto';
import { SmartRouterService } from './smart-router';
import { ReconciliationService } from './reconciliation-service';
import { RDNStagingService } from './staging-service';
import { LedgerCommitService } from './ledger-commit-service';

export interface IngestionJob {
  id: string;
  payload: IngestionPayload;
  status: RDNBatchStatus;
  progressMessage: string;
  batchId?: string;
  error?: string;
}

export class IngestionService {
  private static readonly ALLOWED_EMAIL_DOMAINS = [
    'stockbit.com',
    'indopremier.com',
    'ipot.id',
    'ajaib.co.id',
    'mandirisekuritas.co.id',
    'bca.co.id',
    'jago.com',
    'permata.co.id',
    'miraeasset.co.id',
  ];

  /**
   * Validate inbound email sender domain for security
   */
  static validateEmailSenderDomain(senderEmail?: string): boolean {
    if (!senderEmail) return false;
    const parts = senderEmail.toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return IngestionService.ALLOWED_EMAIL_DOMAINS.some(
      (d) => domain === d || domain.endsWith(`.${d}`)
    );
  }

  /**
   * Enqueue and process ingestion payload asynchronously in-memory
   */
  static async processIngestion(params: {
    payload: IngestionPayload;
    userAccounts: Account[];
    stocks: StockAsset[];
    transactions: Transaction[];
    onBatchReady?: (batch: RDNStagingBatch) => void;
    onStateUpdate?: (updated: {
      accounts: Account[];
      stocks: StockAsset[];
      transactions: Transaction[];
    }) => void;
  }): Promise<RDNStagingBatch> {
    const { payload, userAccounts, stocks, transactions, onBatchReady, onStateUpdate } = params;

    // Buffer reference for guaranteed memory wiping in finally block
    let inMemoryBuffer: string | null = payload.content_text || payload.content_base64 || '';

    try {
      // 1. Inbound Email Webhook Validation
      if (payload.source === 'EMAIL_WEBHOOK') {
        const isValidDomain = IngestionService.validateEmailSenderDomain(payload.sender_email);
        if (!isValidDomain) {
          throw new Error(
            `Pengirim email (${payload.sender_email || 'unknown'}) bukan domain sekuritas atau bank RDN resmi yang terverifikasi.`
          );
        }
      }

      // 2. Compute SHA-256 Checksum from In-Memory Buffer
      const fileChecksum = computeFileChecksum(inMemoryBuffer);
      const batchId = `batch-${Date.now()}-${fileChecksum.slice(0, 8)}`;

      // 3. Smart Routing & Hybrid Parsing (Stage 2 & 3)
      const parsedData = await SmartRouterService.routeAndParse(
        inMemoryBuffer,
        payload.account_id
      );

      // 4. Mathematical Reconciliation & Guardrails (Stage 4)
      const reconciliation = ReconciliationService.reconcileBalances(
        parsedData.records,
        parsedData.openingBalance,
        parsedData.closingBalance
      );

      // Collect existing transaction hashes for deduplication
      const existingHashes = new Set<string>();
      transactions.forEach((tx) => {
        if (tx.transactionHash) {
          existingHashes.add(tx.transactionHash);
        }
      });

      const evaluated = ReconciliationService.evaluateRecords({
        records: parsedData.records,
        batchId,
        existingTransactions: transactions,
        existingHashes,
        userAccounts,
      });

      const batchStatus: RDNBatchStatus = reconciliation.status === 'VERIFIED' ? 'VERIFIED' : 'NEEDS_REVIEW';

      const stagingBatch: RDNStagingBatch = {
        id: batchId,
        account_id: payload.account_id,
        institution: parsedData.institution,
        statement_type: parsedData.statementType,
        file_name: payload.file_name,
        file_checksum: fileChecksum,
        source: payload.source,
        status: batchStatus,
        reconciliation,
        total_items: parsedData.records.length,
        new_items_count: evaluated.newItemsCount,
        duplicate_skipped_count: evaluated.duplicateCount,
        internal_transfers_count: evaluated.internalTransferCount,
        items: evaluated.items,
        created_at: new Date().toISOString(),
      };

      // 5. Store in Staging Area (Stage 5)
      await RDNStagingService.saveBatch(stagingBatch);

      if (onBatchReady) {
        onBatchReady(stagingBatch);
      }

      // Check auto_commit_verified_email flag
      const targetAccount = userAccounts.find((a) => a.id === payload.account_id);
      if (
        payload.source === 'EMAIL_WEBHOOK' &&
        targetAccount?.autoCommitVerifiedEmail &&
        stagingBatch.status === 'VERIFIED'
      ) {
        // Automatically proceed to Stage 6 (Atomic Commit)
        await LedgerCommitService.commitBatch(
          stagingBatch,
          userAccounts,
          stocks,
          transactions,
          onStateUpdate
        );
        stagingBatch.status = 'COMMITTED';
      }

      return stagingBatch;
    } finally {
      // Memory Hygiene: Nullify RAM buffer references completely
      inMemoryBuffer = null;
    }
  }
}
