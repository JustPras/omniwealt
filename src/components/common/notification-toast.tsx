import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './icon';
import { GlassCard } from './glass-card';
import { NotificationSyncService } from '../../services/notification-sync-service';
import { BankMutationResult, CapturedNotificationLog } from '../../types';
import { formatCurrency } from '../../utils/format';
import { useWealth } from '../../store/wealth-context';
import { triggerHaptic } from '../../utils/haptics';
import { color, space, radius, shadow, font, useTheme, themes } from '../../theme/tokens';

export const NotificationToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.canvas === themes.dark.canvas;
  const { currency, usdRate } = useWealth();

  const [activeItem, setActiveItem] = useState<{
    result: BankMutationResult;
    log: CapturedNotificationLog;
  } | null>(null);

  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -160,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveItem(null);
    });
  };

  useEffect(() => {
    const unsubscribe = NotificationSyncService.subscribe(({ result, log }) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setActiveItem({ result, log });
      triggerHaptic('success');

      translateY.setValue(-160);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 190,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, 4800);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateY, opacity]);

  if (!activeItem) return null;

  const { result } = activeItem;
  const isIncome = result.type === 'INCOME';
  const isTransfer = result.type === 'TRANSFER';
  const formattedAmount = formatCurrency(result.amount, currency, usdRate);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        {
          top: insets.top > 0 ? insets.top + 6 : 12,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable onPress={hideToast} style={styles.pressableWrapper}>
        <GlassCard level="raised" style={styles.toastCard} noPadding>
          {/* Specular Liquid Top Arc */}
          <View style={styles.liquidGlint} />

          <View style={styles.innerContent}>
            {/* Left Icon Badge */}
            <View
              style={[
                styles.iconBadge,
                isIncome
                  ? styles.iconBadgeIncome
                  : isTransfer
                  ? styles.iconBadgeTransfer
                  : styles.iconBadgeExpense,
              ]}
            >
              <Icon
                name={isIncome ? 'ArrowDownLeft' : isTransfer ? 'Repeat' : 'Zap'}
                size={16}
                color={isIncome ? color.gain : isTransfer ? '#38BDF8' : '#F59E0B'}
              />
            </View>

            {/* Middle Details */}
            <View style={styles.textColumn}>
              <View style={styles.headerRow}>
                <Text style={[styles.autoTag, isTransfer && { color: '#A78BFA' }]}>
                  {isTransfer ? '🔄 Transfer Internal' : '⚡ Auto-Sync Notifikasi'}
                </Text>
                <Text style={styles.bankName}>{result.bankName}</Text>
              </View>

              <Text style={styles.descText} numberOfLines={1}>
                {isTransfer && result.destinationHint
                  ? `Transfer ke ${result.destinationHint}`
                  : result.merchantOrSender
                  ? `${result.merchantOrSender}`
                  : result.category}
              </Text>
            </View>

            {/* Right Value & Close */}
            <View style={styles.valueColumn}>
              <Text
                style={[
                  styles.amountText,
                  isIncome
                    ? styles.textIncome
                    : isTransfer
                    ? styles.textTransfer
                    : styles.textExpense,
                ]}
              >
                {isIncome ? `+${formattedAmount}` : isTransfer ? `⇄ ${formattedAmount}` : `-${formattedAmount}`}
              </Text>
              <Text style={styles.categorySub}>{result.category}</Text>
            </View>

            {/* Dismiss Button */}
            <Pressable hitSlop={8} onPress={hideToast} style={styles.dismissBtn}>
              <Icon name="X" size={13} color={color.textMuted} />
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    zIndex: 999999,
    alignItems: 'center',
    elevation: 20,
  },
  pressableWrapper: {
    width: '100%',
    maxWidth: 520,
  },
  toastCard: {
    backgroundColor: 'rgba(26, 26, 32, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1.2,
    borderRadius: radius.xl,
    padding: space.sm,
    paddingHorizontal: space.md,
    position: 'relative',
    overflow: 'hidden',
    ...shadow.e2,
    shadowColor: '#007AFF',
    shadowOpacity: 0.35,
  },
  liquidGlint: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBadgeIncome: {
    backgroundColor: 'rgba(48, 209, 88, 0.16)',
    borderColor: 'rgba(48, 209, 88, 0.35)',
  },
  iconBadgeExpense: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  iconBadgeTransfer: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  autoTag: {
    fontSize: 10,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bankName: {
    fontSize: 10,
    fontFamily: font.uiSemi,
    fontWeight: '600',
    color: color.textMuted,
  },
  descText: {
    fontSize: 13,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  valueColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 13,
    fontFamily: font.num,
    fontWeight: '700',
  },
  textIncome: {
    color: color.gain,
  },
  textExpense: {
    color: '#F87171',
  },
  textTransfer: {
    color: '#38BDF8',
  },
  categorySub: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  dismissBtn: {
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 2,
  },
});
