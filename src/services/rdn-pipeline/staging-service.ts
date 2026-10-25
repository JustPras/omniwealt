import AsyncStorage from '@react-native-async-storage/async-storage';
import { RDNStagingBatch, RDNStagingItem, StandardizedRDNRecord } from '../../types/rdn-pipeline';

const STAGING_STORAGE_KEY = '@omniwealth_rdn_staging_batches_v1';

export class RDNStagingService {
  /**
   * Get all staging batches
   */
  static async getBatches(): Promise<RDNStagingBatch[]> {
    try {
      const data = await AsyncStorage.getItem(STAGING_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Save or update staging batch
   */
  static async saveBatch(batch: RDNStagingBatch): Promise<void> {
    try {
      const batches = await RDNStagingService.getBatches();
      const existingIdx = batches.findIndex((b) => b.id === batch.id);

      if (existingIdx >= 0) {
        batches[existingIdx] = batch;
      } else {
        batches.unshift(batch);
      }

      await AsyncStorage.setItem(STAGING_STORAGE_KEY, JSON.stringify(batches));
    } catch (e) {
      console.warn('Failed to save RDN staging batch:', e);
    }
  }

  /**
   * Get a single staging batch by ID
   */
  static async getBatchById(batchId: string): Promise<RDNStagingBatch | null> {
    const batches = await RDNStagingService.getBatches();
    return batches.find((b) => b.id === batchId) || null;
  }

  /**
   * Update a specific staging row (Human-in-the-Loop editing for NEEDS_REVIEW items)
   */
  static async updateStagingItem(
    batchId: string,
    itemId: string,
    updates: Partial<StandardizedRDNRecord>
  ): Promise<RDNStagingBatch | null> {
    const batch = await RDNStagingService.getBatchById(batchId);
    if (!batch) return null;

    const itemIdx = batch.items.findIndex((i) => i.id === itemId);
    if (itemIdx < 0) return null;

    const oldItem = batch.items[itemIdx];
    const updatedRecord: StandardizedRDNRecord = {
      ...oldItem.record,
      ...updates,
    };

    batch.items[itemIdx] = {
      ...oldItem,
      record: updatedRecord,
      status: 'READY',
      validation_error: undefined,
    };

    // Re-check reconciliation
    const diff = batch.items.reduce((acc, it) => {
      const net = it.record.net_amount;
      if (it.record.category === 'TOPUP' || it.record.category === 'SELL' || it.record.category === 'DIVIDEND') {
        return acc + net;
      }
      return acc - net;
    }, batch.reconciliation.opening_balance);

    const discrepancy = Math.abs(diff - batch.reconciliation.statement_closing);
    const isBalanced = discrepancy < 1.0;

    batch.reconciliation = {
      ...batch.reconciliation,
      calculated_closing: diff,
      discrepancy_amount: isBalanced ? 0 : discrepancy,
      is_balanced: isBalanced,
      status: isBalanced ? 'VERIFIED' : 'NEEDS_REVIEW',
    };

    batch.status = isBalanced ? 'VERIFIED' : 'NEEDS_REVIEW';

    await RDNStagingService.saveBatch(batch);
    return batch;
  }

  /**
   * Remove a staging batch after commit or cancellation
   */
  static async deleteBatch(batchId: string): Promise<void> {
    const batches = await RDNStagingService.getBatches();
    const filtered = batches.filter((b) => b.id !== batchId);
    await AsyncStorage.setItem(STAGING_STORAGE_KEY, JSON.stringify(filtered));
  }
}
