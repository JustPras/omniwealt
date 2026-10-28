import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { LiquidSegmentControl } from '../common/liquid-segment-control';
import { useWealth } from '../../store/wealth-context';
import {
  MONITORED_BANK_APPS,
  NOTIFICATION_TEST_PRESETS,
  NotificationSyncService,
} from '../../services/notification-sync-service';
import { formatCurrency, formatDate } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow, font } from '../../theme/tokens';
import { generateSyncToken } from '../../services/storage-service';

type ModalTab = 'STATUS' | 'SETUP' | 'SIMULASI' | 'LOGS';

interface BankAutoSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BankAutoSyncModal: React.FC<BankAutoSyncModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    notificationConfig,
    updateNotificationConfig,
    notificationLogs,
    clearNotificationLogs,
    processIncomingNotification,
    currency,
    usdRate,
  } = useWealth();

  const [activeTab, setActiveTab] = useState<ModalTab>('STATUS');
  const [customText, setCustomText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const guide = NotificationSyncService.getMacroDroidGuide(notificationConfig.syncSecretToken);

  const handleRegenerateToken = () => {
    triggerHaptic('selection');
    const newToken = generateSyncToken();
    updateNotificationConfig({ syncSecretToken: newToken });
  };

  const handleToggleApp = (appId: string) => {
    triggerHaptic('selection');
    const current = notificationConfig.monitoredApps || [];
    const updated = current.includes(appId)
      ? current.filter((id) => id !== appId)
      : [...current, appId];
    updateNotificationConfig({ monitoredApps: updated });
  };

  const handleCopyDeepLink = async () => {
    triggerHaptic('selection');
    try {
      await Share.share({
        message: guide.deepLinkTemplate,
        title: 'Deep Link Template OmniWealth',
      });
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleRunPreset = async (presetText: string, appId: string) => {
    setIsSimulating(true);
    triggerHaptic('medium');
    try {
      await processIncomingNotification(presetText, appId);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunTwoLeggedPair = async () => {
    setIsSimulating(true);
    triggerHaptic('medium');
    try {
      // Leg 1: BCA Outflow
      await processIncomingNotification(
        'Transfer keluar Rp 500.000 ke Bank Jago dari rekening BCA Tahapan',
        'bca'
      );
      // Brief pause between legs
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Leg 2: Jago Inflow (Complementary Leg)
      await processIncomingNotification(
        'Pemberitahuan: Uang masuk Rp 500.000 via BI-FAST dari BCA ke Kantong Utama Bank Jago',
        'jago'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunCustom = async () => {
    if (!customText.trim()) return;
    setIsSimulating(true);
    triggerHaptic('medium');
    try {
      await processIncomingNotification(customText);
      setCustomText('');
    } finally {
      setIsSimulating(false);
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
                <View style={styles.liveBadgeRow}>
                  <View
                    style={[
                      styles.liveDot,
                      notificationConfig.enabled
                        ? styles.liveDotActive
                        : styles.liveDotInactive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.liveBadgeText,
                      notificationConfig.enabled
                        ? styles.liveBadgeTextActive
                        : styles.liveBadgeTextInactive,
                    ]}
                  >
                    {notificationConfig.enabled ? 'Auto-Sync Aktif' : 'Auto-Sync Nonaktif'}
                  </Text>
                </View>
                <Text style={styles.title}>Auto-Sync Bank & E-Wallet</Text>
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

            {/* Liquid Segment Control Tabs */}
            <View style={styles.tabWrapper}>
              <LiquidSegmentControl<ModalTab>
                items={[
                  { key: 'STATUS', label: 'Status' },
                  { key: 'SETUP', label: 'Setup 1-Klik' },
                  { key: 'SIMULASI', label: 'Simulasi' },
                  { key: 'LOGS', label: `Log (${notificationLogs.length})` },
                ]}
                activeKey={activeTab}
                onSelect={setActiveTab}
                height={34}
                fontSize={11}
                compact
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* TAB 1: STATUS & TOGGLES */}
              {activeTab === 'STATUS' && (
                <View style={styles.tabBody}>
                  {/* Master Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Aktifkan Auto-Sync Notifikasi</Text>
                      <Text style={styles.settingDesc}>
                        Tangkap notifikasi transaksi QRIS, debit, dan transfer masuk di latar belakang.
                      </Text>
                    </View>
                    <Switch
                      value={notificationConfig.enabled}
                      onValueChange={(val) => {
                        triggerHaptic('selection');
                        updateNotificationConfig({ enabled: val });
                      }}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: color.accent }}
                      thumbColor="#fff"
                    />
                  </View>

                  {/* Auto-Commit Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Auto-Commit Langsung ke Saldo</Text>
                      <Text style={styles.settingDesc}>
                        Otomatis memperbarui saldo akun kas & buku besar saat notifikasi masuk.
                      </Text>
                    </View>
                    <Switch
                      value={notificationConfig.autoCommit}
                      onValueChange={(val) => {
                        triggerHaptic('selection');
                        updateNotificationConfig({ autoCommit: val });
                      }}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: color.gain }}
                      thumbColor="#fff"
                    />
                  </View>

                  {/* Pilar 2: Anti-Duplikat Transfer Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.settingLabel}>Pilar 2: Smart Anti-Duplikat Transfer</Text>
                        <View style={styles.pilarBadge}>
                          <Text style={styles.pilarBadgeText}>Pilar 2</Text>
                        </View>
                      </View>
                      <Text style={styles.settingDesc}>
                        Mencocokkan mutasi transfer antar rekening sendiri (BCA, Mandiri, Jago, GoPay, RDN) tanpa menduplikasi uang masuk/keluar.
                      </Text>
                    </View>
                    <Switch
                      value={notificationConfig.internalTransferMatching !== false}
                      onValueChange={(val) => {
                        triggerHaptic('selection');
                        updateNotificationConfig({ internalTransferMatching: val });
                      }}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#A78BFA' }}
                      thumbColor="#fff"
                    />
                  </View>

                  {/* Monitored Apps Grid */}
                  <Text style={styles.sectionHeader}>Aplikasi Bank & E-Wallet Dipantau</Text>
                  <Text style={styles.sectionSubDesc}>
                    Pilih institusi yang ingin disinkronisasikan otomatis ke OmniWealth:
                  </Text>

                  <View style={styles.appsGrid}>
                    {MONITORED_BANK_APPS.map((app) => {
                      const isMonitored = (notificationConfig.monitoredApps || []).includes(app.id);
                      return (
                        <Pressable
                          key={app.id}
                          onPress={() => handleToggleApp(app.id)}
                          style={[
                            styles.appChip,
                            isMonitored && styles.appChipActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.appChipDot,
                              { backgroundColor: isMonitored ? app.color : 'rgba(255,255,255,0.2)' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.appChipText,
                              isMonitored && styles.appChipTextActive,
                            ]}
                          >
                            {app.name}
                          </Text>
                          {isMonitored && (
                            <Icon name="Check" size={12} color="#38BDF8" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* TAB 2: SETUP 1-KLIK (MACRODROID) */}
              {activeTab === 'SETUP' && (
                <View style={styles.tabBody}>
                  <View style={styles.infoBanner}>
                    <Icon name="Zap" size={16} color="#38BDF8" />
                    <Text style={styles.infoBannerText}>
                      Di Android, Anda bisa menangkap notifikasi secara 100% otomatis di latar belakang menggunakan MacroDroid (gratis dari Play Store, tanpa root).
                    </Text>
                  </View>

                  <Text style={styles.sectionHeader}>Langkah Setup Cepat (3 Menit):</Text>

                  <View style={styles.stepsList}>
                    {guide.steps.map((st, idx) => (
                      <View key={idx} style={styles.stepItem}>
                        <View style={styles.stepNumBadge}>
                          <Text style={styles.stepNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{st}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Security Handshake Card */}
                  <View style={styles.securityBox}>
                    <View style={styles.securityHeader}>
                      <Icon name="ShieldCheck" size={16} color="#10B981" />
                      <Text style={styles.securityTitle}>Kunci Rahasia Sinkronisasi (Handshake Token):</Text>
                    </View>
                    <View style={styles.tokenRow}>
                      <Text style={styles.tokenText}>{notificationConfig.syncSecretToken || 'omni_sec_default'}</Text>
                      <Pressable onPress={handleRegenerateToken} style={styles.regenBtn}>
                        <Icon name="RefreshCw" size={12} color="#38BDF8" />
                        <Text style={styles.regenBtnText}>Ganti Kunci</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.securityDesc}>
                      Hanya deep link dengan token rahasia ini yang diizinkan masuk ke buku kas untuk mencegah injeksi transaksi dari aplikasi lain.
                    </Text>
                  </View>

                  {/* Deep Link Template Box */}
                  <Text style={styles.sectionHeader}>Template Deep Link Action:</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{guide.deepLinkTemplate}</Text>
                  </View>

                  <Pressable onPress={handleCopyDeepLink} style={styles.copyBtn}>
                    <Icon name="Share2" size={15} color="#fff" />
                    <Text style={styles.copyBtnText}>
                      {copyFeedback ? '✓ Template Siap Digunakan!' : 'Bagikan / Salin Template Macro'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* TAB 3: UJI SIMULASI */}
              {activeTab === 'SIMULASI' && (
                <View style={styles.tabBody}>
                  {/* Interactive Pilar 2 Test Card */}
                  <View style={styles.pilar2FeatureCard}>
                    <View style={styles.pilar2CardHeader}>
                      <View style={styles.pilar2IconCircle}>
                        <Icon name="Repeat" size={16} color="#A78BFA" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pilar2CardTitle}>Uji Rekonsiliasi Transfer 2 Arah</Text>
                        <Text style={styles.pilar2CardDesc}>
                          Simulasikan debit BCA Rp 500k disusul kredit Jago Rp 500k. Aplikasi akan menyatukannya menjadi 1 transaksi Transfer tanpa double-counting.
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      disabled={isSimulating}
                      onPress={handleRunTwoLeggedPair}
                      style={[styles.pilar2RunBtn, isSimulating && styles.disabledButton]}
                    >
                      {isSimulating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Icon name="Play" size={13} color="#fff" />
                          <Text style={styles.pilar2RunBtnText}>Jalankan Simulasi 2 Arah (BCA ➔ Jago)</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  <Text style={styles.sectionHeader}>Pilih Preset Transaksi Nyata:</Text>
                  <Text style={styles.sectionSubDesc}>
                    Sentuh salah satu preset untuk menguji interseptor mutasi & banner secara langsung:
                  </Text>

                  <View style={styles.presetList}>
                    {NOTIFICATION_TEST_PRESETS.map((p) => (
                      <Pressable
                        key={p.id}
                        disabled={isSimulating}
                        onPress={() => handleRunPreset(p.text, p.appId)}
                        style={styles.presetCard}
                      >
                        <View style={styles.presetCardLeft}>
                          <View style={styles.presetHeaderRow}>
                            <Text style={styles.presetTitle}>{p.title}</Text>
                            <View style={styles.presetBadge}>
                              <Text style={styles.presetBadgeText}>{p.badge}</Text>
                            </View>
                          </View>
                          <Text style={styles.presetDesc} numberOfLines={2}>
                            "{p.text}"
                          </Text>
                        </View>
                        <Icon name="Play" size={14} color="#38BDF8" />
                      </Pressable>
                    ))}
                  </View>

                  {/* Custom Test */}
                  <Text style={styles.sectionHeader}>Ketik atau Tempel Notifikasi Sendiri:</Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Contoh: Transaksi QRIS Rp 25.000 di Janji Jiwa berhasil..."
                    placeholderTextColor={color.textFaint}
                    value={customText}
                    onChangeText={setCustomText}
                    multiline
                    numberOfLines={3}
                  />

                  <Pressable
                    disabled={isSimulating || !customText.trim()}
                    onPress={handleRunCustom}
                    style={[
                      styles.runCustomBtn,
                      (!customText.trim() || isSimulating) && styles.disabledBtn,
                    ]}
                  >
                    {isSimulating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="Send" size={14} color="#fff" />
                        <Text style={styles.runCustomBtnText}>Uji Notifikasi Kustom</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {/* TAB 4: RIWAYAT LOG */}
              {activeTab === 'LOGS' && (
                <View style={styles.tabBody}>
                  <View style={styles.logsHeader}>
                    <Text style={styles.sectionHeader}>
                      Riwayat Tangkapan ({notificationLogs.length})
                    </Text>
                    {notificationLogs.length > 0 && (
                      <Pressable onPress={clearNotificationLogs} hitSlop={6}>
                        <Text style={styles.clearLogsText}>Hapus Semua</Text>
                      </Pressable>
                    )}
                  </View>

                  {notificationLogs.length === 0 ? (
                    <View style={styles.emptyLogsBox}>
                      <Icon name="Bell" size={28} color={color.textFaint} />
                      <Text style={styles.emptyLogsTitle}>Belum Ada Notifikasi Ditangkap</Text>
                      <Text style={styles.emptyLogsDesc}>
                        Notifikasi yang ditangkap dari m-Banking atau simulasi akan tercatat otomatis di sini.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.logsList}>
                      {notificationLogs.map((log) => {
                        const isIncome = log.parsedResult.type === 'INCOME';
                        return (
                          <View key={log.id} style={styles.logCard}>
                            <View style={styles.logTopRow}>
                              <View style={styles.logAppBadge}>
                                <Text style={styles.logAppText}>{log.sourceApp}</Text>
                              </View>
                              <Text style={styles.logTime}>
                                {formatDate(log.timestamp)}
                              </Text>
                            </View>

                            <View style={styles.logDetailRow}>
                              <Text style={styles.logDesc} numberOfLines={1}>
                                {log.parsedResult.merchantOrSender || log.parsedResult.category}
                              </Text>
                              <Text
                                style={[
                                  styles.logAmount,
                                  isIncome ? styles.textIncome : styles.textExpense,
                                ]}
                              >
                                {isIncome ? '+' : '-'}
                                {formatCurrency(log.parsedResult.amount, currency, usdRate)}
                              </Text>
                            </View>

                            <Text style={styles.logRawText} numberOfLines={2}>
                              "{log.rawText}"
                            </Text>
                          </View>
                        );
                      })}
                    </View>
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
    marginBottom: space.sm,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDotActive: {
    backgroundColor: color.gain,
  },
  liveDotInactive: {
    backgroundColor: color.textFaint,
  },
  liveBadgeText: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveBadgeTextActive: {
    color: color.gain,
  },
  liveBadgeTextInactive: {
    color: color.textFaint,
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
  tabWrapper: {
    marginTop: space.xs,
    marginBottom: space.md,
  },
  scrollContent: {
    paddingBottom: space.xl,
  },
  tabBody: {
    gap: space.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: space.sm,
  },
  settingLabel: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
    marginTop: space.xs,
  },
  sectionSubDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    marginTop: -4,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  appChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  appChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  appChipText: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
  },
  appChipTextActive: {
    color: '#EDE9FE',
    fontFamily: font.uiBold,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  infoBannerText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: '#BAE6FD',
    flex: 1,
    lineHeight: 17,
  },
  stepsList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
  },
  stepText: {
    fontSize: 12,
    fontFamily: font.ui,
    color: color.text,
    flex: 1,
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  securityBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  securityTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#34D399',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    marginBottom: 6,
  },
  tokenText: {
    fontFamily: font.num,
    fontSize: 13,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  regenBtnText: {
    fontSize: 10,
    fontFamily: font.uiBold,
    color: '#38BDF8',
  },
  securityDesc: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 15,
  },
  codeText: {
    fontFamily: font.num,
    fontSize: 11,
    color: '#A7F3D0',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: space.sm,
    borderRadius: radius.md,
    marginTop: space.xs,
  },
  copyBtnText: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#fff',
  },
  presetList: {
    gap: 8,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  presetCardLeft: {
    flex: 1,
    paddingRight: space.sm,
  },
  presetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  presetTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  presetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  presetBadgeText: {
    fontSize: 9,
    fontFamily: font.uiSemi,
    color: color.textMuted,
  },
  presetDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 15,
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    padding: space.sm,
    color: color.text,
    fontSize: 12,
    fontFamily: font.ui,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  runCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  runCustomBtnText: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#fff',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLogsText: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    color: color.loss,
  },
  emptyLogsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xl,
    gap: 6,
  },
  emptyLogsTitle: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.textMuted,
  },
  emptyLogsDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textFaint,
    textAlign: 'center',
    paddingHorizontal: space.lg,
  },
  logsList: {
    gap: 8,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAppBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
  },
  logAppText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
  },
  logTime: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textFaint,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  logDesc: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
    flex: 1,
  },
  logAmount: {
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
  pilarBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  pilarBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#A78BFA',
  },
  pilar2FeatureCard: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
  },
  pilar2CardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: space.sm,
  },
  pilar2IconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilar2CardTitle: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#DDD6FE',
    marginBottom: 2,
  },
  pilar2CardDesc: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    lineHeight: 16,
  },
  pilar2RunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingVertical: 9,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  pilar2RunBtnText: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  logRawText: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textMuted,
    fontStyle: 'italic',
  },
});
