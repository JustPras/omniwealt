import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { useWealth } from '../../store/wealth-context';
import { formatIDR } from '../../utils/format';

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

  if (privacyMode) {
    const dots = '•'.repeat(maskedLength);
    return (
      <Text selectable style={[styles.tabularText, style]}>
        {isCurrency ? `Rp ${dots}` : dots}
      </Text>
    );
  }

  let display = '';
  if (typeof value === 'number') {
    display = isCurrency ? formatIDR(value, compact) : value.toString();
  } else {
    display = value;
  }

  return (
    <Text selectable style={[styles.tabularText, style]}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  tabularText: {
    fontVariant: ['tabular-nums'],
  },
});
