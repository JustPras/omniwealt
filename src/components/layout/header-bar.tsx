import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '../common/icon';
import { useWealth } from '../../store/wealth-context';
import { formatTime } from '../../utils/format';

export const HeaderBar: React.FC = () => {
  const { privacyMode, togglePrivacy, isRefreshing, refreshMarketPrices, lastUpdated } = useWealth();

  return (
    <View style={styles.headerContainer}>
      {/* Live Market Status Pill */}
      <View style={styles.liveBadge}>
        <View style={styles.pulseDot} />
        <Text style={styles.liveText}>IDX & CRYPTO LIVE</Text>
        <Text style={styles.timeText}>{formatTime(lastUpdated.toISOString())}</Text>
      </View>

      {/* Header Actions: Refresh & Privacy Toggle */}
      <View style={styles.actionGroup}>
        {/* Refresh Market Prices Button */}
        <TouchableOpacity
          onPress={refreshMarketPrices}
          disabled={isRefreshing}
          activeOpacity={0.7}
          style={styles.iconButton}
          accessibilityLabel="Refresh harga pasar IDX dan Kripto"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Icon name="RefreshCw" size={17} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Privacy Eye Toggle Button */}
        <TouchableOpacity
          onPress={togglePrivacy}
          activeOpacity={0.7}
          style={[styles.iconButton, privacyMode && styles.activeIconButton]}
          accessibilityLabel="Toggle Sensor Privasi Saldo"
        >
          {privacyMode ? (
            <Icon name="EyeOff" size={17} color="#F59E0B" />
          ) : (
            <Icon name="Eye" size={17} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.6,
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
});
