import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { useWealth } from '../../store/wealth-context';
import { formatIDR } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { BankMutationResult } from '../../types';
import { color, space, radius, shadow } from '../../theme/tokens';

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
      title: 'QRIS Kopi Kenangan',
      text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
    },
    {
      id: 'p2',
      title: 'Gaji Bulanan',
      text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
    },
    {
      id: 'p3',
      title: 'Top Up RDN',
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Simulasi notifikasi mutasi</Text>
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

            <Text style={styles.label}>Pilih preset simulasi notifikasi SMS/QRIS:</Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    setInputText(p.text);
                  }}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>{p.title}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Ketik atau tempel teks notifikasi..."
              placeholderTextColor={color.textFaint}
              multiline
              numberOfLines={3}
              value={inputText}
              onChangeText={setInputText}
            />

            {lastResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>
                  {lastResult.type}: {formatIDR(lastResult.amount)}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {lastResult.bankName} • {lastResult.category}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              style={[styles.submitBtn, (!inputText.trim() || isProcessing) && styles.disabledBtn]}
            >
              {isProcessing ? (
                <ActivityIndicator color={color.onAccent} size="small" />
              ) : (
                <Text style={styles.submitText}>Proses notifikasi</Text>
              )}
            </Pressable>
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
    padding: space.md,
    paddingBottom: 34,
  },
  cardContainer: {
    padding: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: color.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
  },
  label: {
    fontSize: 12,
    color: color.textMuted,
    marginBottom: space.xs,
  },
  presetRow: {
    flexDirection: 'row',
    gap: space.xs,
    marginBottom: space.md,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 11,
    color: color.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    color: color.text,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: space.md,
  },
  resultBox: {
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginBottom: space.md,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: color.gain,
  },
  resultSubtitle: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: color.accent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    ...shadow.e1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitText: {
    color: color.onAccent,
    fontWeight: '600',
    fontSize: 14,
  },
});
