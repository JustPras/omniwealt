import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { Liability, LiabilityType } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { formatIDR } from '../../utils/format';
import { color, space, radius, shadow, font } from '../../theme/tokens';

interface LiabilityModalProps {
  visible: boolean;
  onClose: () => void;
  liability?: Liability | null;
}

const POPULAR_PRESETS: {
  name: string;
  type: LiabilityType;
  institution: string;
  defaultLimit: number;
  dueDate: number;
}[] = [
  { name: 'BCA Everyday Card', type: 'CREDIT_CARD', institution: 'BCA', defaultLimit: 20000000, dueDate: 20 },
  { name: 'Mandiri Visa Signature', type: 'CREDIT_CARD', institution: 'Mandiri', defaultLimit: 30000000, dueDate: 15 },
  { name: 'Shopee PayLater', type: 'PAYLATER', institution: 'Shopee', defaultLimit: 5000000, dueDate: 5 },
  { name: 'GoPay Later', type: 'PAYLATER', institution: 'GoPay', defaultLimit: 3000000, dueDate: 1 },
  { name: 'Kredivo', type: 'PAYLATER', institution: 'Kredivo', defaultLimit: 10000000, dueDate: 28 },
  { name: 'Cicilan Gadget 0%', type: 'LOAN', institution: 'Bank', defaultLimit: 0, dueDate: 10 },
  { name: 'KPR Rumah', type: 'LOAN', institution: 'Bank', defaultLimit: 0, dueDate: 8 },
];

