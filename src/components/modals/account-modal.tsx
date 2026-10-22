import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { AccountType } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';

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
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const numBalance = parseFloat(balance.replace(/\D/g, '')) || 0;

    await addAccount({
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim() || undefined,
      balance: numBalance,
      color,
      icon: type === 'BANK' ? 'landmark' : type === 'RDN' ? 'trending-up' : 'smartphone',
    });

    setName('');
    setAccountNumber('');
    setBalance('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Tambah Rekening Baru</Text>
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

            {/* Type Selector */}
            <Text style={styles.inputLabel}>Tipe Akun</Text>
            <View style={styles.typeRow}>
              {(['BANK', 'RDN', 'E-WALLET'] as AccountType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    triggerHaptic('selection');
                    setType(t);
                    if (t === 'BANK') setColor('#3B82F6');
                    else if (t === 'RDN') setColor('#10B981');
                    else setColor('#06B6D4');
                  }}
                  style={[styles.typeButton, type === t && styles.activeTypeButton]}
                >
                  {t === 'BANK' && <Icon name="Landmark" size={15} color={type === t ? '#38BDF8' : '#64748B'} />}
                  {t === 'RDN' && <Icon name="TrendingUp" size={15} color={type === t ? '#10B981' : '#64748B'} />}
                  {t === 'E-WALLET' && <Icon name="Smartphone" size={15} color={type === t ? '#06B6D4' : '#64748B'} />}
                  <Text style={[styles.typeText, type === t && styles.activeTypeText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Name */}
            <Text style={styles.inputLabel}>Nama Rekening</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BCA Prioritas, Mandiri RDN"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
            />

            {/* Account Number */}
            <Text style={styles.inputLabel}>Nomor Rekening (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8220194821"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            {/* Initial Balance */}
            <Text style={styles.inputLabel}>Saldo Awal (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              value={balance}
              onChangeText={setBalance}
            />

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} activeOpacity={0.8}>
              <Text style={styles.submitText}>Simpan Rekening</Text>
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeTypeButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTypeText: {
    color: '#F8FAFC',
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
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
