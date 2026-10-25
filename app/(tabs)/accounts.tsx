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
import { AccountModal } from '../../src/components/modals/account-modal';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatDate } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BankMutationResult, AccountType } from '../../src/types';
import { color, space, radius, shadow } from '../../src/theme/tokens';

type TxFilter = 'ALL' | 'INCOME' | 'EXPENSE';

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
  } = useWealth();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
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
    return transactions.filter((tx) => tx.type === selectedTxFilter);
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

  const handleSimulateAndroidListener = () => {
    triggerHaptic('medium');
    const merchants = ['Kopi Kenangan Senopati', 'Fore Coffee Grand Indonesia', 'Point Coffee Sudirman', 'FamilyMart Thamrin'];
    const randomAmount = Math.floor(Math.random() * 45000) + 25000;
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const text = `Transaksi QRIS Rp ${randomAmount.toLocaleString('id-ID')} di ${randomMerchant} berhasil dari rekening BCA Tahapan`;

    setSimulatedNotification(text);
    setTimeout(() => {
      handleProcessMutation(text);
    }, 600);
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
        {accounts.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada rekening kas</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan rekening bank, rekening dana nasabah (RDN), atau dompet digital untuk memantau saldo likuid.
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

        {/* 4. ANDROID NOTIFICATION LISTENER SIMULATOR */}
        <GlassCard level="base" style={styles.simulatorCard}>
          <View style={styles.simulatorHeader}>
            <Icon name="BellRing" size={16} color={color.accent} />
            <Text style={styles.simulatorTitle}>Simulasi notifikasi Android</Text>
          </View>
          <Text style={styles.simulatorDesc}>
            Uji interseptor notifikasi otomatis saat transaksi QRIS atau SMS bank diterima.
          </Text>

          {simulatedNotification && (
            <View style={styles.simulatedBox}>
              <Text style={styles.simulatedText}>"{simulatedNotification}"</Text>
            </View>
          )}

          <Pressable
            onPress={handleSimulateAndroidListener}
            style={styles.simulatorButton}
          >
            <Text style={styles.simulatorButtonText}>Simulasi notifikasi QRIS masuk</Text>
          </Pressable>
        </GlassCard>

        {/* 5. RIWAYAT TRANSAKSI TERBARU (SINGLE CARD WITH ROWS SEPARATED BY HAIRLINE) */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionHeadline}>Riwayat mutasi</Text>

          {/* Mini Tx Filter */}
          <View style={styles.txFilterGroup}>
            {(['ALL', 'INCOME', 'EXPENSE'] as TxFilter[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedTxFilter(f);
                }}
                style={[
                  styles.txFilterBtn,
                  selectedTxFilter === f && styles.txFilterBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.txFilterBtnText,
                    selectedTxFilter === f && styles.txFilterBtnTextActive,
                  ]}
                >
                  {f === 'ALL' ? 'Semua' : f === 'INCOME' ? 'Masuk' : 'Keluar'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {filteredTransactions.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Belum ada riwayat transaksi kas.</Text>
          </GlassCard>
        ) : (
          <GlassCard level="base" noPadding style={styles.txCard}>
            {filteredTransactions.slice(0, 10).map((tx, index) => {
              const isInc = tx.type === 'INCOME';
              const isLast = index === Math.min(filteredTransactions.length, 10) - 1;
              return (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <Text style={styles.txDescription}>{tx.description}</Text>
                      <Text style={styles.txMeta}>
                        {formatDate(tx.transactionDate)} • {tx.accountName || 'Kas'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmountText,
                        isInc ? styles.textGain : styles.textLoss,
                      ]}
                    >
                      {isInc ? '▲ +' : '▼ −'}
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
    gap: space.xs + 2,
    marginBottom: 4,
  },
  simulatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  simulatorDesc: {
    fontSize: 12,
    color: color.textMuted,
    lineHeight: 17,
    marginBottom: space.md,
  },
  simulatedBox: {
    padding: space.sm,
    backgroundColor: color.glassFillInset,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.hairline,
    marginBottom: space.sm,
  },
  simulatedText: {
    fontSize: 11,
    color: color.accent,
    fontStyle: 'italic',
  },
  simulatorButton: {
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  simulatorButtonText: {
    fontSize: 12,
    color: color.text,
    fontWeight: '500',
  },

  // History
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txFilterGroup: {
    flexDirection: 'row',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: color.hairline,
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
});
