import {
  StandardizedRDNRecord,
  ReconciliationSummary,
  RDNStagingItem,
  RDNItemStatus,
} from '../../types/rdn-pipeline';
import { Transaction, Account } from '../../types';
import { Decimal } from '../../utils/decimal';

export class ReconciliationService {
  /**
   * 1. Mathematical Balance Reconciliation
   * Formula: opening_balance + total_credit - total_debit == closing_balance
   */
  static reconcileBalances(
    records: StandardizedRDNRecord[],
    openingBalance?: number,
    closingBalance?: number
  ): ReconciliationSummary {
    let creditSum = new Decimal(0);
    let debitSum = new Decimal(0);

    for (const rec of records) {
      const net = new Decimal(rec.net_amount);
      if (rec.category === 'TOPUP' || rec.category === 'SELL' || rec.category === 'DIVIDEND' || rec.category === 'INTEREST') {
        creditSum = creditSum.plus(net);
      } else {
        // WITHDRAWAL, BUY, ADMIN_TAX
        debitSum = debitSum.plus(net);
      }
    }

    const openDec = new Decimal(openingBalance || 0);
    const calculatedClosing = openDec.plus(creditSum).minus(debitSum);

    // If closing balance was explicitly specified on the document
    if (closingBalance !== undefined && closingBalance !== null) {
      const statementCloseDec = new Decimal(closingBalance);
      const diff = calculatedClosing.minus(statementCloseDec);
      const discrepancy = diff.abs().toNumber();
      const isBalanced = diff.isZero() || discrepancy < 1.0; // Within 1 IDR tolerance for rounding

      return {
        opening_balance: openDec.toNumber(),
        total_credit: creditSum.toNumber(),
        total_debit: debitSum.toNumber(),
        calculated_closing: calculatedClosing.toNumber(),
        statement_closing: statementCloseDec.toNumber(),
        discrepancy_amount: isBalanced ? 0 : discrepancy,
        is_balanced: isBalanced,
        status: isBalanced ? 'VERIFIED' : 'NEEDS_REVIEW',
      };
    }

    // If no closing balance is stated on document (e.g. single trade confirmation)
    return {
      opening_balance: openDec.toNumber(),
      total_credit: creditSum.toNumber(),
      total_debit: debitSum.toNumber(),
      calculated_closing: calculatedClosing.toNumber(),
      statement_closing: calculatedClosing.toNumber(),
      discrepancy_amount: 0,
      is_balanced: true,
      status: 'VERIFIED',
    };
  }

  /**
   * 2. Idempotency Check & 3. Internal Transfer Matching
   * Evaluates each record against existing ledger and user accounts
   */
  static evaluateRecords(params: {
    records: StandardizedRDNRecord[];
    batchId: string;
    existingTransactions: Transaction[];
    existingHashes: Set<string>;
    userAccounts: Account[];
  }): {
    items: RDNStagingItem[];
    duplicateCount: number;
    internalTransferCount: number;
    newItemsCount: number;
  } {
    const { records, batchId, existingTransactions, existingHashes, userAccounts } = params;
    const items: RDNStagingItem[] = [];
    let duplicateCount = 0;
    let internalTransferCount = 0;
    let newItemsCount = 0;

    for (const rec of records) {
      // 1. Check Idempotency / Duplicate
      if (existingHashes.has(rec.transaction_hash)) {
        duplicateCount++;
        items.push({
          id: `item-${Date.now()}-${rec.id}`,
          batch_id: batchId,
          record: rec,
          status: 'DUPLICATE_SKIPPED',
          validation_error: 'Transaksi sudah pernah dicatat di buku besar (SHA-256 hash cocok).',
        });
        continue;
      }

      // 2. Check Cross-Account Internal Transfer Matching
      // For TOPUP or WITHDRAWAL, check if user has a corresponding Bank/E-Wallet transaction
      // within tolerance H-1 to H+1 and identical amount
      let matchedTx: Transaction | undefined;
      let matchedAccount: Account | undefined;

      if (rec.category === 'TOPUP' || rec.category === 'WITHDRAWAL') {
        const targetAmount = Math.round(rec.net_amount);
        const recDate = new Date(rec.transaction_date).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        matchedTx = existingTransactions.find((tx) => {
          // If RDN has TOPUP (incoming money), look for Bank/E-Wallet with EXPENSE/TRANSFER of same amount
          // If RDN has WITHDRAWAL (outgoing money), look for Bank/E-Wallet with INCOME/TRANSFER of same amount
          const isMatchingType =
            rec.category === 'TOPUP'
              ? tx.type === 'EXPENSE' || tx.type === 'TRANSFER'
              : tx.type === 'INCOME' || tx.type === 'TRANSFER';

          if (!isMatchingType) return false;
          if (Math.round(tx.amount) !== targetAmount) return false;

          // Date tolerance: within H-1 to H+1
          const txDate = new Date(tx.transactionDate).getTime();
          const diffDays = Math.abs(recDate - txDate);
          return diffDays <= oneDayMs * 1.5;
        });

        if (matchedTx) {
          matchedAccount = userAccounts.find((a) => a.id === matchedTx?.accountId);
        }
      }

      if (matchedTx && matchedAccount) {
        internalTransferCount++;
        items.push({
          id: `item-${Date.now()}-${rec.id}`,
          batch_id: batchId,
          record: rec,
          status: 'INTERNAL_TRANSFER',
          matched_transfer_account_name: matchedAccount.name,
          matched_transfer_tx_id: matchedTx.id,
        });
      } else {
        newItemsCount++;
        items.push({
          id: `item-${Date.now()}-${rec.id}`,
          batch_id: batchId,
          record: rec,
          status: 'READY',
        });
      }
    }

    return {
      items,
      duplicateCount,
      internalTransferCount,
      newItemsCount,
    };
  }
}
