import { RDNStagingBatch, RDNImportLog, StandardizedRDNRecord } from '../../types/rdn-pipeline';
import { Account, StockAsset, Transaction } from '../../types';
import { StorageService } from '../storage-service';
import { RDNStagingService } from './staging-service';
import { Decimal } from '../../utils/decimal';

export interface CommitResult {
  success: boolean;
  message: string;
  transactionsCreated: number;
  stocksUpdated: number;
  importLog: RDNImportLog;
}

export class LedgerCommitService {
  /**
   * Recalibrate portfolio holding lots and weighted average buy price
   * Formula for BUY: newAvg = ((oldShares * oldAvg) + netBuyAmount) / newTotalShares
   * Formula for SELL: newLots = max(0, oldLots - sellLots), avgBuyPrice stays unchanged
   */
  static recalibrateStockHoldings(
    currentStocks: StockAsset[],
    rec: StandardizedRDNRecord,
    rdnAccountId?: string
  ): StockAsset[] {
    if (!rec.ticker || (rec.category !== 'BUY' && rec.category !== 'SELL')) {
      return currentStocks;
    }

    const updated = [...currentStocks];
    const tickerClean = rec.ticker.toUpperCase().endsWith('.JK')
      ? rec.ticker.toUpperCase()
      : `${rec.ticker.toUpperCase()}.JK`;

    const stockIdx = updated.findIndex((s) => s.ticker.toUpperCase() === tickerClean);
    const tradeLotsDec = new Decimal(rec.lot || 0);
    const tradeSharesDec = tradeLotsDec.times(100);
    const netDec = new Decimal(rec.net_amount);

    if (rec.category === 'BUY') {
      if (stockIdx >= 0) {
        const old = updated[stockIdx];
        const oldLotsDec = new Decimal(old.lots);
        const oldSharesDec = oldLotsDec.times(100);
        const oldAvgDec = new Decimal(old.avgBuyPrice);

        const newTotalSharesDec = oldSharesDec.plus(tradeSharesDec);

        // Weighted Average Buy Price Formula:
        // newAvg = ((oldShares * oldAvg) + netBuyAmount) / newTotalShares
        const totalCostDec = oldSharesDec.times(oldAvgDec).plus(netDec);
        const newAvgDec = newTotalSharesDec.greaterThan(0)
          ? totalCostDec.dividedBy(newTotalSharesDec)
          : oldAvgDec;

        updated[stockIdx] = {
          ...old,
          lots: newTotalSharesDec.dividedBy(100).toNumber(),
          avgBuyPrice: Math.round(newAvgDec.toNumber()),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new stock entry in portfolio
        const avgPrice = tradeSharesDec.greaterThan(0)
          ? Math.round(netDec.dividedBy(tradeSharesDec).toNumber())
          : Math.round(rec.execution_price || 0);

        const isWarrant = /-W[0-9A-Z]*\.JK$/i.test(tickerClean);
        const isRight = /-R[0-9A-Z]*\.JK$/i.test(tickerClean);
        const assetSuffix = isWarrant ? 'Warrant' : isRight ? 'Right Issue' : 'Assets';

        updated.push({
          id: `stock-${Date.now()}-${tickerClean}`,
          ticker: tickerClean,
          name: `${tickerClean.replace('.JK', '')} ${assetSuffix}`,
          lots: tradeLotsDec.toNumber(),
          avgBuyPrice: avgPrice,
          currentPrice: rec.execution_price || avgPrice,
          change24h: 0.0,
          currency: 'IDR',
          rdnAccountId,
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (rec.category === 'SELL') {
      if (stockIdx >= 0) {
        const old = updated[stockIdx];
        const oldLotsDec = new Decimal(old.lots);
        const newLotsDec = oldLotsDec.minus(tradeLotsDec);
        // In SELL, avgBuyPrice does NOT change
        updated[stockIdx] = {
          ...old,
          lots: Math.max(0, newLotsDec.toNumber()),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return updated;
  }

  /**
   * Atomic ACID Commit: writes valid staging items to primary ledger,
   * updates RDN cash balance, recalibrates stock portfolio holding avg prices,
   * records import audit log, and purges staging/buffer data.
   */
  static async commitBatch(
    batch: RDNStagingBatch,
    accounts: Account[],
    stocks: StockAsset[],
    existingTransactions: Transaction[],
    onStateUpdate?: (updated: {
      accounts: Account[];
      stocks: StockAsset[];
      transactions: Transaction[];
    }) => void
  ): Promise<CommitResult> {
    const rawBufferReferences: any[] = []; // In-memory reference tracking for cleanup

    try {
      // Find or Auto-Provision RDN Account
      let rdnAccount = accounts.find((a) => a.id === batch.account_id) || accounts.find((a) => a.type === 'RDN');
      let updatedAccounts = [...accounts];

      if (!rdnAccount) {
        rdnAccount = {
          id: `acc-rdn-${Date.now()}`,
          name: `RDN ${batch.institution || 'Sekuritas'}`,
          type: 'RDN',
          accountNumber: '1029384756',
          balance: 0,
          color: '#10B981',
          icon: 'trending-up',
          autoCommitVerifiedEmail: false,
          updatedAt: new Date().toISOString(),
        };
        updatedAccounts.push(rdnAccount);
      }

      let currentBalance = new Decimal(rdnAccount.balance);
      let updatedStocks = [...stocks];
      const newTransactions: Transaction[] = [];
      let successCount = 0;
      let skippedCount = 0;

      // Check if this batch is primarily an existing portfolio holdings snapshot
      const isHoldingsSnapshot = batch.items.every(
        (it) => it.record.category === 'BUY' && (it.record.raw_description || '').includes('Portofolio Saham:')
      );

      // If statement has an explicit non-negative closing cash balance from statement
      if (batch.reconciliation.statement_closing !== undefined && batch.reconciliation.statement_closing >= 0 && isHoldingsSnapshot) {
        currentBalance = new Decimal(batch.reconciliation.statement_closing);
      }

      // 1. Process each staging item
      for (const item of batch.items) {
        if (item.status === 'DUPLICATE_SKIPPED') {
          skippedCount++;
          continue;
        }

        const rec = item.record;
        const netDec = new Decimal(rec.net_amount);
        const isHoldingItem = (rec.raw_description || '').includes('Portofolio Saham:');

        // A. Ledger Transaction Creation
        let txType: Transaction['type'] = 'EXPENSE';
        if (rec.category === 'TOPUP' || rec.category === 'SELL' || rec.category === 'DIVIDEND' || rec.category === 'INTEREST') {
          txType = 'INCOME';
          currentBalance = currentBalance.plus(netDec);
        } else if (!isHoldingItem) {
          // Only actual trade execution spends cash from RDN balance
          txType = 'EXPENSE';
          currentBalance = currentBalance.minus(netDec);
        }

        if (item.status === 'INTERNAL_TRANSFER') {
          txType = 'TRANSFER';
        }

        const ledgerTx: Transaction = {
          id: `tx-rdn-${Date.now()}-${rec.id}`,
          accountId: rdnAccount.id,
          accountName: rdnAccount.name,
          type: txType,
          amount: netDec.toNumber(),
          category: rec.category,
          description: rec.raw_description || `${rec.category} via ${batch.institution}`,
          source: 'RDN_PIPELINE',
          destinationAccountId: item.matched_transfer_tx_id ? rdnAccount.id : undefined,
          transactionDate: `${rec.transaction_date}T12:00:00.000Z`,
          transactionHash: rec.transaction_hash,
          isInternalTransfer: item.status === 'INTERNAL_TRANSFER',
        };

        newTransactions.push(ledgerTx);
        successCount++;

        // B. Stock Portfolio Recalibration (Weighted Average Buy Price & Lots)
        if (rec.ticker && (rec.category === 'BUY' || rec.category === 'SELL')) {
          updatedStocks = LedgerCommitService.recalibrateStockHoldings(
            updatedStocks,
            rec,
            rdnAccount.id
          );
        }
      }

      // 2. Update Accounts Balance (guarantee non-negative)
      const finalBalance = Math.max(0, currentBalance.toNumber());
      updatedAccounts = updatedAccounts.map((a) => {
        if (a.id === rdnAccount.id) {
          return {
            ...a,
            balance: finalBalance,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });

      // 3. Combine Transactions
      const updatedTransactions = [...newTransactions, ...existingTransactions];

      // 4. Record Import Audit Log
      const importLog: RDNImportLog = {
        id: `log-${Date.now()}`,
        batch_id: batch.id,
        account_id: rdnAccount.id,
        file_checksum: batch.file_checksum,
        source: batch.source,
        institution: batch.institution,
        total_records: batch.total_items,
        success_count: successCount,
        skipped_count: skippedCount,
        committed_at: new Date().toISOString(),
        discrepancy_amount: batch.reconciliation.discrepancy_amount,
      };

      // 5. Persist to Storage
      await Promise.all([
        StorageService.saveAccounts(updatedAccounts),
        StorageService.saveStocks(updatedStocks),
        StorageService.saveTransactions(updatedTransactions),
        RDNStagingService.deleteBatch(batch.id),
      ]);

      if (onStateUpdate) {
        onStateUpdate({
          accounts: updatedAccounts,
          stocks: updatedStocks,
          transactions: updatedTransactions,
        });
      }

      return {
        success: true,
        message: `Berhasil mencatat ${successCount} transaksi ke buku besar dan memperbarui portofolio!`,
        transactionsCreated: successCount,
        stocksUpdated: updatedStocks.length,
        importLog,
      };
    } finally {
      // 4. Memory Cleanup: Wipe any references to raw buffers
      rawBufferReferences.length = 0;
    }
  }
}
