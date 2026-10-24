import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow } from '../../theme/tokens';

interface CashMutationModalProps {
  visible: boolean;
  onClose: () => void;
  accountId?: string;
  initialType?: 'INCOME' | 'EXPENSE';
}

export const CashMutationModal: React.FC<CashMutationModalProps> = ({
  visible,
  onClose,
  accountId,
  initialType = 'EXPENSE',
}) => {
  const { accounts, updateAccountBalance } = useWealth();
  const [selectedAccId, setSelectedAccId] = useState<string>(accountId || accounts[0]?.id || '');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (accountId) setSelectedAccId(accountId);
    if (initialType) setType(initialType);
  }, [accountId, initialType, visible]);

  const targetAccount = accounts.find((a) => a.id === selectedAccId) || accounts[0];

  const handleSubmit = async () => {
    if (!targetAccount) return;
    const cleanAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!cleanAmount || cleanAmount <= 0) return;

    const delta = type === 'INCOME' ? cleanAmount : -cleanAmount;
    await updateAccountBalance(
      targetAccount.id,
      delta,
      description.trim() || (type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'),
      type
    );

    triggerHaptic('success');
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Catat mutasi kas</Text>
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

            {/* Income vs Expense Toggle */}
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setType('EXPENSE');
                }}
                style={[styles.typeButton, type === 'EXPENSE' && styles.expenseActive]}
              >
                <Text style={[styles.typeText, type === 'EXPENSE' && styles.expenseTextActive]}>
                  Pengeluaran
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setType('INCOME');
                }}
                style={[styles.typeButton, type === 'INCOME' && styles.incomeActive]}
              >
                <Text style={[styles.typeText, type === 'INCOME' && styles.incomeTextActive]}>
                  Pemasukan
                </Text>
              </Pressable>
            </View>

            {/* Select Target Account */}
            <Text style={styles.inputLabel}>Pilih rekening</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountSelectorScroll}>
              <View style={styles.accountSelectorRow}>
                {accounts.map((acc) => {
                  const isSelected = (selectedAccId || targetAccount?.id) === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedAccId(acc.id);
                      }}
                      style={[styles.accountChip, isSelected && styles.accountChipActive]}
                    >
                      <Text style={[styles.accountChipText, isSelected && styles.accountChipTextActive]}>
                        {acc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Nominal Input */}
            <Text style={styles.inputLabel}>Nominal mutasi (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={color.textFaint}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Description Input */}
            <Text style={styles.inputLabel}>Keterangan (opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Belanja mingguan, makan siang..."
              placeholderTextColor={color.textFaint}
              value={description}
              onChangeText={setDescription}
            />

            {/* Submit Button */}
            <Pressable onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitText}>Simpan mutasi</Text>
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
  typeRow: {
    flexDirection: 'row',
    gap: space.xs + 2,
    marginBottom: space.sm,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
    color: color.textMuted,
  },
  expenseActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.32)',
  },
  expenseTextActive: {
    color: color.loss,
    fontWeight: '600',
  },
  incomeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.32)',
  },
  incomeTextActive: {
    color: color.gain,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: color.textMuted,
    marginBottom: 6,
    marginTop: space.sm,
  },
  accountSelectorScroll: {
    marginBottom: space.xs,
  },
  accountSelectorRow: {
    flexDirection: 'row',
    gap: space.xs + 2,
  },
  accountChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  accountChipActive: {
    backgroundColor: color.accentSoft,
    borderColor: color.accentRim,
  },
  accountChipText: {
    fontSize: 12,
    color: color.textMuted,
    fontWeight: '500',
  },
  accountChipTextActive: {
    color: color.accent,
    fontWeight: '600',
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
