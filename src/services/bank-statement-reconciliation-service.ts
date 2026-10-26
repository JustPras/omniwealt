import {
  Account,
  BankStatementMutation,
  BankStatementParseResult,
  BankStatementCommitResult,
  Transaction,
} from '../types';

export class BankStatementReconciliationServiceImpl {
  /**
   * Reconcile statement mutations with existing transactions in the ledger
   * Identifies duplicates (from Pillar 1 real-time notifications or manual inputs)
   */
  reconcileWithLedger(
    mutations: BankStatementMutation[],
    targetAccount: Account,
    existingTransactions: Transaction[]
  ): {
    reconciledMutations: BankStatementMutation[];
    newCount: number;
    duplicateCount: number;
  } {
    let newCount = 0;
    let duplicateCount = 0;

    const accountTxs = existingTransactions.filter((tx) => tx.accountId === targetAccount.id);

    const reconciledMutations = mutations.map((mutation) => {
      const mutDate = new Date(mutation.date).getTime();

      // Check if an existing ledger transaction matches
      const isDuplicate = accountTxs.some((tx) => {
        // 1. Amount match
        const isSameAmount = Math.abs(tx.amount - mutation.amount) === 0;
        if (!isSameAmount) return false;

        // 2. Type compatibility
        const isTypeMatch =
          tx.type === mutation.type ||
          (tx.type === 'TRANSFER' && mutation.isInternalTransfer) ||
          (tx.type === 'EXPENSE' && mutation.type === 'TRANSFER');
        if (!isTypeMatch) return false;

        // 3. Date proximity within +/- 2 days (due to bank posting delays on weekends/holidays)
        const txDate = new Date(tx.transactionDate).getTime();
        const daysDiff = Math.abs(mutDate - txDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 2.5) return false;

        // 4. Description similarity
        const descA = tx.description.toLowerCase();
        const descB = mutation.description.toLowerCase();
        const isDescSimilar =
          descA.includes(descB) ||
          descB.includes(descA) ||
          (descA.includes('qris') && descB.includes('qris')) ||
          (descA.includes('bi-fast') && descB.includes('bi-fast'));

        return isDescSimilar || daysDiff <= 1.0;
      });

      if (isDuplicate) {
        duplicateCount++;
        return {
          ...mutation,
          status: 'DUPLICATE_SKIPPED' as const,
        };
      } else {
        newCount++;
        return {
          ...mutation,
          status: 'NEW' as const,
        };
      }
    });

    return {
      reconciledMutations,
      newCount,
      duplicateCount,
    };
  }

  /**
   * Produce commit payload: creates new Transaction objects for unrecorded rows
   */
  prepareCommitPayload(
    mutations: BankStatementMutation[],
    targetAccount: Account
  ): {
    newTransactions: Transaction[];
    newBalance: number;
  } {
    const newItems = mutations.filter((m) => m.status === 'NEW');

    const newTransactions: Transaction[] = newItems.map((m, idx) => ({
      id: `tx-stmt-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      accountId: targetAccount.id,
      accountName: targetAccount.name,
      type: m.type,
      amount: m.amount,
      category: m.category,
      description: m.description,
      rawNotificationText: `e-Statement: ${m.rawDate} ${m.description} Rp ${m.amount.toLocaleString('id-ID')}`,
      source: 'AI_MUTATION',
      transactionDate: `${m.date}T12:00:00.000Z`,
      isInternalTransfer: m.isInternalTransfer,
    }));

    return {
      newTransactions,
      newBalance: targetAccount.balance, // Will be updated to statement closing balance
    };
  }
}

export const BankStatementReconciliationService = new BankStatementReconciliationServiceImpl();
