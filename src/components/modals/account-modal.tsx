import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { AccountType } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow } from '../../theme/tokens';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ visible, onClose }) => {
  const { addAccount } = useWealth();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const numBalance = parseFloat(balance.replace(/\D/g, '')) || 0;

    await addAccount({
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim() || undefined,
      balance: numBalance,
      color: type === 'BANK' ? color.asset.stock : type === 'RDN' ? color.gain : color.asset.crypto,
      icon: type === 'BANK' ? 'landmark' : type === 'RDN' ? 'trending-up' : 'smartphone',
    });

    triggerHaptic('success');
    setName('');
    setAccountNumber('');
    setBalance('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Tambah rekening baru</Text>
              <Pressable
                accessibilityLabel="Tutup modal"
                accessibilityRole="button"
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

            {/* Type Selector */}
            <Text style={styles.inputLabel}>Tipe akun</Text>
            <View style={styles.typeRow}>
              {(['BANK', 'RDN', 'E-WALLET'] as AccountType[]).map((t) => {
                const isActive = type === t;
                const label = t === 'BANK' ? 'Bank' : t === 'RDN' ? 'RDN' : 'E-Wallet';
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      triggerHaptic('selection');
                      setType(t);
                    }}
                    style={[styles.typeButton, isActive && styles.activeTypeButton]}
                  >
                    {t === 'BANK' && (
                      <Icon name="Landmark" size={15} color={isActive ? color.accent : color.textMuted} />
                    )}
                    {t === 'RDN' && (
                      <Icon name="TrendingUp" size={15} color={isActive ? color.accent : color.textMuted} />
                    )}
                    {t === 'E-WALLET' && (
                      <Icon name="Smartphone" size={15} color={isActive ? color.accent : color.textMuted} />
                    )}
                    <Text style={[styles.typeText, isActive && styles.activeTypeText]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick Presets */}
            <Text style={styles.inputLabel}>Pilih instan rekening populer</Text>
            <View style={styles.quickPresetRow}>
              {[
                { label: 'Bank Jago (Kantong Utama)', t: 'BANK' as AccountType },
                { label: 'RDN Stockbit Jago', t: 'RDN' as AccountType },
                { label: 'BCA Tahapan', t: 'BANK' as AccountType },
                { label: "Mandiri Livin'", t: 'BANK' as AccountType },
                { label: 'GoPay Utama', t: 'E-WALLET' as AccountType },
              ].map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => {
                    triggerHaptic('selection');
                    setName(p.label);
                    setType(p.t);
                  }}
                  style={styles.quickPresetChip}
                >
                  <Text style={styles.quickPresetText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Account Name */}
            <Text style={styles.inputLabel}>Nama rekening</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: BCA Tahapan, Mandiri RDN"
              placeholderTextColor={color.textFaint}
              value={name}
              onChangeText={setName}
            />

            {/* Account Number */}
            <Text style={styles.inputLabel}>Nomor rekening (opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 8220194821"
              placeholderTextColor={color.textFaint}
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            {/* Initial Balance */}
            <Text style={styles.inputLabel}>Saldo awal (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={color.textFaint}
              keyboardType="number-pad"
              value={balance}
              onChangeText={setBalance}
            />

            {/* Submit Button */}
            <Pressable onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitText}>Simpan rekening</Text>
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: color.textMuted,
    marginBottom: 6,
    marginTop: space.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: space.xs + 2,
    marginBottom: space.xs,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  activeTypeButton: {
    backgroundColor: color.accentSoft,
    borderColor: color.accentRim,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: color.textMuted,
  },
  activeTypeText: {
    color: color.accent,
    fontWeight: '600',
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: space.xs,
  },
  quickPresetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickPresetText: {
    fontSize: 10,
    fontWeight: '600',
    color: color.textMuted,
  },
  input: {
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    color: color.text,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  submitBtn: {
    backgroundColor: color.accent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.lg,
    ...shadow.e1,
  },
  submitText: {
    color: color.onAccent,
    fontWeight: '600',
    fontSize: 14,
  },
});
