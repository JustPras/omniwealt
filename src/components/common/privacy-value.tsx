import React, { useRef, useEffect } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet, Animated } from 'react-native';
import { useWealth } from '../../store/wealth-context';
import { formatIDR } from '../../utils/format';
import { color } from '../../theme/tokens';

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
  const { privacyMode } = useWealth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 180ms soft transition when toggling privacy mode
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
  }, [privacyMode, fadeAnim]);

  if (privacyMode) {
    const dots = '••••';
    return (
      <Animated.Text
        selectable={false}
        style={[styles.tabularText, { opacity: fadeAnim }, style]}
      >
        {isCurrency ? `Rp ${dots}` : dots}
      </Animated.Text>
    );
  }

  let display = '';
  if (typeof value === 'number') {
    display = isCurrency ? formatIDR(value, compact) : value.toString();
  } else {
    display = value;
  }

  return (
    <Animated.Text
      selectable
      style={[styles.tabularText, { opacity: fadeAnim }, style]}
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
