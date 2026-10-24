import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { StockAsset } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';

interface StockModalProps {
  visible: boolean;
  onClose: () => void;
  stockToEdit?: StockAsset | null;
}

export const StockModal: React.FC<StockModalProps> = ({ visible, onClose, stockToEdit }) => {
  const { saveStock, deleteStock, accounts } = useWealth();

  const [ticker, setTicker] = useState(stockToEdit ? stockToEdit.ticker : '');
  const [name, setName] = useState(stockToEdit ? stockToEdit.name : '');
  const [lots, setLots] = useState(stockToEdit ? stockToEdit.lots.toString() : '');
  const [avgBuyPrice, setAvgBuyPrice] = useState(stockToEdit ? stockToEdit.avgBuyPrice.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (stockToEdit) {
      setTicker(stockToEdit.ticker);
      setName(stockToEdit.name);
      setLots(stockToEdit.lots.toString());
      setAvgBuyPrice(stockToEdit.avgBuyPrice.toString());
    } else {
      setTicker('');
      setName('');
      setLots('');
      setAvgBuyPrice('');
    }
  }, [stockToEdit]);

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
          currentPrice: stockToEdit?.currentPrice || numAvgPrice,
          change24h: stockToEdit?.change24h || 0,
          currency: 'IDR',
          rdnAccountId: rdnAcc?.id,
        },
        stockToEdit?.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (stockToEdit) {
      await deleteStock(stockToEdit.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GlassCard style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon name="TrendingUp" size={18} color="#38BDF8" />
                <Text style={styles.title}>{stockToEdit ? 'Edit Saham IDX' : 'Tambah Saham IDX'}</Text>
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

            {/* Kode Saham */}
            <Text style={styles.inputLabel}>Kode Ticker Saham (IDX)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BBCA, BMRI, TLKM, ASII"
              placeholderTextColor="#475569"
              autoCapitalize="characters"
              value={ticker}
              onChangeText={setTicker}
            />

            {/* Nama Perusahaan */}
            <Text style={styles.inputLabel}>Nama Perusahaan / Emiten</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bank Central Asia Tbk."
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
            />

            {/* Lot */}
            <Text style={styles.inputLabel}>Jumlah Lot (1 Lot = 100 lembar)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={lots}
              onChangeText={setLots}
            />

            {/* Avg Buy Price */}
            <Text style={styles.inputLabel}>Harga Beli Rata-Rata (Avg Price Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9200"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              value={avgBuyPrice}
              onChangeText={setAvgBuyPrice}
            />

            {/* Automatic Real-Time Market Price Notice (No manual input needed) */}
            <View style={styles.autoPricePill}>
              <Icon name="Sparkles" size={15} color="#38BDF8" />
              <View style={styles.autoPriceTextGroup}>
                <Text style={styles.autoPriceTitle}>Harga Pasar Real-Time Otomatis</Text>
                <Text style={styles.autoPriceSubtitle}>
                  {stockToEdit
                    ? `Harga pasar saat ini (Rp ${stockToEdit.currentPrice.toLocaleString('id-ID')}) diperbarui otomatis live dari IDX.`
                    : 'Harga pasar live langsung diambil otomatis dari Bursa Efek Indonesia (IDX).'}
                </Text>
              </View>
            </View>

            {/* Submit & Delete Buttons */}
            <View style={styles.actionRow}>
              {stockToEdit && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.submitText}>
                  {isSubmitting
                    ? 'Memperbarui Harga...'
                    : stockToEdit
                    ? 'Simpan Perubahan'
                    : '+ Tambah Saham'}
                </Text>
              </TouchableOpacity>
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  autoPricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  autoPriceTextGroup: {
    flex: 1,
  },
  autoPriceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  autoPriceSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  deleteBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    alignItems: 'center',
  },
  deleteText: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#080C14',
    fontWeight: '700',
    fontSize: 15,
  },
});
