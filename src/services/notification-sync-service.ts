import {
  BankMutationResult,
  MonitoredBankApp,
  AutoSyncNotificationConfig,
  CapturedNotificationLog,
} from '../types';
import { AIParserService } from './ai-parser';

export const MONITORED_BANK_APPS: MonitoredBankApp[] = [
  {
    id: 'bca',
    name: 'BCA (m-BCA & myBCA)',
    type: 'BANK',
    packageName: 'com.bca',
    icon: 'landmark',
    color: '#00529C',
    sampleNotification: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan Senopati berhasil dari rekening BCA Tahapan',
  },
  {
    id: 'mandiri',
    name: "Mandiri Livin'",
    type: 'BANK',
    packageName: 'id.co.mandiri.livin',
    icon: 'landmark',
    color: '#003366',
    sampleNotification: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
  },
  {
    id: 'bri',
    name: 'BRImo (Bank BRI)',
    type: 'BANK',
    packageName: 'id.co.bri.brimo',
    icon: 'landmark',
    color: '#00529C',
    sampleNotification: 'Transaksi QRIS Rp 35.000 di Alfamart berhasil dari rekening BRImo',
  },
  {
    id: 'bni',
    name: 'BNI Mobile Banking',
    type: 'BANK',
    packageName: 'src.com.bni',
    icon: 'landmark',
    color: '#F15A24',
    sampleNotification: 'Debit Rp 75.000 untuk transaksi di Indomaret BNI',
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    type: 'BANK',
    packageName: 'com.jago.digitalbanking',
    icon: 'smartphone',
    color: '#8B5CF6',
    sampleNotification: 'Pemberitahuan: Uang keluar Rp 62.000 untuk F&B via Kantong Utama Bank Jago',
  },
  {
    id: 'gopay',
    name: 'GoPay / Gojek',
    type: 'E_WALLET',
    packageName: 'com.gojek.app',
    icon: 'wallet',
    color: '#00AED6',
    sampleNotification: 'Pembayaran GoFood Rp 54.000 dengan GoPay berhasil',
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'E_WALLET',
    packageName: 'ovo.id',
    icon: 'wallet',
    color: '#4C3494',
    sampleNotification: 'Transaksi OVO Cash Rp 32.000 di Fore Coffee berhasil',
  },
  {
    id: 'dana',
    name: 'DANA Indonesia',
    type: 'E_WALLET',
    packageName: 'id.dana',
    icon: 'wallet',
    color: '#118EEA',
    sampleNotification: 'Pembayaran QRIS DANA Rp 28.000 berhasil',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    type: 'E_WALLET',
    packageName: 'com.shopee.id',
    icon: 'wallet',
    color: '#EE4D2D',
    sampleNotification: 'ShopeePay: Pembayaran merchant Rp 45.000 berhasil',
  },
];

