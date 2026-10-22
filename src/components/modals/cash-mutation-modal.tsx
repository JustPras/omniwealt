import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';

interface CashMutationModalProps {
  visible: boolean;
  onClose: () => void;
  defaultAccountId?: string;
  defaultType?: 'INCOME' | 'EXPENSE';
}

export const CashMutationModal: React.FC<CashMutationModalProps> = ({
  visible,
  onClose,
  defaultAccountId,
  defaultType = 'EXPENSE',
}) => {
  const { accounts, updateAccountBalance } = useWealth();
  const [selectedAccId, setSelectedAccId] = useState<string>(defaultAccountId || accounts[0]?.id || '');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const targetAccount = accounts.find((a) => a.id === selectedAccId) || accounts[0];

  const handleSubmit = async () => {
    if (!targetAccount) return;
    const cleanAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!cleanAmount || cleanAmount <= 0) return;

    const delta = type === 'INCOME' ? cleanAmount : -cleanAmount;
    await updateAccountBalance(
      targetAccount.id,
      delta,
      description.trim() || (type === 'INCOME' ? 'Pemasukan Tunai' : 'Pengeluaran Tunai'),
      type
    );

    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Catat Mutasi Saldo</Text>
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

            {/* Income vs Expense Toggle */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setType('EXPENSE');
                }}
                style={[styles.typeButton, type === 'EXPENSE' && styles.expenseActive]}
              >
                <Icon name="ArrowUpRight" size={16} color={type === 'EXPENSE' ? '#F43F5E' : '#64748B'} />
                <Text style={[styles.typeText, type === 'EXPENSE' && styles.expenseTextActive]}>
                  Pengeluaran
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setType('INCOME');
                }}
                style={[styles.typeButton, type === 'INCOME' && styles.incomeActive]}
              >
                <Icon name="ArrowDownLeft" size={16} color={type === 'INCOME' ? '#10B981' : '#64748B'} />
                <Text style={[styles.typeText, type === 'INCOME' && styles.incomeTextActive]}>
                  Pemasukan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Select Target Account */}
            <Text style={styles.inputLabel}>Pilih Rekening</Text>
            <View style={styles.accountSelectorList}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedAccId(acc.id);
                  }}
                  style={[
                    styles.accountChip,
                    (selectedAccId === acc.id || (!selectedAccId && targetAccount?.id === acc.id)) &&
                      styles.activeAccountChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.accountChipText,
                      (selectedAccId === acc.id || (!selectedAccId && targetAccount?.id === acc.id)) &&
                        styles.activeAccountChipText,
                    ]}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={styles.inputLabel}>Nominal (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Keterangan Transaksi</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Makan Siang, Gaji Bulanan, Tagihan Listrik"
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
            />

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, type === 'INCOME' ? styles.submitIncome : styles.submitExpense]}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>
                {type === 'INCOME' ? '+ Simpan Pemasukan' : '- Potong Pengeluaran'}
              </Text>
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  expenseActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: '#F43F5E',
  },
  incomeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  expenseTextActive: {
    color: '#F43F5E',
  },
  incomeTextActive: {
    color: '#10B981',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 8,
  },
  accountSelectorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  accountChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeAccountChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  accountChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeAccountChipText: {
    color: '#38BDF8',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitExpense: {
    backgroundColor: '#F43F5E',
  },
  submitIncome: {
    backgroundColor: '#10B981',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
