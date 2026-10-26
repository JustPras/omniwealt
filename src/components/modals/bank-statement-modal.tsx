import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { LiquidSegmentControl } from '../common/liquid-segment-control';
import { useWealth } from '../../store/wealth-context';
import { BankStatementParserService } from '../../services/bank-statement-parser-service';
import { BankStatementReconciliationService } from '../../services/bank-statement-reconciliation-service';
import { PDFExtractorService } from '../../services/pdf-extractor';
import {
  BankStatementParseResult,
  BankStatementMutation,
  Account,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow, font } from '../../theme/tokens';

export const STATEMENT_DEMO_PRESETS = [
  {
    id: 'preset-bca-sep',
    title: 'BCA Tahapan (e-Statement Sep 2026)',
    bank: 'BCA Tahapan',
    badge: '5 Transaksi • Seimbang',
    text: `
REKENING TAHAPAN BCA
NO. REKENING : 1234567890
PERIODE : SEPTEMBER 2026
SALDO AWAL : 10,500,000.00
02/09 TRSF E-BANKING CR 500,000.00 11,000,000.00
05/09 QRIS KOPI KENANGAN DB 48,500.00 10,951,500.00
12/09 BI-FAST DARI JAGO CR 1,000,000.00 11,951,500.00
30/09 BIAYA ADM DB 15,000.00 11,936,500.00
30/09 BUNGA TABUNGAN CR 2,500.00 11,939,000.00
SALDO AKHIR : 11,939,000.00
    `.trim(),
  },
  {
    id: 'preset-jago-kantong',
    title: 'Bank Jago (Kantong Utama Sep 2026)',
    bank: 'Bank Jago',
    badge: '4 Transaksi • Seimbang',
    text: `
Laporan Rekening Bank Jago
Nomor Kantong : 504012345678
Kantong : Kantong Utama
Periode : 1 Sep 2026 - 30 Sep 2026
Saldo Awal : Rp 2.500.000
02 Sep Uang Masuk dari BCA BI-FAST Rp 1.000.000 Rp 3.500.000
08 Sep Pembayaran QRIS F&B Rp 62.000 Rp 3.438.000
25 Sep Bunga Kantong Rp 15.200 Rp 3.453.200
28 Sep Top up RDN Stockbit Rp 1.000.000 Rp 2.453.200
Saldo Akhir : Rp 2.453.200
    `.trim(),
  },
  {
    id: 'preset-mandiri-livin',
    title: 'Mandiri Livin (e-Statement Sep 2026)',
    bank: "Mandiri Livin'",
    badge: '3 Transaksi • Seimbang',
    text: `
REKENING MANDIRI TABUNGAN
No. Rekening : 1370001234567
Saldo Awal : 5,000,000.00
04/09 TRF BI-FAST KE REK BCA 500,000.00 D 4,500,000.00
10/09 GAJI PT KARYA DIGITAL 6,000,000.00 K 10,500,000.00
30/09 BIAYA ADM BULANAN 12,500.00 D 10,487,500.00
Saldo Akhir : 10,487,500.00
    `.trim(),
  },
];

interface BankStatementModalProps {
  visible: boolean;
  onClose: () => void;
  defaultAccountId?: string;
}

type TabMode = 'PREVIEW' | 'INPUT_TEXT' | 'PRESETS';

