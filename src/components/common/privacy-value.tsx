import React, { useRef, useEffect } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet, Animated } from 'react-native';
import { useWealth } from '../../store/wealth-context';
import { formatCurrency } from '../../utils/format';
import { color, useTheme } from '../../theme/tokens';

interface PrivacyValueProps {
  value: number | string;
  isCurrency?: boolean;
  compact?: boolean;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  maskedLength?: number;
}

export const PrivacyValue: React.FC<PrivacyValueProps> = ({
  value,
  isCurrency = true,
  compact = false,
  prefix = '',
  suffix = '',
  style,
  maskedLength = 8,
}) => {
  const theme = useTheme();
  const { privacyMode, currency, usdRate } = useWealth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 180ms soft transition when toggling privacy mode or currency mode
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.35,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [privacyMode, currency, fadeAnim]);

  if (privacyMode) {
    const dots = '••••';
    const currencyPrefix = currency === 'USD' ? '$' : 'Rp';
    return (
      <Animated.Text
        selectable={false}
        style={[styles.tabularText, { color: theme.text, opacity: fadeAnim }, style]}
      >
        {isCurrency ? `${currencyPrefix} ${dots}` : dots}
      </Animated.Text>
    );
  }

  let display = '';
  if (typeof value === 'number') {
    display = isCurrency ? formatCurrency(value, currency, usdRate, compact) : value.toString();
  } else {
    display = value;
  }

  return (
    <Animated.Text
      selectable
      style={[styles.tabularText, { color: theme.text, opacity: fadeAnim }, style]}
    >
      {prefix}
      {display}
      {suffix}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  tabularText: {
    fontVariant: ['tabular-nums'],
    color: color.text,
  },
});
