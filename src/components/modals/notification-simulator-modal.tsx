import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { useWealth } from '../../store/wealth-context';
import { formatIDR } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { BankMutationResult } from '../../types';

interface NotificationSimulatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationSimulatorModal: React.FC<NotificationSimulatorModalProps> = ({
  visible,
  onClose,
}) => {
  const { applyMutationText } = useWealth();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<BankMutationResult | null>(null);

  const PRESETS = [
    {
      id: 'p1',
      title: 'QRIS Kopi Kenangan (BCA)',
      text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
    },
    {
      id: 'p2',
      title: 'BI-FAST Gaji (Mandiri)',
      text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
    },
    {
      id: 'p3',
      title: 'Top Up RDN Stockbit',
      text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
    },
  ];

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const result = await applyMutationText(inputText);
      setLastResult(result);
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPreset = (presetText: string) => {
    triggerHaptic('selection');
    setInputText(presetText);
    setLastResult(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon name="Sparkles" size={18} color="#38BDF8" />
                <Text style={styles.title}>Smart Bank & QRIS Parser</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                style={styles.closeBtn}
              >
                <Icon name="X" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Tempel notifikasi SMS / WhatsApp / QRIS mutasi bank dari HP Anda, atau pilih preset cepat di bawah:
            </Text>

            {/* 3 Quick Presets */}
            <View style={styles.presetSection}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleApplyPreset(p.text)}
                  style={styles.presetChip}
                  activeOpacity={0.7}
                >
                  <Icon name="Zap" size={12} color="#F59E0B" />
                  <Text style={styles.presetChipText}>{p.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Text Input Multiline */}
            <TextInput
              style={styles.textArea}
              placeholder="Ketik atau paste teks notifikasi di sini..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={(t) => {
                setInputText(t);
                setLastResult(null);
              }}
            />

            {/* Result Preview Banner */}
            {lastResult && (
              <View style={styles.resultBanner}>
                <Icon name="CheckCircle2" size={18} color="#10B981" />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>
                    {lastResult.type}: {formatIDR(lastResult.amount)}
                  </Text>
                  <Text style={styles.resultDetails}>
                    Akun: {lastResult.bankName} • Kategori: {lastResult.category}
                  </Text>
                  <Text style={styles.resultSuccessTag}>Saldo Rekening Otomatis Terpotong/Bertambah</Text>
                </View>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              style={[styles.processBtn, (!inputText.trim() || isProcessing) && styles.disabledBtn]}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator color="#080C14" />
              ) : (
                <Text style={styles.processBtnText}>⚡ Proses & Perbarui Saldo</Text>
              )}
            </TouchableOpacity>
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
    width: '100%',
    padding: 16,
    paddingBottom: 34,
  },
  cardContainer: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 18,
  },
  presetSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  resultBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  resultDetails: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  resultSuccessTag: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
    marginTop: 4,
  },
  processBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  processBtnText: {
    color: '#080C14',
    fontWeight: '700',
    fontSize: 14,
  },
});
