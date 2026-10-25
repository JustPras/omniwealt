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
import { BrokerExtractionResult, BrokerTradeItem } from '../../src/types';
import { AIParserService } from '../../src/services/ai-parser';
import { color, space, radius, shadow } from '../../src/theme/tokens';

export default function SyncScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const { confirmBrokerTrades, accounts } = useWealth();

  const [pdfPassword, setPdfPassword] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isEncryptedPdf, setIsEncryptedPdf] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<BrokerExtractionResult | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const rdnAccount =
    accounts.find((a) => a.type === 'RDN') ||
    accounts[0];

  // Generic Broker Simulation Presets
  const SIMULATION_PRESETS = [
    {
      id: 'sim1',
      title: 'Trade Confirmation (Beli BBCA & Jual BMRI)',
      desc: 'Beli 5 lot BBCA @ Rp 9.800 & Jual 10 lot BMRI @ Rp 6.600',
      broker: 'PT Stockbit Sekuritas Digital',
      trades: [
        {
          action: 'BUY' as const,
          ticker: 'BBCA.JK',
          lots: 5,
          price: 9800,
          fee: 7350,
          netAmount: 5 * 100 * 9800 + 7350, // Rp 4.907.350
        },
        {
          action: 'SELL' as const,
          ticker: 'BMRI.JK',
          lots: 10,
          price: 6600,
          fee: 16500,
          netAmount: 10 * 100 * 6600 - 16500, // Rp 6.583.500
        },
      ],
    },
    {
      id: 'sim2',
      title: 'Ajaib Trade Confirmation (Beli TLKM & BBRI)',
      desc: 'Beli 20 lot TLKM @ Rp 2.950 & Beli 10 lot BBRI @ Rp 4.750',
      broker: 'Ajaib Sekuritas',
      trades: [
        {
          action: 'BUY' as const,
          ticker: 'TLKM.JK',
          lots: 20,
          price: 2950,
          fee: 8850,
          netAmount: 20 * 100 * 2950 + 8850,
        },
        {
          action: 'BUY' as const,
          ticker: 'BBRI.JK',
          lots: 10,
          price: 4750,
          fee: 7125,
          netAmount: 10 * 100 * 4750 + 7125,
        },
      ],
    },
  ];

  const handlePickDocument = async () => {
    try {
      triggerHaptic('light');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        setConfirmationNotice(null);
        setIsExtracting(true);

        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          setIsEncryptedPdf(true);
        }

        try {
          const parsed = await AIParserService.parseDocumentFile(file);
          setExtractionResult(parsed);
          triggerHaptic('success');
        } catch (err: any) {
          console.warn('Doc picker parse notice:', err.message);
          // Show paste box so the user can easily paste statement text directly
          setShowPasteBox(true);
          setConfirmationNotice(
            err.message ||
              `Berkas "${file.name}" terenkripsi atau berformat biner. Buka PDF di aplikasi pembaca PDF, salin (copy) teks tabel saham Anda, lalu tempel di kolom teks di bawah.`
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
    setIsExtracting(true);
    setConfirmationNotice(null);

    try {
      const parsed = await AIParserService.parseBrokerDocument(pastedText);
      setExtractionResult(parsed);
      setSelectedFileName('Teks salinan dokumen');
      if (parsed.trades.length > 0) {
        triggerHaptic('success');
      } else {
        triggerHaptic('warning');
        setConfirmationNotice(
          parsed.summaryNote ||
            'Tidak ada transaksi atau portofolio saham yang terdeteksi pada teks ini. Pastikan teks memuat kode saham (misal: BBRI, ASII, GOTO), jumlah lot, dan harga beli.'
        );
      }
    } catch (e) {
      console.warn('Paste extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRunSimulation = (sim: (typeof SIMULATION_PRESETS)[0]) => {
    triggerHaptic('selection');
    setSelectedFileName(`${sim.broker.replace(/\s+/g, '_')}_Confirmation.pdf`);
    setConfirmationNotice(null);
    setIsExtracting(true);

    setTimeout(() => {
      setExtractionResult({
        brokerName: sim.broker,
        documentType: 'TRADE_CONFIRMATION',
        tradeDate: new Date().toISOString().split('T')[0],
        trades: sim.trades,
        summaryNote: `Hasil ekstraksi dari dokumen ${sim.broker}`,
      });
      setIsExtracting(false);
      triggerHaptic('success');
    }, 400);
  };

  const handleConfirmUpdate = async () => {
    if (!extractionResult) return;
    triggerHaptic('medium');

    const res = await confirmBrokerTrades(extractionResult, rdnAccount?.id);
    setConfirmationNotice(res.message);
    setExtractionResult(null);
    setSelectedFileName(null);
    setIsEncryptedPdf(false);
    setPdfPassword('');
    triggerHaptic('success');
  };

  // Calculate Net Impact for preview
  const calculateImpacts = () => {
    if (!extractionResult || !extractionResult.trades) {
      return {
        rdnCashImpact: 0,
        stockImpacts: [] as { ticker: string; lots: number; isBuy: boolean }[],
      };
    }

    let rdnCashImpact = 0;
    const stockImpacts: { ticker: string; lots: number; isBuy: boolean }[] = [];

    extractionResult.trades.forEach((t) => {
      const cleanTicker = t.ticker.replace('.JK', '');
      if (t.action === 'BUY') {
        rdnCashImpact -= t.netAmount;
        stockImpacts.push({ ticker: cleanTicker, lots: t.lots, isBuy: true });
      } else {
        rdnCashImpact += t.netAmount;
        stockImpacts.push({ ticker: cleanTicker, lots: t.lots, isBuy: false });
      }
    });

    return {
      rdnCashImpact,
      stockImpacts,
    };
  };

  const impacts = calculateImpacts();

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
          <Text style={styles.heroLabel}>Impor statement broker</Text>
          <Text style={styles.heroTitle}>Sinkronisasi otomatis</Text>
          <Text style={styles.heroDesc}>
            Perbarui data transaksi saham, harga beli rata-rata, dan saldo kas RDN langsung dari dokumen Statement of Account (SoA) atau Trade Confirmation.
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
        </GlassCard>

        {/* 2. UPLOAD & SELECT FILE SECTION */}
        <GlassCard level="base" style={styles.uploadCard}>
          <Text style={styles.sectionHeadline}>Pilih berkas statement</Text>
          <Text style={styles.uploadDesc}>
            Mendukung dokumen resmi Stockbit, Ajaib, IPOT, Mandiri Sekuritas (PDF atau foto).
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
                {showPasteBox ? 'Tutup kolom teks' : 'Atau tempel teks dokumen'}
              </Text>
            </Pressable>
          </View>

          {showPasteBox && (
            <View style={styles.pasteAreaContainer}>
              <TextInput
                style={styles.pasteInput}
                placeholder="Tempel teks salinan statement broker di sini..."
                placeholderTextColor={color.textFaint}
                multiline
                numberOfLines={4}
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
                <Text style={styles.extractTextButtonText}>Ekstrak teks</Text>
              </Pressable>
            </View>
          )}
        </GlassCard>

        {/* 3. SIMULASI 1-KLIK PRESETS */}
        <View style={styles.presetsHeader}>
          <Text style={styles.sectionHeadline}>Simulasi statement</Text>
          <Text style={styles.presetsSubtext}>Uji alur sinkronisasi tanpa berkas asli</Text>
        </View>

        <GlassCard level="base" noPadding style={styles.presetsCard}>
          {SIMULATION_PRESETS.map((sim, index) => {
            const isLast = index === SIMULATION_PRESETS.length - 1;
            return (
              <View key={sim.id}>
                <Pressable
                  onPress={() => handleRunSimulation(sim)}
                  style={styles.presetRow}
                >
                  <View style={styles.presetLeft}>
                    <Text style={styles.presetTitle}>{sim.title}</Text>
                    <Text style={styles.presetDesc}>{sim.desc}</Text>
                  </View>
                  <View style={styles.presetActionChip}>
                    <Text style={styles.presetActionText}>Uji coba</Text>
                  </View>
                </Pressable>
                {!isLast && <View style={styles.rowHairline} />}
              </View>
            );
          })}
        </GlassCard>

        {/* 4. SUCCESS CONFIRMATION NOTICE */}
        {confirmationNotice && (
          <GlassCard level="base" style={styles.successCard}>
            <View style={styles.successInner}>
              <Icon name="CheckCircle2" size={18} color={color.gain} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Portofolio berhasil diperbarui</Text>
                <Text style={styles.successMessage}>{confirmationNotice}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* 5. PRATINJAU TRANSAKSI & ESTIMASI DAMPAK */}
        {extractionResult && (
          <GlassCard level="base" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewBrokerText}>{extractionResult.brokerName}</Text>
                <Text style={styles.previewSubtext}>
                  {extractionResult.trades.length} transaksi terdeteksi
                </Text>
              </View>
            </View>

            {extractionResult.trades.length === 0 ? (
              <View style={styles.emptyExtractionBox}>
                <Icon name="AlertCircle" size={18} color={color.accent} />
                <Text style={styles.emptyExtractionText}>
                  {extractionResult.summaryNote ||
                    'Tidak ada transaksi yang terdeteksi. Silakan periksa format teks portofolio Anda.'}
                </Text>
              </View>
            ) : (
              <>
                {/* List of Detected Trades */}
                <View style={styles.tradesList}>
                  {extractionResult.trades.map((t, idx) => {
                    const cleanTicker = t.ticker.replace('.JK', '');
                    return (
                      <View key={idx} style={styles.tradeRow}>
                        <View style={styles.tradeLeft}>
                          {/* Neutral Chip for BUY/SELL/DIVIDEN per design rules */}
                          <View style={styles.neutralChip}>
                            <Text style={styles.neutralChipText}>{t.action}</Text>
                          </View>
                          <View>
                            <Text style={styles.tradeTicker}>{cleanTicker}</Text>
                            <Text style={styles.tradeLots}>
                              {t.lots} lot @ {formatIDR(t.price)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.tradeAmount}>{formatIDR(t.netAmount)}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* IMPACT PREVIEW */}
                <View style={styles.impactBox}>
                  <Text style={styles.impactTitle}>Dampak pada portofolio:</Text>
                  {impacts.rdnCashImpact !== 0 && (
                    <Text style={styles.impactLine}>
                      • Kas RDN {impacts.rdnCashImpact < 0 ? '−' : '+'}
                      {formatIDR(Math.abs(impacts.rdnCashImpact))}
                    </Text>
                  )}
                  {impacts.stockImpacts.map((s, i) => (
                    <Text key={i} style={styles.impactLine}>
                      • {s.ticker} {s.isBuy ? '+' : '−'}
                      {s.lots} lot
                    </Text>
                  ))}
                </View>

                {/* Apply Button: Terapkan ke portofolio */}
                <Pressable
                  onPress={handleConfirmUpdate}
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>Terapkan ke portofolio</Text>
                </Pressable>
              </>
            )}
          </GlassCard>
        )}
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
    color: color.textMuted,
    fontWeight: '500',
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
    minHeight: 80,
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

  // Success
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

  // Preview Card
  previewCard: {
    padding: space.lg,
    gap: space.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBrokerText: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
  },
  previewSubtext: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  tradesList: {
    gap: space.xs,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // Neutral Chip per DESIGN.md: "Chip BUY/SELL/DIVIDEN netral dan tidak memakai warna gain/loss"
  neutralChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  neutralChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: color.text,
  },
  tradeTicker: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  tradeLots: {
    fontSize: 11,
    color: color.textMuted,
  },
  tradeAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  impactBox: {
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    gap: 4,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: color.accent,
    marginBottom: 2,
  },
  impactLine: {
    fontSize: 12,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  emptyExtractionBox: {
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  emptyExtractionText: {
    flex: 1,
    fontSize: 12,
    color: color.textMuted,
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: color.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.onAccent,
  },
});