export const NOTIFICATION_TEST_PRESETS = [
  {
    id: 'test-transfer-pair-bca',
    title: 'Pilar 2: Transfer Keluar (BCA)',
    badge: 'Leg 1 (BCA ➔ Jago)',
    appId: 'bca',
    text: 'Transfer keluar Rp 500.000 ke Bank Jago dari rekening BCA Tahapan',
  },
  {
    id: 'test-transfer-pair-jago',
    title: 'Pilar 2: Transfer Masuk (Jago)',
    badge: 'Leg 2 (Pair Match)',
    appId: 'jago',
    text: 'Pemberitahuan: Uang masuk Rp 500.000 via BI-FAST dari BCA ke Kantong Utama Bank Jago',
  },
  {
    id: 'test-transfer-single-gopay',
    title: 'Pilar 2: Direct Top Up GoPay',
    badge: 'BCA ➔ GoPay',
    appId: 'bca',
    text: 'Top up GoPay Rp 150.000 dari BCA Tahapan berhasil',
  },
  {
    id: 'test-transfer-jago-pockets',
    title: 'Pilar 2: Pindah Kantong Jago',
    badge: 'Utama ➔ Nabung',
    appId: 'jago',
    text: 'Pindah kantong Rp 200.000 dari Kantong Utama ke Kantong Nabung Bank Jago berhasil',
  },
  {
    id: 'test-jago-fnb',
    title: 'Jago Uang Keluar F&B',
    badge: 'Kantong Utama Jago',
    appId: 'jago',
    text: 'Pemberitahuan: Uang keluar Rp 62.000 untuk F&B via Kantong Utama Bank Jago',
  },
  {
    id: 'test-jago-interest',
    title: 'Jago Bunga Kantong',
    badge: 'Kantong Nabung Jago',
    appId: 'jago',
    text: 'Pemberitahuan: Bunga kantong Rp 15.200 telah ditambahkan ke Kantong Nabung Bank Jago',
  },
  {
    id: 'test-jago-rdn',
    title: 'Jago Top Up RDN Stockbit',
    badge: 'Jago ke RDN',
    appId: 'jago',
    text: 'Top up saldo RDN Rp 1.000.000 dari Kantong Utama ke RDN Stockbit Jago berhasil',
  },
  {
    id: 'test-qris',
    title: 'QRIS Kopi Kenangan',
    badge: 'BCA Tahapan',
    appId: 'bca',
    text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan Senopati berhasil dari rekening BCA Tahapan',
  },
  {
    id: 'test-salary',
    title: 'Transfer Masuk Gaji',
    badge: "Mandiri Livin'",
    appId: 'mandiri',
    text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
  },
  {
    id: 'test-rdn',
    title: 'Top Up RDN Saham',
    badge: 'BCA ke RDN',
    appId: 'bca',
    text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
  },
  {
    id: 'test-gofood',
    title: 'GoFood GoPay',
    badge: 'GoPay',
    appId: 'gopay',
    text: 'Pembayaran GoFood Rp 54.000 dengan GoPay berhasil di Mie Gacoan',
  },
  {
    id: 'test-dana',
    title: 'QRIS DANA',
    badge: 'DANA',
    appId: 'dana',
    text: 'Pembayaran QRIS DANA Rp 28.000 di Janji Jiwa berhasil',
  },
  {
    id: 'test-brimo',
    title: 'BRImo Alfamart',
    badge: 'BRImo',
    appId: 'bri',
    text: 'Transaksi QRIS Rp 35.000 di Alfamart berhasil dari rekening BRImo',
  },
];

type NotificationListener = (payload: {
  result: BankMutationResult;
  log: CapturedNotificationLog;
}) => void;

class NotificationSyncServiceImpl {
  private listeners: Set<NotificationListener> = new Set();
  private recentHashes: Map<string, number> = new Map();
  private readonly HASH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes duplicate protection

  /**
   * Subscribe to incoming notifications (for in-app Toast banner)
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(payload: { result: BankMutationResult; log: CapturedNotificationLog }) {
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.warn('Error in notification listener:', err);
      }
    });
  }

  /**
   * Simple deterministic hash for duplicate detection
   */
  private computeHash(text: string): string {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    return `hash-${hash}`;
  }

  private isDuplicate(text: string): boolean {
    const hash = this.computeHash(text);
    const now = Date.now();
    const lastSeen = this.recentHashes.get(hash);

    if (lastSeen && now - lastSeen < this.HASH_COOLDOWN_MS) {
      return true;
    }

    this.recentHashes.set(hash, now);

    // Prune stale hashes older than cooldown
    if (this.recentHashes.size > 200) {
      for (const [key, timestamp] of this.recentHashes.entries()) {
        if (now - timestamp > this.HASH_COOLDOWN_MS) {
          this.recentHashes.delete(key);
        }
      }
    }

    return false;
  }

  private inMemoryLogs: CapturedNotificationLog[] = [];

  getRecentLogs(): CapturedNotificationLog[] {
    return this.inMemoryLogs;
  }

