import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../common/icon';
import { useWealth } from '../../store/wealth-context';
import { formatTime } from '../../utils/format';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow, motion, font } from '../../theme/tokens';

export const HeaderBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    privacyMode,
    togglePrivacy,
    currency,
    toggleCurrency,
    isRefreshing,
    refreshMarketPrices,
    lastUpdated,
  } = useWealth();

  // Pulse animation for LIVE indicator dot (The only authorized idle loop in the app per design)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  // Spin animation for RefreshCw button
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Press feedback scales for the two header action buttons
  const refreshScale = useRef(new Animated.Value(1)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
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
            toValue: 0.5,
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
      toValue: 0.94,
      tension: motion.spring.press.tension,
      friction: motion.spring.press.friction,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (scaleRef: Animated.Value) => {
    Animated.spring(scaleRef, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  };

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
          <Text style={styles.liveText}>Live</Text>
          <Text style={styles.timeText}>{formatTime(lastUpdated.toISOString())}</Text>
        </View>
      </View>

      {/* Header Actions: Currency, Refresh & Privacy Toggle */}
      <View style={styles.actionGroup}>
        {/* Currency Switcher (IDR / USD) */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            toggleCurrency();
          }}
          hitSlop={6}
          accessibilityLabel="Ganti tampilan mata uang Rupiah atau Dollar"
          accessibilityRole="button"
          style={styles.currencyToggleBtn}
        >
          <View
            style={[
              styles.currencySegment,
              currency === 'IDR' && styles.activeCurrencySegment,
            ]}
          >
            <Text
              style={[
                styles.currencySegmentText,
                currency === 'IDR' && styles.activeCurrencySegmentText,
              ]}
            >
              Rp
            </Text>
          </View>
          <View
            style={[
              styles.currencySegment,
              currency === 'USD' && styles.activeCurrencySegment,
            ]}
          >
            <Text
              style={[
                styles.currencySegmentText,
                currency === 'USD' && styles.activeCurrencySegmentText,
              ]}
            >
              $
            </Text>
          </View>
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
              styles.iconButton,
              isRefreshing && styles.refreshingButton,
              { transform: [{ scale: refreshScale }] },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon
                name="RefreshCw"
                size={16}
                color={isRefreshing ? color.accent : color.textMuted}
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
              styles.iconButton,
              privacyMode && styles.activeIconButton,
              { transform: [{ scale: eyeScale }] },
            ]}
          >
            {privacyMode ? (
              <Icon name="EyeOff" size={16} color={color.accent} />
            ) : (
              <Icon name="Eye" size={16} color={color.textMuted} />
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    zIndex: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.rim,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.glassFillInset,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gain,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: color.gain,
  },
  timeText: {
    fontSize: 11,
    color: color.textMuted,
    fontVariant: ['tabular-nums'],
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillRaised,
    borderWidth: 1,
    borderColor: color.rim,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  refreshingButton: {
    borderColor: color.accentRim,
  },
  activeIconButton: {
    borderColor: color.accentRim,
    backgroundColor: color.accentSoft,
  },
  currencyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.glassFillRaised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.rim,
    padding: 3,
    height: 38,
    ...shadow.e1,
  },
  currencySegment: {
    paddingHorizontal: 9,
    height: '100%',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCurrencySegment: {
    backgroundColor: color.accent,
  },
  currencySegmentText: {
    fontSize: 11,
    fontFamily: font.uiSemi,
    fontWeight: '700',
    color: color.textMuted,
  },
  activeCurrencySegmentText: {
    color: '#FFFFFF',
  },
});
