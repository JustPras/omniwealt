import React, { useState, useEffect, useMemo } from 'react';
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
import { Liability, Account } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { formatIDR } from '../../utils/format';
import { color, space, radius, shadow, font } from '../../theme/tokens';

interface PayLiabilityModalProps {
  visible: boolean;
  onClose: () => void;
  liability: Liability | null;
}

export const PayLiabilityModal: React.FC<PayLiabilityModalProps> = ({
  visible,
  onClose,
  liability,
}) => {
  const { accounts, payLiability } = useWealth();

  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter accounts that have money and are not crypto
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((a) => a.type !== 'CRYPTO_WALLET');
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return eligibleAccounts.find((a) => a.id === selectedAccountId) || eligibleAccounts[0];
  }, [eligibleAccounts, selectedAccountId]);

  useEffect(() => {
    if (liability) {
      // Default to full amount
      setAmountStr(String(liability.outstandingAmount));
      setErrorMessage(null);
      if (eligibleAccounts.length > 0) {
        setSelectedAccountId(eligibleAccounts[0].id);
      }
    }
  }, [liability, eligibleAccounts, visible]);

  if (!liability) return null;

  const paymentAmount = parseFloat(amountStr.replace(/\D/g, '')) || 0;
  const isBalanceSufficient = selectedAccount ? selectedAccount.balance >= paymentAmount : false;
  const newLiabilityBalance = Math.max(0, liability.outstandingAmount - paymentAmount);
  const newAccountBalance = selectedAccount ? selectedAccount.balance - paymentAmount : 0;

  const handleSetFullPayment = () => {
    triggerHaptic('selection');
    setAmountStr(String(liability.outstandingAmount));
  };

  const handleSetMinPayment = () => {
    triggerHaptic('selection');
    const min = liability.minimumPayment || Math.round(liability.outstandingAmount * 0.1);
    setAmountStr(String(min));
  };

  const handleConfirmPayment = async () => {
    if (!selectedAccount) return;
    if (paymentAmount <= 0) {
      setErrorMessage('Masukkan nominal pembayaran yang valid.');
      return;
    }
    if (!isBalanceSufficient) {
      setErrorMessage(`Saldo ${selectedAccount.name} tidak cukup.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await payLiability(liability.id, paymentAmount, selectedAccount.id, notes);
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran tagihan.');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
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
                  <Icon name="CreditCard" size={16} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.title}>Pelunasan / Bayar Tagihan</Text>
                  <Text style={styles.subTitle}>{liability.name}</Text>
                </View>
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
              {/* Liability Summary Card */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Tagihan Berjalan</Text>
                  <Text style={styles.summaryValue}>{formatIDR(liability.outstandingAmount)}</Text>
                </View>
                {liability.dueDate && (
                  <View style={[styles.summaryRow, { marginTop: 4 }]}>
                    <Text style={styles.summarySubLabel}>Jatuh Tempo</Text>
                    <Text style={styles.summarySubValue}>Tanggal {liability.dueDate} tiap bulan</Text>
                  </View>
                )}
              </View>

              {/* Amount Shortcuts */}
              <Text style={styles.inputLabel}>Pilih Nominal Pembayaran</Text>
              <View style={styles.shortcutRow}>
                <Pressable
                  onPress={handleSetFullPayment}
                  style={[
                    styles.shortcutBtn,
                    paymentAmount === liability.outstandingAmount && styles.shortcutBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shortcutBtnText,
                      paymentAmount === liability.outstandingAmount && styles.shortcutBtnTextActive,
                    ]}
                  >
                    Bayar Penuh (100%)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSetMinPayment}
                  style={[
                    styles.shortcutBtn,
                    paymentAmount === (liability.minimumPayment || Math.round(liability.outstandingAmount * 0.1)) &&
                      styles.shortcutBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shortcutBtnText,
                      paymentAmount === (liability.minimumPayment || Math.round(liability.outstandingAmount * 0.1)) &&
                        styles.shortcutBtnTextActive,
                    ]}
                  >
                    Bayar Min (10%)
                  </Text>
                </Pressable>
              </View>

              {/* Custom Amount Input */}
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={color.textFaint}
                keyboardType="numeric"
                value={paymentAmount ? paymentAmount.toLocaleString('id-ID') : ''}
                onChangeText={(t) => setAmountStr(t.replace(/\D/g, ''))}
              />

              {/* Source Account Selector */}
              <Text style={styles.inputLabel}>Pilih Rekening Sumber Pembayaran</Text>
              <View style={styles.accountList}>
                {eligibleAccounts.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  const isEnough = acc.balance >= paymentAmount;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedAccountId(acc.id);
                      }}
                      style={[
                        styles.accountItem,
                        isSelected && styles.accountItemActive,
                      ]}
                    >
                      <View style={styles.accountItemLeft}>
                        <View style={[styles.accountDot, { backgroundColor: acc.color || color.accent }]} />
                        <View>
                          <Text style={styles.accountName}>{acc.name}</Text>
                          <Text style={styles.accountBal}>
                            Saldo: {formatIDR(acc.balance)} {!isEnough && paymentAmount > 0 ? '(Kurang)' : ''}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Icon name="Check" size={16} color="#38BDF8" />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Transaction Simulation Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Simulasi Dampak Pembayaran:</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Sisa Tagihan {liability.name}:</Text>
                  <Text style={[styles.previewValue, { color: newLiabilityBalance === 0 ? color.gain : '#F87171' }]}>
                    {formatIDR(newLiabilityBalance)} {newLiabilityBalance === 0 ? '✓ Lunas' : ''}
                  </Text>
                </View>
                {selectedAccount && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Sisa Saldo {selectedAccount.name}:</Text>
                    <Text style={[styles.previewValue, { color: isBalanceSufficient ? color.text : '#EF4444' }]}>
                      {formatIDR(newAccountBalance)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Error Alert */}
              {errorMessage && (
                <View style={styles.errorAlert}>
                  <Icon name="AlertCircle" size={14} color="#EF4444" />
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
              )}

              {/* Notes Input */}
              <Text style={styles.inputLabel}>Catatan Tambahan (opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="misal: Pembayaran via m-BCA / Transfer BI-FAST"
                placeholderTextColor={color.textFaint}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Submit Action */}
              <Pressable
                onPress={handleConfirmPayment}
                disabled={isSubmitting || paymentAmount <= 0 || !isBalanceSufficient}
                style={[
                  styles.confirmBtn,
                  (isSubmitting || paymentAmount <= 0 || !isBalanceSufficient) && styles.confirmBtnDisabled,
                ]}
              >
                <Icon name="Check" size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>
                  {isSubmitting ? 'Memproses...' : `Konfirmasi Bayar ${formatIDR(paymentAmount)}`}
                </Text>
              </Pressable>
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
    maxHeight: '92%',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
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
  summaryBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: radius.lg,
    padding: space.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: font.num,
    fontWeight: '700',
    color: '#F87171',
  },
  summarySubLabel: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textFaint,
  },
  summarySubValue: {
    fontSize: 10,
    fontFamily: font.uiBold,
    color: color.textMuted,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
    marginTop: 4,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  shortcutBtnText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  shortcutBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
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
  amountInput: {
    fontSize: 18,
    fontFamily: font.num,
    fontWeight: '700',
    color: color.gain,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  accountList: {
    gap: 6,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  accountItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  accountName: {
    fontSize: 13,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.text,
  },
  accountBal: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
    marginTop: 1,
  },
  previewCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  previewTitle: {
    fontSize: 11,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.textMuted,
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textFaint,
  },
  previewValue: {
    fontSize: 12,
    fontFamily: font.num,
    fontWeight: '700',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: radius.md,
    padding: space.sm,
  },
  errorAlertText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: '#EF4444',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.gain,
    marginTop: 8,
    ...shadow.e1,
  },
  confirmBtnDisabled: {
    opacity: 0.35,
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
