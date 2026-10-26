import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { CryptoNetworkType, CryptoWalletToken } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { CryptoWalletService } from '../../services/crypto-wallet-service';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/format';
import { color, space, radius, shadow, font } from '../../theme/tokens';

interface CryptoWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CryptoWalletModal: React.FC<CryptoWalletModalProps> = ({ visible, onClose }) => {
  const { addCryptoWallet, currency, usdRate } = useWealth();

  const [importMode, setImportMode] = useState<'SINGLE' | 'BATCH'>('BATCH');
  const [batchText, setBatchText] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [networkType, setNetworkType] = useState<CryptoNetworkType>('EVM');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    chains: string[];
    tokens: CryptoWalletToken[];
    totalBalanceIdr: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extracted addresses from batch text
  const detectedAddresses = React.useMemo(() => {
    return CryptoWalletService.extractAddresses(batchText);
  }, [batchText]);

  // Reset modal state on open/close
  React.useEffect(() => {
    if (visible) {
      setName('');
      setAddress('');
      setBatchText('');
      setImportMode('BATCH');
      setNetworkType('EVM');
      setScanResult(null);
      setErrorMsg(null);
      setIsScanning(false);
      setIsSubmitting(false);
    }
  }, [visible]);

  // Handle address change & auto-detect network
  const handleAddressChange = (text: string) => {
    const trimmed = text.trim();
    setAddress(trimmed);
    setErrorMsg(null);
    setScanResult(null);

    // Auto-detect network if user pastes full address
    const detected = CryptoWalletService.detectNetworkType(trimmed);
    if (detected && detected !== networkType) {
      setNetworkType(detected);
    }
  };

