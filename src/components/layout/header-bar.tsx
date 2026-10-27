import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../common/icon';
import { GlassCard } from '../common/glass-card';
import { LiquidSegmentControl } from '../common/liquid-segment-control';
import { useWealth } from '../../store/wealth-context';
import { formatTime } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { Colors, useTheme, useThemeController, isDarkTheme, radius, space, shadow } from '../../theme/tokens';

export const HeaderBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { toggleTheme } = useThemeController();
  const isDark = isDarkTheme(theme);

  const {
    privacyMode,
    togglePrivacy,
    currency,
    toggleCurrency,
    isRefreshing,
    refreshMarketPrices,
    lastUpdated,
  } = useWealth();

  // Pulse animation for LIVE indicator dot per DESIGN.md
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  // Spin animation for RefreshCw button
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Press feedback scales for the header action buttons
  const refreshScale = useRef(new Animated.Value(1)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;
  const themeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1000,
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

  const handleButtonPressIn = (scaleRef: Animated.Value) => {
    Animated.spring(scaleRef, {
      toValue: 0.92,
      tension: 260,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (scaleRef: Animated.Value) => {
    Animated.spring(scaleRef, {
      toValue: 1,
      tension: 160,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const textColor = theme.text;

  return (
    <View style={[styles.outerWrapper, { paddingTop: Math.max(insets.top + 4, 12) }]}>
      {/* Floating Capsule Glass Card per DESIGN.md Section 6.1 */}
      <GlassCard
        level="raised"
        radius="pill"
        noPadding
        style={styles.capsuleCard}
        contentStyle={styles.capsuleInner}
      >
        {/* Kiri: Ikon tetesan air biru #007AFF + teks Omniwealt */}
        <View style={styles.leftBrandGroup}>
          <View style={styles.dropletIconBadge}>
            <Icon name="Droplet" size={16} color={Colors.palette.appleBlue} />
          </View>
          <View style={styles.brandTitleCol}>
            <View style={styles.brandNameRow}>
              <Text style={[styles.brandTitle, { color: textColor }]}>Omniwealt</Text>
            </View>
            {/* Live Indicator Sub-text */}
            <View style={styles.liveSubRow}>
              <Animated.View
                style={[
                  styles.pulseDot,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
              <Text style={[styles.liveTimeText, { color: theme.textMuted }]}>{formatTime(lastUpdated.toISOString())}</Text>
            </View>
          </View>
        </View>

        {/* Kanan: LiquidSegmentControl (IDR/USD) + Tema Terang/Gelap + Refresh + Privacy Mode */}
        <View style={styles.rightActionGroup}>
          {/* Liquid Currency Switcher (IDR / USD) */}
          <LiquidSegmentControl
            items={[
              { key: 'IDR', label: 'Rp' },
              { key: 'USD', label: '$' },
            ]}
            activeKey={currency}
            onSelect={() => toggleCurrency()}
            height={28}
            fontSize={11}
            compact
            style={styles.currencySegmentControl}
          />

          {/* Theme Mode Toggle Button (Light ☀️ / Dark 🌙) */}
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              toggleTheme();
            }}
            onPressIn={() => handleButtonPressIn(themeScale)}
            onPressOut={() => handleButtonPressOut(themeScale)}
            hitSlop={8}
            accessibilityLabel={isDark ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.circularGlassButton,
                {
                  transform: [{ scale: themeScale }],
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.15)',
                },
              ]}
            >
              <Icon
                name={isDark ? 'Sun' : 'Moon'}
                size={14}
                color={isDark ? '#F59E0B' : '#0F172A'}
              />
            </Animated.View>
          </Pressable>

          {/* Refresh Market Prices Button */}
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              refreshMarketPrices();
            }}
            onPressIn={() => handleButtonPressIn(refreshScale)}
            onPressOut={() => handleButtonPressOut(refreshScale)}
            disabled={isRefreshing}
            hitSlop={8}
            accessibilityLabel="Segarkan harga pasar"
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.circularGlassButton,
                isRefreshing && styles.refreshingButton,
                {
                  transform: [{ scale: refreshScale }],
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.15)',
                },
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Icon
                  name="RefreshCw"
                  size={14}
                  color={isRefreshing ? Colors.palette.appleBlue : (isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155')}
                />
              </Animated.View>
            </Animated.View>
          </Pressable>

          {/* Privacy Eye Toggle Button */}
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              togglePrivacy();
            }}
            onPressIn={() => handleButtonPressIn(eyeScale)}
            onPressOut={() => handleButtonPressOut(eyeScale)}
            hitSlop={8}
            accessibilityLabel={privacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            accessibilityRole="button"
          >
            <Animated.View
              style={[
                styles.circularGlassButton,
                privacyMode && styles.activeEyeButton,
                {
                  transform: [{ scale: eyeScale }],
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.15)',
                },
              ]}
            >
              {privacyMode ? (
                <Icon name="EyeOff" size={14} color={Colors.palette.appleBlue} />
              ) : (
                <Icon name="Eye" size={14} color={isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155'} />
              )}
            </Animated.View>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: space.lg - 2,
    paddingBottom: 6,
    zIndex: 10,
  },
  capsuleCard: {
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  capsuleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  leftBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dropletIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  liveSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34C759',
  },
  liveTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.palette.appleMuted,
    fontVariant: ['tabular-nums'],
  },
  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySegmentControl: {
    width: 76,
  },
  circularGlassButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshingButton: {
    borderColor: Colors.palette.appleBlue,
  },
  activeEyeButton: {
    borderColor: Colors.palette.appleBlue,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
});
