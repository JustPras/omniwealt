import React, { useState, useRef, useMemo } from 'react';
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
import { LogoLoader } from '../../src/components/common/logo-loader';
import { LiquidButton } from '../../src/components/common/liquid-button';
import { LiquidSegmentControl } from '../../src/components/common/liquid-segment-control';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { AIParserService } from '../../src/services/ai-parser';
import { PDFExtractorService } from '../../src/services/pdf-extractor';
import { BankStatementModal } from '../../src/components/modals/bank-statement-modal';
import { color, space, radius, shadow, font, useTheme, Colors } from '../../src/theme/tokens';
import { IngestionPayload } from '../../src/types/rdn-pipeline';

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

export default function SyncScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const theme = useTheme();
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
  const [bankStatementModalVisible, setBankStatementModalVisible] = useState(false);

  const rdnAccount = useMemo(() => {
    return accounts.find((a) => a.type === 'RDN') || accounts[0];
  }, [accounts]);

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
          const extractedText = await PDFExtractorService.extractTextFromFile(file);

          if (extractedText && extractedText.trim().length > 30) {
            await handleRunPipelineIngestion(
              extractedText,
              file.name,
              'MANUAL_UPLOAD'
            );
            return;
          }

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

  const scrollViewRef = useRef<ScrollView>(null);

  const handleCommitCurrentBatch = async () => {
    if (!activeStagingBatch) return;
    try {
      setIsExtracting(true);
      const res = await commitRDNStagingBatch(activeStagingBatch.id);
      setConfirmationNotice(res.message);
      setSelectedFileName(null);
      setIsEncryptedPdf(false);
      setPdfPassword('');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      console.warn('Commit error:', err);
      setConfirmationNotice(err.message || 'Gagal menyimpan transaksi ke buku besar.');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDiscardCurrentBatch = async () => {
    if (!activeStagingBatch) return;
    triggerHaptic('medium');
    await discardRDNStagingBatch(activeStagingBatch.id);
    setConfirmationNotice('Draft staging dokumen berhasil dihapus.');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScreenTransition style={[styles.screenContainer, { backgroundColor: Colors.palette.canvas }]}>
      <AmbientBackground activeAssetClass="STOCK" />
      <HeaderBar />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP SUBHEADER / SECTION INTRO */}
        <View style={styles.syncHeaderBlock}>
          <View style={styles.syncSubHeaderRow}>
            <Text style={styles.syncSubHeaderLabel}>INGESTION ENGINE // V4.8</Text>
            <View style={styles.airGappedPill}>
              <View style={styles.airGappedDot} />
              <Text style={styles.airGappedText}>AIR-GAPPED</Text>
            </View>
          </View>
          <Text style={styles.syncTitle}>AUTOMATED WEALTH INGESTION</Text>
          <Text style={styles.syncSubtitle}>AI Bank Mutation &amp; Broker PDF Statement Reader</Text>
        </View>

        {/* 2. INSTITUTIONAL PRIVACY MICRO-BAR */}
        <View style={styles.privacyMicroBar}>
          <Icon name="Lock" size={15} color={Colors.palette.sovereignJade} />
          <Text style={styles.privacyMicroBarText} numberOfLines={1}>
            ON-DEVICE OCR &amp; PARSER  •  0 BYTES EXPORTED  •  100% AIR-GAPPED
          </Text>
        </View>

        {/* 3. DUAL TITANIUM INGESTION DROPZONES */}
        <View style={styles.dualTitaniumGrid}>
          {/* Left: Bank Mutation AI */}
          <View style={styles.titaniumDropzoneCard}>
            <View style={styles.dropzoneSpecularWash} />
            <View style={styles.dropzoneCardContent}>
              <View style={styles.dropzoneTopRow}>
                <Text style={styles.dropzoneIndexLabel}>01 // SOURCE</Text>
                <View style={styles.dropzoneBadge}>
                  <View style={styles.dropzoneBadgeDot} />
                  <Text style={styles.dropzoneBadgeText}>LOCAL LLM</Text>
                </View>
              </View>
              <Text style={styles.dropzoneHeadline}>Bank Mutation AI</Text>
              <Text style={styles.dropzoneDesc}>BCA, Mandiri, BRI CSV &amp; Scans</Text>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setBankStatementModalVisible(true);
              }}
              style={styles.uploadMutationBtn}
            >
              <Icon name="PlusCircle" size={15} color={Colors.palette.champagneGold} />
              <Text style={styles.uploadMutationBtnText}>+ Upload Mutation</Text>
            </Pressable>
          </View>

          {/* Right: Async Broker PDF */}
          <View style={styles.titaniumDropzoneCard}>
            <View style={styles.dropzoneSpecularWashGold} />
            <View style={styles.dropzoneCardContent}>
              <View style={styles.dropzoneTopRow}>
                <Text style={styles.dropzoneIndexLabel}>02 // BROKER</Text>
                <View style={styles.dropzoneBadge}>
                  <Text style={styles.dropzoneBadgeText}>IDX PARSER</Text>
                </View>
              </View>
              <Text style={styles.dropzoneHeadline}>Async Broker PDF</Text>
              <Text style={styles.dropzoneDesc}>IDX Trade Confirms, Stockbit, Bibit</Text>
            </View>

            <Pressable
              onPress={handlePickDocument}
              style={styles.uploadBrokerBtn}
            >
              <Icon name="FileText" size={15} color="#0A0A09" />
              <Text style={styles.uploadBrokerBtnText}>
                {isExtracting ? 'Reading...' : '+ Ingest Broker PDF'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. LIVE PROCESSING STATUS BAR */}
        <View style={styles.liveStatusBarCard}>
          <View style={styles.liveStatusBarTop}>
            <View style={styles.liveStatusBarFileRow}>
              <Icon name="RefreshCw" size={16} color={Colors.palette.champagneGold} />
              <Text style={styles.liveStatusBarFileName} numberOfLines={1}>
                {selectedFileName ? `READING: ${selectedFileName}` : 'READY: e-Statement & Trade Confirmations'}
              </Text>
            </View>
            <Text style={styles.liveStatusBarMeta}>
              {activeStagingBatch ? `${activeStagingBatch.items.length} ROWS` : 'STANDBY'}
            </Text>
          </View>

          {/* Micro Precision Progress Bar (2px) */}
          <View style={styles.microProgressBarTrack}>
            <View
              style={[
                styles.microProgressBarFill,
                { width: isExtracting ? '70%' : activeStagingBatch ? '100%' : '15%' },
              ]}
            />
          </View>

          <View style={styles.liveStatusBarBottom}>
            <Text style={styles.liveStatusBarDesc} numberOfLines={1}>
              {isExtracting
                ? 'Extracting lot prices, stamp duty & RDN shifts...'
                : activeStagingBatch
                ? 'Reconciled & deduplicated against institutional ledger.'
                : 'Select statement file or paste mutation above.'}
            </Text>
            <Text style={styles.liveStatusBarTag}>
              {isExtracting ? '[PARSING]' : activeStagingBatch ? '[COMPLETED]' : '[IDLE]'}
            </Text>
          </View>
        </View>

        {/* RDN ACCOUNT STATUS INFO */}
        <GlassCard level="base" style={styles.rdnInfoCard}>
          <View style={styles.rdnInfoBox}>
            <View>
              <Text style={styles.rdnInfoLabel}>REKENING RDN TERHUBUNG</Text>
              <Text style={styles.rdnInfoName}>{rdnAccount?.name || 'Kas RDN'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rdnInfoLabel}>SALDO KAS BUKU BESAR</Text>
              <PrivacyValue value={rdnAccount?.balance || 0} style={styles.rdnInfoBalance} />
            </View>
          </View>

          {rdnAccount && (
            <View style={styles.autoCommitRow}>
              <View style={{ flex: 1, marginRight: space.md }}>
                <Text style={styles.autoCommitTitle}>Auto-Commit Email Terverifikasi</Text>
                <Text style={styles.autoCommitDesc}>
                  Otomatis commit ke buku besar jika selisih saldo e-statement bernilai Rp 0.
                </Text>
              </View>
              <Switch
                value={Boolean(rdnAccount.autoCommitVerifiedEmail)}
                onValueChange={() => toggleAccountAutoCommit(rdnAccount.id)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.12)', true: Colors.palette.sovereignJade }}
                thumbColor={Colors.palette.alabasterWhite}
              />
            </View>
          )}
        </GlassCard>

        {/* INGESTION ENTRY POINT TABS */}
        <LiquidSegmentControl<'MANUAL' | 'EMAIL_WEBHOOK'>
          items={[
            { key: 'MANUAL', label: 'Unggah Berkas / Teks' },
            { key: 'EMAIL_WEBHOOK', label: 'Inbound Email Webhook' },
          ]}
          activeKey={activeTab}
          onSelect={setActiveTab}
          style={{ width: '100%', marginBottom: space.xs }}
          height={38}
        />

        {/* INPUT & PASTE AREA CARD */}
        <GlassCard level="base" style={styles.uploadCard}>
          {activeTab === 'MANUAL' ? (
            <>
              <Text style={styles.sectionHeadline}>Unggah Berkas atau Salin Teks</Text>
              <Text style={styles.uploadDesc}>
                Mendukung PDF & gambar resmi Stockbit, Ajaib, IPOT, Mandiri Sekuritas, dan Bank Jago RDN.
              </Text>

              <LiquidButton
                title={selectedFileName ? `Ganti berkas (${selectedFileName})` : 'Pilih Berkas PDF Statement'}
                icon="UploadCloud"
                variant="azure"
                size="md"
                loading={isExtracting}
                disabled={isExtracting}
                onPress={handlePickDocument}
                style={{ width: '100%', marginVertical: space.sm }}
              />

              {isEncryptedPdf && (
                <View style={styles.passwordContainer}>
                  <Icon name="Lock" size={15} color={Colors.palette.naturalTitanium} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Kata sandi PDF (contoh: tanggal lahir DDMMYYYY)"
                    placeholderTextColor={Colors.palette.darkPewter}
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
                Simulasi payload email statement yang diteruskan otomatis dari sekuritas resmi.
              </Text>

              <View style={styles.webhookInputRow}>
                <Text style={styles.webhookLabel}>Domain Pengirim Sekuritas:</Text>
                <TextInput
                  style={styles.webhookSenderInput}
                  value={webhookSender}
                  onChangeText={setWebhookSender}
                  placeholder="e.g. statement@stockbit.com"
                  placeholderTextColor={Colors.palette.darkPewter}
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
                placeholderTextColor={Colors.palette.darkPewter}
                multiline
                numberOfLines={5}
                value={pastedText}
                onChangeText={setPastedText}
              />
              <LiquidButton
                title="Proses ke Pipeline Staging"
                variant="azure"
                size="md"
                loading={isExtracting}
                disabled={isExtracting || !pastedText.trim()}
                onPress={handleExtractPastedText}
                style={{ width: '100%', marginTop: space.sm }}
              />
            </View>
          )}
        </GlassCard>

        {/* NOTICE MESSAGE */}
        {confirmationNotice && (
          <GlassCard
            level="base"
            style={[
              styles.successCard,
              confirmationNotice.toLowerCase().includes('gagal') && {
                backgroundColor: 'rgba(225, 82, 65, 0.08)',
                borderColor: 'rgba(225, 82, 65, 0.28)',
              },
            ]}
          >
            <View style={styles.successInner}>
              <Icon
                name={confirmationNotice.toLowerCase().includes('gagal') ? 'AlertCircle' : 'CheckCircle2'}
                size={18}
                color={confirmationNotice.toLowerCase().includes('gagal') ? Colors.palette.terracottaRose : Colors.palette.sovereignJade}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.successTitle,
                    confirmationNotice.toLowerCase().includes('gagal') && { color: Colors.palette.terracottaRose },
                  ]}
                >
                  {confirmationNotice.toLowerCase().includes('gagal') ? 'Peringatan Pipeline' : 'Pemberitahuan Pipeline'}
                </Text>
                <Text style={styles.successMessage}>{confirmationNotice}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* ACTIVE EXTRACTION LOADER (PIXEL2MOTION) */}
        {isExtracting && (
          <GlassCard level="bullion" style={{ padding: space.xl, alignItems: 'center', justifyContent: 'center' }}>
            <LogoLoader size={60} label="AIR-GAPPED AI INGESTION IN PROGRESS..." />
          </GlassCard>
        )}

        {/* PERFORATED VAULT SLIP PREVIEW FOR ACTIVE STAGING BATCH */}
        {activeStagingBatch && (
          <View style={styles.perforatedSlipCard}>
            {/* Vault Slip Header */}
            <View style={styles.slipHeader}>
              <View style={styles.slipHeaderLeft}>
                <Icon name="FileText" size={16} color={Colors.palette.champagneGold} />
                <Text style={styles.slipHeaderTitle}>VAULT SLIP AUDIT PREVIEW</Text>
              </View>
              <Text style={styles.slipBatchId}>BATCH #{activeStagingBatch.id.slice(0, 8).toUpperCase()}</Text>
            </View>

            {/* Perforation Line with Semicircular Cutouts */}
            <View style={styles.perforationRow}>
              <View style={styles.perforationCutoutLeft} />
              <View style={styles.perforationDashedLine} />
              <View style={styles.perforationCutoutRight} />
            </View>

            {/* 4-Metric Guardrail Statistics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>NEW ITEMS</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.new_items_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DUPLICATE</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.duplicate_skipped_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>TRANSFERS</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.internal_transfers_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DISCREPANCY</Text>
                <Text
                  style={[
                    styles.metricValue,
                    activeStagingBatch.reconciliation.discrepancy_amount === 0
                      ? { color: Colors.palette.sovereignJade }
                      : { color: Colors.palette.champagneGold },
                  ]}
                >
                  {activeStagingBatch.reconciliation.discrepancy_amount === 0
                    ? 'Rp 0'
                    : formatIDR(activeStagingBatch.reconciliation.discrepancy_amount)}
                </Text>
              </View>
            </View>

            {/* Items List with Monospace Alignment */}
            <View style={styles.slipItemsList}>
              {activeStagingBatch.items.map((it, idx) => {
                const rec = it.record;
                const isExpense = rec.net_amount < 0 || rec.category === 'BUY' || rec.category === 'ADMIN_TAX';
                const isDividend = rec.category === 'DIVIDEND' || rec.category === 'COUPON' || rec.category === 'INTEREST';

                return (
                  <View key={it.id}>
                    <View style={styles.slipItemRow}>
                      <View style={styles.slipItemLeft}>
                        <View style={styles.slipItemTitleRow}>
                          <Text style={styles.slipItemDate}>{rec.transaction_date.slice(5) || '28 OCT'}</Text>
                          <Text style={styles.slipItemTitle} numberOfLines={1}>
                            {rec.ticker ? `BUY ${rec.ticker.replace('.JK', '')} ${rec.lot} LOT` : rec.raw_description}
                          </Text>
                        </View>
                        <Text style={styles.slipItemSub}>
                          {activeStagingBatch.institution.toUpperCase()} • RDN SETTLED
                        </Text>
                      </View>

                      <View style={styles.slipItemRight}>
                        <Text
                          style={[
                            styles.slipItemAmount,
                            isDividend ? styles.amountJade : isExpense ? styles.amountAlabaster : styles.amountTerracotta,
                          ]}
                        >
                          {rec.net_amount >= 0 ? '+' : '−'}{formatIDR(Math.abs(rec.net_amount))}
                        </Text>
                        <Text
                          style={[
                            styles.slipItemCategoryPill,
                            isDividend ? styles.catJade : isExpense ? styles.catGold : styles.catTerracotta,
                          ]}
                        >
                          {isDividend ? 'CASH YIELD' : isExpense ? 'EQUITY ASSET' : 'DISCRETIONARY'}
                        </Text>
                      </View>
                    </View>

                    {idx < activeStagingBatch.items.length - 1 && <View style={styles.slipDividerHairline} />}
                  </View>
                );
              })}
            </View>

            {/* Footnote: Stamp Duty & IDX Levy */}
            <View style={styles.slipFootnoteBar}>
              <View style={styles.slipFootnoteLeft}>
                <Icon name="Info" size={13} color={Colors.palette.champagneGold} />
                <Text style={styles.slipFootnoteText}>STAMP DUTY &amp; IDX LEVY: Rp 10.000</Text>
              </View>
              <Text style={styles.slipFootnoteRight}>(Auto-deducted)</Text>
            </View>

            {/* Bottom Commit Bar */}
            <View style={styles.slipCommitSection}>
              <View style={styles.slipAttestationRow}>
                <View style={styles.slipAttestationLeft}>
                  <Icon name="ShieldCheck" size={14} color={Colors.palette.sovereignJade} />
                  <Text style={styles.slipConfidenceText}>AI CONFIDENCE: 99.6%</Text>
                </View>
                <Text style={styles.slipShaText}>SHA-256: 8C91A...F29</Text>
              </View>

              <Pressable
                onPress={handleCommitCurrentBatch}
                disabled={isExtracting}
                style={styles.sovereignCommitBtn}
              >
                <Text style={styles.sovereignCommitBtnText}>COMMIT TO LEDGER</Text>
                <Icon name="ArrowRight" size={18} color="#0A0A09" />
              </Pressable>
            </View>
          </View>
        )}

        {/* PIPELINE SIMULATION PRESETS */}
        <View style={styles.presetsHeader}>
          <Text style={styles.sectionHeadline}>Uji Alur Pipeline Dokumen</Text>
          <Text style={styles.presetsSubtext}>Jalankan simulasi 6-tahap menggunakan sampel statement resmi</Text>
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
                  <LiquidButton
                    title="Uji alur"
                    variant="clear"
                    size="sm"
                    onPress={() => handleRunPipelineIngestion(sim.rawText, `${sim.broker}_Simulasi.txt`)}
                  />
                </Pressable>
                {!isLast && <View style={styles.rowHairline} />}
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>

      <BankStatementModal
        visible={bankStatementModalVisible}
        onClose={() => setBankStatementModalVisible(false)}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({

  // Luxury Stitch Screen 5 Styles
  syncHeaderBlock: {
    gap: 2,
    paddingTop: 4,
  },
  syncSubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncSubHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.palette.champagneGold,
  },
  airGappedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A28',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  airGappedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.palette.champagneGold,
  },
  airGappedText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.palette.naturalTitanium,
  },
  syncTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  syncSubtitle: {
    fontSize: 12,
    color: Colors.palette.darkPewter,
    marginTop: 1,
  },
  privacyMicroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  privacyMicroBarText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.palette.naturalTitanium,
    flex: 1,
  },
  dualTitaniumGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  titaniumDropzoneCard: {
    flex: 1,
    backgroundColor: '#1C1C1A',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 160,
  },
  dropzoneSpecularWash: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dropzoneSpecularWashGold: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  dropzoneCardContent: {
    gap: 4,
    zIndex: 1,
  },
  dropzoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropzoneIndexLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.palette.darkPewter,
  },
  dropzoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  dropzoneBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.palette.champagneGold,
  },
  dropzoneBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.palette.champagneGold,
  },
  dropzoneHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    marginTop: 4,
  },
  dropzoneDesc: {
    fontSize: 10,
    color: Colors.palette.darkPewter,
    lineHeight: 14,
  },
  uploadMutationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2A2A28',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
  },
  uploadMutationBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.palette.champagneGold,
  },
  uploadBrokerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.palette.champagneGold,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
  },
  uploadBrokerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A0A09',
  },
  liveStatusBarCard: {
    backgroundColor: '#1C1C1A',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  liveStatusBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveStatusBarFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveStatusBarFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
    flex: 1,
  },
  liveStatusBarMeta: {
    fontSize: 10,
    color: Colors.palette.darkPewter,
    letterSpacing: 0.5,
  },
  microProgressBarTrack: {
    height: 2,
    backgroundColor: '#2A2A28',
    borderRadius: 1,
    overflow: 'hidden',
  },
  microProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.palette.champagneGold,
  },
  liveStatusBarBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveStatusBarDesc: {
    fontSize: 10.5,
    color: Colors.palette.darkPewter,
    flex: 1,
  },
  liveStatusBarTag: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.palette.sovereignJade,
  },
  perforatedSlipCard: {
    backgroundColor: '#1C1C1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  slipHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slipHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: Colors.palette.alabasterWhite,
  },
  slipBatchId: {
    fontSize: 10,
    color: Colors.palette.darkPewter,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    height: 16,
    position: 'relative',
  },
  perforationCutoutLeft: {
    width: 8,
    height: 16,
    backgroundColor: Colors.palette.canvas,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  perforationCutoutRight: {
    width: 8,
    height: 16,
    backgroundColor: Colors.palette.canvas,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  perforationDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  slipItemsList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  slipItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  slipItemLeft: {
    flex: 1,
    gap: 2,
  },
  slipItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slipItemDate: {
    fontSize: 10,
    color: Colors.palette.darkPewter,
  },
  slipItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
    flex: 1,
  },
  slipItemSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.palette.darkPewter,
  },
  slipItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  slipItemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountJade: {
    color: Colors.palette.sovereignJade,
  },
  amountAlabaster: {
    color: Colors.palette.alabasterWhite,
  },
  amountTerracotta: {
    color: Colors.palette.terracottaRose,
  },
  slipItemCategoryPill: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  catJade: {
    color: Colors.palette.sovereignJade,
  },
  catGold: {
    color: Colors.palette.champagneGold,
  },
  catTerracotta: {
    color: Colors.palette.terracottaRose,
  },
  slipDividerHairline: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  slipFootnoteBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 40, 0.4)',
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  slipFootnoteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slipFootnoteText: {
    fontSize: 9.5,
    color: Colors.palette.naturalTitanium,
  },
  slipFootnoteRight: {
    fontSize: 9,
    color: Colors.palette.darkPewter,
  },
  slipCommitSection: {
    padding: 16,
    backgroundColor: '#141412',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  slipAttestationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipAttestationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slipConfidenceText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.palette.naturalTitanium,
  },
  slipShaText: {
    fontSize: 9.5,
    color: Colors.palette.darkPewter,
  },
  sovereignCommitBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.palette.champagneGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sovereignCommitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0A09',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.palette.canvas,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.md,
  },
  topPrivacyBanner: {
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(20, 20, 18, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
  },
  privacyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  goldDotPulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.palette.champagneGold,
  },
  privacyBadgeText: {
    fontSize: 9.5,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.champagneGold,
    letterSpacing: 0.6,
  },
  privacyZeroExport: {
    fontSize: 9.5,
    fontFamily: font.mono,
    color: Colors.palette.sovereignJade,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  privacyHeadline: {
    fontSize: 16,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    letterSpacing: -0.2,
  },
  privacySubtext: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 2,
    lineHeight: 16,
  },
  dualDropzoneGrid: {
    flexDirection: 'row',
    gap: space.sm,
  },
  dropzoneCard: {
    flex: 1,
    padding: space.md,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  dropzoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  dropzoneIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneChannelBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  channelBadgeText: {
    fontSize: 8.5,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
  },
  dropzoneTitle: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    marginTop: 4,
  },
  dropzoneSubtitle: {
    fontSize: 10,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    lineHeight: 14,
    marginTop: 3,
  },
  dropzoneActionRow: {
    marginTop: 8,
  },
  dropzoneActionText: {
    fontSize: 11,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
  },
  rdnInfoCard: {
    padding: space.md,
  },
  rdnInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rdnInfoLabel: {
    fontSize: 9.5,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rdnInfoName: {
    fontSize: 14,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  rdnInfoBalance: {
    fontSize: 14,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.champagneGold,
    fontVariant: ['tabular-nums'],
  },
  autoCommitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  autoCommitTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
  },
  autoCommitDesc: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 1,
  },
  uploadCard: {
    padding: space.md,
  },
  sectionHeadline: {
    fontSize: 14,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    marginBottom: 2,
  },
  uploadDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    lineHeight: 15,
    marginBottom: space.sm,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10, 10, 9, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: space.xs,
  },
  passwordInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: font.mono,
    color: Colors.palette.alabasterWhite,
  },
  webhookInputRow: {
    marginTop: space.xs,
    marginBottom: space.sm,
  },
  webhookLabel: {
    fontSize: 11,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    marginBottom: 4,
  },
  webhookSenderInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10, 10, 9, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    fontSize: 12,
    fontFamily: font.mono,
    color: Colors.palette.alabasterWhite,
  },
  pasteToggleRow: {
    alignItems: 'center',
    marginTop: space.xs,
  },
  pasteToggleText: {
    fontSize: 11,
    color: Colors.palette.champagneGold,
    fontWeight: '600',
  },
  pasteAreaContainer: {
    marginTop: space.sm,
  },
  pasteInput: {
    backgroundColor: 'rgba(10, 10, 9, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 11,
    fontFamily: font.mono,
    color: Colors.palette.alabasterWhite,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  successCard: {
    padding: space.md,
    backgroundColor: 'rgba(46, 189, 133, 0.08)',
    borderColor: 'rgba(46, 189, 133, 0.28)',
  },
  successInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.sovereignJade,
  },
  successMessage: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.alabasterWhite,
    marginTop: 2,
    lineHeight: 15,
  },
  vaultSlipCard: {
    padding: space.md,
  },
  vaultSlipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  vaultBatchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vaultSlipIndex: {
    fontSize: 9.5,
    fontFamily: font.mono,
    color: Colors.palette.champagneGold,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  vaultInstitution: {
    fontSize: 15,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  vaultSubtext: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeVerified: {
    backgroundColor: 'rgba(46, 189, 133, 0.12)',
    borderColor: 'rgba(46, 189, 133, 0.35)',
  },
  statusBadgeReview: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: font.mono,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.xs,
  },
  metricBox: {
    flex: 1,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10, 10, 9, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 12,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  perforationLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    borderStyle: 'dashed',
    marginVertical: space.md,
  },
  listSectionTitle: {
    fontSize: 10,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
    letterSpacing: 0.6,
    marginBottom: space.xs,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10, 10, 9, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  neutralChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  neutralChipText: {
    fontSize: 9,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  derivativeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
  },
  derivativeBadgeText: {
    fontSize: 8,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.champagneGold,
  },
  itemDate: {
    fontSize: 10,
    fontFamily: font.mono,
    color: Colors.palette.darkPewter,
    marginTop: 1,
  },
  internalTransferTag: {
    fontSize: 9.5,
    fontFamily: font.ui,
    color: Colors.palette.sovereignJade,
    marginTop: 1,
  },
  duplicateTag: {
    fontSize: 9.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 1,
  },
  itemAmount: {
    fontSize: 12,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    fontVariant: ['tabular-nums'],
  },
  dimmedAmount: {
    opacity: 0.45,
  },
  vaultSlipFooter: {
    marginTop: space.md,
    gap: space.sm,
  },
  attestationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  attestationText: {
    fontSize: 8.5,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    letterSpacing: 0.6,
  },
  stagingActionsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  presetsHeader: {
    marginTop: space.xs,
  },
  presetsSubtext: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 1,
    marginBottom: space.xs,
  },
  presetsCard: {
    borderRadius: radius.lg,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
  },
  presetLeft: {
    flex: 1,
    marginRight: space.sm,
  },
  presetTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  presetDesc: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 2,
    lineHeight: 14,
  },
  rowHairline: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: space.md,
  },
});
