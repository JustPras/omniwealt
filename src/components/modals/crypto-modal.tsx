import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { CryptoAsset } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow } from '../../theme/tokens';

interface CryptoModalProps {
  visible: boolean;
  onClose: () => void;
  crypto?: CryptoAsset | null;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({ visible, onClose, crypto }) => {
  const { saveCrypto, deleteCrypto } = useWealth();

  const [symbol, setSymbol] = useState(crypto ? crypto.symbol : '');
  const [name, setName] = useState(crypto ? crypto.name : '');
  const [holdings, setHoldings] = useState(crypto ? crypto.holdings.toString() : '');
  const [avgBuyPriceIdr, setAvgBuyPriceIdr] = useState(
    crypto ? crypto.avgBuyPriceIdr.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (crypto) {
      setSymbol(crypto.symbol);
      setName(crypto.name);
      setHoldings(crypto.holdings.toString());
      setAvgBuyPriceIdr(crypto.avgBuyPriceIdr.toString());
    } else {
      setSymbol('');
      setName('');
      setHoldings('');
      setAvgBuyPriceIdr('');
    }
  }, [crypto, visible]);

  const handleSubmit = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;

    const numHoldings = parseFloat(holdings) || 0;
    const numAvgPrice = parseFloat(avgBuyPriceIdr.replace(/\D/g, '')) || 0;

    let coingeckoId = cleanSymbol.toLowerCase();
    if (cleanSymbol === 'BTC') coingeckoId = 'bitcoin';
    else if (cleanSymbol === 'ETH') coingeckoId = 'ethereum';
    else if (cleanSymbol === 'SOL') coingeckoId = 'solana';

    setIsSubmitting(true);
    try {
      await saveCrypto(
        {
          symbol: cleanSymbol,
          name: name.trim() || cleanSymbol,
          coingeckoId,
          holdings: numHoldings,
          avgBuyPriceIdr: numAvgPrice,
          currentPriceIdr: crypto?.currentPriceIdr || numAvgPrice,
          change24h: crypto?.change24h || 0,
        },
        crypto?.id
      );
      triggerHaptic('success');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (crypto) {
      triggerHaptic('warning');
      await deleteCrypto(crypto.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard level="raised" style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{crypto ? 'Ubah aset kripto' : 'Tambah kripto'}</Text>
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

            {/* Simbol Kripto */}
            <Text style={styles.inputLabel}>Simbol koin (kripto)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: BTC, ETH, SOL"
              placeholderTextColor={color.textFaint}
              autoCapitalize="characters"
              value={symbol}
              onChangeText={setSymbol}
            />

            {/* Nama Aset */}
            <Text style={styles.inputLabel}>Nama koin</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bitcoin, Ethereum"
              placeholderTextColor={color.textFaint}
              value={name}
              onChangeText={setName}
            />

            {/* Jumlah Koin */}
            <Text style={styles.inputLabel}>Jumlah kepemilikan koin</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={color.textFaint}
              keyboardType="numeric"
              value={holdings}
              onChangeText={setHoldings}
            />

            {/* Harga Rata-rata Beli */}
            <Text style={styles.inputLabel}>Harga beli rata-rata (IDR)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={color.textFaint}
              keyboardType="number-pad"
              value={avgBuyPriceIdr}
              onChangeText={setAvgBuyPriceIdr}
            />

            <Text style={styles.autoPriceNotice}>
              Harga live pasar akan diperbarui secara otomatis.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {crypto && (
                <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !symbol.trim()}
                style={[styles.submitBtn, (!symbol.trim() || isSubmitting) && styles.disabledBtn]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={color.onAccent} size="small" />
                ) : (
                  <Text style={styles.submitText}>Simpan transaksi</Text>
                )}
              </Pressable>
            </View>
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
  autoPriceNotice: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: space.sm,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
  deleteBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: color.loss,
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: color.accent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
