import {
  Account,
  AccountType,
  BankMutationResult,
  InternalTransferMatchPlan,
  Transaction,
} from '../types';

export const KNOWN_ADMIN_FEES = [1000, 2000, 2500, 6500]; // GoPay/Shopee (1k), OVO/DANA (2k), BI-FAST (2.5k), Online ATM (6.5k)

export class InternalTransferServiceImpl {
  /**
   * Helper to find an account in user's accounts list that matches a hint or keyword
   */
  matchAccountByHint(
    hint: string | undefined,
    accounts: Account[],
    excludeAccountId?: string
  ): Account | undefined {
    if (!hint) return undefined;
    const lower = hint.toLowerCase().trim();

    // Candidates excluding current account if specified
    const pool = excludeAccountId
      ? accounts.filter((a) => a.id !== excludeAccountId)
      : accounts;

    // 1. Exact or startsWith name match
    const exact = pool.find((a) => a.name.toLowerCase() === lower);
    if (exact) return exact;

    // 2. Specific Bank Jago Pockets
    if (lower.includes('kantong nabung') || lower.includes('nabung')) {
      const nabung = pool.find(
        (a) => a.name.toLowerCase().includes('jago') && a.name.toLowerCase().includes('nabung')
      );
      if (nabung) return nabung;
    }
    if (lower.includes('kantong belanja') || lower.includes('belanja')) {
      const belanja = pool.find(
        (a) => a.name.toLowerCase().includes('jago') && a.name.toLowerCase().includes('belanja')
      );
      if (belanja) return belanja;
    }
    if (lower.includes('kantong utama') || lower.includes('jago utama')) {
      const utama = pool.find(
        (a) => a.name.toLowerCase().includes('jago') && a.name.toLowerCase().includes('utama')
      );
      if (utama) return utama;
    }

    // 3. RDN / Stockbit / Ajaib
    if (lower.includes('rdn') || lower.includes('stockbit') || lower.includes('ajaib')) {
      const rdn = pool.find(
        (a) =>
          a.type === 'RDN' ||
          a.name.toLowerCase().includes('rdn') ||
          a.name.toLowerCase().includes('stockbit')
      );
      if (rdn) return rdn;
    }

    // 4. E-Wallets
    if (lower.includes('gopay') || lower.includes('gojek')) {
      const gopay = pool.find((a) => a.name.toLowerCase().includes('gopay'));
      if (gopay) return gopay;
    }
    if (lower.includes('ovo')) {
      const ovo = pool.find((a) => a.name.toLowerCase().includes('ovo'));
      if (ovo) return ovo;
    }
    if (lower.includes('dana')) {
      const dana = pool.find((a) => a.name.toLowerCase().includes('dana'));
      if (dana) return dana;
    }
    if (lower.includes('shopee') || lower.includes('shopeepay')) {
      const sp = pool.find(
        (a) => a.name.toLowerCase().includes('shopee') || a.name.toLowerCase().includes('shopeepay')
      );
      if (sp) return sp;
    }

    // 5. Major Banks (prefer BANK type over RDN)
    if (lower.includes('bca')) {
      const bca = pool.find((a) => a.type === 'BANK' && a.name.toLowerCase().includes('bca')) ||
                  pool.find((a) => a.name.toLowerCase().includes('bca'));
      if (bca) return bca;
    }
    if (lower.includes('mandiri') || lower.includes('livin')) {
      const mandiri = pool.find((a) => a.type === 'BANK' && a.name.toLowerCase().includes('mandiri')) ||
                      pool.find((a) => a.name.toLowerCase().includes('mandiri') || a.name.toLowerCase().includes('livin'));
      if (mandiri) return mandiri;
    }
    if (lower.includes('bri') || lower.includes('brimo')) {
      const bri = pool.find((a) => a.type === 'BANK' && a.name.toLowerCase().includes('bri')) ||
                  pool.find((a) => a.name.toLowerCase().includes('bri') || a.name.toLowerCase().includes('brimo'));
      if (bri) return bri;
    }
    if (lower.includes('bni')) {
      const bni = pool.find((a) => a.type === 'BANK' && a.name.toLowerCase().includes('bni')) ||
                  pool.find((a) => a.name.toLowerCase().includes('bni'));
      if (bni) return bni;
    }
    if (lower.includes('jago')) {
      const jago = pool.find((a) => a.type === 'BANK' && a.name.toLowerCase().includes('jago')) ||
                   pool.find((a) => a.name.toLowerCase().includes('jago'));
      if (jago) return jago;
    }

    // 6. Generic partial includes
    return pool.find((a) => a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase()));
  }

  /**
   * Helper to create auto-provisioned Account when user doesn't have the target account yet
   */
  createAutoProvisionedAccount(hint: string): Account | undefined {
    const lower = hint.toLowerCase().trim();
    const id = `acc-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    if (lower.includes('gopay') || lower.includes('gojek')) {
      return {
        id,
        name: 'GoPay Utama',
        type: 'E-WALLET',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#00AED6',
        icon: 'wallet',
        updatedAt: now,
      };
    }
    if (lower.includes('ovo')) {
      return {
        id,
        name: 'OVO Cash',
        type: 'E-WALLET',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#4C3494',
        icon: 'wallet',
        updatedAt: now,
      };
    }
    if (lower.includes('dana')) {
      return {
        id,
        name: 'DANA Indonesia',
        type: 'E-WALLET',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#118EEA',
        icon: 'wallet',
        updatedAt: now,
      };
    }
    if (lower.includes('shopee') || lower.includes('shopeepay')) {
      return {
        id,
        name: 'ShopeePay',
        type: 'E-WALLET',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#EE4D2D',
        icon: 'wallet',
        updatedAt: now,
      };
    }
    if (lower.includes('kantong nabung') || lower.includes('nabung')) {
      return {
        id,
        name: 'Bank Jago (Kantong Nabung)',
        type: 'BANK',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#8B5CF6',
        icon: 'smartphone',
        updatedAt: now,
      };
    }
    if (lower.includes('jago')) {
      return {
        id,
        name: 'Bank Jago (Kantong Utama)',
        type: 'BANK',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#8B5CF6',
        icon: 'smartphone',
        updatedAt: now,
      };
    }
    if (lower.includes('rdn') || lower.includes('stockbit')) {
      return {
        id,
        name: 'RDN Stockbit',
        type: 'RDN',
        accountNumber: 'Aktif',
        balance: 0,
        color: '#10B981',
        icon: 'trending-up',
        updatedAt: now,
      };
    }

    return undefined;
  }

  /**
   * Scenario A: Single notification that explicitly contains both Source & Destination
   * E.g. "Top up GoPay Rp 150.000 dari BCA Tahapan berhasil"
   * E.g. "Top up saldo RDN Rp 1.000.000 dari Kantong Utama ke RDN Stockbit Jago berhasil"
   * E.g. "Transfer keluar Rp 500.000 ke Bank Jago dari rekening BCA Tahapan"
   */
  checkDirectSingleTransfer(
    parsed: BankMutationResult,
    text: string,
    accounts: Account[]
  ): InternalTransferMatchPlan | null {
    const lower = text.toLowerCase();
    const isTransferAction =
      parsed.type === 'TRANSFER' ||
      lower.includes('transfer') ||
      lower.includes('top up') ||
      lower.includes('topup') ||
      lower.includes('isi saldo') ||
      lower.includes('pindah kantong');

    if (!isTransferAction) {
      return null;
    }

    // 1. Resolve Destination Account
    let destAccount = this.matchAccountByHint(parsed.destinationHint, accounts);
    const topUpMatch = text.match(/\b(?:top\s*up|topup|isi\s*saldo)\s+(?:saldo\s+)?([a-zA-Z0-9\s()&'-]+?)(?:\s+(?:sebesar|rp|idr|dari|via|berhasil|sukses)|$)/i);
    if (!destAccount && topUpMatch) {
      destAccount =
        this.matchAccountByHint(topUpMatch[1].trim(), accounts) ||
        this.createAutoProvisionedAccount(topUpMatch[1].trim());
    }
    if (!destAccount && parsed.merchantOrSender && parsed.merchantOrSender !== parsed.sourceHint) {
      destAccount = this.matchAccountByHint(parsed.merchantOrSender, accounts);
    }
    if (!destAccount) {
      // Check for keywords in entire text
      if (lower.includes('ke rdn') || lower.includes('top up rdn') || lower.includes('ke stockbit')) {
        destAccount = accounts.find((a) => a.type === 'RDN') || this.createAutoProvisionedAccount('rdn');
      } else if (lower.includes('ke gopay') || lower.includes('top up gopay')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('gopay')) || this.createAutoProvisionedAccount('gopay');
      } else if (lower.includes('ke ovo') || lower.includes('top up ovo')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('ovo')) || this.createAutoProvisionedAccount('ovo');
      } else if (lower.includes('ke dana') || lower.includes('top up dana')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('dana')) || this.createAutoProvisionedAccount('dana');
      } else if (lower.includes('ke shopeepay') || lower.includes('top up shopee')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('shopee')) || this.createAutoProvisionedAccount('shopeepay');
      } else if (lower.includes('ke kantong nabung')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('nabung')) || this.createAutoProvisionedAccount('kantong nabung');
      } else if (lower.includes('ke jago') || lower.includes('ke bank jago')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('jago')) || this.createAutoProvisionedAccount('jago');
      } else if (lower.includes('ke bca') || lower.includes('ke rekening bca')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('bca'));
      } else if (lower.includes('ke mandiri') || lower.includes('ke livin')) {
        destAccount = accounts.find((a) => a.name.toLowerCase().includes('mandiri'));
      }
    }

    // 2. Resolve Source Account
    let sourceAccount = this.matchAccountByHint(
      parsed.sourceHint,
      accounts,
      destAccount ? destAccount.id : undefined
    );
    if (!sourceAccount) {
      sourceAccount = this.matchAccountByHint(
        parsed.bankName,
        accounts,
        destAccount ? destAccount.id : undefined
      );
    }
    if (!sourceAccount && destAccount) {
      sourceAccount = accounts.find(
        (a) => a.id !== destAccount?.id && a.name.toLowerCase().includes(parsed.bankName.toLowerCase())
      );
    }

    // Fallback: If sourceAccount is still not found, match with the first bank account
    if (!sourceAccount && accounts.length > 0) {
      sourceAccount = accounts.find((a) => a.type === 'BANK') || accounts[0];
    }

    // If both source and destination are resolved and are distinct accounts
    if (sourceAccount && destAccount && sourceAccount.id !== destAccount.id) {
      const now = new Date().toISOString();
      const consolidatedTx: Transaction = {
        id: `tx-transfer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        accountId: sourceAccount.id,
        accountName: sourceAccount.name,
        destinationAccountId: destAccount.id,
        destinationAccountName: destAccount.name,
        type: 'TRANSFER',
        amount: parsed.amount,
        category: 'Internal Transfer',
        description: `Transfer ${sourceAccount.name} ➔ ${destAccount.name}`,
        rawNotificationText: text,
        source: 'ANDROID_AUTO',
        transactionDate: now,
        isInternalTransfer: true,
      };

      return {
        isMatched: true,
        matchType: 'DIRECT_SINGLE',
        sourceAccount,
        destinationAccount: destAccount,
        transferAmount: parsed.amount,
        consolidatedTransaction: consolidatedTx,
        notes: `Direct internal transfer parsed from notification: ${sourceAccount.name} -> ${destAccount.name}`,
      };
    }

    return null;
  }

  /**
   * Scenario B: Two asynchronous notifications arriving within a temporal window (e.g. 15 mins)
   * Leg 1 (e.g. BCA Outflow) was committed first.
   * Leg 2 (e.g. Bank Jago Inflow) arrives now.
   * Or vice-versa!
   */
  findTwoLeggedMatch(
    incoming: BankMutationResult,
    text: string,
    currentAccount: Account,
    recentTransactions: Transaction[],
    userAccounts: Account[],
    windowMs = 15 * 60 * 1000
  ): InternalTransferMatchPlan | null {
    const now = Date.now();
    const incomingIsCredit = incoming.type === 'INCOME';

    // Find complementary transaction in recent history
    for (const tx of recentTransactions) {
      // 1. Must be within matching time window
      const txTime = new Date(tx.transactionDate).getTime();
      if (now - txTime > windowMs) {
        continue;
      }

      // 2. Cannot match itself or same account
      if (tx.accountId === currentAccount.id) {
        continue;
      }

      // 3. Skip already consolidated internal transfers
      if (tx.isInternalTransfer) {
        continue;
      }

      // 4. Direction must be complementary (one is debit/outflow, one is credit/inflow)
      const existingIsDebit = tx.type === 'EXPENSE' || tx.type === 'TRANSFER';
      const existingIsCredit = tx.type === 'INCOME';

      if (incomingIsCredit && !existingIsDebit) continue;
      if (!incomingIsCredit && !existingIsCredit) continue;

      // 5. Amount check (Exact match OR known fee difference)
      const diff = Math.abs(tx.amount - incoming.amount);
      const isExact = diff === 0;
      const isFeeMatch = KNOWN_ADMIN_FEES.includes(diff);

      if (!isExact && !isFeeMatch) {
        continue;
      }

      // 6. Contextual verification: check bank names / hints
      const existingAccount = userAccounts.find((a) => a.id === tx.accountId);
      if (!existingAccount) continue;

      const incomingTextLower = text.toLowerCase();
      const existingTextLower = (tx.rawNotificationText || tx.description).toLowerCase();

      const mentionsExistingInIncoming =
        incomingTextLower.includes(existingAccount.name.toLowerCase()) ||
        (existingAccount.name.toLowerCase().includes('bca') && incomingTextLower.includes('bca')) ||
        (existingAccount.name.toLowerCase().includes('mandiri') && incomingTextLower.includes('mandiri')) ||
        (existingAccount.name.toLowerCase().includes('jago') && incomingTextLower.includes('jago')) ||
        (existingAccount.name.toLowerCase().includes('bri') && incomingTextLower.includes('bri')) ||
        (existingAccount.name.toLowerCase().includes('gopay') && incomingTextLower.includes('gopay'));

      const mentionsIncomingInExisting =
        existingTextLower.includes(currentAccount.name.toLowerCase()) ||
        (currentAccount.name.toLowerCase().includes('bca') && existingTextLower.includes('bca')) ||
        (currentAccount.name.toLowerCase().includes('mandiri') && existingTextLower.includes('mandiri')) ||
        (currentAccount.name.toLowerCase().includes('jago') && existingTextLower.includes('jago')) ||
        (currentAccount.name.toLowerCase().includes('bri') && existingTextLower.includes('bri')) ||
        (currentAccount.name.toLowerCase().includes('gopay') && existingTextLower.includes('gopay'));

      // If either mentions the other OR if both are user accounts with exact amount within 5 minutes
      const timeDiffMs = Math.abs(now - txTime);
      const isHighConfidencePair =
        mentionsExistingInIncoming ||
        mentionsIncomingInExisting ||
        (isExact && timeDiffMs < 5 * 60 * 1000);

      if (isHighConfidencePair) {
        // Determine source (outflow) and destination (inflow)
        const sourceAccount = incomingIsCredit ? existingAccount : currentAccount;
        const destinationAccount = incomingIsCredit ? currentAccount : existingAccount;
        const transferAmount = Math.min(tx.amount, incoming.amount);
        const feeAmount = isFeeMatch ? diff : undefined;

        const consolidatedTx: Transaction = {
          id: tx.id, // Reuse the ID to replace/merge in place
          accountId: sourceAccount.id,
          accountName: sourceAccount.name,
          destinationAccountId: destinationAccount.id,
          destinationAccountName: destinationAccount.name,
          type: 'TRANSFER',
          amount: transferAmount,
          category: 'Internal Transfer',
          description: `Transfer ${sourceAccount.name} ➔ ${destinationAccount.name}`,
          rawNotificationText: `${tx.rawNotificationText || tx.description} | ${text}`,
          source: 'ANDROID_AUTO',
          transactionDate: tx.transactionDate,
          isInternalTransfer: true,
        };

        return {
          isMatched: true,
          matchType: isFeeMatch ? 'FEE_ADJUSTED' : 'TWO_LEGGED_PAIR',
          sourceAccount,
          destinationAccount,
          transferAmount,
          feeAmount,
          matchedTransactionId: tx.id,
          consolidatedTransaction: consolidatedTx,
          notes: `Two-legged transfer reconciled: ${sourceAccount.name} -> ${destinationAccount.name} (Delta ${diff})`,
        };
      }
    }

    return null;
  }

  /**
   * Check if an incoming notification is an acknowledgment leg for a transfer
   * that was ALREADY reconciled (prevents double-crediting)
   */
  checkAlreadyReconciled(
    incoming: BankMutationResult,
    currentAccount: Account,
    recentTransactions: Transaction[],
    windowMs = 15 * 60 * 1000
  ): boolean {
    const now = Date.now();

    for (const tx of recentTransactions) {
      if (!tx.isInternalTransfer) continue;

      const txTime = new Date(tx.transactionDate).getTime();
      if (now - txTime > windowMs) continue;

      // If this transaction already connects currentAccount with the exact amount
      const isSameAmount = Math.abs(tx.amount - incoming.amount) === 0;
      const isRelatedAccount =
        tx.destinationAccountId === currentAccount.id || tx.accountId === currentAccount.id;

      if (isSameAmount && isRelatedAccount) {
        return true;
      }
    }

    return false;
  }
}

export const InternalTransferService = new InternalTransferServiceImpl();