  /**
   * Process raw incoming notification text from any source (Deep link, Webhook, or Simulator)
   */
  async processNotification(
    rawText: string,
    sourceAppOrPackage?: string,
    onAutoCommit?: (result: BankMutationResult) => Promise<void>,
    onSaveLog?: (log: CapturedNotificationLog) => Promise<void>
  ): Promise<{
    success: boolean;
    result?: BankMutationResult;
    log?: CapturedNotificationLog;
    isDuplicate?: boolean;
    error?: string;
  }> {
    const text = rawText.trim();
    if (!text) {
      return { success: false, error: 'Empty notification text' };
    }

    // Check duplicate
    if (this.isDuplicate(text)) {
      const duplicateLog: CapturedNotificationLog = {
        id: `notif-dup-${Date.now()}`,
        sourceApp: sourceAppOrPackage || 'Android Notification',
        rawText: text,
        parsedResult: AIParserService.deterministicBankParse(text, sourceAppOrPackage),
        timestamp: new Date().toISOString(),
        status: 'DUPLICATE',
      };
      this.inMemoryLogs.unshift(duplicateLog);
      if (onSaveLog) await onSaveLog(duplicateLog);
      return { success: false, isDuplicate: true, log: duplicateLog };
    }

    try {
      // 1. Parse mutation
      const parsed = await AIParserService.parseBankMutation(text, sourceAppOrPackage);

      // 2. Determine source app label
      const matchedApp = MONITORED_BANK_APPS.find(
        (a) =>
          a.id === sourceAppOrPackage ||
          a.packageName === sourceAppOrPackage ||
          parsed.bankName.toLowerCase().includes(a.id)
      );
      const sourceApp = matchedApp ? matchedApp.name : sourceAppOrPackage || parsed.bankName;

      // 3. Auto-commit to ledger if callback provided
      if (onAutoCommit) {
        await onAutoCommit(parsed);
      }

      // 4. Create and persist capture log
      const log: CapturedNotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceApp,
        rawText: text,
        parsedResult: parsed,
        timestamp: new Date().toISOString(),
        status: 'COMMITTED',
      };
      this.inMemoryLogs.unshift(log);
      if (onSaveLog) await onSaveLog(log);

      // 5. Trigger in-app toast notification
      this.notify({ result: parsed, log });

      return {
        success: true,
        result: parsed,
        log,
      };
    } catch (err: any) {
      console.warn('Failed to process incoming bank notification:', err);
      const failedLog: CapturedNotificationLog = {
        id: `notif-err-${Date.now()}`,
        sourceApp: sourceAppOrPackage || 'Android Notification',
        rawText: text,
        parsedResult: {
          type: 'EXPENSE',
          amount: 0,
          bankName: 'Tidak Diketahui',
          category: 'General',
          description: text,
        },
        timestamp: new Date().toISOString(),
        status: 'FAILED',
      };
      this.inMemoryLogs.unshift(failedLog);
      if (onSaveLog) await onSaveLog(failedLog);
      return { success: false, error: err.message || 'Processing failed', log: failedLog };
    }
  }

  /**
   * Deep Link Generator for MacroDroid / Tasker
   * Format: omniwealth://notification?text={url_encoded_text}&app={app_id}
   */
  getDeepLinkUrl(sampleText = '{notification_text}', appId = '{package_name}', secretToken?: string): string {
    const tokenPart = secretToken ? `token=${encodeURIComponent(secretToken)}&` : '';
    return `omniwealth://notification?${tokenPart}text=${encodeURIComponent(sampleText)}&app=${encodeURIComponent(appId)}`;
  }

  /**
   * Helper instructions for users setting up MacroDroid with local security handshake
   */
  getMacroDroidGuide(secretToken?: string) {
    const tokenParam = secretToken ? `token=${secretToken}&` : '';
    const template = `omniwealth://notification?${tokenParam}text=[notif_text]&app=[package_name]`;
    return {
      title: 'Setup Auto-Sync Android via MacroDroid (Gratis & Tanpa Root)',
      deepLinkTemplate: template,
      steps: [
        'Unduh aplikasi "MacroDroid" gratis dari Google Play Store.',
        'Buka MacroDroid > Buat Macro Baru (Add Macro).',
        'Pilih TRIGGER: "Notification" > "Notification Received" > Centang aplikasi m-Banking Anda (BCA, Mandiri, GoPay, OVO, ShopeePay, DANA).',
        `Pilih ACTION: "Connectivity" > "Open Website / HTTP" > Masukkan URL:\n${template}`,
        'Simpan Macro dengan nama "OmniWealth Auto-Sync". Selesai!',
      ],
    };
  }

  /**
   * Validates inbound deep link URLs to prevent unauthorized transaction spoofing / CSRF
   */
  validateDeepLink(
    queryParams: Record<string, any> | undefined | null,
    config: AutoSyncNotificationConfig
  ): { isValid: boolean; reason?: string } {
    if (!config || !config.enabled) {
      return { isValid: false, reason: 'Sync notifikasi dinonaktifkan oleh pengguna' };
    }

    if (config.syncSecretToken) {
      const incomingToken = queryParams?.token as string | undefined;
      if (!incomingToken || incomingToken !== config.syncSecretToken) {
        return { isValid: false, reason: 'Kunci rahasia sinkronisasi (token) tidak cocok atau hilang' };
      }
    }

    const text = queryParams?.text as string | undefined;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { isValid: false, reason: 'Isi teks notifikasi kosong' };
    }

    return { isValid: true };
  }
}

export const NotificationSyncService = new NotificationSyncServiceImpl();
