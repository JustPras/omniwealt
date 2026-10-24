import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../common/icon';
import { useWealth } from '../../store/wealth-context';
import { formatTime } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';

export const HeaderBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { privacyMode, togglePrivacy, isRefreshing, refreshMarketPrices, lastUpdated } = useWealth();

  // Pulse animation for LIVE indicator dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  // Spin animation for RefreshCw button
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing pulse for LIVE dot
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, pulseOpacity]);

  useEffect(() => {
    if (isRefreshing) {
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();
      return () => {
        spinLoop.stop();
        spinAnim.setValue(0);
      };
    } else {
      spinAnim.setValue(0);
    }
  }, [isRefreshing, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 6, 16) }]}>
      {/* Brand Logo + Live Pill */}
      <View style={styles.leftGroup}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.brandLogo}
          resizeMode="cover"
        />
        {/* Live Market Status Pill */}
        <View style={styles.liveBadge}>
          <Animated.View
            style={[
              styles.pulseDot,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <Text style={styles.liveText}>IDX & CRYPTO LIVE</Text>
          <Text style={styles.timeText}>{formatTime(lastUpdated.toISOString())}</Text>
        </View>
      </View>

      {/* Header Actions: Refresh & Privacy Toggle */}
      <View style={styles.actionGroup}>
        {/* Refresh Market Prices Button with Smooth 360 Spin */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            refreshMarketPrices();
          }}
          disabled={isRefreshing}
          activeOpacity={0.65}
          style={[styles.iconButton, isRefreshing && styles.refreshingButton]}
          accessibilityLabel="Refresh harga pasar IDX dan Kripto"
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon
              name="RefreshCw"
              size={16}
              color={isRefreshing ? '#10B981' : '#94A3B8'}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Privacy Eye Toggle Button */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            togglePrivacy();
          }}
          activeOpacity={0.65}
          style={[styles.iconButton, privacyMode && styles.activeIconButton]}
          accessibilityLabel="Toggle Sensor Privasi Saldo"
        >
          {privacyMode ? (
            <Icon name="EyeOff" size={16} color="#F59E0B" />
          ) : (
            <Icon name="Eye" size={16} color="#94A3B8" />
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 6,
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshingButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  activeIconButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
});
