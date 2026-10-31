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
import { LogoIcon } from '../common/logo';
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

  // Pulse animation for LIVE indicator dot per DESIGN_SYSTEM.md
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

  const textColor = Colors.palette.alabasterWhite;

  return (
    <View style={[styles.outerWrapper, { paddingTop: Math.max(insets.top + 4, 12) }]}>
      {/* Floating Capsule Glass Card with Warm Titanium specular border */}
      <GlassCard
        level="raised"
        radius="pill"
        noPadding
        style={styles.capsuleCard}
        contentStyle={styles.capsuleInner}
      >
        {/* Left: Brand Logo + OmniWealth + Private Wealth tag */}
        <View style={styles.leftBrandGroup}>
          <LogoIcon size={24} variant="adaptive" style={styles.brandLogoBadge} />
          <View style={styles.brandTitleCol}>
            <View style={styles.brandNameRow}>
              <Text style={[styles.brandTitle, { color: textColor }]}>OmniWealth</Text>
              <View style={styles.aiReadyCapsule}>
                <Text style={styles.aiReadyText}>PRIVATE</Text>
              </View>
            </View>
            {/* Live Timestamp Sub-text */}
            <View style={styles.liveSubRow}>
              <Text style={styles.liveTimeText}>{formatTime(lastUpdated.toISOString())} • TERVERIFIKASI</Text>
            </View>
          </View>
        </View>

        {/* Right: Currency Switcher + Theme Toggle + Refresh + Privacy Eye */}
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

          {/* Theme Mode Toggle Button (Light / Dark) */}
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
                  backgroundColor: 'rgba(245, 243, 239, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            >
              <Icon
                name={isDark ? 'Sun' : 'Moon'}
                size={14}
                color={Colors.palette.champagneGold}
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
                  backgroundColor: 'rgba(245, 243, 239, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Icon
                  name="RefreshCw"
                  size={14}
                  color={isRefreshing ? Colors.palette.champagneGold : Colors.palette.naturalTitanium}
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
                  backgroundColor: privacyMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(245, 243, 239, 0.05)',
                  borderColor: privacyMode ? 'rgba(212, 175, 55, 0.45)' : 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            >
              {privacyMode ? (
                <Icon name="EyeOff" size={14} color={Colors.palette.champagneGold} />
              ) : (
                <Icon name="Eye" size={14} color={Colors.palette.naturalTitanium} />
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
    backgroundColor: 'rgba(20, 20, 18, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
  brandLogoBadge: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  aiReadyCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  aiPulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.palette.champagneGold,
  },
  aiReadyText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.palette.champagneGold,
  },
  liveSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  liveTimeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.palette.darkPewter,
    fontVariant: ['tabular-nums'],
  },
  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  currencySegmentControl: {
    width: 68,
  },
  circularGlassButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshingButton: {
    borderColor: Colors.palette.champagneGold,
  },
  activeEyeButton: {
    borderColor: Colors.palette.champagneGold,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
});
