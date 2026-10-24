import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { StockAsset } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow } from '../../theme/tokens';

interface StockModalProps {
  visible: boolean;
  onClose: () => void;
  stock?: StockAsset | null;
}

export const StockModal: React.FC<StockModalProps> = ({ visible, onClose, stock }) => {
  const { saveStock, deleteStock, accounts } = useWealth();

  const [ticker, setTicker] = useState(stock ? stock.ticker : '');
  const [name, setName] = useState(stock ? stock.name : '');
  const [lots, setLots] = useState(stock ? stock.lots.toString() : '');
  const [avgBuyPrice, setAvgBuyPrice] = useState(stock ? stock.avgBuyPrice.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (stock) {
      setTicker(stock.ticker.replace('.JK', ''));
      setName(stock.name);
      setLots(stock.lots.toString());
      setAvgBuyPrice(stock.avgBuyPrice.toString());
    } else {
      setTicker('');
      setName('');
      setLots('');
      setAvgBuyPrice('');
    }
  }, [stock, visible]);

  const handleSubmit = async () => {
    let cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;
    if (!cleanTicker.endsWith('.JK')) cleanTicker += '.JK';

    const numLots = parseFloat(lots) || 0;
    const numAvgPrice = parseFloat(avgBuyPrice.replace(/\D/g, '')) || 0;
    const rdnAcc = accounts.find((a) => a.type === 'RDN') || accounts[0];

    setIsSubmitting(true);
    try {
      await saveStock(
        {
          ticker: cleanTicker,
          name: name.trim() || `${cleanTicker.replace('.JK', '')} Asset`,
          lots: numLots,
          avgBuyPrice: numAvgPrice,
          currentPrice: stock?.currentPrice || numAvgPrice,
          change24h: stock?.change24h || 0,
          currency: 'IDR',
          rdnAccountId: rdnAcc?.id,
        },
        stock?.id
      );
      triggerHaptic('success');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (stock) {
      triggerHaptic('warning');
      await deleteStock(stock.id);
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
              <Text style={styles.title}>{stock ? 'Ubah transaksi saham' : 'Tambah saham'}</Text>
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

            {/* Kode Saham */}
            <Text style={styles.inputLabel}>Kode ticker (IDX)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: BBCA, BMRI, TLKM"
              placeholderTextColor={color.textFaint}
              autoCapitalize="characters"
              value={ticker}
              onChangeText={setTicker}
            />

            {/* Nama Emiten */}
            <Text style={styles.inputLabel}>Nama perusahaan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Bank Central Asia Tbk"
              placeholderTextColor={color.textFaint}
              value={name}
              onChangeText={setName}
            />

            {/* Jumlah Lot */}
            <Text style={styles.inputLabel}>Jumlah kepemilikan (lot)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={color.textFaint}
              keyboardType="numeric"
              value={lots}
              onChangeText={setLots}
            />

            {/* Harga Rata-rata Beli */}
            <Text style={styles.inputLabel}>Harga beli rata-rata per lembar (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={color.textFaint}
              keyboardType="number-pad"
              value={avgBuyPrice}
              onChangeText={setAvgBuyPrice}
            />

            <Text style={styles.autoPriceNotice}>
              Harga live pasar akan diperbarui secara otomatis.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {stock && (
                <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !ticker.trim()}
                style={[styles.submitBtn, (!ticker.trim() || isSubmitting) && styles.disabledBtn]}
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
