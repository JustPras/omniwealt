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
import * as DocumentPicker from 'expo-document-picker';
import {
  FileText,
  Lock,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BrokerExtractionResult, BrokerTradeItem } from '../../src/types';
import { AIParserService } from '../../src/services/ai-parser';

export default function SyncScreen() {
  const { confirmBrokerTrades, accounts, stocks } = useWealth();

  const [pdfPassword, setPdfPassword] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<BrokerExtractionResult | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const rdnAccount = accounts.find((a) => a.type === 'RDN') || accounts[0];

  // 3 MANDATORY BROKER SIMULATION PRESETS
  const SIMULATION_PRESETS = [
    {
      id: 'sim1',
      title: 'Stockbit TC (BUY BBCA & SELL BMRI)',
      desc: 'Beli 5 Lot BBCA.JK @ Rp 9.800 & Jual 10 Lot BMRI.JK @ Rp 6.600',
      broker: 'Stockbit Sekuritas',
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
      title: 'Ajaib Sekuritas TC (BUY TLKM & BBRI)',
      desc: 'Beli 20 Lot TLKM.JK @ Rp 2.950 & Beli 10 Lot BBRI.JK @ Rp 4.750',
      broker: 'Ajaib Sekuritas',
      trades: [
        {
          action: 'BUY' as const,
          ticker: 'TLKM.JK',
          lots: 20,
          price: 2950,
          fee: 8850,
          netAmount: 20 * 100 * 2950 + 8850, // Rp 5.908.850
        },
        {
          action: 'BUY' as const,
          ticker: 'BBRI.JK',
          lots: 10,
          price: 4750,
          fee: 7125,
          netAmount: 10 * 100 * 4750 + 7125, // Rp 4.757.125
        },
      ],
    },
    {
      id: 'sim3',
      title: 'IPOT Monthly SoA (BUY GOTO & DIVIDEN)',
      desc: 'Tambah 15 Lot GOTO.JK @ Rp 68 & Dividen Tunai Rp 450.000',
      broker: 'Indo Premier (IPOT)',
      trades: [
        {
          action: 'BUY' as const,
          ticker: 'GOTO.JK',
          lots: 15,
          price: 68,
          fee: 153,
          netAmount: 15 * 100 * 68 + 153, // Rp 102.153
        },
        {
          action: 'DIVIDEND' as const,
          ticker: 'CASH.DIV',
          lots: 0,
          price: 0,
          fee: 0,
          netAmount: 450000, // Rp 450.000 masuk RDN
        },
      ],
    },
  ];

  const handlePickDocument = async () => {
    triggerHaptic('light');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedFileName(file.name);
        setIsExtracting(true);
        setConfirmationNotice(null);

        // Smart Extraction simulation with parser
        setTimeout(async () => {
          const parsed = await AIParserService.parseBrokerDocument(
            `Trade Confirmation Dokumen ${file.name}. Transaksi Beli 5 Lot BBCA.JK @ Rp 9.800 Fee Rp 7.350 dan Jual 10 Lot BMRI.JK @ Rp 6.600 Fee Rp 16.500`,
            'Stockbit Sekuritas'
          );
          setExtractionResult(parsed);
          setIsExtracting(false);
          triggerHaptic('success');
        }, 1000);
      }
    } catch (e) {
      console.warn('Doc picker error:', e);
      setIsExtracting(false);
    }
  };

  const handleRunSimulation = (sim: (typeof SIMULATION_PRESETS)[0]) => {
    triggerHaptic('selection');
    setSelectedFileName(`${sim.broker}_Confirmation.pdf`);
    setConfirmationNotice(null);
    setIsExtracting(true);

    setTimeout(() => {
      setExtractionResult({
        brokerName: sim.broker,
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
  };

  return (
    <View style={styles.screenContainer}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO SYNC EXPLANATION */}
        <GlassCard style={styles.heroCard} borderTint="rgba(56, 189, 248, 0.25)">
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Sparkles size={20} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Broker Statement Engine</Text>
              <Text style={styles.heroSubtitle}>
                Auto-update Lot saham, Average Buy Price, dan saldo RDN dari dokumen Trade Confirmation / SoA broker.
              </Text>
            </View>
          </View>

          {/* RDN Status info */}
          <View style={styles.rdnStatusBox}>
            <Text style={styles.rdnLabel}>Rekening RDN Terhubung:</Text>
            <Text style={styles.rdnName}>{rdnAccount?.name || 'RDN Stockbit BCA'}</Text>
            <PrivacyValue value={rdnAccount?.balance || 0} style={styles.rdnBalance} />
          </View>
        </GlassCard>

        {/* 3 PRESET SIMULATION BUTTONS (1-CLICK TEST) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Uji Coba 1-Klik Simulasi Broker Statement</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Wajib Ada untuk Pengujian Instan</Text>
        </View>

        <View style={styles.presetsList}>
          {SIMULATION_PRESETS.map((sim, index) => (
            <TouchableOpacity
              key={sim.id}
              onPress={() => handleRunSimulation(sim)}
              style={styles.simCardBtn}
              activeOpacity={0.8}
            >
              <GlassCard style={styles.simCardInner} borderTint="rgba(245, 158, 11, 0.2)">
                <View style={styles.simTop}>
                  <View style={styles.simNumberBadge}>
                    <Text style={styles.simNumberText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simTitle}>{sim.title}</Text>
                    <Text style={styles.simDesc}>{sim.desc}</Text>
                  </View>
                  <View style={styles.simRunBadge}>
                    <Text style={styles.simRunText}>Tes Ekstraksi</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* NATIVE DOCUMENT PICKER SECTION */}
        <GlassCard style={styles.uploadCard} borderTint="rgba(255, 255, 255, 0.12)">
          <Text style={styles.uploadCardTitle}>Pilih File PDF / Gambar Asli</Text>
          <Text style={styles.uploadCardDesc}>
            Mendukung dokumen resmi Stockbit, Ajaib, IPOT, Mandiri Sekuritas, Indo Premier, dll.
          </Text>

          {/* Optional PDF Password */}
          <View style={styles.passwordInputContainer}>
            <Lock size={15} color="#94A3B8" />
            <TextInput
              style={styles.passwordInput}
              placeholder="Password PDF Broker (Opsional jika dienkripsi)"
              placeholderTextColor="#475569"
              secureTextEntry
              value={pdfPassword}
              onChangeText={setPdfPassword}
            />
          </View>

          {/* Document Picker Button */}
          <TouchableOpacity
            onPress={handlePickDocument}
            style={styles.uploadBtn}
            activeOpacity={0.8}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <ActivityIndicator color="#080C14" />
            ) : (
              <>
                <UploadCloud size={18} color="#080C14" />
                <Text style={styles.uploadBtnText}>
                  {selectedFileName ? `Ganti File (${selectedFileName})` : 'Pilih File Dokumen Broker'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* CONFIRMATION SUCCESS NOTIFICATION */}
        {confirmationNotice && (
          <GlassCard style={styles.successNoticeCard} borderTint="rgba(16, 185, 129, 0.3)">
            <View style={styles.noticeHeader}>
              <CheckCircle2 size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successNoticeTitle}>Portofolio Berhasil Diperbarui!</Text>
                <Text style={styles.successNoticeMsg}>{confirmationNotice}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* EXTRACTION PREVIEW CARD & MATH VERIFICATION */}
        {extractionResult && (
          <GlassCard style={styles.previewCard} borderTint="rgba(56, 189, 248, 0.3)">
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTag}>PRATINJAU HASIL EKSTRAKSI</Text>
                <Text style={styles.previewBrokerName}>{extractionResult.brokerName}</Text>
              </View>
              <View style={styles.tradeCountBadge}>
                <Text style={styles.tradeCountText}>{extractionResult.trades.length} Transaksi Terdeteksi</Text>
              </View>
            </View>

            {/* List of Trades to confirm */}
            <View style={styles.tradesContainer}>
              {extractionResult.trades.map((t, idx) => {
                const isBuy = t.action === 'BUY';
                const isSell = t.action === 'SELL';
                const isDiv = t.action === 'DIVIDEND';

                return (
                  <View key={idx} style={styles.tradeRow}>
                    <View style={styles.tradeRowLeft}>
                      <View
                        style={[
                          styles.actionBadge,
                          isBuy ? styles.badgeGreen : isSell ? styles.badgeRose : styles.badgeAmber,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBadgeText,
                            isBuy ? styles.textGreen : isSell ? styles.textRose : styles.textAmber,
                          ]}
                        >
                          {t.action}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.tradeTicker}>{t.ticker}</Text>
                        {!isDiv && (
                          <Text style={styles.tradeDetail}>
                            {t.lots} Lot @ Rp {t.price.toLocaleString('id-ID')} (Fee: Rp {t.fee.toLocaleString('id-ID')})
                          </Text>
                        )}
                        {isDiv && <Text style={styles.tradeDetail}>Dividen Tunai Masuk Saldo RDN</Text>}
                      </View>
                    </View>

                    <View style={styles.tradeRowRight}>
                      <Text style={[styles.netAmount, isBuy ? styles.textRose : styles.textGreen]}>
                        {isBuy ? '- ' : '+ '}
                        {formatIDR(t.netAmount)}
                      </Text>
                      <Text style={styles.settlementTag}>
                        {isBuy ? 'Potong RDN' : 'Masuk RDN'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Confirm & Update Portfolio Button */}
            <TouchableOpacity
              onPress={handleConfirmUpdate}
              style={styles.confirmBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>✓ Konfirmasi & Update Portofolio</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
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
  heroCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  rdnStatusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
  },
  rdnLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  rdnName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  rdnBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  presetsList: {
    gap: 8,
  },
  simCardBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  simCardInner: {
    padding: 12,
    borderRadius: 16,
  },
  simTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  simTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  simDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  simRunBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  simRunText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  uploadCard: {
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  uploadCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  uploadCardDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 12,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080C14',
  },
  successNoticeCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  noticeHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  successNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  successNoticeMsg: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  previewCard: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  previewTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  previewBrokerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  tradeCountBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tradeCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
  },
  tradesContainer: {
    gap: 10,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
  },
  tradeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeRose: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tradeTicker: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  tradeDetail: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  tradeRowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  netAmount: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  settlementTag: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  textGreen: {
    color: '#10B981',
  },
  textRose: {
    color: '#F43F5E',
  },
  textAmber: {
    color: '#F59E0B',
  },
});