  // Perform live on-chain scan for single address
  const handleScanPreview = async () => {
    const clean = address.trim();
    if (!clean) {
      setErrorMsg('Masukkan alamat publik terlebih dahulu');
      triggerHaptic('warning');
      return;
    }

    if (!CryptoWalletService.isValidAddress(clean, networkType)) {
      setErrorMsg(`Format alamat ${networkType} tidak valid`);
      triggerHaptic('warning');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    triggerHaptic('light');

    try {
      const res = await CryptoWalletService.scanWallet(clean, networkType);
      setScanResult({
        chains: res.chains,
        tokens: res.tokens,
        totalBalanceIdr: res.totalBalanceIdr,
      });
      triggerHaptic('success');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal memindai blockchain. Periksa koneksi.');
      triggerHaptic('warning');
    } finally {
      setIsScanning(false);
    }
  };

  // Submit single wallet
  const handleSingleSubmit = async () => {
    const clean = address.trim();
    if (!clean) {
      setErrorMsg('Alamat publik wajib diisi');
      triggerHaptic('warning');
      return;
    }

    if (!CryptoWalletService.isValidAddress(clean, networkType)) {
      setErrorMsg(`Format alamat ${networkType} tidak valid`);
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await addCryptoWallet(
        name.trim() || `Dompet ${networkType}`,
        clean,
        networkType
      );
      triggerHaptic('success');
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menambahkan dompet Web3.');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit batch multi-addresses at once
  const handleBatchSubmit = async () => {
    if (detectedAddresses.length === 0) {
      setErrorMsg('Tidak ada alamat valid yang terdeteksi dari teks.');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      for (const item of detectedAddresses) {
        await addCryptoWallet(
          `Dompet ${item.networkType}`,
          item.address,
          item.networkType
        );
      }
      triggerHaptic('success');
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menambahkan beberapa dompet.');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.badgeRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.badgeText}>100% Auto-Sync On-Chain</Text>
                </View>
                <Text style={styles.title}>Hubungkan Dompet Web3</Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <Icon name="X" size={18} color={color.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Import Mode Switcher */}
              <View style={styles.modeRow}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setImportMode('BATCH');
                    setErrorMsg(null);
                  }}
                  style={[styles.modeTab, importMode === 'BATCH' && styles.activeModeTab]}
                >
                  <View style={styles.batchTagRow}>
                    <Icon
                      name="Zap"
                      size={13}
                      color={importMode === 'BATCH' ? '#DDD6FE' : color.textMuted}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        importMode === 'BATCH' && styles.activeModeTabText,
                      ]}
                    >
                      Tempel Sekaligus
                    </Text>
                    <View style={styles.quickBadge}>
                      <Text style={styles.quickBadgeText}>Rekomendasi</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setImportMode('SINGLE');
                    setErrorMsg(null);
                  }}
                  style={[styles.modeTab, importMode === 'SINGLE' && styles.activeModeTab]}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      importMode === 'SINGLE' && styles.activeModeTabText,
                    ]}
                  >
                    Input Tunggal
                  </Text>
                </Pressable>
              </View>

              {importMode === 'BATCH' ? (
                /* BATCH MODE: PASTE ALL AT ONCE */
                <View style={styles.batchContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Tempel Daftar Alamat Publik</Text>
                    <Text style={styles.readOnlyTag}>Auto-Detect Multi-Chain</Text>
                  </View>
                  <TextInput
                    style={styles.batchInput}
                    placeholder={`Tempel satu atau beberapa alamat publik di sini.\nBisa dipisah baris, koma, spasi, atau teks bebas.\nContoh:\n0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\nvines1vzrYbzLMRdu58sy5XTSEPbEK9aZXgHG7xXt21\nbc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq`}
                    placeholderTextColor={color.textFaint}
                    multiline
                    numberOfLines={5}
                    value={batchText}
                    onChangeText={(t) => {
                      setBatchText(t);
                      setErrorMsg(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Detected Address Chips */}
                  <View style={styles.detectedSummaryBox}>
                    <Text style={styles.detectedSummaryTitle}>
                      {detectedAddresses.length > 0
                        ? `Terdeteksi ${detectedAddresses.length} Alamat Blockchain Valid:`
                        : 'Tempel alamat publik untuk mendeteksi otomatis'}
                    </Text>
                    {detectedAddresses.length > 0 && (
                      <View style={styles.detectedPillsRow}>
                        {detectedAddresses.map((item, idx) => (
                          <View key={`${item.address}-${idx}`} style={styles.detectedPill}>
                            <View style={styles.chainPillDot} />
                            <Text style={styles.detectedPillNetwork}>
                              {item.networkType === 'EVM' ? 'EVM (5 Chain)' : item.networkType}
                            </Text>
                            <Text style={styles.detectedPillAddress}>
                              {CryptoWalletService.truncateAddress(item.address, 5, 4)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Submit Batch Button */}
                  <Pressable
                    onPress={handleBatchSubmit}
                    disabled={isSubmitting || detectedAddresses.length === 0}
                    style={[
                      styles.submitBtn,
                      (detectedAddresses.length === 0 || isSubmitting) && styles.disabledSubmitBtn,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="Link2" size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>
                          {detectedAddresses.length > 0
                            ? `Hubungkan ${detectedAddresses.length} Dompet Sekaligus`
                            : 'Tempel Alamat Terlebih Dahulu'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                /* SINGLE MODE: ONE BY ONE */
                <View>
                  {/* Network Selector Tabs */}
                  <Text style={styles.inputLabel}>Pilih Jaringan Blockchain</Text>
                  <View style={styles.networkRow}>
                    {(['EVM', 'SOLANA', 'BITCOIN'] as CryptoNetworkType[]).map((net) => {
                      const isActive = networkType === net;
                      const label =
                        net === 'EVM' ? 'EVM Multi-Chain' : net === 'SOLANA' ? 'Solana' : 'Bitcoin';
                      return (
                        <Pressable
                          key={net}
                          onPress={() => {
                            triggerHaptic('selection');
                            setNetworkType(net);
                            setScanResult(null);
                            setErrorMsg(null);
                          }}
                          style={[styles.networkTab, isActive && styles.activeNetworkTab]}
                        >
                          <Text style={[styles.networkTabText, isActive && styles.activeNetworkTabText]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {networkType === 'EVM' && (
                    <View style={styles.networkSubNote}>
                      <Text style={styles.networkSubNoteText}>
                        Mendukung 5 chain sekaligus: Ethereum, BSC, Polygon, Arbitrum & Base
                      </Text>
                    </View>
                  )}

                  {/* Wallet Name */}
                  <Text style={styles.inputLabel}>Nama Dompet (Opsional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Metamask Utama, Ledger Cold, Phantom"
                    placeholderTextColor={color.textFaint}
                    value={name}
                    onChangeText={setName}
                    maxLength={40}
                  />

                  {/* Public Address */}
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Alamat Publik (Public Address)</Text>
                    <Text style={styles.readOnlyTag}>Read-Only</Text>
                  </View>
                  <View style={styles.addressInputContainer}>
                    <TextInput
                      style={[styles.input, styles.addressInput]}
                      placeholder={
                        networkType === 'EVM'
                          ? '0x...'
                          : networkType === 'SOLANA'
                          ? 'Alamat Solana Base58...'
                          : 'bc1... atau 1... atau 3...'
                      }
                      placeholderTextColor={color.textFaint}
                      value={address}
                      onChangeText={handleAddressChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      multiline={false}
                    />
                  </View>

                  {/* Scan Trigger Button */}
                  <Pressable
                    onPress={handleScanPreview}
                    disabled={isScanning || !address.trim()}
                    style={[
                      styles.scanPreviewBtn,
                      (!address.trim() || isScanning) && styles.disabledBtn,
                    ]}
                  >
                    {isScanning ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="RefreshCw" size={14} color="#fff" />
                        <Text style={styles.scanPreviewBtnText}>Pindai Saldo On-Chain</Text>
                      </>
                    )}
                  </Pressable>

                  {/* Live Scan Result Preview */}
                  {scanResult && (
                    <View style={styles.scanResultContainer}>
                      <View style={styles.scanHeader}>
                        <Text style={styles.scanResultTitle}>Hasil Pindaian On-Chain</Text>
                        <Text style={styles.scanTotalValue}>
                          {formatCurrency(scanResult.totalBalanceIdr, currency, usdRate)}
                        </Text>
                      </View>

                      {/* Chains detected */}
                      <View style={styles.chainPillRow}>
                        {scanResult.chains.map((c) => (
                          <View key={c} style={styles.chainPill}>
                            <View style={styles.chainPillDot} />
                            <Text style={styles.chainPillText}>{c}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Tokens detected */}
                      {scanResult.tokens.length > 0 ? (
                        <View style={styles.tokensList}>
                          {scanResult.tokens.map((t, idx) => (
                            <View key={`${t.chain}-${t.symbol}-${idx}`} style={styles.tokenRow}>
                              <View style={styles.tokenLeft}>
                                <View style={styles.tokenIconBadge}>
                                  <Text style={styles.tokenIconText}>{t.symbol.slice(0, 3)}</Text>
                                </View>
                                <View>
                                  <Text style={styles.tokenSymbol}>{t.symbol}</Text>
                                  <Text style={styles.tokenChain}>{t.chain}</Text>
                                </View>
                              </View>
                              <View style={styles.tokenRight}>
                                <Text style={styles.tokenAmount}>
                                  {t.balance < 0.001 ? t.balance.toFixed(6) : t.balance.toFixed(4)}
                                </Text>
                                <Text style={styles.tokenValue}>
                                  {formatCurrency(t.valueIdr, currency, usdRate)}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.emptyTokens}>
                          <Text style={styles.emptyTokensText}>
                            Tidak ditemukan saldo aktif pada alamat ini. Anda tetap dapat menghubungkannya untuk pemantauan masa depan.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Submit Single Button */}
                  <Pressable
                    onPress={handleSingleSubmit}
                    disabled={isSubmitting || !address.trim()}
                    style={[
                      styles.submitBtn,
                      (!address.trim() || isSubmitting) && styles.disabledSubmitBtn,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="Link2" size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>Simpan & Aktifkan Auto-Sync</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Error Message */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Icon name="AlertCircle" size={14} color={color.loss} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Non-Custodial Security Notice Card */}
              <View style={styles.securityCard}>
                <Icon name="ShieldCheck" size={18} color={color.gain} />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityTitle}>100% Non-Custodial & Aman</Text>
                  <Text style={styles.securityDesc}>
                    OmniWealth hanya membaca data publik on-chain. Kami tidak pernah meminta,
                    menyimpan, atau memerlukan Private Key atau Seed Phrase Anda.
                  </Text>
                </View>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '92%',
  },
  cardContainer: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xl,
    backgroundColor: 'rgba(22, 22, 26, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gain,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.gain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  closeBtn: {
    padding: space.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingBottom: space.xl,
  },
  modeRow: {
    flexDirection: 'row',
    gap: space.xs,
    marginBottom: space.md,
  },
  modeTab: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeModeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: '#8B5CF6',
  },
  modeTabText: {
    fontSize: 12,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
  },
  activeModeTabText: {
    color: '#DDD6FE',
    fontFamily: font.uiBold,
    fontWeight: '700',
  },
  batchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
  },
  quickBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.gain,
  },
  batchContainer: {
    gap: space.xs,
  },
  batchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: color.text,
    fontSize: 12,
    fontFamily: font.num,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  detectedSummaryBox: {
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detectedSummaryTitle: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
    marginBottom: 6,
  },
  detectedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  detectedPillNetwork: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  detectedPillAddress: {
    fontSize: 10,
    fontFamily: font.num,
    color: color.textMuted,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
    marginBottom: space.xs,
    marginTop: space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyTag: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  networkRow: {
    flexDirection: 'row',
    gap: space.xs,
    marginBottom: space.xs,
  },
  networkTab: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNetworkTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: '#8B5CF6',
  },
  networkTabText: {
    fontSize: 12,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
  },
  activeNetworkTabText: {
    color: '#DDD6FE',
    fontFamily: font.uiBold,
    fontWeight: '700',
  },
  networkSubNote: {
    marginBottom: space.xs,
  },
  networkSubNoteText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textFaint,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: color.text,
    fontSize: 13,
    fontFamily: font.ui,
  },
  addressInputContainer: {
    marginBottom: space.sm,
  },
  addressInput: {
    fontFamily: font.num,
    fontSize: 12,
  },
  scanPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    marginVertical: space.xs,
  },
  scanPreviewBtnText: {
    fontSize: 12,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: '#EDE9FE',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: space.sm,
    borderRadius: radius.md,
    marginTop: space.xs,
  },
  errorText: {
    fontSize: 12,
    color: color.loss,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    flex: 1,
  },
  scanResultContainer: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  scanResultTitle: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
    textTransform: 'uppercase',
  },
  scanTotalValue: {
    fontSize: 16,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.gain,
  },
  chainPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: space.xs,
  },
  chainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  chainPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#A78BFA',
  },
  chainPillText: {
    fontSize: 10,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: '#DDD6FE',
  },
  tokensList: {
    marginTop: space.xs,
    gap: 6,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.textMuted,
  },
  tokenSymbol: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  tokenChain: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textFaint,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    fontSize: 12,
    fontFamily: font.num,
    fontWeight: '600',
    color: color.text,
  },
  tokenValue: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  emptyTokens: {
    paddingVertical: space.sm,
  },
  emptyTokensText: {
    fontSize: 12,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 18,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: radius.md,
    padding: space.sm,
    marginTop: space.md,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.gain,
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: space.md,
    borderRadius: radius.lg,
    marginTop: space.lg,
    ...shadow.e1,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#fff',
  },
  disabledSubmitBtn: {
    opacity: 0.4,
  },
});
