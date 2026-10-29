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
        {/* TOP PRIVACY & AIR-GAPPED BANNER */}
        <View style={styles.topPrivacyBanner}>
          <View style={styles.privacyBannerHeader}>
            <View style={styles.privacyBadge}>
              <View style={styles.goldDotPulse} />
              <Text style={styles.privacyBadgeText}>AIR-GAPPED V1.4</Text>
            </View>
            <Text style={styles.privacyZeroExport}>0 BYTES EXPORTED</Text>
          </View>
          <Text style={styles.privacyHeadline}>Automated Wealth Ingestion</Text>
          <Text style={styles.privacySubtext}>
            On-device OCR, asynchronous broker statement parser & atomic ledger reconciliation.
          </Text>
        </View>

        {/* DUAL DROPZONE CARDS (2-COLUMN GRID) */}
        <View style={styles.dualDropzoneGrid}>
          {/* Card 1: Bank Mutation OCR */}
          <GlassCard
            level="base"
            style={styles.dropzoneCard}
            onPress={() => {
              triggerHaptic('medium');
              setBankStatementModalVisible(true);
            }}
          >
            <View style={styles.dropzoneHeader}>
              <View style={styles.dropzoneIconBox}>
                <Icon name="Landmark" size={18} color={Colors.palette.titaniumSilver} />
              </View>
              <View style={styles.dropzoneChannelBadge}>
                <Text style={styles.channelBadgeText}>CH 01</Text>
              </View>
            </View>
            <Text style={styles.dropzoneTitle}>Rekening Koran Bank</Text>
            <Text style={styles.dropzoneSubtitle}>
              BCA, Mandiri, BRI, Bank Jago e-Statement dengan anti-duplikat.
            </Text>
            <View style={styles.dropzoneActionRow}>
              <Text style={styles.dropzoneActionText}>Buka Parser &rarr;</Text>
            </View>
          </GlassCard>

          {/* Card 2: Broker Statement PDF */}
          <GlassCard
            level="bullion"
            style={styles.dropzoneCard}
            onPress={handlePickDocument}
          >
            <View style={styles.dropzoneHeader}>
              <View style={[styles.dropzoneIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                <Icon name="FileText" size={18} color={Colors.palette.champagneGold} />
              </View>
              <View style={[styles.dropzoneChannelBadge, { borderColor: 'rgba(212, 175, 55, 0.40)' }]}>
                <Text style={[styles.channelBadgeText, { color: Colors.palette.champagneGold }]}>CH 02</Text>
              </View>
            </View>
            <Text style={styles.dropzoneTitle}>Statement RDN & Saham</Text>
            <Text style={styles.dropzoneSubtitle}>
              Stockbit, Ajaib, IPOT, Mandiri Sekuritas SoA & Trade Confirmations.
            </Text>
            <View style={styles.dropzoneActionRow}>
              <Text style={[styles.dropzoneActionText, { color: Colors.palette.champagneGold }]}>
                {isExtracting ? 'Mengekstrak...' : 'Pilih Berkas &rarr;'}
              </Text>
            </View>
          </GlassCard>
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
          <GlassCard level="bullion" style={styles.vaultSlipCard}>
            {/* Top Vault Slip Header */}
            <View style={styles.vaultSlipHeader}>
              <View>
                <View style={styles.vaultBatchTagRow}>
                  <Text style={styles.vaultSlipIndex}>VAULT SLIP // {activeStagingBatch.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <Text style={styles.vaultInstitution}>{activeStagingBatch.institution}</Text>
                <Text style={styles.vaultSubtext}>
                  {activeStagingBatch.statement_type === 'BANK_RDN_MUTATION'
                    ? 'Mutasi Kas RDN (T+2 Settlement)'
                    : 'Konfirmasi Eksekusi Saham (T+0)'}
                </Text>
              </View>

              {/* Status Badge */}
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
                  color={activeStagingBatch.status === 'VERIFIED' ? Colors.palette.sovereignJade : Colors.palette.champagneGold}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        activeStagingBatch.status === 'VERIFIED' ? Colors.palette.sovereignJade : Colors.palette.champagneGold,
                    },
                  ]}
                >
                  {activeStagingBatch.status}
                </Text>
              </View>
            </View>

            {/* 4-Metric Guardrail Statistics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>TRANSAKSI BARU</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.new_items_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DUPLIKAT SKIP</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.duplicate_skipped_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>TRANSFER INT.</Text>
                <Text style={styles.metricValue}>{activeStagingBatch.internal_transfers_count}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>SELISIH SALDO</Text>
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

            {/* Perforation Line */}
            <View style={styles.perforationLine} />

            {/* Items List with Precision Monospace Alignment */}
            <Text style={styles.listSectionTitle}>DAFTAR MUTASI / TRANSAKSI ({activeStagingBatch.items.length})</Text>
            <View style={styles.itemsList}>
              {activeStagingBatch.items.map((it) => {
                const rec = it.record;
                return (
                  <View key={it.id} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <View style={styles.neutralChip}>
                        <Text style={styles.neutralChipText}>{rec.category}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {rec.ticker ? `${rec.ticker.replace('.JK', '')} (${rec.lot} lot)` : rec.raw_description}
                          </Text>
                          {rec.ticker && /-W[0-9A-Z]*(\.JK)?$/i.test(rec.ticker) && (
                            <View style={styles.derivativeBadge}>
                              <Text style={styles.derivativeBadgeText}>WARRANT</Text>
                            </View>
                          )}
                          {rec.ticker && /-R[0-9A-Z]*(\.JK)?$/i.test(rec.ticker) && (
                            <View style={styles.derivativeBadge}>
                              <Text style={styles.derivativeBadgeText}>RIGHT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemDate}>{rec.transaction_date}</Text>
                        {it.status === 'INTERNAL_TRANSFER' && (
                          <Text style={styles.internalTransferTag}>
                            Taut transfer: {it.matched_transfer_account_name}
                          </Text>
                        )}
                        {it.status === 'DUPLICATE_SKIPPED' && (
                          <Text style={styles.duplicateTag}>Sudah tercatat di buku besar</Text>
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

            {/* Bottom Cryptographic Attestation & Action Bar */}
            <View style={styles.vaultSlipFooter}>
              <View style={styles.attestationRow}>
                <Icon name="ShieldCheck" size={13} color={Colors.palette.sovereignJade} />
                <Text style={styles.attestationText}>SHA-256 HASH VERIFIED • ZERO DUPLICATE GUARANTEE</Text>
              </View>

              <View style={styles.stagingActionsRow}>
                <LiquidButton
                  title="Hapus Draft"
                  variant="obsidian"
                  size="md"
                  onPress={handleDiscardCurrentBatch}
                  style={{ flex: 1 }}
                />

                <LiquidButton
                  title="Commit ke Buku Besar"
                  variant="azure"
                  size="md"
                  loading={isExtracting}
                  disabled={isExtracting}
                  onPress={handleCommitCurrentBatch}
                  style={{ flex: 1.6 }}
                />
              </View>
            </View>
          </GlassCard>
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
