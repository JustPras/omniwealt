import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
import { BankMutationResult, Account } from '../../src/types';

export default function AccountsScreen() {
  const { accounts, transactions, applyMutationText, totalCash } = useWealth();

  // Modals state
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [mutationModalVisible, setMutationModalVisible] = useState(false);
  const [activeAccountForMutation, setActiveAccountForMutation] = useState<string | undefined>(undefined);
  const [mutationType, setMutationType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Smart Parser state
  const [parserText, setParserText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<BankMutationResult | null>(null);

  // Background Simulator state
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  const PRESETS = [
    {
      id: 'p1',
      title: 'QRIS Kopi Kenangan',
      text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
    },
    {
      id: 'p2',
      title: 'BI-FAST Gaji',
      text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
    },
    {
      id: 'p3',
      title: 'Top Up RDN',
      text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
    },
  ];

  const handleProcessMutation = async (customText?: string) => {
    const textToRun = customText || parserText;
    if (!textToRun.trim()) return;

    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const res = await applyMutationText(textToRun);
      setParseResult(res);
      setParserText('');
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateAndroidListener = () => {
    triggerHaptic('heavy');
    const randomAmount = Math.floor(Math.random() * 40 + 25) * 1000;
    const merchants = ['Janji Jiwa', 'Alfamart Senopati', 'Mixue Sudirman', 'Kantin Mega'];
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const text = `Transaksi QRIS Rp ${randomAmount.toLocaleString('id-ID')} di ${randomMerchant} berhasil dari rekening BCA Tahapan`;

    setSimulatedNotification(text);
    // Auto-process as if intercepted in background
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Liquidity Pod */}
        <GlassCard style={styles.liquidityHeroCard} borderTint="rgba(16, 185, 129, 0.25)">
          <View style={styles.liquidityHeader}>
            <View>
              <Text style={styles.liquidityLabel}>TOTAL LIKUIDITAS KAS & RDN</Text>
              <PrivacyValue value={totalCash} style={styles.liquidityAmount} />
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('medium');
                setAccountModalVisible(true);
              }}
              style={styles.addAccountBtn}
              activeOpacity={0.8}
            >
              <Icon name="Plus" size={14} color="#080C14" />
              <Text style={styles.addAccountBtnText}>Tambah Rekening</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* BANK & RDN ACCOUNTS LIST */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Daftar Rekening & Dompet Digital</Text>
          <Text style={styles.sectionSubtitle}>{accounts.length} Akun Terdaftar</Text>
        </View>

        <View style={styles.accountList}>
          {accounts.map((acc) => (
            <GlassCard key={acc.id} style={styles.accountCard} borderTint="rgba(255, 255, 255, 0.1)">
              <View style={styles.accountTopRow}>
                <View style={styles.accountLeft}>
                  <View style={[styles.accountIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                    {acc.type === 'BANK' && <Icon name="Landmark" size={18} color="#38BDF8" />}
                    {acc.type === 'RDN' && <Icon name="TrendingUp" size={18} color="#10B981" />}
                    {acc.type === 'E-WALLET' && <Icon name="Smartphone" size={18} color="#06B6D4" />}
                  </View>
                  <View>
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
                  activeOpacity={0.7}
                >
                  <Icon name="ArrowDownLeft" size={12} color="#10B981" />
                  <Text style={[styles.smallAdjustText, { color: '#10B981' }]}>+ Pemasukan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openMutationModal(acc.id, 'EXPENSE')}
                  style={[styles.smallAdjustBtn, styles.expenseAdjustBtn]}
                  activeOpacity={0.7}
                >
                  <Icon name="ArrowUpRight" size={12} color="#F43F5E" />
                  <Text style={[styles.smallAdjustText, { color: '#F43F5E' }]}>- Pengeluaran</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* SMART AI NOTIFICATION & QRIS MUTASI PARSER */}
        <GlassCard style={styles.aiParserCard} borderTint="rgba(56, 189, 248, 0.25)">
          <View style={styles.aiParserHeader}>
            <View style={styles.aiHeaderTitle}>
              <Icon name="Sparkles" size={18} color="#38BDF8" />
              <Text style={styles.aiTitle}>Smart Android Mutasi & QRIS Parser</Text>
            </View>
            <View style={styles.aiEngineTag}>
              <Text style={styles.aiEngineTagText}>Gemini Flash + Local Regex</Text>
            </View>
          </View>

          <Text style={styles.aiInstruction}>
            Tempel teks notifikasi SMS, WhatsApp, atau QRIS dari bank Anda untuk potong/tambah saldo instan:
          </Text>

          {/* 3 REQUIRED PRESET BUTTONS (1-CLICK TEST) */}
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
                activeOpacity={0.7}
              >
                <Icon name="Zap" size={11} color="#F59E0B" />
                <Text style={styles.presetChipText}>{p.title}</Text>
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
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color="#080C14" size="small" />
            ) : (
              <Text style={styles.aiProcessBtnText}>⚡ Proses & Perbarui Saldo</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* ANDROID NOTIFICATION LISTENER SIMULATOR */}
        <GlassCard style={styles.listenerCard} borderTint="rgba(245, 158, 11, 0.25)">
          <View style={styles.listenerHeader}>
            <View style={styles.listenerIcon}>
              <Icon name="BellRing" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listenerTitle}>Android Notification Interceptor</Text>
              <Text style={styles.listenerSubtitle}>
                Simulasi listener otomatis latar belakang saat ada transaksi QRIS / SMS masuk
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
            activeOpacity={0.8}
          >
            <Icon name="Zap" size={14} color="#080C14" />
            <Text style={styles.simulateActionBtnText}>Simulasi Notifikasi QRIS Masuk</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* RECENT TRANSACTIONS HISTORY */}
        <View style={styles.sectionTitleRow}>
          <View style={styles.historyTitleRow}>
            <Icon name="History" size={16} color="#94A3B8" />
            <Text style={styles.sectionTitle}>Riwayat Transaksi Terbaru</Text>
          </View>
        </View>

        <View style={styles.txList}>
          {transactions.slice(0, 10).map((tx) => {
            const isInc = tx.type === 'INCOME';
            const isTrans = tx.type === 'TRANSFER';
            return (
              <GlassCard key={tx.id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconBadge,
                      isInc ? styles.txBadgeGreen : isTrans ? styles.txBadgeSky : styles.txBadgeRed,
                    ]}
                  >
                    {isInc ? (
                      <Icon name="ArrowDownLeft" size={14} color="#10B981" />
                    ) : isTrans ? (
                      <Icon name="TrendingUp" size={14} color="#38BDF8" />
                    ) : (
                      <Icon name="ArrowUpRight" size={14} color="#F43F5E" />
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
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 16,
  },
  liquidityHeroCard: {
    padding: 18,
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
    marginTop: 4,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  addAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  accountList: {
    gap: 10,
  },
  accountCard: {
    borderRadius: 20,
    padding: 14,
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 14,
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
    fontWeight: '700',
    color: '#F8FAFC',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  smallAdjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  incomeAdjustBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  expenseAdjustBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  smallAdjustText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiParserCard: {
    borderRadius: 22,
    padding: 16,
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
    gap: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  aiEngineTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  aiEngineTagText: {
    fontSize: 9,
    fontWeight: '600',
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
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  aiInputArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  resultSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  aiProcessBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  aiProcessBtnText: {
    color: '#080C14',
    fontWeight: '700',
    fontSize: 13,
  },
  listenerCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  listenerHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  simulatedText: {
    fontSize: 11,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  simulateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 11,
  },
  simulateActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080C14',
  },
  txList: {
    gap: 8,
  },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  txBadgeSky: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  txBadgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  txMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  txSourceTag: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
  },
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#F43F5E',
  },
});
