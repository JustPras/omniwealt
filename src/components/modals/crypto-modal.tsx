import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { CryptoAsset } from '../../types';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';

interface CryptoModalProps {
  visible: boolean;
  onClose: () => void;
  cryptoToEdit?: CryptoAsset | null;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({ visible, onClose, cryptoToEdit }) => {
  const { saveCrypto, deleteCrypto } = useWealth();

  const [symbol, setSymbol] = useState(cryptoToEdit ? cryptoToEdit.symbol : '');
  const [name, setName] = useState(cryptoToEdit ? cryptoToEdit.name : '');
  const [holdings, setHoldings] = useState(cryptoToEdit ? cryptoToEdit.holdings.toString() : '');
  const [avgBuyPriceIdr, setAvgBuyPriceIdr] = useState(
    cryptoToEdit ? cryptoToEdit.avgBuyPriceIdr.toString() : ''
  );

  React.useEffect(() => {
    if (cryptoToEdit) {
      setSymbol(cryptoToEdit.symbol);
      setName(cryptoToEdit.name);
      setHoldings(cryptoToEdit.holdings.toString());
      setAvgBuyPriceIdr(cryptoToEdit.avgBuyPriceIdr.toString());
    } else {
      setSymbol('');
      setName('');
      setHoldings('');
      setAvgBuyPriceIdr('');
    }
  }, [cryptoToEdit]);

  const handleSubmit = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;

    const numHoldings = parseFloat(holdings) || 0;
    const numAvgPrice = parseFloat(avgBuyPriceIdr.replace(/\D/g, '')) || 0;

    let coingeckoId = cleanSymbol.toLowerCase();
    if (cleanSymbol === 'BTC') coingeckoId = 'bitcoin';
    else if (cleanSymbol === 'ETH') coingeckoId = 'ethereum';
    else if (cleanSymbol === 'SOL') coingeckoId = 'solana';

    await saveCrypto(
      {
        symbol: cleanSymbol,
        name: name.trim() || cleanSymbol,
        coingeckoId,
        holdings: numHoldings,
        avgBuyPriceIdr: numAvgPrice,
        currentPriceIdr: cryptoToEdit?.currentPriceIdr || numAvgPrice * 1.05,
        change24h: 0.025,
      },
      cryptoToEdit?.id
    );

    onClose();
  };

  const handleDelete = async () => {
    if (cryptoToEdit) {
      await deleteCrypto(cryptoToEdit.id);
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
                <Icon name="Coins" size={18} color="#F59E0B" />
                <Text style={styles.title}>{cryptoToEdit ? 'Edit Aset Kripto' : 'Tambah Aset Kripto'}</Text>
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

            {/* Simbol Kripto */}
            <Text style={styles.inputLabel}>Simbol Kripto</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BTC, ETH, SOL, BNB"
              placeholderTextColor="#475569"
              autoCapitalize="characters"
              value={symbol}
              onChangeText={setSymbol}
            />

            {/* Nama Kripto */}
            <Text style={styles.inputLabel}>Nama Koin / Token</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bitcoin, Ethereum, Solana"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
            />

            {/* Holdings */}
            <Text style={styles.inputLabel}>Jumlah Koin (Holdings)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0.05 atau 12.5"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={holdings}
              onChangeText={setHoldings}
            />

            {/* Avg Buy Price */}
            <Text style={styles.inputLabel}>Harga Beli Rata-Rata (IDR)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1000000000"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              value={avgBuyPriceIdr}
              onChangeText={setAvgBuyPriceIdr}
            />

            {/* Submit & Delete Buttons */}
            <View style={styles.actionRow}>
              {cryptoToEdit && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
                  <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} activeOpacity={0.8}>
                <Text style={styles.submitText}>
                  {cryptoToEdit ? 'Simpan Perubahan' : '+ Tambah Kripto'}
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
    borderColor: 'rgba(245, 158, 11, 0.25)',
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
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#080C14',
    fontWeight: '700',
    fontSize: 15,
  },
});