export const BankStatementModal: React.FC<BankStatementModalProps> = ({
  visible,
  onClose,
  defaultAccountId,
}) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const { accounts, transactions, commitBankStatement, currency, usdRate } = useWealth();

  const [activeTab, setActiveTab] = useState<TabMode>('PRESETS');
  const [rawText, setRawText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parseResult, setParseResult] = useState<BankStatementParseResult | null>(null);
  const [reconciledResult, setReconciledResult] = useState<{
    reconciledMutations: BankStatementMutation[];
    newCount: number;
    duplicateCount: number;
  } | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultAccountId || accounts.find((a) => a.type === 'BANK')?.id || accounts[0]?.id || ''
  );
  const [commitSummary, setCommitSummary] = useState<string | null>(null);

  // Pick PDF file
  const handlePickDocument = async () => {
    try {
      triggerHaptic('selection');
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        setSelectedFileName(file.name);
        setIsExtracting(true);

        const extractedText = await PDFExtractorService.extractTextFromFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
        });

        setIsExtracting(false);
        if (extractedText && extractedText.trim()) {
          setRawText(extractedText);
          processStatementText(extractedText);
        }
      }
    } catch (err: any) {
      console.warn('Error picking document:', err);
      setIsExtracting(false);
    }
  };

  // Process text with BankStatementParserService
  const processStatementText = (text: string) => {
    if (!text.trim()) return;
    triggerHaptic('medium');

    const parsed = BankStatementParserService.parseBankStatement(text);
    setParseResult(parsed);

    // Auto-select target account if bank name matches
    const matchedAcc =
      accounts.find((a) => a.id === selectedAccountId) ||
      accounts.find((a) => a.name.toLowerCase().includes(parsed.bankName.toLowerCase())) ||
      accounts.find((a) => a.type === 'BANK') ||
      accounts[0];

    if (matchedAcc) {
      setSelectedAccountId(matchedAcc.id);
      const reconciled = BankStatementReconciliationService.reconcileWithLedger(
        parsed.mutations,
        matchedAcc,
        transactions
      );
      setReconciledResult(reconciled);
    }

    setActiveTab('PREVIEW');
  };

  const handleApplyPreset = (presetText: string) => {
    triggerHaptic('selection');
    setRawText(presetText);
    setSelectedFileName('Demo-Statement.pdf');
    processStatementText(presetText);
  };

  const handleCommit = async () => {
    if (!parseResult) return;
    setIsCommitting(true);
    triggerHaptic('medium');

    try {
      const res = await commitBankStatement(parseResult, selectedAccountId);
      setCommitSummary(res.summary);
      triggerHaptic('success');
    } catch (err: any) {
      console.warn('Failed to commit statement:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer} noPadding>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.headerTitleRow}>
                  <View style={styles.headerIconCircle}>
                    <Icon name="FileText" size={16} color="#38BDF8" />
                  </View>
                  <Text style={styles.headerTitle}>Import Rekening Koran</Text>
                  <View style={styles.pilarBadge}>
                    <Text style={styles.pilarBadgeText}>Pilar 3</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>
                  e-Statement PDF Bulanan • Rekonsiliasi Saldo & Anti-Duplikat
                </Text>
              </View>

              <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
                <Icon name="X" size={16} color={color.textMuted} />
              </Pressable>
            </View>

            {/* Segment Controls */}
            <View style={styles.segmentWrapper}>
              <LiquidSegmentControl<TabMode>
                items={[
                  { key: 'PRESETS', label: 'Preset Demo' },
                  { key: 'INPUT_TEXT', label: 'Upload / Tempel' },
                  { key: 'PREVIEW', label: 'Hasil Rekonsiliasi' },
                ]}
                activeKey={activeTab}
                onSelect={(k) => {
                  triggerHaptic('light');
                  setActiveTab(k);
                }}
                height={34}
                fontSize={11}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* TAB 1: PRESETS */}
              {activeTab === 'PRESETS' && (
                <View style={styles.tabBody}>
                  <Text style={styles.sectionHeader}>Uji Langsung Rekening Koran Bank Nyata:</Text>
                  <Text style={styles.sectionSubDesc}>
                    Sentuh salah satu preset untuk menguji parsing PDF, rekonsiliasi matematis, dan deteksi transaksi terlewat:
                  </Text>

                  <View style={styles.presetsList}>
                    {STATEMENT_DEMO_PRESETS.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => handleApplyPreset(p.text)}
                        style={styles.presetCard}
                      >
                        <View style={styles.presetCardHeader}>
                          <Text style={styles.presetCardTitle}>{p.title}</Text>
                          <View style={styles.presetBadge}>
                            <Text style={styles.presetBadgeText}>{p.badge}</Text>
                          </View>
                        </View>
                        <Text style={styles.presetSnippet} numberOfLines={3}>
                          {p.text}
                        </Text>
                        <View style={styles.presetActionRow}>
                          <Text style={styles.presetActionText}>Uji Rekonsiliasi e-Statement ➔</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* TAB 2: UPLOAD / TEMPEL */}
              {activeTab === 'INPUT_TEXT' && (
                <View style={styles.tabBody}>
                  {/* Upload PDF Box */}
                  <Pressable
                    disabled={isExtracting}
                    onPress={handlePickDocument}
                    style={styles.uploadDropZone}
                  >
                    {isExtracting ? (
                      <ActivityIndicator color="#38BDF8" size="small" />
                    ) : (
                      <>
                        <View style={styles.uploadIconCircle}>
                          <Icon name="UploadCloud" size={20} color="#38BDF8" />
                        </View>
                        <Text style={styles.uploadTitle}>
                          {selectedFileName ? `Berkas: ${selectedFileName}` : 'Pilih Berkas e-Statement PDF'}
                        </Text>
                        <Text style={styles.uploadSub}>
                          Mendukung PDF resmi m-BCA, Mandiri Livin, BRImo, dan Bank Jago
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Text style={styles.sectionDividerText}>— ATAU TEMPEL TEKS MUTASI —</Text>

                  <TextInput
                    style={styles.textInputBox}
                    placeholder="Salin dan tempel tabel mutasi dari pembaca PDF di sini..."
                    placeholderTextColor={color.textFaint}
                    multiline
                    numberOfLines={6}
                    value={rawText}
                    onChangeText={setRawText}
                  />

                  <Pressable
                    disabled={!rawText.trim()}
                    onPress={() => processStatementText(rawText)}
                    style={[
                      styles.processBtn,
                      !rawText.trim() && styles.disabledButton,
                    ]}
                  >
                    <Icon name="Check" size={14} color="#fff" />
                    <Text style={styles.processBtnText}>Mulai Rekonsiliasi Statement</Text>
                  </Pressable>
                </View>
              )}

              {/* TAB 3: PREVIEW & RECONCILIATION RESULT */}
              {activeTab === 'PREVIEW' && (
                <View style={styles.tabBody}>
                  {!parseResult ? (
                    <View style={styles.emptyPreviewBox}>
                      <Icon name="FileText" size={28} color={color.textMuted} />
                      <Text style={styles.emptyPreviewTitle}>Belum Ada Statement Diproses</Text>
                      <Text style={styles.emptyPreviewDesc}>
                        Silakan pilih salah satu preset di tab "Preset Demo" atau upload berkas PDF rekening koran Anda.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Statement Header Card */}
                      <View style={styles.resultHeaderCard}>
                        <View style={styles.bankTagRow}>
                          <View style={styles.bankBadge}>
                            <Text style={styles.bankBadgeText}>{parseResult.bankName}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              parseResult.status === 'VERIFIED'
                                ? styles.statusBadgeVerified
                                : styles.statusBadgeReview,
                            ]}
                          >
                            <Icon
                              name={parseResult.status === 'VERIFIED' ? 'Check' : 'AlertCircle'}
                              size={11}
                              color={parseResult.status === 'VERIFIED' ? color.gain : '#F59E0B'}
                            />
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color:
                                    parseResult.status === 'VERIFIED'
                                      ? color.gain
                                      : '#F59E0B',
                                },
                              ]}
                            >
                              {parseResult.status === 'VERIFIED'
                                ? '✓ Rekonsiliasi Seimbang'
                                : '⚠️ Perlu Ditinjau'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.periodText}>
                          Periode: {parseResult.periodStart || 'Bulan Ini'}{' '}
                          {parseResult.periodEnd ? `- ${parseResult.periodEnd}` : ''} • Rek: {parseResult.accountNumber}
                        </Text>

                        {/* Balance Metrics Grid */}
                        <View style={styles.metricGrid}>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Saldo Awal</Text>
                            <Text style={styles.metricVal}>
                              {formatCurrency(parseResult.openingBalance, currency, usdRate)}
                            </Text>
                          </View>

                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Total Masuk</Text>
                            <Text style={[styles.metricVal, { color: color.gain }]}>
                              +{formatCurrency(parseResult.totalInflow, currency, usdRate)}
                            </Text>
                          </View>

                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Total Keluar</Text>
                            <Text style={[styles.metricVal, { color: '#F87171' }]}>
                              -{formatCurrency(parseResult.totalOutflow, currency, usdRate)}
                            </Text>
                          </View>

                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Saldo Akhir</Text>
                            <Text style={[styles.metricVal, { color: '#38BDF8' }]}>
                              {formatCurrency(parseResult.closingBalance, currency, usdRate)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Deduplication Summary Bar */}
                      {reconciledResult && (
                        <View style={styles.dedupBar}>
                          <View style={styles.dedupPillNew}>
                            <Text style={styles.dedupTextNew}>
                              ● {reconciledResult.newCount} Mutasi Baru
                            </Text>
                          </View>
                          <View style={styles.dedupPillDup}>
                            <Text style={styles.dedupTextDup}>
                              ○ {reconciledResult.duplicateCount} Duplikat Dilewati
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Account Target Selector */}
                      <Text style={styles.sectionHeader}>Rekening Target di OmniWealth:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accChipScroll}>
                        {accounts.map((acc) => {
                          const isSelected = acc.id === selectedAccountId;
                          return (
                            <Pressable
                              key={acc.id}
                              onPress={() => {
                                triggerHaptic('selection');
                                setSelectedAccountId(acc.id);
                                if (parseResult) {
                                  const r = BankStatementReconciliationService.reconcileWithLedger(
                                    parseResult.mutations,
                                    acc,
                                    transactions
                                  );
                                  setReconciledResult(r);
                                }
                              }}
                              style={[styles.accChip, isSelected && styles.accChipSelected]}
                            >
                              <View style={[styles.accDot, { backgroundColor: acc.color }]} />
                              <Text
                                style={[styles.accChipText, isSelected && styles.accChipTextSelected]}
                              >
                                {acc.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>

                      {/* Mutations List */}
                      <Text style={styles.sectionHeader}>
                        Rincian Baris Mutasi ({parseResult.mutations.length}):
                      </Text>

                      <View style={styles.mutationList}>
                        {(reconciledResult ? reconciledResult.reconciledMutations : parseResult.mutations).map(
                          (m) => {
                            const isInc = m.type === 'INCOME';
                            const isDup = m.status === 'DUPLICATE_SKIPPED';
                            return (
                              <View
                                key={m.id}
                                style={[styles.mutRow, isDup && styles.mutRowDuplicate]}
                              >
                                <View style={styles.mutLeft}>
                                  <View style={styles.mutTagRow}>
                                    <Text style={styles.mutDate}>{m.rawDate}</Text>
                                    <View style={styles.mutCatBadge}>
                                      <Text style={styles.mutCatText}>{m.category}</Text>
                                    </View>
                                    {isDup && (
                                      <View style={styles.dupBadge}>
                                        <Text style={styles.dupBadgeText}>Duplikat</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.mutDesc}>{m.description}</Text>
                                </View>

                                <View style={styles.mutRight}>
                                  <Text
                                    style={[
                                      styles.mutAmount,
                                      isInc ? styles.textIncome : styles.textExpense,
                                      isDup && styles.textMutedDup,
                                    ]}
                                  >
                                    {isInc ? '+' : '-'}
                                    {formatCurrency(m.amount, currency, usdRate)}
                                  </Text>
                                  {m.balance !== undefined && (
                                    <Text style={styles.mutBalanceSub}>
                                      Saldo: {formatCurrency(m.balance, currency, usdRate)}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            );
                          }
                        )}
                      </View>

                      {/* Commit Success Summary Notice */}
                      {commitSummary && (
                        <View style={styles.commitNotice}>
                          <Icon name="Check" size={14} color={color.gain} />
                          <Text style={styles.commitNoticeText}>{commitSummary}</Text>
                        </View>
                      )}

                      {/* Commit Button */}
                      <Pressable
                        disabled={isCommitting}
                        onPress={handleCommit}
                        style={[styles.commitBtn, isCommitting && styles.disabledButton]}
                      >
                        {isCommitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Icon name="Check" size={15} color="#fff" />
                            <Text style={styles.commitBtnText}>
                              Komit ke Buku Kas (
                              {reconciledResult ? reconciledResult.newCount : parseResult.mutations.length}{' '}
                              Mutasi Baru)
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    width: '100%',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 24, 0.96)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  pilarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pilarBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentWrapper: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  scrollBody: {
    padding: space.md,
    paddingBottom: space.xl,
  },
  tabBody: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
    marginTop: 6,
  },
  sectionSubDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 16,
  },
  presetsList: {
    gap: 10,
    marginTop: 4,
  },
  presetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.lg,
    padding: space.md,
  },
  presetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetCardTitle: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  presetBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
  },
  presetBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    color: '#A78BFA',
  },
  presetSnippet: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    color: color.textMuted,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: space.xs,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  presetActionRow: {
    alignItems: 'flex-end',
  },
  presetActionText: {
    fontSize: 11,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
  },
  uploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    gap: 8,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  uploadSub: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    textAlign: 'center',
  },
  sectionDividerText: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.textFaint,
    textAlign: 'center',
    letterSpacing: 0.6,
    marginVertical: 4,
  },
  textInputBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    padding: space.md,
    color: color.text,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    minHeight: 120,
    textAlignVertical: 'top',
  },
  processBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: color.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 6,
  },
  processBtnText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.onAccent,
  },
  disabledButton: {
    opacity: 0.4,
  },
  emptyPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xl,
    gap: 8,
  },
  emptyPreviewTitle: {
    fontSize: 14,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.textMuted,
  },
  emptyPreviewDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textFaint,
    textAlign: 'center',
    paddingHorizontal: space.lg,
    lineHeight: 16,
  },
  resultHeaderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.lg,
    padding: space.md,
  },
  bankTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  bankBadgeText: {
    fontSize: 11,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBadgeVerified: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  statusBadgeReview: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
  },
  periodText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    width: '48%',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textFaint,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontFamily: font.num,
    fontWeight: '700',
    color: color.text,
  },
  dedupBar: {
    flexDirection: 'row',
    gap: 8,
  },
  dedupPillNew: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dedupTextNew: {
    fontSize: 10,
    fontFamily: font.uiBold,
    color: '#38BDF8',
  },
  dedupPillDup: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dedupTextDup: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  accChipScroll: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  accChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 6,
  },
  accChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: '#38BDF8',
  },
  accDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  accChipText: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    color: color.textMuted,
  },
  accChipTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  mutationList: {
    gap: 8,
  },
  mutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  mutRowDuplicate: {
    opacity: 0.45,
    backgroundColor: 'transparent',
  },
  mutLeft: {
    flex: 1,
    marginRight: 8,
  },
  mutTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mutDate: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    color: color.textFaint,
  },
  mutCatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  mutCatText: {
    fontSize: 9,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  dupBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  dupBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    color: '#F59E0B',
  },
  mutDesc: {
    fontSize: 12,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.text,
  },
  mutRight: {
    alignItems: 'flex-end',
  },
  mutAmount: {
    fontSize: 12,
    fontFamily: font.num,
    fontWeight: '700',
  },
  textIncome: {
    color: color.gain,
  },
  textExpense: {
    color: '#F87171',
  },
  textMutedDup: {
    color: color.textFaint,
  },
  mutBalanceSub: {
    fontSize: 9,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    color: color.textFaint,
  },
  commitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  commitNoticeText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.gain,
    flex: 1,
  },
  commitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: color.accent,
    paddingVertical: 13,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  commitBtnText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.onAccent,
  },
});
