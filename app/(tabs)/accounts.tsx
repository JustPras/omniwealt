import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { AccountModal } from '../../src/components/modals/account-modal';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatDate } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BankMutationResult, AccountType } from '../../src/types';

type AccountFilter = 'ALL' | 'BANK' | 'RDN' | 'E-WALLET';
type TxFilter = 'ALL' | 'INCOME' | 'EXPENSE';

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
  const [selectedAccFilter, setSelectedAccFilter] = useState<AccountFilter>('ALL');
  const [selectedTxFilter, setSelectedTxFilter] = useState<TxFilter>('ALL');

  // AI Parser state
  const [parserText, setParserText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<BankMutationResult | null>(null);

  // Background Simulator state
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  const PRESETS = [
    {
      id: 'p1',
      title: 'QRIS Kopi Kenangan',
      amount: 'Rp 48.500',
      tag: 'BCA Tahapan',
      text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
    },
    {
      id: 'p2',
      title: 'BI-FAST Gaji Bulanan',
      amount: 'Rp 2.500.000',
      tag: 'Mandiri Livin',
      text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
    },
    {
      id: 'p3',
      title: 'Top Up RDN Stockbit',
      amount: 'Rp 1.000.000',
      tag: 'BCA Tahapan',
      text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
    },
  ];

  const filteredAccounts = accounts.filter((acc) => {
    if (selectedAccFilter === 'ALL') return true;
    return acc.type === selectedAccFilter;
  });

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedTxFilter === 'ALL') return true;
    return tx.type === selectedTxFilter;
  });

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
    triggerHaptic('heavy');
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

  return (
    <View style={styles.screenContainer}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? 12 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Liquidity Pod */}
        <GlassCard
          style={styles.liquidityHeroCard}
          borderTint="rgba(16, 185, 129, 0.25)"
          gradientColors={['rgba(16, 185, 129, 0.10)', 'rgba(15, 23, 42, 0.55)']}
        >
          <View style={styles.liquidityHeader}>
            <View>
              <Text style={styles.liquidityLabel}>TOTAL LIKUIDITAS KAS & RDN</Text>
              <PrivacyValue value={totalCash} style={styles.liquidityAmount} />
              <Text style={styles.liquiditySubtitle}>{accounts.length} rekening aktif terhubung</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                setAccountModalVisible(true);
              }}
              style={styles.addAccountBtn}
              activeOpacity={0.7}
            >
              <Icon name="Plus" size={13} color="#080C14" />
              <Text style={styles.addAccountBtnText}>+ Akun Baru</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* BANK & RDN ACCOUNTS LIST WITH RESPONSIVE FILTER CHIPS */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Rekening & Dompet Digital</Text>
          <Text style={styles.sectionSubtitle}>{filteredAccounts.length} Akun</Text>
        </View>

        {/* Filter Chips Bar */}
        <View style={styles.accountFilterRow}>
          {(['ALL', 'BANK', 'RDN', 'E-WALLET'] as AccountFilter[]).map((filter) => {
            const isActive = selectedAccFilter === filter;
            const count = filter === 'ALL'
              ? accounts.length
              : accounts.filter((a) => a.type === filter).length;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAccFilter(filter);
                }}
                activeOpacity={0.65}
                style={[styles.accFilterChip, isActive && styles.activeAccFilterChip]}
              >
                <Text style={[styles.accFilterChipText, isActive && styles.activeAccFilterChipText]}>
                  {filter === 'ALL' ? 'Semua' : filter} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Account Cards */}
        <View style={styles.accountList}>
          {filteredAccounts.map((acc) => (
            <GlassCard
              key={acc.id}
              style={styles.accountCard}
              borderTint="rgba(255, 255, 255, 0.10)"
            >
              <View style={styles.accountTopRow}>
                <View style={styles.accountLeft}>
                  <View
                    style={[
                      styles.accountIconBadge,
                      {
                        backgroundColor:
                          acc.type === 'BANK'
                            ? 'rgba(56, 189, 248, 0.12)'
                            : acc.type === 'RDN'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(6, 182, 212, 0.12)',
                      },
                    ]}
                  >
                    {acc.type === 'BANK' && <Icon name="Landmark" size={18} color="#38BDF8" />}
                    {acc.type === 'RDN' && <Icon name="TrendingUp" size={18} color="#10B981" />}
                    {acc.type === 'E-WALLET' && <Icon name="Smartphone" size={18} color="#06B6D4" />}
                  </View>
                  <View style={styles.accountTextContainer}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountNumber}>
                      {acc.type} • {acc.accountNumber || 'Aktif'}
                    </Text>
                  </View>
                </View>

                <View style={styles.accountRight}>
                  <PrivacyValue value={acc.balance} style={styles.accountBalance} />
                </View>
              </View>

              {/* Quick Adjustment Buttons */}
              <View style={styles.quickButtonsRow}>
                <TouchableOpacity
                  onPress={() => openMutationModal(acc.id, 'INCOME')}
                  style={[styles.smallAdjustBtn, styles.incomeAdjustBtn]}
                  activeOpacity={0.65}
                >
                  <Icon name="ArrowDownLeft" size={12} color="#10B981" />
                  <Text style={[styles.smallAdjustText, { color: '#10B981' }]}>+ Pemasukan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openMutationModal(acc.id, 'EXPENSE')}
                  style={[styles.smallAdjustBtn, styles.expenseAdjustBtn]}
                  activeOpacity={0.65}
                >
                  <Icon name="ArrowUpRight" size={12} color="#F43F5E" />
                  <Text style={[styles.smallAdjustText, { color: '#F43F5E' }]}>- Pengeluaran</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* SMART AI NOTIFICATION & QRIS MUTASI PARSER */}
        <GlassCard
          style={styles.aiParserCard}
          borderTint="rgba(56, 189, 248, 0.22)"
          gradientColors={['rgba(56, 189, 248, 0.08)', 'rgba(15, 23, 42, 0.50)']}
        >
          <View style={styles.aiParserHeader}>
            <View style={styles.aiHeaderTitle}>
              <Icon name="Sparkles" size={17} color="#38BDF8" />
              <Text style={styles.aiTitle}>Smart Android Mutasi & QRIS Parser</Text>
            </View>
            <View style={styles.aiEngineTag}>
              <Text style={styles.aiEngineTagText}>Gemini + Regex</Text>
            </View>
          </View>

          <Text style={styles.aiInstruction}>
            Pilih preset instan di bawah atau tempel teks SMS/QRIS bank Anda:
          </Text>

          {/* 3 PRESET BUTTONS (RESPONSIVE CHIPS) */}
          <View style={styles.presetGrid}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setParserText(p.text);
                  setParseResult(null);
                }}
                style={styles.presetChip}
                activeOpacity={0.65}
              >
                <View style={styles.presetChipTop}>
                  <Icon name="Zap" size={11} color="#F59E0B" />
                  <Text style={styles.presetChipTitle}>{p.title}</Text>
                </View>
                <Text style={styles.presetChipAmount}>{p.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Multiline Input */}
          <TextInput
            style={styles.aiInputArea}
            placeholder="Ketik atau tempel teks notifikasi mutasi bank..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
            value={parserText}
            onChangeText={(t) => {
              setParserText(t);
              setParseResult(null);
            }}
          />

          {/* Parse Result Feedback Banner */}
          {parseResult && (
            <View style={styles.resultBanner}>
              <Icon name="CheckCircle2" size={16} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>
                  {parseResult.type}: {formatIDR(parseResult.amount)}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {parseResult.bankName} • {parseResult.category} ({parseResult.merchantOrSender || 'Berhasil'})
                </Text>
              </View>
            </View>
          )}

          {/* Process Button */}
          <TouchableOpacity
            onPress={() => handleProcessMutation()}
            disabled={isProcessing || !parserText.trim()}
            style={[styles.aiProcessBtn, (!parserText.trim() || isProcessing) && styles.disabledBtn]}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color="#080C14" size="small" />
            ) : (
              <Text style={styles.aiProcessBtnText}>⚡ Proses & Perbarui Saldo</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* ANDROID NOTIFICATION LISTENER SIMULATOR */}
        <GlassCard
          style={styles.listenerCard}
          borderTint="rgba(245, 158, 11, 0.22)"
          gradientColors={['rgba(245, 158, 11, 0.08)', 'rgba(15, 23, 42, 0.50)']}
        >
          <View style={styles.listenerHeader}>
            <View style={styles.listenerIcon}>
              <Icon name="BellRing" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listenerTitle}>Android Notification Interceptor</Text>
              <Text style={styles.listenerSubtitle}>
                Simulasi listener otomatis saat transaksi QRIS / SMS masuk
              </Text>
            </View>
          </View>

          {simulatedNotification && (
            <View style={styles.simulatedBox}>
              <Text style={styles.simulatedText}>"{simulatedNotification}"</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSimulateAndroidListener}
            style={styles.simulateActionBtn}
            activeOpacity={0.7}
          >
            <Icon name="Zap" size={13} color="#080C14" />
            <Text style={styles.simulateActionBtnText}>Simulasi Notifikasi QRIS Masuk</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* RECENT TRANSACTIONS HISTORY WITH TYPE FILTER */}
        <View style={styles.sectionTitleRow}>
          <View style={styles.historyTitleRow}>
            <Icon name="History" size={15} color="#94A3B8" />
            <Text style={styles.sectionTitle}>Riwayat Transaksi Terbaru</Text>
          </View>

          {/* Mini Tx Filter */}
          <View style={styles.txFilterGroup}>
            {(['ALL', 'INCOME', 'EXPENSE'] as TxFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedTxFilter(f);
                }}
                activeOpacity={0.65}
                style={[styles.txFilterBtn, selectedTxFilter === f && styles.txFilterBtnActive]}
              >
                <Text style={[styles.txFilterBtnText, selectedTxFilter === f && styles.txFilterBtnTextActive]}>
                  {f === 'ALL' ? 'Semua' : f === 'INCOME' ? 'Masuk' : 'Keluar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.txList}>
          {filteredTransactions.slice(0, 10).map((tx) => {
            const isInc = tx.type === 'INCOME';
            const isTrans = tx.type === 'TRANSFER';
            return (
              <GlassCard
                key={tx.id}
                style={styles.txCard}
                borderTint="rgba(255, 255, 255, 0.08)"
              >
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconBadge,
                      isInc ? styles.txBadgeGreen : isTrans ? styles.txBadgeSky : styles.txBadgeRed,
                    ]}
                  >
                    {isInc ? (
                      <Icon name="ArrowDownLeft" size={13} color="#10B981" />
                    ) : isTrans ? (
                      <Icon name="TrendingUp" size={13} color="#38BDF8" />
                    ) : (
                      <Icon name="ArrowUpRight" size={13} color="#F43F5E" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.accountName || 'Akun'} • {tx.category} • {formatDate(tx.transactionDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRight}>
                  <PrivacyValue
                    value={tx.amount}
                    prefix={isInc ? '+ ' : '- '}
                    style={[styles.txAmount, isInc ? styles.textGreen : styles.textRed]}
                  />
                  <Text style={styles.txSourceTag}>{tx.source}</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Account Creation Modal */}
      <AccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
      />

      {/* Cash Mutation Modal */}
      <CashMutationModal
        visible={mutationModalVisible}
        onClose={() => setMutationModalVisible(false)}
        defaultAccountId={activeAccountForMutation}
        defaultType={mutationType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 14,
  },
  liquidityHeroCard: {
    borderRadius: 24,
  },
  liquidityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liquidityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.1,
  },
  liquidityAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 3,
  },
  liquiditySubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#38BDF8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addAccountBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080C14',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  accountFilterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  accFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeAccFilterChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  accFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  activeAccFilterChipText: {
    color: '#38BDF8',
  },
  accountList: {
    gap: 8,
  },
  accountCard: {
    borderRadius: 20,
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accountIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextContainer: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  accountNumber: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  smallAdjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  incomeAdjustBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },
  expenseAdjustBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.22)',
  },
  smallAdjustText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aiParserCard: {
    borderRadius: 22,
  },
  aiParserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  aiEngineTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  aiEngineTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  aiInstruction: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.20)',
    justifyContent: 'space-between',
  },
  presetChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  presetChipTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  presetChipAmount: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  aiInputArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    color: '#F8FAFC',
    padding: 10,
    fontSize: 12,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  resultSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  aiProcessBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  aiProcessBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080C14',
  },
  listenerCard: {
    borderRadius: 22,
  },
  listenerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  listenerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  listenerSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  simulatedBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderRadius: 10,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginBottom: 8,
  },
  simulatedText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontStyle: 'italic',
  },
  simulateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 9,
  },
  simulateActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080C14',
  },
  txFilterGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  txFilterBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  txFilterBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  txFilterBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  txFilterBtnTextActive: {
    color: '#38BDF8',
  },
  txList: {
    gap: 6,
  },
  txCard: {
    borderRadius: 16,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  txBadgeSky: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  txBadgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  txDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  txMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  txSourceTag: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1,
  },
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#F43F5E',
  },
});
