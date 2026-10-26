import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { LiquidSegmentControl } from '../../src/components/common/liquid-segment-control';
import { AccountModal } from '../../src/components/modals/account-modal';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { CryptoWalletModal } from '../../src/components/modals/crypto-wallet-modal';
import { BankAutoSyncModal } from '../../src/components/modals/bank-auto-sync-modal';
import { CryptoWalletService } from '../../src/services/crypto-wallet-service';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatDate } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BankMutationResult, AccountType } from '../../src/types';
import { color, space, radius, shadow } from '../../src/theme/tokens';

type TxFilter = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const PRESETS = [
  {
    id: 'p1',
    title: 'QRIS Kopi Kenangan',
    amount: 'Rp 48.500',
    text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
  },
  {
    id: 'p2',
    title: 'Gaji Bulanan',
    amount: 'Rp 2.500.000',
    text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
  },
  {
    id: 'p3',
    title: 'Top Up RDN',
    amount: 'Rp 1.000.000',
    text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
  },
];

export default function AccountsScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const {
    accounts,
    totalCash,
    transactions,
    applyMutationText,
    cryptoWallets,
    syncCryptoWallet,
    deleteCryptoWallet,
    notificationConfig,
    processIncomingNotification,
  } = useWealth();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [autoSyncModalVisible, setAutoSyncModalVisible] = useState(false);
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);
  const [mutationModalVisible, setMutationModalVisible] = useState(false);
  const [activeAccountForMutation, setActiveAccountForMutation] = useState<string | undefined>(undefined);
  const [mutationType, setMutationType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Interactive filters
  const [selectedTxFilter, setSelectedTxFilter] = useState<TxFilter>('ALL');

  // AI Parser state
  const [parserText, setParserText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<BankMutationResult | null>(null);

  // Background Simulator state
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  // Group accounts by type: Bank, RDN, E-Wallet (memoized)
  const bankAccounts = useMemo(() => accounts.filter((a) => a.type === 'BANK'), [accounts]);
  const rdnAccounts = useMemo(() => accounts.filter((a) => a.type === 'RDN'), [accounts]);
  const ewalletAccounts = useMemo(() => accounts.filter((a) => a.type === 'E-WALLET'), [accounts]);

  const filteredTransactions = useMemo(() => {
    if (selectedTxFilter === 'ALL') return transactions;
    if (selectedTxFilter === 'TRANSFER') {
      return transactions.filter((tx) => tx.type === 'TRANSFER' || tx.isInternalTransfer);
    }
    return transactions.filter((tx) => tx.type === selectedTxFilter && !tx.isInternalTransfer);
  }, [transactions, selectedTxFilter]);

  const handleProcessMutation = async (customText?: string) => {
    const textToProcess = customText || parserText;
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const result = await applyMutationText(textToProcess);
      setParseResult(result);
      triggerHaptic('success');
      if (!customText) {
        setParserText('');
      }
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateAndroidListener = async () => {
    triggerHaptic('medium');
    const merchants = ['Kopi Kenangan Senopati', 'Fore Coffee Grand Indonesia', 'Point Coffee Sudirman', 'FamilyMart Thamrin'];
    const randomAmount = Math.floor(Math.random() * 45000) + 25000;
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const text = `Transaksi QRIS Rp ${randomAmount.toLocaleString('id-ID')} di ${randomMerchant} berhasil dari rekening BCA Tahapan`;

    setSimulatedNotification(text);
    await processIncomingNotification(text, 'bca');
  };

  const openMutationModal = (accId: string, type: 'INCOME' | 'EXPENSE') => {
    triggerHaptic('light');
    setActiveAccountForMutation(accId);
    setMutationType(type);
    setMutationModalVisible(true);
  };

  const renderAccountGroupCard = (title: string, groupAccounts: typeof accounts, iconName: any) => {
    if (groupAccounts.length === 0) return null;

    return (
      <View style={styles.groupContainer} key={title}>
        <View style={styles.groupHeaderRow}>
          <Icon name={iconName} size={15} color={color.textMuted} />
          <Text style={styles.groupTitleText}>{title}</Text>
          <Text style={styles.groupCountText}>({groupAccounts.length})</Text>
        </View>

        <GlassCard level="base" noPadding style={styles.groupCard}>
          {groupAccounts.map((acc, index) => {
            const isLast = index === groupAccounts.length - 1;
            return (
              <View key={acc.id}>
                <View style={styles.accountRow}>
                  <View style={styles.accountLeft}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountMeta}>
                      {acc.accountNumber || 'Aktif'}
                    </Text>
                  </View>

                  <View style={styles.accountRight}>
                    <PrivacyValue value={acc.balance} style={styles.accountBalanceText} />
                    <View style={styles.quickActionPillRow}>
                      <Pressable
                        onPress={() => openMutationModal(acc.id, 'INCOME')}
                        hitSlop={6}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillIncome}>+ Masuk</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openMutationModal(acc.id, 'EXPENSE')}
                        hitSlop={6}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillExpense}>− Keluar</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                {!isLast && <View style={styles.rowHairline} />}
              </View>
            );
          })}
        </GlassCard>
      </View>
    );
  };

  const renderCryptoWalletsGroupCard = () => {
    return (
      <View style={styles.groupContainer} key="Dompet Kripto Web3">
        <View style={styles.groupHeaderRow}>
          <Icon name="Wallet" size={15} color="#A78BFA" />
          <Text style={[styles.groupTitleText, { color: '#DDD6FE' }]}>Dompet Kripto Web3</Text>
          <Text style={styles.groupCountText}>({cryptoWallets.length})</Text>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setWalletModalVisible(true);
            }}
            style={styles.addWeb3HeaderBtn}
            hitSlop={6}
          >
            <Icon name="Plus" size={12} color="#A78BFA" />
            <Text style={styles.addWeb3HeaderBtnText}>Hubungkan</Text>
          </Pressable>
        </View>

        <GlassCard level="base" noPadding style={styles.groupCard}>
          {cryptoWallets.length === 0 ? (
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setWalletModalVisible(true);
              }}
              style={styles.emptyWeb3Row}
            >
              <View style={styles.web3RowIconCircle}>
                <Icon name="Link2" size={16} color="#A78BFA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyWeb3Title}>Hubungkan Dompet Web3</Text>
                <Text style={styles.emptyWeb3Subtitle}>
                  Auto-sync saldo on-chain EVM, Solana & Bitcoin
                </Text>
              </View>
              <Icon name="ChevronRight" size={16} color={color.textMuted} />
            </Pressable>
          ) : (
            cryptoWallets.map((wallet, index) => {
              const isLast = index === cryptoWallets.length - 1;
              const isThisSyncing = syncingWalletId === wallet.id;

              return (
                <View key={wallet.id}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.web3NetworkBadge}>
                          <Text style={styles.web3NetworkBadgeText}>{wallet.networkType}</Text>
                        </View>
                        <Text style={styles.accountName}>{wallet.name}</Text>
                      </View>
                      <Text style={styles.accountMeta}>
                        {CryptoWalletService.truncateAddress(wallet.address, 6, 4)} • {wallet.tokens.length} token
                      </Text>
                    </View>

                    <View style={styles.accountRight}>
                      <PrivacyValue value={wallet.balanceIdr} style={styles.accountBalanceText} />
                      <View style={styles.web3ActionRow}>
                        <Pressable
                          onPress={async () => {
                            setSyncingWalletId(wallet.id);
                            try {
                              await syncCryptoWallet(wallet.id);
                            } finally {
                              setSyncingWalletId(null);
                            }
                          }}
                          disabled={isThisSyncing}
                          hitSlop={6}
                          style={styles.web3SyncBtn}
                        >
                          <Icon
                            name="RefreshCw"
                            size={11}
                            color={isThisSyncing ? color.accent : color.gain}
                          />
                          <Text style={styles.web3SyncBtnText}>
                            {isThisSyncing ? 'Sync...' : 'Auto-Sync'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => deleteCryptoWallet(wallet.id)}
                          hitSlop={6}
                          style={styles.web3DeleteBtn}
                        >
                          <Icon name="Trash2" size={12} color={color.loss} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <ScreenTransition style={styles.screenContainer}>
      <AmbientBackground activeAssetClass="CASH" />
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. LIQUIDITY HERO CARD */}
        <GlassCard level="base" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Total likuiditas kas & RDN</Text>
              <PrivacyValue value={totalCash} style={styles.heroAmount} />
              <Text style={styles.heroSubtitle}>{accounts.length} rekening aktif terhubung</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setAccountModalVisible(true);
              }}
              style={styles.addAccountButton}
            >
              <Text style={styles.addAccountButtonText}>+ Tambah rekening</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* 2. REKENING DIKELOMPOKKAN (SATU KARTU PER KELOMPOK DENGAN BARIS) */}
        {accounts.length === 0 && cryptoWallets.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada rekening kas</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan rekening bank, rekening dana nasabah (RDN), dompet digital, atau dompet Web3 untuk memantau saldo likuid.
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setAccountModalVisible(true);
              }}
              style={styles.addAccountButton}
            >
              <Text style={styles.addAccountButtonText}>Tambah rekening pertama</Text>
            </Pressable>
          </GlassCard>
        ) : (
          <View style={styles.groupsWrapper}>
            {renderAccountGroupCard('Bank', bankAccounts, 'Landmark')}
            {renderAccountGroupCard('Rekening Dana Nasabah (RDN)', rdnAccounts, 'TrendingUp')}
            {renderAccountGroupCard('Dompet digital', ewalletAccounts, 'Smartphone')}
            {renderCryptoWalletsGroupCard()}
          </View>
        )}

        {/* 3. KOTAK TEMPEL MUTASI & AI PARSER */}
        <GlassCard level="base" style={styles.parserCard}>
          <View style={styles.parserHeader}>
            <Text style={styles.sectionHeadline}>Tempel mutasi</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI Parser</Text>
            </View>
          </View>

          <Text style={styles.parserSubtext}>
            Pilih preset instan atau tempel teks notifikasi transaksi bank:
          </Text>

          {/* Preset Chips (Inset surfaces) */}
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setParserText(p.text);
                  setParseResult(null);
                }}
                style={styles.presetChip}
              >
                <Text style={styles.presetTitle}>{p.title}</Text>
                <Text style={styles.presetAmount}>{p.amount}</Text>
              </Pressable>
            ))}
          </View>

          {/* Large Inset Input Area */}
          <TextInput
            style={styles.parserInput}
            placeholder="Ketik atau tempel teks mutasi bank di sini..."
            placeholderTextColor={color.textFaint}
            multiline
            numberOfLines={3}
            value={parserText}
            onChangeText={(t) => {
              setParserText(t);
              setParseResult(null);
            }}
          />

          {/* Parse Result Confirmation Row */}
          {parseResult && (
            <View style={styles.confirmationRow}>
              <View style={styles.confirmLeft}>
                <Text style={styles.confirmType}>
                  {parseResult.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}: {formatIDR(parseResult.amount)}
                </Text>
                <Text style={styles.confirmAccount}>
                  {parseResult.bankName} • {parseResult.category} ({parseResult.merchantOrSender || 'Berhasil'})
                </Text>
              </View>
              <Text style={styles.confirmTag}>Mutasi dicatat</Text>
            </View>
          )}

          {/* Action Button: Simpan Mutasi */}
          <Pressable
            onPress={() => handleProcessMutation()}
            disabled={isProcessing || !parserText.trim()}
            style={[
              styles.saveMutationButton,
              (!parserText.trim() || isProcessing) && styles.disabledButton,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color={color.onAccent} size="small" />
            ) : (
              <Text style={styles.saveMutationText}>Simpan mutasi</Text>
            )}
          </Pressable>
        </GlassCard>

        {/* 4. AUTO-SYNC NOTIFIKASI BANK & E-WALLET (PILAR 1) */}
        <GlassCard level="base" style={styles.simulatorCard}>
          <View style={styles.simulatorHeader}>
            <View style={styles.autoSyncTitleRow}>
              <View style={styles.autoSyncIconCircle}>
                <Icon name="BellRing" size={16} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.simulatorTitle}>Auto-Sync Notifikasi Bank</Text>
                <Text style={styles.simulatorSubBadge}>
                  {notificationConfig.enabled
                    ? '● Aktif (Mendukung 9 Institusi)'
                    : '○ Nonaktif'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setAutoSyncModalVisible(true);
              }}
              style={styles.manageSyncHeaderBtn}
            >
              <Icon name="Settings" size={12} color="#38BDF8" />
              <Text style={styles.manageSyncHeaderBtnText}>Atur</Text>
            </Pressable>
          </View>

          <Text style={styles.simulatorDesc}>
            Menangkap notifikasi mutasi QRIS, transfer masuk BI-FAST, dan debit secara otomatis dari m-Banking dan e-Wallet tanpa input manual.
          </Text>

          {/* Quick Action Button Row */}
          <View style={styles.autoSyncActionRow}>
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setAutoSyncModalVisible(true);
              }}
              style={styles.openModalBtn}
            >
              <Icon name="Sliders" size={13} color="#fff" />
              <Text style={styles.openModalBtnText}>Kelola & Setup 1-Klik</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                handleSimulateAndroidListener();
              }}
              style={styles.quickTestBtn}
            >
              <Icon name="Play" size={13} color="#38BDF8" />
              <Text style={styles.quickTestBtnText}>Uji QRIS</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* 5. RIWAYAT TRANSAKSI TERBARU (SINGLE CARD WITH ROWS SEPARATED BY HAIRLINE) */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionHeadline}>Riwayat mutasi</Text>

          {/* Mini Tx Filter */}
          <LiquidSegmentControl<TxFilter>
            items={[
              { key: 'ALL', label: 'Semua' },
              { key: 'INCOME', label: 'Masuk' },
              { key: 'EXPENSE', label: 'Keluar' },
              { key: 'TRANSFER', label: 'Transfer' },
            ]}
            activeKey={selectedTxFilter}
            onSelect={setSelectedTxFilter}
            style={[styles.txFilterGroup, { width: isSmall ? 220 : 250 }]}
            height={32}
            fontSize={11}
            compact
            hapticType="light"
          />
        </View>

        {filteredTransactions.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Belum ada riwayat transaksi kas.</Text>
          </GlassCard>
        ) : (
          <GlassCard level="base" noPadding style={styles.txCard}>
            {filteredTransactions.slice(0, 10).map((tx, index) => {
              const isInc = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER' || tx.isInternalTransfer;
              const isLast = index === Math.min(filteredTransactions.length, 10) - 1;
              return (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {isTransfer && (
                          <View style={styles.transferTagBadge}>
                            <Text style={styles.transferTagText}>Transfer</Text>
                          </View>
                        )}
                        <Text style={styles.txDescription}>{tx.description}</Text>
                      </View>
                      <Text style={styles.txMeta}>
                        {formatDate(tx.transactionDate)} • {tx.accountName || 'Kas'}
                        {tx.destinationAccountName ? ` ➔ ${tx.destinationAccountName}` : ''}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmountText,
                        isTransfer
                          ? styles.textTransfer
                          : isInc
                          ? styles.textGain
                          : styles.textLoss,
                      ]}
                    >
                      {isTransfer ? '⇄ ' : isInc ? '▲ +' : '▼ −'}
                      {formatIDR(Math.abs(tx.amount))}
                    </Text>
                  </View>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>

      {/* Modals */}
      <AccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
      />

      <CashMutationModal
        visible={mutationModalVisible}
        accountId={activeAccountForMutation}
        initialType={mutationType}
        onClose={() => {
          setMutationModalVisible(false);
          setActiveAccountForMutation(undefined);
        }}
      />

      <CryptoWalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />

      <BankAutoSyncModal
        visible={autoSyncModalVisible}
        onClose={() => setAutoSyncModalVisible(false)}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: color.obsidian,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.lg,
  },
  heroCard: {
    padding: space.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 13,
    color: color.textMuted,
    fontWeight: '500',
    marginBottom: space.xs,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: color.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: space.xs,
  },
  addAccountButton: {
    backgroundColor: color.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  addAccountButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: color.onAccent,
  },

  // Groups
  groupsWrapper: {
    gap: space.md,
  },
  groupContainer: {
    gap: space.xs,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  groupTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  groupCountText: {
    fontSize: 12,
    color: color.textMuted,
  },
  groupCard: {
    borderRadius: radius.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  accountLeft: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  accountMeta: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
    textAlign: 'right',
  },
  quickActionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: 4,
  },
  actionPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
  },
  actionPillIncome: {
    fontSize: 11,
    color: color.gain,
    fontWeight: '600',
  },
  actionPillExpense: {
    fontSize: 11,
    color: color.loss,
    fontWeight: '600',
  },
  rowHairline: {
    height: 1,
    backgroundColor: color.hairline,
    marginHorizontal: space.lg,
  },

  // Parser Card
  parserCard: {
    padding: space.lg,
  },
  parserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  sectionHeadline: {
    fontSize: 17,
    fontWeight: '600',
    color: color.text,
  },
  aiTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  aiTagText: {
    fontSize: 11,
    color: color.accent,
    fontWeight: '600',
  },
  parserSubtext: {
    fontSize: 13,
    color: color.textMuted,
    marginBottom: space.md,
  },
  presetRow: {
    flexDirection: 'row',
    gap: space.xs + 2,
    marginBottom: space.md,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  presetTitle: {
    fontSize: 11,
    color: color.textMuted,
    fontWeight: '500',
  },
  presetAmount: {
    fontSize: 12,
    color: color.text,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  parserInput: {
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.md,
    color: color.text,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: space.md,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginBottom: space.md,
  },
  confirmLeft: {
    flex: 1,
  },
  confirmType: {
    fontSize: 13,
    fontWeight: '600',
    color: color.gain,
  },
  confirmAccount: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  confirmTag: {
    fontSize: 11,
    fontWeight: '600',
    color: color.gain,
  },
  saveMutationButton: {
    backgroundColor: color.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveMutationText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.onAccent,
  },

  // Simulator Card
  simulatorCard: {
    padding: space.lg,
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  autoSyncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  autoSyncIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
  },
  simulatorSubBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: color.gain,
    marginTop: 1,
  },
  manageSyncHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  manageSyncHeaderBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
  },
  simulatorDesc: {
    fontSize: 11,
    color: color.textMuted,
    lineHeight: 16,
    marginVertical: space.xs,
  },
  autoSyncActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  openModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  openModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  quickTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  quickTestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },

  // History
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txFilterGroup: {
    alignSelf: 'center',
  },
  txFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  txFilterBtnActive: {
    backgroundColor: color.accentSoft,
  },
  txFilterBtnText: {
    fontSize: 11,
    color: color.textMuted,
    fontWeight: '500',
  },
  txFilterBtnTextActive: {
    color: color.accent,
    fontWeight: '600',
  },
  txCard: {
    borderRadius: radius.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  txLeft: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: color.text,
  },
  txMeta: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textGain: {
    color: color.gain,
  },
  textLoss: {
    color: color.loss,
  },
  textTransfer: {
    color: '#38BDF8',
  },
  transferTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  transferTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  emptyCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  emptyDesc: {
    fontSize: 13,
    color: color.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: space.md,
  },

  // Web3 Group Styles
  addWeb3HeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginLeft: 'auto',
  },
  addWeb3HeaderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DDD6FE',
  },
  emptyWeb3Row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
  },
  web3RowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWeb3Title: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    marginBottom: 2,
  },
  emptyWeb3Subtitle: {
    fontSize: 11,
    color: color.textMuted,
  },
  web3NetworkBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  web3NetworkBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  web3ActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  web3SyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  web3SyncBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: color.gain,
  },
  web3DeleteBtn: {
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
});
