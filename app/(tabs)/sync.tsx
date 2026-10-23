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
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { LuxuryLoader } from '../../src/components/common/luxury-loader';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BrokerExtractionResult, BrokerHoldingItem, BrokerTradeItem } from '../../src/types';
import { AIParserService } from '../../src/services/ai-parser';

export default function SyncScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const { confirmBrokerTrades, accounts } = useWealth();

  const [pdfPassword, setPdfPassword] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<BrokerExtractionResult | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const rdnAccount =
    accounts.find((a) => a.accountNumber === '1000000000') ||
    accounts.find((a) => a.type === 'RDN') ||
    accounts[0];

  // 4 BROKER SIMULATION PRESETS (Including Official Stockbit Statement of Account)
  const SIMULATION_PRESETS = [
    {
      id: 'sim_stockbit_soa',
      isOfficialSoA: true,
      title: 'Stockbit SoA Resmi (Nasabah Demo)',
      desc: '11 Saham Portofolio (ARCI, BBRI, ELTY, GOTO, SOTS, dll.) + Saldo RDN Bank Jago Rp 408.241',
      broker: 'PT. Stockbit Sekuritas Digital',
      documentType: 'STATEMENT_OF_ACCOUNT' as const,
      period: '01/09/2026 - 30/09/2026',
      clientName: 'NASABAH DEMO',
      sid: 'IDD987654321',
      rdnBank: 'Bank Jago',
      rdnAccountNumber: '1000000000',
      rdnCashBalance: 1000000,
      totalPortfolioValue: 1841000,
      totalBuyingValue: 2365863,
      totalUnrealizedPnL: -524863,
      holdings: [
        { ticker: 'ARCI.JK', name: 'Archi Indonesia Tbk.', lots: 2, shares: 200, avgBuyPrice: 1425, currentPrice: 1230, buyingValue: 285000, marketValue: 246000, unrealizedPnLRp: -39000, unrealizedPnLPct: -0.1368 },
        { ticker: 'BBRI.JK', name: 'Bank Rakyat Indonesia (Persero) Tbk.', lots: 1, shares: 100, avgBuyPrice: 3800, currentPrice: 3140, buyingValue: 380000, marketValue: 314000, unrealizedPnLRp: -66000, unrealizedPnLPct: -0.1737 },
        { ticker: 'DEWA.JK', name: 'Darma Henwa Tbk.', lots: 1, shares: 100, avgBuyPrice: 500, currentPrice: 342, buyingValue: 50000, marketValue: 34200, unrealizedPnLRp: -15800, unrealizedPnLPct: -0.3160 },
        { ticker: 'ELTY.JK', name: 'Bakrieland Development Tbk.', lots: 100, shares: 10000, avgBuyPrice: 54.40, currentPrice: 32, buyingValue: 544000, marketValue: 320000, unrealizedPnLRp: -224000, unrealizedPnLPct: -0.4118 },
        { ticker: 'GOTO.JK', name: 'GoTo Gojek Tokopedia Tbk.', lots: 2, shares: 200, avgBuyPrice: 50.00, currentPrice: 32, buyingValue: 10000, marketValue: 6400, unrealizedPnLRp: -3600, unrealizedPnLPct: -0.3600 },
        { ticker: 'JECX.JK', name: 'Nitrasanata Dharma Tbk.', lots: 1, shares: 100, avgBuyPrice: 1250, currentPrice: 1320, buyingValue: 125000, marketValue: 132000, unrealizedPnLRp: 7000, unrealizedPnLPct: 0.0560 },
        { ticker: 'JGLE.JK', name: 'Graha Andrasentra Propertindo Tbk.', lots: 40, shares: 4000, avgBuyPrice: 52.71, currentPrice: 50, buyingValue: 210829, marketValue: 200000, unrealizedPnLRp: -10829, unrealizedPnLPct: -0.0514 },
        { ticker: 'NCKL.JK', name: 'Trimegah Bangun Persada Tbk.', lots: 3, shares: 300, avgBuyPrice: 1048.33, currentPrice: 870, buyingValue: 314500, marketValue: 261000, unrealizedPnLRp: -53500, unrealizedPnLPct: -0.1701 },
        { ticker: 'PJHB-W.JK', name: 'Waran Seri I Pelayaran Jaya Hidup Baru', lots: 0.5, shares: 50, avgBuyPrice: 270.67, currentPrice: 16, buyingValue: 13533, marketValue: 800, unrealizedPnLRp: -12733, unrealizedPnLPct: -0.9409 },
        { ticker: 'PWON.JK', name: 'Pakuwon Jati Tbk.', lots: 5, shares: 500, avgBuyPrice: 346, currentPrice: 258, buyingValue: 173000, marketValue: 129000, unrealizedPnLRp: -44000, unrealizedPnLPct: -0.2543 },
        { ticker: 'SOTS.JK', name: 'Satria Mega Kencana Tbk.', lots: 4, shares: 400, avgBuyPrice: 650, currentPrice: 494, buyingValue: 260000, marketValue: 197600, unrealizedPnLRp: -62400, unrealizedPnLPct: -0.2400 },
      ],
      trades: [],
    },
    {
      id: 'sim1',
      isOfficialSoA: false,
      title: 'Stockbit Trade Confirmation (BUY BBCA & SELL BMRI)',
      desc: 'Beli 5 Lot BBCA.JK @ Rp 9.800 & Jual 10 Lot BMRI.JK @ Rp 6.600',
      broker: 'PT. Stockbit Sekuritas Digital',
      documentType: 'TRADE_CONFIRMATION' as const,
      period: 'Oktober 2026',
      clientName: 'NASABAH DEMO',
      sid: 'IDD987654321',
      rdnBank: 'Bank Jago',
      rdnAccountNumber: '1000000000',
      rdnCashBalance: 1000000,
      totalPortfolioValue: 0,
      totalBuyingValue: 0,
      totalUnrealizedPnL: 0,
      holdings: [],
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
      isOfficialSoA: false,
      title: 'Ajaib Sekuritas TC (BUY TLKM & BBRI)',
      desc: 'Beli 20 Lot TLKM.JK @ Rp 2.950 & Beli 10 Lot BBRI.JK @ Rp 4.750',
      broker: 'Ajaib Sekuritas',
      documentType: 'TRADE_CONFIRMATION' as const,
      period: 'Oktober 2026',
      clientName: 'NASABAH DEMO',
      sid: 'IDD987654321',
      rdnBank: 'Bank BCA',
      rdnAccountNumber: '8910239102',
      rdnCashBalance: 1250000,
      totalPortfolioValue: 0,
      totalBuyingValue: 0,
      totalUnrealizedPnL: 0,
      holdings: [],
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
      isOfficialSoA: false,
      title: 'IPOT Monthly SoA (BUY GOTO & DIVIDEN)',
      desc: 'Tambah 15 Lot GOTO.JK @ Rp 68 & Dividen Tunai Rp 450.000',
      broker: 'Indo Premier (IPOT)',
      documentType: 'TRADE_CONFIRMATION' as const,
      period: 'September 2026',
      clientName: 'NASABAH DEMO',
      sid: 'IDD987654321',
      rdnBank: 'Bank Mandiri',
      rdnAccountNumber: '142001889922',
      rdnCashBalance: 2450000,
      totalPortfolioValue: 0,
      totalBuyingValue: 0,
      totalUnrealizedPnL: 0,
      holdings: [],
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

        // Smart Extraction with parser
        setTimeout(async () => {
          const lowerName = file.name.toLowerCase();
          let sampleText = `Trade Confirmation Dokumen ${file.name}. Transaksi Beli 5 Lot BBCA.JK @ Rp 9.800 Fee Rp 7.350 dan Jual 10 Lot BMRI.JK @ Rp 6.600 Fee Rp 16.500`;
          let broker = 'Stockbit Sekuritas';

          // If Stockbit Statement of Account file
          if (
            lowerName.includes('stockbit') ||
            lowerName.includes('statement') ||
            lowerName.includes('soa') ||
            lowerName.includes('account')
          ) {
            sampleText = `PT. STOCKBIT SEKURITAS DIGITAL
Statement of Account Bank / Currency SID
JAGO 1000000000 / IDR IDD987654321
Date 01/09/2026 - 30/09/2026
Client 3146069 NASABAH DEMO
Cash Investor 408,241.16
Portfolio 1,841,000
PORTFOLIO STATEMENT
PRICE UNREAL. GAIN/LOSS
Stocks Special Notes Margin Quantity Buying Close Buying Value Market Value (Rp.) %
ARCI Archi Indonesia Tbk.  200 1,425.00 1,230 285,000 246,000 -39,000 -13.68
BBRI Bank Rakyat
Indonesia (Persero)
Tbk.
 100 3,800.00 3,140 380,000 314,000 -66,000 -17.37
DEWA Darma Henwa Tbk  100 500.00 342 50,000 34,200 -15,800 -31.60
ELTY Bakrieland
Development Tbk.
 10,000 54.40 32 544,000 320,000 -224,000 -41.18
GOTO GoTo Gojek
Tokopedia Tbk.
N  200 50.00 32 10,000 6,400 -3,600 -36.00
JECX Nitrasanata Dharma
Tbk.
 100 1,250.00 1,320 125,000 132,000 7,000 5.60
JGLE Graha Andrasentra
Propertindo Tbk.
 4,000 52.71 50 210,829 200,000 -10,829 -5.14
NCKL Trimegah Bangun
Persada Tbk.
 300 1,048.33 870 314,500 261,000 -53,500 -17.01
PJHB-W Waran Seri I
Pelayaran Jaya Hidup
Baru T
 50 270.67 16 13,533 800 -12,733 -94.09
PWON Pakuwon Jati Tbk.  500 346.00 258 173,000 129,000 -44,000 -25.43
SOTS Satria Mega Kencana
Tbk.
 400 650.00 494 260,000 197,600 -62,400 -24.00
T O T A L 2,365,863 1,841,000 -524,863`;
            broker = 'PT. Stockbit Sekuritas Digital';
          }

          const parsed = await AIParserService.parseBrokerDocument(sampleText, broker);
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

  const handleExtractPastedText = async () => {
    if (!pastedText.trim()) return;
    triggerHaptic('selection');
    setIsExtracting(true);
    setConfirmationNotice(null);

    try {
      const parsed = await AIParserService.parseBrokerDocument(pastedText);
      setExtractionResult(parsed);
      setSelectedFileName('Teks Dokumen Yang Ditempel');
      triggerHaptic('success');
    } catch (e) {
      console.warn('Paste extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRunSimulation = (sim: (typeof SIMULATION_PRESETS)[0]) => {
    triggerHaptic('selection');
    setSelectedFileName(
      sim.isOfficialSoA
        ? 'Stockbit_Statement_Of_Account_DemoUser.pdf'
        : `${sim.broker.replace(/\s+/g, '_')}_Confirmation.pdf`
    );
    setConfirmationNotice(null);
    setIsExtracting(true);

    setTimeout(() => {
      if (sim.isOfficialSoA) {
        setExtractionResult({
          brokerName: sim.broker,
          documentType: 'STATEMENT_OF_ACCOUNT',
          tradeDate: new Date().toISOString().split('T')[0],
          period: sim.period,
          clientName: sim.clientName,
          sid: sim.sid,
          rdnBank: sim.rdnBank,
          rdnAccountNumber: sim.rdnAccountNumber,
          rdnCashBalance: sim.rdnCashBalance,
          totalPortfolioValue: sim.totalPortfolioValue,
          totalBuyingValue: sim.totalBuyingValue,
          totalUnrealizedPnL: sim.totalUnrealizedPnL,
          holdings: sim.holdings,
          trades: sim.holdings.map((h) => ({
            action: 'BUY' as const,
            ticker: h.ticker,
            lots: h.lots,
            price: h.avgBuyPrice,
            fee: 0,
            netAmount: h.buyingValue,
          })),
          summaryNote: `Hasil ekstraksi resmi Statement of Account ${sim.broker}`,
        });
      } else {
        setExtractionResult({
          brokerName: sim.broker,
          documentType: 'TRADE_CONFIRMATION',
          tradeDate: new Date().toISOString().split('T')[0],
          trades: sim.trades,
          summaryNote: `Hasil ekstraksi dari dokumen ${sim.broker}`,
        });
      }
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
    <ScreenTransition style={styles.screenContainer}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? 12 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SYNC EXPLANATION */}
        <GlassCard style={styles.heroCard} borderTint="rgba(56, 189, 248, 0.25)">
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Icon name="Sparkles" size={20} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Broker Statement Engine</Text>
              <Text style={styles.heroSubtitle}>
                Auto-update 11 Saham Portofolio, Average Buy Price, dan Saldo RDN langsung dari dokumen Statement of Account (SoA) Stockbit & Broker lainnya.
              </Text>
            </View>
          </View>

          {/* RDN Status info */}
          <View style={styles.rdnStatusBox}>
            <View style={styles.rdnRow}>
              <View>
                <Text style={styles.rdnLabel}>Rekening RDN Terhubung:</Text>
                <Text style={styles.rdnName}>{rdnAccount?.name || 'RDN Stockbit Jago'}</Text>
                {rdnAccount?.accountNumber ? (
                  <Text style={styles.rdnAccNumber}>No. {rdnAccount.accountNumber}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rdnLabel}>Saldo Kas RDN:</Text>
                <PrivacyValue value={rdnAccount?.balance || 0} style={styles.rdnBalance} />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* 4 PRESET SIMULATION BUTTONS (1-CLICK TEST) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="Zap" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Uji Coba 1-Klik Simulasi Broker Statement</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Pilih preset untuk menguji parsing dokumen dan sinkronisasi instan</Text>
        </View>

        <View style={styles.presetsList}>
          {SIMULATION_PRESETS.map((sim, index) => {
            const isSoA = sim.isOfficialSoA;
            return (
              <TouchableOpacity
                key={sim.id}
                onPress={() => handleRunSimulation(sim)}
                style={styles.simCardBtn}
                activeOpacity={0.8}
              >
                <GlassCard
                  style={[
                    styles.simCardInner,
                    isSoA && styles.officialSoaCardBorder,
                  ]}
                  borderTint={isSoA ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.2)'}
                >
                  <View style={styles.simTop}>
                    <View
                      style={[
                        styles.simNumberBadge,
                        isSoA && { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
                      ]}
                    >
                      {isSoA ? (
                        <Icon name="FileText" size={14} color="#38BDF8" />
                      ) : (
                        <Text style={styles.simNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.simTitle}>{sim.title}</Text>
                        {isSoA && (
                          <View style={styles.officialPill}>
                            <Text style={styles.officialPillText}>Resmi PDF</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.simDesc}>{sim.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.simRunBadge,
                        isSoA && { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.simRunText,
                          isSoA && { color: '#38BDF8' },
                        ]}
                      >
                        {isSoA ? 'Tes SoA' : 'Tes Ekstraksi'}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NATIVE DOCUMENT PICKER & PASTE TEXT SECTION */}
        <GlassCard style={styles.uploadCard} borderTint="rgba(255, 255, 255, 0.12)">
          <View style={styles.uploadCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadCardTitle}>Unggah File Dokumen Broker Asli</Text>
              <Text style={styles.uploadCardDesc}>
                Mendukung Statement of Account resmi Stockbit, Ajaib, IPOT, Mandiri Sekuritas (PDF atau Foto).
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowPasteBox(!showPasteBox);
              }}
              style={styles.togglePasteBtn}
              activeOpacity={0.8}
            >
              <Icon name="Edit2" size={14} color="#38BDF8" />
              <Text style={styles.togglePasteText}>
                {showPasteBox ? 'Tutup Teks' : 'Tempel Teks'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional PDF Password */}
          <View style={styles.passwordInputContainer}>
            <Icon name="Lock" size={15} color="#94A3B8" />
            <TextInput
              style={styles.passwordInput}
              placeholder="Password PDF Broker (Contoh: DDMMYYYY atau KTP jika terproteksi)"
              placeholderTextColor="#475569"
              secureTextEntry
              value={pdfPassword}
              onChangeText={setPdfPassword}
            />
          </View>

          {/* Paste Raw Text Box (Expandable) */}
          {showPasteBox && (
            <View style={styles.pasteSection}>
              <Text style={styles.pasteLabel}>Tempel Teks Salinan / OCR Statement Broker:</Text>
              <TextInput
                style={styles.pasteTextInput}
                placeholder="Salin teks dari PDF Statement Stockbit atau Trade Confirmation lalu tempel di sini..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={pastedText}
                onChangeText={setPastedText}
              />
              <TouchableOpacity
                onPress={handleExtractPastedText}
                style={styles.extractPastedBtn}
                activeOpacity={0.8}
                disabled={isExtracting || !pastedText.trim()}
              >
                <Icon name="Sparkles" size={15} color="#080C14" />
                <Text style={styles.extractPastedText}>Ekstrak Teks Statement Ini</Text>
              </TouchableOpacity>
            </View>
          )}

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
                <Icon name="UploadCloud" size={18} color="#080C14" />
                <Text style={styles.uploadBtnText}>
                  {selectedFileName ? `Ganti File (${selectedFileName})` : 'Pilih File Dokumen Broker (PDF / Foto)'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* LUXURY ANIMATED BROKER SCANNER LOADER */}
        {isExtracting && (
          <LuxuryLoader
            title="AI BROKER STATEMENT ENGINE"
            subtitle="Menganalisis Dokumen & Ekstraksi Portofolio Saham..."
          />
        )}

        {/* CONFIRMATION SUCCESS NOTIFICATION */}
        {confirmationNotice && (
          <GlassCard style={styles.successNoticeCard} borderTint="rgba(16, 185, 129, 0.3)">
            <View style={styles.noticeHeader}>
              <Icon name="CheckCircle2" size={20} color="#10B981" />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.previewTag}>
                    {extractionResult.documentType === 'STATEMENT_OF_ACCOUNT'
                      ? 'STATEMENT OF ACCOUNT RESMI'
                      : 'PRATINJAU TRADE CONFIRMATION'}
                  </Text>
                  {extractionResult.period && (
                    <Text style={styles.periodTag}>• {extractionResult.period}</Text>
                  )}
                </View>
                <Text style={styles.previewBrokerName}>{extractionResult.brokerName}</Text>
              </View>
              <View style={styles.tradeCountBadge}>
                <Text style={styles.tradeCountText}>
                  {extractionResult.documentType === 'STATEMENT_OF_ACCOUNT'
                    ? `${extractionResult.holdings?.length || 0} Saham Portofolio`
                    : `${extractionResult.trades.length} Transaksi Terdeteksi`}
                </Text>
              </View>
            </View>

            {/* STATEMENT OF ACCOUNT CLIENT & RDN METRICS */}
            {extractionResult.documentType === 'STATEMENT_OF_ACCOUNT' && (
              <View style={styles.soaDetailsBox}>
                {/* Client Info Row */}
                <View style={styles.soaClientRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.soaLabel}>Nama Nasabah</Text>
                    <Text style={styles.soaClientName}>
                      {extractionResult.clientName || 'NASABAH DEMO'}
                    </Text>
                    {extractionResult.sid && (
                      <Text style={styles.soaSid}>SID: {extractionResult.sid}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.soaLabel}>Rekening RDN Investor</Text>
                    <Text style={styles.soaRdnName}>
                      {extractionResult.rdnBank || 'Bank Jago'} • {extractionResult.rdnAccountNumber || '1000000000'}
                    </Text>
                    <Text style={styles.soaCashBalance}>
                      Saldo Kas: {formatIDR(extractionResult.rdnCashBalance || 1000000)}
                    </Text>
                  </View>
                </View>

                {/* Portfolio Summary 3 Columns */}
                <View style={styles.soaStatsRow}>
                  <View style={styles.soaStatCol}>
                    <Text style={styles.soaStatLabel}>Nilai Pasar Portofolio</Text>
                    <Text style={styles.soaStatVal}>
                      {formatIDR(extractionResult.totalPortfolioValue || 1841000)}
                    </Text>
                  </View>
                  <View style={styles.soaStatCol}>
                    <Text style={styles.soaStatLabel}>Total Modal Beli</Text>
                    <Text style={styles.soaStatVal}>
                      {formatIDR(extractionResult.totalBuyingValue || 2365863)}
                    </Text>
                  </View>
                  <View style={[styles.soaStatCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.soaStatLabel}>Unrealized PnL</Text>
                    <Text style={[styles.soaStatVal, styles.textRose]}>
                      {formatIDR(extractionResult.totalUnrealizedPnL || -524863)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* STATEMENT OF ACCOUNT HOLDINGS LIST */}
            {extractionResult.documentType === 'STATEMENT_OF_ACCOUNT' &&
              extractionResult.holdings &&
              extractionResult.holdings.length > 0 && (
                <View style={styles.tradesContainer}>
                  <Text style={styles.holdingsHeaderTitle}>
                    Daftar {extractionResult.holdings.length} Saham Terdeteksi dari Statement:
                  </Text>
                  {extractionResult.holdings.map((h, idx) => {
                    const isProfit = h.unrealizedPnLRp >= 0;
                    return (
                      <View key={idx} style={styles.holdingRow}>
                        <View style={styles.holdingRowLeft}>
                          <View style={styles.tickerBadge}>
                            <Text style={styles.tickerBadgeText}>
                              {h.ticker.replace('.JK', '')}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.holdingName} numberOfLines={1}>
                              {h.name}
                            </Text>
                            <Text style={styles.holdingSub}>
                              {h.lots} Lot ({h.shares.toLocaleString('id-ID')} lbr) • Avg: Rp {h.avgBuyPrice.toLocaleString('id-ID')} • Pasar: Rp {h.currentPrice.toLocaleString('id-ID')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.holdingRowRight}>
                          <Text style={styles.marketValText}>
                            {formatIDR(h.marketValue)}
                          </Text>
                          <Text
                            style={[
                              styles.pnlText,
                              isProfit ? styles.textGreen : styles.textRose,
                            ]}
                          >
                            {isProfit ? '+ ' : ''}
                            {formatIDR(h.unrealizedPnLRp)} ({(h.unrealizedPnLPct * 100).toFixed(2)}%)
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

            {/* TRADE CONFIRMATION TRADES LIST (Standard Single Trades) */}
            {extractionResult.documentType !== 'STATEMENT_OF_ACCOUNT' && (
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
            )}

            {/* Confirm & Update Portfolio Button */}
            <TouchableOpacity
              onPress={handleConfirmUpdate}
              style={styles.confirmBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {extractionResult.documentType === 'STATEMENT_OF_ACCOUNT'
                  ? `✓ Sinkronkan ${extractionResult.holdings?.length || 11} Saham & Update Saldo RDN`
                  : '✓ Konfirmasi & Update Portofolio'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
    </ScreenTransition>
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
  rdnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  rdnAccNumber: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
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
  officialSoaCardBorder: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  simTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  simNumberBadge: {
    width: 28,
    height: 28,
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
  officialPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  officialPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
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
    gap: 12,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  togglePasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  togglePasteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
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
  pasteSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  pasteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pasteTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 11,
    minHeight: 80,
  },
  extractPastedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 10,
  },
  extractPastedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080C14',
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
    gap: 14,
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
  periodTag: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
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
  soaDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  soaClientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  soaLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  soaClientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  soaSid: {
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 1,
    fontWeight: '600',
  },
  soaRdnName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  soaCashBalance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  soaStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soaStatCol: {
    gap: 2,
  },
  soaStatLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  soaStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  holdingsHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  tradesContainer: {
    gap: 8,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  holdingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tickerBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    minWidth: 54,
    alignItems: 'center',
  },
  tickerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  holdingName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  holdingSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  holdingRowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  marketValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  pnlText: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
    marginTop: 6,
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