export const LiabilityModal: React.FC<LiabilityModalProps> = ({
  visible,
  onClose,
  liability,
}) => {
  const { addLiability, updateLiability, deleteLiability } = useWealth();

  const [name, setName] = useState('');
  const [type, setType] = useState<LiabilityType>('CREDIT_CARD');
  const [institution, setInstitution] = useState('');
  const [outstandingAmount, setOutstandingAmount] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (liability) {
      setName(liability.name);
      setType(liability.type);
      setInstitution(liability.institution || '');
      setOutstandingAmount(liability.outstandingAmount ? String(liability.outstandingAmount) : '');
      setCreditLimit(liability.creditLimit ? String(liability.creditLimit) : '');
      setDueDate(liability.dueDate ? String(liability.dueDate) : '');
      setMonthlyInstallment(liability.monthlyInstallment ? String(liability.monthlyInstallment) : '');
      setAccountNumber(liability.accountNumber || '');
      setNotes(liability.notes || '');
    } else {
      setName('');
      setType('CREDIT_CARD');
      setInstitution('BCA');
      setOutstandingAmount('');
      setCreditLimit('');
      setDueDate('20');
      setMonthlyInstallment('');
      setAccountNumber('');
      setNotes('');
    }
  }, [liability, visible]);

  const handleApplyPreset = (p: typeof POPULAR_PRESETS[0]) => {
    triggerHaptic('selection');
    setName(p.name);
    setType(p.type);
    setInstitution(p.institution);
    if (p.defaultLimit > 0) {
      setCreditLimit(String(p.defaultLimit));
    }
    setDueDate(String(p.dueDate));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const numOutstanding = parseFloat(outstandingAmount.replace(/\D/g, '')) || 0;
    const numLimit = creditLimit ? parseFloat(creditLimit.replace(/\D/g, '')) : undefined;
    const numDueDate = dueDate ? parseInt(dueDate.replace(/\D/g, ''), 10) : undefined;
    const numInstallment = monthlyInstallment ? parseFloat(monthlyInstallment.replace(/\D/g, '')) : undefined;

    const colorMap: Record<LiabilityType, string> = {
      CREDIT_CARD: '#3B82F6',
      PAYLATER: '#EE4D2D',
      LOAN: '#8B5CF6',
      OTHER: '#F59E0B',
    };

    if (liability) {
      await updateLiability(liability.id, {
        name: name.trim(),
        type,
        institution: institution.trim() || 'Bank',
        outstandingAmount: numOutstanding,
        creditLimit: numLimit,
        dueDate: numDueDate,
        monthlyInstallment: numInstallment,
        accountNumber: accountNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addLiability({
        name: name.trim(),
        type,
        institution: institution.trim() || 'Bank',
        outstandingAmount: numOutstanding,
        creditLimit: numLimit,
        dueDate: numDueDate,
        monthlyInstallment: numInstallment,
        accountNumber: accountNumber.trim() || undefined,
        color: colorMap[type],
        icon: type === 'CREDIT_CARD' ? 'CreditCard' : type === 'PAYLATER' ? 'Smartphone' : 'Landmark',
        notes: notes.trim() || undefined,
      });
    }

    triggerHaptic('success');
    onClose();
  };

  const handleDelete = async () => {
    if (!liability) return;
    triggerHaptic('medium');
    await deleteLiability(liability.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIconCircle}>
                  <Icon name="CreditCard" size={16} color="#F87171" />
                </View>
                <Text style={styles.title}>
                  {liability ? 'Edit Liabilitas & Tagihan' : 'Tambah Utang & Tagihan'}
                </Text>
              </View>
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Type Selector */}
              <Text style={styles.inputLabel}>Tipe Liabilitas</Text>
              <View style={styles.typeGrid}>
                {[
                  { key: 'CREDIT_CARD' as LiabilityType, label: 'Kartu Kredit', icon: 'CreditCard' },
                  { key: 'PAYLATER' as LiabilityType, label: 'PayLater', icon: 'Smartphone' },
                  { key: 'LOAN' as LiabilityType, label: 'Cicilan / Pinjaman', icon: 'Landmark' },
                ].map((item) => {
                  const isActive = type === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        triggerHaptic('selection');
                        setType(item.key);
                      }}
                      style={[styles.typeBtn, isActive && styles.typeBtnActive]}
                    >
                      <Icon
                        name={item.icon as any}
                        size={14}
                        color={isActive ? '#F87171' : color.textMuted}
                      />
                      <Text style={[styles.typeBtnText, isActive && styles.typeBtnTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Popular Presets */}
              {!liability && (
                <>
                  <Text style={styles.inputLabel}>Pilih Cepat Tagihan Populer</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                    {POPULAR_PRESETS.map((p, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => handleApplyPreset(p)}
                        style={styles.presetChip}
                      >
                        <Text style={styles.presetChipText}>{p.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Input Fields */}
              <Text style={styles.inputLabel}>Nama Tagihan / Kartu</Text>
              <TextInput
                style={styles.input}
                placeholder="misal: BCA Everyday Card, Shopee PayLater"
                placeholderTextColor={color.textFaint}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Institusi / Bank</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="BCA, Mandiri, Shopee"
                    placeholderTextColor={color.textFaint}
                    value={institution}
                    onChangeText={setInstitution}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>4 Digit / No. Kartu (opsional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="misal: 4821"
                    placeholderTextColor={color.textFaint}
                    keyboardType="number-pad"
                    maxLength={16}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Saldo Tagihan Berjalan (Rp)</Text>
              <TextInput
                style={[styles.input, styles.highlightInput]}
                placeholder="0"
                placeholderTextColor={color.textFaint}
                keyboardType="numeric"
                value={
                  outstandingAmount
                    ? parseFloat(outstandingAmount.replace(/\D/g, '') || '0').toLocaleString('id-ID')
                    : ''
                }
                onChangeText={(text) => setOutstandingAmount(text.replace(/\D/g, ''))}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    {type === 'LOAN' ? 'Cicilan / Bulan (Rp)' : 'Total Limit Kredit (Rp)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={color.textFaint}
                    keyboardType="numeric"
                    value={
                      type === 'LOAN'
                        ? monthlyInstallment
                          ? parseFloat(monthlyInstallment.replace(/\D/g, '') || '0').toLocaleString('id-ID')
                          : ''
                        : creditLimit
                        ? parseFloat(creditLimit.replace(/\D/g, '') || '0').toLocaleString('id-ID')
                        : ''
                    }
                    onChangeText={(text) => {
                      if (type === 'LOAN') {
                        setMonthlyInstallment(text.replace(/\D/g, ''));
                      } else {
                        setCreditLimit(text.replace(/\D/g, ''));
                      }
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Tgl Jatuh Tempo (1-31)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="misal: 20"
                    placeholderTextColor={color.textFaint}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Catatan (opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="misal: Belanja operasional kantor atau cicilan 0%"
                placeholderTextColor={color.textFaint}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {liability && (
                  <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                    <Icon name="Trash2" size={16} color="#F87171" />
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!name.trim()}
                  style={[
                    styles.submitBtn,
                    !name.trim() && styles.submitBtnDisabled,
                    liability && { flex: 2 },
                  ]}
                >
                  <Icon name="Check" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {liability ? 'Simpan Perubahan' : 'Simpan Liabilitas'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
    width: '100%',
  },
  cardContainer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: space.lg,
    backgroundColor: 'rgba(20, 20, 26, 0.96)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollBody: {
    gap: 10,
    paddingBottom: space.xl,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  typeBtnText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  typeBtnTextActive: {
    color: '#F87171',
    fontWeight: '700',
  },
  presetScroll: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.text,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    padding: space.md,
    color: color.text,
    fontSize: 13,
    fontFamily: font.ui,
  },
  highlightInput: {
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(248, 113, 113, 0.06)',
    fontSize: 15,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#F87171',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    ...shadow.e1,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
