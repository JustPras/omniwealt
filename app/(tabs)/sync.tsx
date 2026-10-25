import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Switch,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { AIParserService } from '../../src/services/ai-parser';
import { PDFExtractorService } from '../../src/services/pdf-extractor';
import { color, space, radius, shadow } from '../../src/theme/tokens';
import { IngestionPayload } from '../../src/types/rdn-pipeline';

export default function SyncScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const {
    accounts,
    processRDNIngestion,
    stagingBatches,
    activeStagingBatch,
    setActiveStagingBatch,
    commitRDNStagingBatch,
    discardRDNStagingBatch,
    toggleAccountAutoCommit,
  } = useWealth();

  const [pdfPassword, setPdfPassword] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isEncryptedPdf, setIsEncryptedPdf] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'EMAIL_WEBHOOK'>('MANUAL');
  const [webhookSender, setWebhookSender] = useState('statement@stockbit.com');

  const rdnAccount =
    accounts.find((a) => a.type === 'RDN') ||
    accounts[0];

  // Generic Broker Simulation Presets
  const SIMULATION_PRESETS = [
    {
      id: 'sim1',
      title: 'Stockbit SoA Statement (T+2 Cash & Holdings)',
      desc: 'Top-up Rp 10.000.000, BUY 10 lot BBRI @ Rp 4.750, Saldo Akhir Rp 5.242.875',
      broker: 'PT Stockbit Sekuritas Digital',
      rawText: `
STATEMENT OF ACCOUNT
PT Stockbit Sekuritas Digital
Client 12345678 INVESTOR NASABAH
Bank RDN: JAGO 1029384756
Saldo Awal: 0
2026-10-15 TOP UP RDN 10,000,000 CR 10,000,000
2026-10-16 BUY 10 lot BBRI @ 4750 4,757,125 DB 5,242,875
Saldo Akhir: 5,242,875
      `,
    },
    {
      id: 'sim2',
      title: 'Ajaib Trade Confirmation (T+0 Buy Slip)',
      desc: 'Beli 20 lot TLKM @ Rp 2.950 & Beli 10 lot BBRI @ Rp 4.750',
      broker: 'Ajaib Sekuritas',
      rawText: `
TRADE CONFIRMATION
Ajaib Sekuritas
Trade Date: 2026-10-21
TLKM BUY 20 lot 2950
BBRI BUY 10 lot 4750
      `,
    },
  ];

  // Pipeline Ingestion Trigger
  const handleRunPipelineIngestion = async (
    contentText: string,
    fileName: string,
    source: IngestionPayload['source'] = 'MANUAL_UPLOAD',
    senderEmail?: string
  ) => {
    setIsExtracting(true);
    setConfirmationNotice(null);
    try {
      const batch = await processRDNIngestion({
        source,
        account_id: rdnAccount?.id || accounts[0]?.id || 'rdn-acc',
        file_name: fileName,
        content_text: contentText,
        pdf_password: pdfPassword || undefined,
        sender_email: senderEmail,
      });

      triggerHaptic(batch.status === 'VERIFIED' ? 'success' : 'warning');
      setSelectedFileName(fileName);
      if (batch.status === 'COMMITTED') {
        setConfirmationNotice(
          `Batch ${batch.institution} dari Email Webhook terverifikasi seimbang dan berhasil di-commit otomatis ke buku besar!`
        );
      }
    } catch (e: any) {
      console.warn('Pipeline ingestion error:', e);
      setConfirmationNotice(e.message || 'Gagal memproses dokumen.');
      triggerHaptic('warning');
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      triggerHaptic('light');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        setConfirmationNotice(null);
        setIsExtracting(true);

        const isPdf = file.name.toLowerCase().endsWith('.pdf');

        try {
          // 1. Ekstraksi langsung di memori (Offline In-Memory PDF & Text Parser)
          const extractedText = await PDFExtractorService.extractTextFromFile(file);

          if (extractedText && extractedText.trim().length > 30) {
            // Berhasil membaca teks langsung dari PDF/dokumen!
            await handleRunPipelineIngestion(
              extractedText,
              file.name,
              'MANUAL_UPLOAD'
            );
            return;
          }

          // 2. Fallback: jika PDF berisi hasil scan murni atau biner gambar
          try {
            const parsed = await AIParserService.parseDocumentFile(file);
            await handleRunPipelineIngestion(
              parsed.rawText || JSON.stringify(parsed),
              file.name,
              'MANUAL_UPLOAD'
            );
          } catch (aiErr: any) {
            if (isPdf) {
              setIsEncryptedPdf(true);
            }
            setShowPasteBox(true);
            setConfirmationNotice(
              `Dokumen "${file.name}" tidak memuat teks tabel transaksi yang dapat dibaca langsung. Jika diproteksi sandi, masukkan PIN di atas atau salin teks dari aplikasi PDF Anda lalu tempel di bawah.`
            );
            triggerHaptic('warning');
          }
        } catch (err: any) {
          console.warn('Doc picker parse notice:', err.message);
          setShowPasteBox(true);
          setConfirmationNotice(
            `Gagal memproses berkas "${file.name}". Buka PDF di aplikasi pembaca PDF, salin teks tabel saham Anda, lalu tempel di kolom teks di bawah.`
          );
          triggerHaptic('warning');
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (e) {
      console.warn('Doc picker error:', e);
      setIsExtracting(false);
    }
  };

  const handleExtractPastedText = async () => {
    if (!pastedText.trim()) return;
    triggerHaptic('selection');
    await handleRunPipelineIngestion(
      pastedText,
      'Teks Salinan Statement.txt',
      activeTab === 'EMAIL_WEBHOOK' ? 'EMAIL_WEBHOOK' : 'MANUAL_UPLOAD',
      activeTab === 'EMAIL_WEBHOOK' ? webhookSender : undefined
    );
  };

  const handleCommitCurrentBatch = async () => {
    if (!activeStagingBatch) return;
    try {
      setIsExtracting(true);
      const res = await commitRDNStagingBatch(activeStagingBatch.id);
      setConfirmationNotice(res.message);
      setSelectedFileName(null);
      setIsEncryptedPdf(false);
      setPdfPassword('');
    } catch (err: any) {
      console.warn('Commit error:', err);
      setConfirmationNotice(err.message || 'Gagal menyimpan transaksi ke buku besar.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDiscardCurrentBatch = async () => {
    if (!activeStagingBatch) return;
    triggerHaptic('medium');
    await discardRDNStagingBatch(activeStagingBatch.id);
    setConfirmationNotice('Draft staging dokumen berhasil dihapus.');
  };

  return (
    <ScreenTransition style={styles.screenContainer}>
      <AmbientBackground activeAssetClass="STOCK" />
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO EXPLANATION CARD */}
        <GlassCard level="base" style={styles.heroCard}>
          <Text style={styles.heroLabel}>Pipeline Statement RDN Asinkron</Text>
          <Text style={styles.heroTitle}>Sinkronisasi Rekening Dana Nasabah</Text>
          <Text style={styles.heroDesc}>
            Pipeline 6-tahap dengan validasi matematis saldo, proteksi anti-duplikasi SHA-256, deteksi transfer internal bank-ke-RDN, dan buku besar atomik.
          </Text>

          {/* RDN Status info */}
          <View style={styles.rdnInfoBox}>
            <View>
              <Text style={styles.rdnInfoLabel}>Rekening RDN terhubung</Text>
              <Text style={styles.rdnInfoName}>{rdnAccount?.name || 'Kas RDN'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rdnInfoLabel}>Saldo kas saat ini</Text>
              <PrivacyValue value={rdnAccount?.balance || 0} style={styles.rdnInfoBalance} />
            </View>
          </View>

          {/* Auto-Commit Verified Email Switch */}
          {rdnAccount && (
            <View style={styles.autoCommitRow}>
              <View style={{ flex: 1, marginRight: space.md }}>
                <Text style={styles.autoCommitTitle}>Auto-commit email terverifikasi</Text>
                <Text style={styles.autoCommitDesc}>
                  Otomatis simpan ke buku besar jika email statement resmi seimbang (selisih saldo Rp 0).
                </Text>
              </View>
              <Switch
                value={Boolean(rdnAccount.autoCommitVerifiedEmail)}
                onValueChange={() => toggleAccountAutoCommit(rdnAccount.id)}
                trackColor={{ false: color.glassFillInset, true: color.gain }}
                thumbColor={color.text}
              />
            </View>
          )}
        </GlassCard>

        {/* 2. INGESTION ENTRY POINTS TABS */}
        <View style={styles.tabSelector}>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('MANUAL');
            }}
            style={[styles.tabButton, activeTab === 'MANUAL' && styles.tabButtonActive]}
          >
            <Icon name="UploadCloud" size={14} color={activeTab === 'MANUAL' ? color.onAccent : color.textMuted} />
            <Text style={[styles.tabButtonText, activeTab === 'MANUAL' && styles.tabButtonTextActive]}>
              Unggah Berkas / Teks
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('EMAIL_WEBHOOK');
            }}
            style={[styles.tabButton, activeTab === 'EMAIL_WEBHOOK' && styles.tabButtonActive]}
          >
            <Icon name="BellRing" size={14} color={activeTab === 'EMAIL_WEBHOOK' ? color.onAccent : color.textMuted} />
            <Text style={[styles.tabButtonText, activeTab === 'EMAIL_WEBHOOK' && styles.tabButtonTextActive]}>
              Inbound Email Webhook
            </Text>
          </Pressable>
        </View>

        {/* 3. UPLOAD & SELECT FILE SECTION */}
        <GlassCard level="base" style={styles.uploadCard}>
          {activeTab === 'MANUAL' ? (
            <>
              <Text style={styles.sectionHeadline}>Unggah Berkas atau Salin Teks</Text>
              <Text style={styles.uploadDesc}>
                Mendukung dokumen resmi Stockbit, Ajaib, IPOT, Mandiri Sekuritas, BCA RDN, dan Bank Jago.
              </Text>

              {/* Document Picker Primary Button */}
              <Pressable
                onPress={handlePickDocument}
                disabled={isExtracting}
                style={styles.pickFileButton}
              >
                {isExtracting ? (
                  <ActivityIndicator color={color.onAccent} size="small" />
                ) : (
                  <View style={styles.pickFileInner}>
                    <Icon name="UploadCloud" size={16} color={color.onAccent} />
                    <Text style={styles.pickFileText}>
                      {selectedFileName ? `Ganti berkas (${selectedFileName})` : 'Pilih berkas PDF atau gambar'}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* In-Place Password Input if Encrypted PDF */}
              {isEncryptedPdf && (
                <View style={styles.passwordContainer}>
                  <Icon name="Lock" size={15} color={color.textMuted} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Kata sandi PDF (contoh: tanggal lahir DDMMYYYY)"
                    placeholderTextColor={color.textFaint}
                    secureTextEntry
                    value={pdfPassword}
                    onChangeText={setPdfPassword}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionHeadline}>Inbound Email Webhook Forwarding</Text>
              <Text style={styles.uploadDesc}>
                Simulasi payload email statement yang diteruskan secara otomatis dari sekuritas ke Omniwealth.
              </Text>

              <View style={styles.webhookInputRow}>
                <Text style={styles.webhookLabel}>Domain Pengirim Sekuritas:</Text>
                <TextInput
                  style={styles.webhookSenderInput}
                  value={webhookSender}
                  onChangeText={setWebhookSender}
                  placeholder="e.g. statement@stockbit.com"
                  placeholderTextColor={color.textFaint}
                />
              </View>
            </>
          )}

          {/* Paste Raw Text Option */}
          <View style={styles.pasteToggleRow}>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setShowPasteBox(!showPasteBox);
              }}
              hitSlop={6}
            >
              <Text style={styles.pasteToggleText}>
                {showPasteBox ? 'Tutup kolom teks' : 'Atau tempel teks dokumen langsung'}
              </Text>
            </Pressable>
          </View>

          {showPasteBox && (
            <View style={styles.pasteAreaContainer}>
              <TextInput
                style={styles.pasteInput}
                placeholder="Tempel teks mutasi RDN atau konfirmasi transaksi di sini..."
                placeholderTextColor={color.textFaint}
                multiline
                numberOfLines={5}
                value={pastedText}
                onChangeText={setPastedText}
              />
              <Pressable
                onPress={handleExtractPastedText}
                disabled={isExtracting || !pastedText.trim()}
                style={[
                  styles.extractTextButton,
                  (!pastedText.trim() || isExtracting) && styles.disabledButton,
                ]}
              >
                {isExtracting ? (
                  <ActivityIndicator color={color.text} size="small" />
                ) : (
                  <Text style={styles.extractTextButtonText}>Proses ke Pipeline Staging</Text>
                )}
              </Pressable>
            </View>
          )}
        </GlassCard>

        {/* 4. SUCCESS / NOTICE MESSAGE */}
        {confirmationNotice && (
          <GlassCard level="base" style={styles.successCard}>
            <View style={styles.successInner}>
              <Icon name="CheckCircle2" size={18} color={color.gain} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Pemberitahuan Pipeline</Text>
                <Text style={styles.successMessage}>{confirmationNotice}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* 5. TAHAP 5: STAGING AREA & HUMAN-IN-THE-LOOP PREVIEW */}
        {activeStagingBatch && (
          <GlassCard level="base" style={styles.stagingCard}>
            <View style={styles.stagingHeader}>
              <View>
                <Text style={styles.stagingBrokerText}>{activeStagingBatch.institution}</Text>
                <Text style={styles.stagingSubtext}>
                  {activeStagingBatch.statement_type === 'BANK_RDN_MUTATION'
                    ? 'Mutasi Kas RDN (T+2 Settlement)'
                    : 'Konfirmasi Transaksi Saham (T+0 Execution)'}
                </Text>
              </View>

              {/* Reconciliation Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  activeStagingBatch.status === 'VERIFIED'
                    ? styles.statusBadgeVerified
                    : styles.statusBadgeReview,
                ]}
              >
                <Icon
                  name={activeStagingBatch.status === 'VERIFIED' ? 'CheckCircle2' : 'AlertCircle'}
                  size={12}
                  color={activeStagingBatch.status === 'VERIFIED' ? color.gain : color.accent}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        activeStagingBatch.status === 'VERIFIED' ? color.gain : color.accent,
                    },
                  ]}
                >
                  {activeStagingBatch.status}
                </Text>
              </View>
            </View>

            {/* 4-Metric Guardrail Statistics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Transaksi Baru</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.new_items_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Duplikat Dilewati</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.duplicate_skipped_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Transfer Internal</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.internal_transfers_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Selisih Saldo</Text>
                <Text
                  style={[
                    styles.metricValue,
                    activeStagingBatch.reconciliation.discrepancy_amount === 0
                      ? { color: color.gain }
                      : { color: color.accent },
                  ]}
                >
                  {activeStagingBatch.reconciliation.discrepancy_amount === 0
                    ? 'Rp 0'
                    : formatIDR(activeStagingBatch.reconciliation.discrepancy_amount)}
                </Text>
              </View>
            </View>

            {/* Items List */}
            <Text style={styles.listSectionTitle}>Daftar Transaksi Staging ({activeStagingBatch.items.length})</Text>
            <View style={styles.itemsList}>
              {activeStagingBatch.items.map((it) => {
                const rec = it.record;
                return (
                  <View key={it.id} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <View style={styles.neutralChip}>
                        <Text style={styles.neutralChipText}>{rec.category}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>
                          {rec.ticker ? `${rec.ticker.replace('.JK', '')} (${rec.lot} lot)` : rec.raw_description}
                        </Text>
                        <Text style={styles.itemDate}>{rec.transaction_date}</Text>
                        {it.status === 'INTERNAL_TRANSFER' && (
                          <Text style={styles.internalTransferTag}>
                            Taut transfer: {it.matched_transfer_account_name}
                          </Text>
                        )}
                        {it.status === 'DUPLICATE_SKIPPED' && (
                          <Text style={styles.duplicateTag}>Sudah ada di buku besar (Dilewati)</Text>
                        )}
                      </View>
                    </View>

                    <Text style={[styles.itemAmount, it.status === 'DUPLICATE_SKIPPED' && styles.dimmedAmount]}>
                      {formatIDR(rec.net_amount)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons: Confirm & Commit vs Discard */}
            <View style={styles.stagingActionsRow}>
              <Pressable
                onPress={handleDiscardCurrentBatch}
                style={styles.discardButton}
              >
                <Text style={styles.discardButtonText}>Hapus Draft</Text>
              </Pressable>

              <Pressable
                onPress={handleCommitCurrentBatch}
                disabled={isExtracting}
                style={styles.commitButton}
              >
                {isExtracting ? (
                  <ActivityIndicator color={color.onAccent} size="small" />
                ) : (
                  <Text style={styles.commitButtonText}>Confirm & Commit</Text>
                )}
              </Pressable>
            </View>
          </GlassCard>
        )}

        {/* 6. SIMULASI PRESETS */}
        <View style={styles.presetsHeader}>
          <Text style={styles.sectionHeadline}>Uji Alur Pipeline Dokumen</Text>
          <Text style={styles.presetsSubtext}>Jalankan pipeline 6-tahap menggunakan berkas simulasi resmi</Text>
        </View>

        <GlassCard level="base" noPadding style={styles.presetsCard}>
          {SIMULATION_PRESETS.map((sim, index) => {
            const isLast = index === SIMULATION_PRESETS.length - 1;
            return (
              <View key={sim.id}>
                <Pressable
                  onPress={() => handleRunPipelineIngestion(sim.rawText, `${sim.broker}_Simulasi.txt`)}
                  style={styles.presetRow}
                >
                  <View style={styles.presetLeft}>
                    <Text style={styles.presetTitle}>{sim.title}</Text>
                    <Text style={styles.presetDesc}>{sim.desc}</Text>
                  </View>
                  <View style={styles.presetActionChip}>
                    <Text style={styles.presetActionText}>Uji alur</Text>
                  </View>
                </Pressable>
                {!isLast && <View style={styles.rowHairline} />}
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>
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
  heroLabel: {
    fontSize: 13,
    color: color.accent,
    fontWeight: '600',
    marginBottom: space.xs,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: color.text,
    marginBottom: space.xs,
  },
  heroDesc: {
    fontSize: 13,
    color: color.textMuted,
    lineHeight: 18,
    marginBottom: space.md,
  },
  rdnInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  rdnInfoLabel: {
    fontSize: 11,
    color: color.textMuted,
    marginBottom: 2,
  },
  rdnInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  rdnInfoBalance: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
  },
  autoCommitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  autoCommitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
  },
  autoCommitDesc: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: color.hairline,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: color.accent,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textMuted,
  },
  tabButtonTextActive: {
    color: color.onAccent,
  },

  // Upload Card
  uploadCard: {
    padding: space.lg,
  },
  sectionHeadline: {
    fontSize: 17,
    fontWeight: '600',
    color: color.text,
    marginBottom: 2,
  },
  uploadDesc: {
    fontSize: 13,
    color: color.textMuted,
    marginBottom: space.md,
    lineHeight: 18,
  },
  pickFileButton: {
    backgroundColor: color.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  pickFileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  pickFileText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.onAccent,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingHorizontal: space.md,
    height: 42,
    marginTop: space.md,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13,
    color: color.text,
  },
  webhookInputRow: {
    marginBottom: space.md,
    gap: 6,
  },
  webhookLabel: {
    fontSize: 12,
    color: color.textMuted,
  },
  webhookSenderInput: {
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingHorizontal: space.md,
    height: 40,
    color: color.text,
    fontSize: 13,
  },
  pasteToggleRow: {
    marginTop: space.md,
    alignItems: 'center',
  },
  pasteToggleText: {
    fontSize: 12,
    color: color.accent,
    fontWeight: '500',
  },
  pasteAreaContainer: {
    marginTop: space.md,
    gap: space.sm,
  },
  pasteInput: {
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.md,
    color: color.text,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  extractTextButton: {
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  extractTextButtonText: {
    fontSize: 12,
    color: color.text,
    fontWeight: '600',
  },

  // Success / Notice
  successCard: {
    padding: space.md,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },
  successInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: color.gain,
  },
  successMessage: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },

  // Staging Card
  stagingCard: {
    padding: space.lg,
    gap: space.md,
  },
  stagingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stagingBrokerText: {
    fontSize: 17,
    fontWeight: '700',
    color: color.text,
  },
  stagingSubtext: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeReview: {
    backgroundColor: color.accentSoft,
    borderColor: color.accentRim,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: color.glassFillInset,
    padding: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  metricLabel: {
    fontSize: 11,
    color: color.textMuted,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
    marginTop: 2,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    marginTop: space.xs,
  },
  itemsList: {
    gap: space.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    flex: 1,
    marginRight: space.sm,
  },
  neutralChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    marginTop: 2,
  },
  neutralChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: color.text,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
  },
  itemDate: {
    fontSize: 11,
    color: color.textMuted,
  },
  internalTransferTag: {
    fontSize: 10,
    color: color.asset.stock,
    marginTop: 2,
  },
  duplicateTag: {
    fontSize: 10,
    color: color.loss,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  dimmedAmount: {
    opacity: 0.4,
    textDecorationLine: 'line-through',
  },
  stagingActionsRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  discardButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: color.glassFillInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    fontSize: 13,
    color: color.textMuted,
    fontWeight: '600',
  },
  commitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  commitButtonText: {
    fontSize: 13,
    color: color.onAccent,
    fontWeight: '700',
  },

  // Presets
  presetsHeader: {
    paddingHorizontal: 2,
  },
  presetsSubtext: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  presetsCard: {
    borderRadius: radius.lg,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  presetLeft: {
    flex: 1,
    marginRight: space.md,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  presetDesc: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  presetActionChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  presetActionText: {
    fontSize: 11,
    color: color.accent,
    fontWeight: '600',
  },
  rowHairline: {
    height: 1,
    backgroundColor: color.hairline,
    marginHorizontal: space.lg,
  },
});
